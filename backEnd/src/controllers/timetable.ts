import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { createError } from '../middleware/errorHandler';

const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const validPeriods = Array.from({ length: 8 }, (_, i) => i + 1);

const buildError = (message: string, status = 400) => createError(message, status);

const collectDayCount = (map: Map<string, Map<string, number>>, id: string, day: string) => {
  const dayMap = map.get(id) ?? new Map<string, number>();
  dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  map.set(id, dayMap);
};

const verifyTimetableSlotDetails = async (
  teacherId: string,
  subjectId: string,
  streamId: string,
  day: string,
  period: number,
) => {
  if (!teacherId || !subjectId || !streamId || !day || period === undefined) {
    throw buildError('teacherId, subjectId, streamId, day, and period are required');
  }

  if (!validDays.includes(day)) {
    throw buildError('Day must be Monday to Friday');
  }

  if (!validPeriods.includes(period)) {
    throw buildError('Period must be between 1 and 8');
  }

  const [subjectRes, teacherRes, streamRes] = await Promise.all([
    query(`SELECT id FROM "Subject" WHERE id = $1`, [subjectId]),
    query(`SELECT "subjectOneId", "subjectTwoId" FROM "Teacher" WHERE id = $1`, [teacherId]),
    query(`SELECT id FROM "Stream" WHERE id = $1`, [streamId]),
  ]);

  if (subjectRes.rows.length === 0) {
    throw buildError('Subject not found', 404);
  }

  if (teacherRes.rows.length === 0) {
    throw buildError('Teacher not found', 404);
  }

  const { subjectOneId, subjectTwoId } = teacherRes.rows[0];
  if (subjectOneId !== subjectId && subjectTwoId !== subjectId) {
    throw buildError('Selected teacher does not teach this subject');
  }

  if (streamRes.rows.length === 0) {
    throw buildError('Stream not found', 404);
  }

  const streamSubjectRes = await query(`
    SELECT 1 FROM "StreamSubject" WHERE "streamId" = $1 AND "subjectId" = $2
  `, [streamId, subjectId]);

  if (streamSubjectRes.rows.length === 0) {
    throw buildError('Selected subject is not assigned to the chosen stream');
  }

  const assignmentRes = await query(`
    SELECT 1 FROM "TeacherClassAssignment"
    WHERE "teacherId" = $1 AND "subjectId" = $2 AND "streamId" = $3
  `, [teacherId, subjectId, streamId]);

  if (assignmentRes.rows.length === 0) {
    throw buildError('The teacher is not assigned to teach this subject for the selected stream');
  }

  const teacherConflict = await query(`
    SELECT id FROM "Timetable"
    WHERE "teacherId" = $1 AND day = $2 AND period = $3
  `, [teacherId, day, period]);

  if (teacherConflict.rows.length > 0) {
    throw buildError('This teacher already has a scheduled lesson at the same time');
  }
};

const saveScheduleSlots = async (slots: Array<{ teacherId: string; subjectId: string; streamId: string; day: string; period: number }>) => {
  await query('BEGIN');
  try {
    await query('DELETE FROM "Timetable"');
    for (const slot of slots) {
      await query(`
        INSERT INTO "Timetable" ("teacherId", "subjectId", "streamId", "day", "period")
        VALUES ($1, $2, $3, $4, $5)
      `, [slot.teacherId, slot.subjectId, slot.streamId, slot.day, slot.period]);
    }
    await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
};

const computeSchedule = (
  assignments: Array<{ teacherId: string; subjectId: string; streamId: string; teacher: any; subject: any; stream: any }>,
) => {
  const warnings: string[] = [];
  const scheduledSlots: Array<{ teacherId: string; subjectId: string; streamId: string; day: string; period: number }> = [];

  // Group assignments by stream
  const streamAssignmentsMap = new Map<string, typeof assignments>();
  for (const a of assignments) {
    if (!streamAssignmentsMap.has(a.streamId)) {
      streamAssignmentsMap.set(a.streamId, []);
    }
    streamAssignmentsMap.get(a.streamId)!.push(a);
  }

  // Generate demands
  const demands: Array<{ streamId: string; subjectId: string; teacherId: string; subjectName: string; teacherName: string; streamName: string }> = [];
  
  // Track teacher total load
  const teacherTotalLoad = new Map<string, number>();

  for (const [streamId, streamAsgs] of streamAssignmentsMap.entries()) {
    const A = streamAsgs.length;
    if (A === 0) continue;

    // Distribute 40 periods among the A assignments
    for (let i = 0; i < A; i++) {
      const a = streamAsgs[i];
      const periodsCount = Math.floor(40 / A) + (i < (40 % A) ? 1 : 0);

      // Add to teacher load
      const currentLoad = teacherTotalLoad.get(a.teacherId) ?? 0;
      teacherTotalLoad.set(a.teacherId, currentLoad + periodsCount);

      if (currentLoad + periodsCount > 40) {
        warnings.push(`Warning: Teacher ${a.teacher?.name || a.teacherId} is allocated ${currentLoad + periodsCount} lessons, exceeding the maximum weekly limit of 40.`);
      }

      for (let p = 0; p < periodsCount; p++) {
        demands.push({
          streamId: a.streamId,
          subjectId: a.subjectId,
          teacherId: a.teacherId,
          subjectName: a.subject?.name || 'Subject',
          teacherName: a.teacher?.name || 'Teacher',
          streamName: a.stream?.name || 'Stream',
        });
      }
    }
  }

  // Occupied status:
  const streamSlots = new Map<string, Set<string>>(); // streamId -> Set of "day-period"
  const teacherSlots = new Map<string, Set<string>>(); // teacherId -> Set of "day-period"
  const subjectDayCount = new Map<string, Map<string, number>>(); // streamId -> Map of "subjectId-day" -> count

  const isOccupiedStream = (streamId: string, day: string, period: number) => {
    return streamSlots.get(streamId)?.has(`${day}-${period}`) ?? false;
  };

  const isOccupiedTeacher = (teacherId: string, day: string, period: number) => {
    return teacherSlots.get(teacherId)?.has(`${day}-${period}`) ?? false;
  };

  const getSubjectDayCount = (streamId: string, subjectId: string, day: string) => {
    return subjectDayCount.get(streamId)?.get(`${subjectId}-${day}`) ?? 0;
  };

  const setOccupied = (streamId: string, teacherId: string, subjectId: string, day: string, period: number, val: boolean) => {
    const slotKey = `${day}-${period}`;
    const subjKey = `${subjectId}-${day}`;

    // Stream
    if (!streamSlots.has(streamId)) streamSlots.set(streamId, new Set());
    if (val) streamSlots.get(streamId)!.add(slotKey);
    else streamSlots.get(streamId)!.delete(slotKey);

    // Teacher
    if (!teacherSlots.has(teacherId)) teacherSlots.set(teacherId, new Set());
    if (val) teacherSlots.get(teacherId)!.add(slotKey);
    else teacherSlots.get(teacherId)!.delete(slotKey);

    // Subject Day Count
    if (!subjectDayCount.has(streamId)) subjectDayCount.set(streamId, new Map());
    const current = subjectDayCount.get(streamId)!.get(subjKey) ?? 0;
    subjectDayCount.get(streamId)!.set(subjKey, current + (val ? 1 : -1));
  };

  // Backtracking solver
  // Sort demands: group by stream and subject, but prioritize highly loaded teachers first to solve constraint bottlenecks
  demands.sort((a, b) => {
    const loadA = teacherTotalLoad.get(a.teacherId) ?? 0;
    const loadB = teacherTotalLoad.get(b.teacherId) ?? 0;
    return loadB - loadA;
  });

  const resultSlots: Array<{ teacherId: string; subjectId: string; streamId: string; day: string; period: number }> = [];

  const solve = (index: number): boolean => {
    if (index >= demands.length) {
      return true;
    }

    const demand = demands[index];
    const { streamId, subjectId, teacherId } = demand;

    const candidates: Array<{ day: string; period: number; score: number }> = [];

    for (const day of validDays) {
      for (const period of validPeriods) {
        if (isOccupiedStream(streamId, day, period) || isOccupiedTeacher(teacherId, day, period)) {
          continue;
        }

        const countOnDay = getSubjectDayCount(streamId, subjectId, day);
        // Prioritize day balance (lower count of this subject on this day), then earlier periods
        const score = countOnDay * 100 + period;
        candidates.push({ day, period, score });
      }
    }

    candidates.sort((a, b) => a.score - b.score);

    for (const cand of candidates) {
      setOccupied(streamId, teacherId, subjectId, cand.day, cand.period, true);
      resultSlots.push({
        streamId,
        subjectId,
        teacherId,
        day: cand.day,
        period: cand.period,
      });

      if (solve(index + 1)) {
        return true;
      }

      // Backtrack
      resultSlots.pop();
      setOccupied(streamId, teacherId, subjectId, cand.day, cand.period, false);
    }

    return false;
  };

  const success = solve(0);
  if (!success) {
    warnings.push("Could not generate a perfectly balanced schedule without conflicts. Falling back to best-effort layout.");
    
    // Fallback greedy scheduling
    resultSlots.length = 0;
    streamSlots.clear();
    teacherSlots.clear();
    subjectDayCount.clear();

    for (const demand of demands) {
      const { streamId, subjectId, teacherId } = demand;
      let bestSlot: { day: string; period: number; score: number } | null = null;

      for (const day of validDays) {
        for (const period of validPeriods) {
          if (isOccupiedStream(streamId, day, period) || isOccupiedTeacher(teacherId, day, period)) {
            continue;
          }

          const countOnDay = getSubjectDayCount(streamId, subjectId, day);
          const score = countOnDay * 100 + period;
          if (bestSlot === null || score < bestSlot.score) {
            bestSlot = { day, period, score };
          }
        }
      }

      if (bestSlot) {
        setOccupied(streamId, teacherId, subjectId, bestSlot.day, bestSlot.period, true);
        resultSlots.push({
          streamId,
          subjectId,
          teacherId,
          day: bestSlot.day,
          period: bestSlot.period,
        });
      } else {
        warnings.push(`Could not schedule ${demand.subjectName} in ${demand.streamName} taught by ${demand.teacherName}`);
      }
    }
  }

  return { scheduledSlots: resultSlots, warnings };
};

export const getAllTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT tt.*,
        row_to_json(t.*) as teacher,
        row_to_json(s.*) as subject,
        row_to_json(str.*) as stream
      FROM "Timetable" tt
      LEFT JOIN "Teacher" t ON tt."teacherId" = t.id
      LEFT JOIN "Subject" s ON tt."subjectId" = s.id
      LEFT JOIN "Stream" str ON tt."streamId" = str.id
      ORDER BY tt.day ASC, tt.period ASC, str.name ASC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const getClassAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT tca.*,
        row_to_json(t.*) as teacher,
        row_to_json(str.*) as stream
      FROM "TeacherClassAssignment" tca
      LEFT JOIN "Teacher" t ON tca."teacherId" = t.id
      LEFT JOIN "Stream" str ON tca."streamId" = str.id
      WHERE tca."subjectId" = $1
      ORDER BY t.name ASC, str.name ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const createClassAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { teacherId, streamId } = req.body;

    if (!teacherId || !streamId) {
      return next(createError('teacherId and streamId are required'));
    }

    const subjectRes = await query(`SELECT id FROM "Subject" WHERE id = $1`, [id]);
    if (subjectRes.rows.length === 0) {
      return next(createError('Subject not found', 404));
    }

    const teacherRes = await query(`SELECT "subjectOneId", "subjectTwoId" FROM "Teacher" WHERE id = $1`, [teacherId]);
    if (teacherRes.rows.length === 0) {
      return next(createError('Teacher not found', 404));
    }

    const { subjectOneId, subjectTwoId } = teacherRes.rows[0];
    if (subjectOneId !== id && subjectTwoId !== id) {
      return next(createError('Selected teacher does not teach this subject'));
    }

    const streamRes = await query(`SELECT id FROM "Stream" WHERE id = $1`, [streamId]);
    if (streamRes.rows.length === 0) {
      return next(createError('Stream not found', 404));
    }

    const result = await query(`
      INSERT INTO "TeacherClassAssignment" ("teacherId", "subjectId", "streamId")
      VALUES ($1, $2, $3)
      RETURNING *
    `, [teacherId, id, streamId]);

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return next(createError('This teacher is already assigned to this subject and stream'));
    }
    next(err);
  }
};

export const deleteClassAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, assignmentId } = req.params;
    const result = await query(`
      DELETE FROM "TeacherClassAssignment"
      WHERE id = $1 AND "subjectId" = $2
      RETURNING *
    `, [assignmentId, id]);

    if (result.rows.length === 0) {
      return next(createError('Assignment not found', 404));
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) { next(err); }
};

export const getSubjectTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT tt.*,
        row_to_json(t.*) as teacher,
        row_to_json(s.*) as subject,
        row_to_json(str.*) as stream
      FROM "Timetable" tt
      LEFT JOIN "Teacher" t ON tt."teacherId" = t.id
      LEFT JOIN "Subject" s ON tt."subjectId" = s.id
      LEFT JOIN "Stream" str ON tt."streamId" = str.id
      WHERE tt."subjectId" = $1
      ORDER BY tt.day ASC, tt.period ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const getStreamTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT tt.*,
        row_to_json(t.*) as teacher,
        row_to_json(s.*) as subject,
        row_to_json(str.*) as stream
      FROM "Timetable" tt
      LEFT JOIN "Teacher" t ON tt."teacherId" = t.id
      LEFT JOIN "Subject" s ON tt."subjectId" = s.id
      LEFT JOIN "Stream" str ON tt."streamId" = str.id
      WHERE tt."streamId" = $1
      ORDER BY tt.day ASC, tt.period ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) { next(err); }
};

export const createTimetableSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { teacherId, streamId, day, period } = req.body;

    if (!teacherId || !streamId || !day || period === undefined) {
      return next(createError('teacherId, streamId, day, and period are required'));
    }

    if (!validDays.includes(day)) {
      return next(createError('Day must be Monday to Friday'));
    }

    if (!validPeriods.includes(period)) {
      return next(createError('Period must be between 1 and 8'));
    }

    await verifyTimetableSlotDetails(teacherId, id, streamId, day, period);

    const result = await query(`
      INSERT INTO "Timetable" ("teacherId", "subjectId", "streamId", "day", "period")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [teacherId, id, streamId, day, period]);

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return next(createError('This stream already has a lesson scheduled at this time'));
    }
    next(err);
  }
};

export const deleteTimetableSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, slotId } = req.params;
    const result = await query(`
      DELETE FROM "Timetable"
      WHERE id = $1 AND "subjectId" = $2
      RETURNING *
    `, [slotId, id]);

    if (result.rows.length === 0) {
      return next(createError('Timetable slot not found', 404));
    }

    res.json({ message: 'Timetable slot deleted successfully' });
  } catch (err) { next(err); }
};

export const createTimetableSlotGeneric = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teacherId, subjectId, streamId, day, period } = req.body;
    await verifyTimetableSlotDetails(teacherId, subjectId, streamId, day, period);

    const result = await query(`
      INSERT INTO "Timetable" ("teacherId", "subjectId", "streamId", "day", "period")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [teacherId, subjectId, streamId, day, period]);

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return next(createError('This stream already has a lesson scheduled at this time'));
    }
    next(err);
  }
};

export const generateUnifiedTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignmentResult = await query(`
      SELECT tca.id, tca."teacherId", tca."subjectId", tca."streamId",
        row_to_json(t.*) as teacher,
        row_to_json(s.*) as subject,
        row_to_json(str.*) as stream
      FROM "TeacherClassAssignment" tca
      LEFT JOIN "Teacher" t ON tca."teacherId" = t.id
      LEFT JOIN "Subject" s ON tca."subjectId" = s.id
      LEFT JOIN "Stream" str ON tca."streamId" = str.id
      ORDER BY t.name ASC, str.name ASC, s.name ASC
    `);

    const assignments = assignmentResult.rows;
    const { scheduledSlots, warnings } = computeSchedule(assignments);

    await saveScheduleSlots(scheduledSlots);

    const timetable = await query(`
      SELECT tt.*,
        row_to_json(t.*) as teacher,
        row_to_json(s.*) as subject,
        row_to_json(str.*) as stream
      FROM "Timetable" tt
      LEFT JOIN "Teacher" t ON tt."teacherId" = t.id
      LEFT JOIN "Subject" s ON tt."subjectId" = s.id
      LEFT JOIN "Stream" str ON tt."streamId" = str.id
      ORDER BY tt.day ASC, tt.period ASC, str.name ASC
    `);

    res.json({
      message: 'Unified timetable generated successfully',
      warnings,
      slots: timetable.rows,
    });
  } catch (err) { next(err); }
};

export const deleteTimetableSlotById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slotId } = req.params;
    const result = await query(`
      DELETE FROM "Timetable"
      WHERE id = $1
      RETURNING *
    `, [slotId]);

    if (result.rows.length === 0) {
      return next(createError('Timetable slot not found', 404));
    }

    res.json({ message: 'Timetable slot deleted successfully' });
  } catch (err) { next(err); }
};
