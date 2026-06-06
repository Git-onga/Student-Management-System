import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { createError } from '../middleware/errorHandler';

// GET /api/subjects/:id/class-assignments
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

// POST /api/subjects/:id/class-assignments
export const createClassAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { teacherId, streamId } = req.body;
    
    if (!teacherId || !streamId) {
      return next(createError('teacherId and streamId are required'));
    }

    // Verify subject exists
    const subjectRes = await query(`SELECT id FROM "Subject" WHERE id = $1`, [id]);
    if (subjectRes.rows.length === 0) {
      return next(createError('Subject not found', 404));
    }

    // Verify teacher exists
    const teacherRes = await query(`SELECT id FROM "Teacher" WHERE id = $1`, [teacherId]);
    if (teacherRes.rows.length === 0) {
      return next(createError('Teacher not found', 404));
    }

    // Verify stream exists
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

// DELETE /api/subjects/:id/class-assignments/:assignmentId
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

// GET /api/subjects/:id/timetable
export const getSubjectTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT tt.*,
        row_to_json(t.*) as teacher,
        row_to_json(str.*) as stream
      FROM "Timetable" tt
      LEFT JOIN "Teacher" t ON tt."teacherId" = t.id
      LEFT JOIN "Stream" str ON tt."streamId" = str.id
      WHERE tt."subjectId" = $1
      ORDER BY tt.day ASC, tt.period ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/subjects/:id/timetable
export const createTimetableSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { teacherId, streamId, day, period } = req.body;
    
    if (!teacherId || !streamId || !day || period === undefined) {
      return next(createError('teacherId, streamId, day, and period are required'));
    }

    if (period < 1 || period > 8) {
      return next(createError('Period must be between 1 and 8'));
    }

    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (!validDays.includes(day)) {
      return next(createError('Day must be Monday to Friday'));
    }

    // Verify subject exists
    const subjectRes = await query(`SELECT id FROM "Subject" WHERE id = $1`, [id]);
    if (subjectRes.rows.length === 0) {
      return next(createError('Subject not found', 404));
    }

    // Verify teacher exists
    const teacherRes = await query(`SELECT id FROM "Teacher" WHERE id = $1`, [teacherId]);
    if (teacherRes.rows.length === 0) {
      return next(createError('Teacher not found', 404));
    }

    // Verify stream exists
    const streamRes = await query(`SELECT id FROM "Stream" WHERE id = $1`, [streamId]);
    if (streamRes.rows.length === 0) {
      return next(createError('Stream not found', 404));
    }

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

// DELETE /api/subjects/:id/timetable/:slotId
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
