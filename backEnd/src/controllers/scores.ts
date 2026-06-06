import { Request, Response, NextFunction } from 'express';
import { query, pool } from '../db';
import { createError } from '../middleware/errorHandler';

// GET /api/scores?streamId=&subjectId=&term=&studentId=
export const getAllScores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { streamId, subjectId, term, studentId } = req.query;
    let sql = `
      SELECT sc.*,
        (SELECT json_build_object('id', stu.id, 'admissionNumber', stu."admissionNumber", 'firstName', stu."firstName", 'lastName', stu."lastName", 'streamId', stu."streamId", 'stream', (SELECT json_build_object('id', st.id, 'name', st.name) FROM "Stream" st WHERE st.id = stu."streamId")) FROM "Student" stu WHERE stu.id = sc."studentId") as student,
        (SELECT json_build_object('id', su.id, 'code', su.code, 'name', su.name) FROM "Subject" su WHERE su.id = sc."subjectId") as subject
      FROM "Score" sc
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subjectId) { params.push(String(subjectId)); sql += ` AND sc."subjectId" = $${params.length}`; }
    if (studentId) { params.push(String(studentId)); sql += ` AND sc."studentId" = $${params.length}`; }
    if (term) { params.push(String(term)); sql += ` AND sc.term = $${params.length}`; }
    if (streamId) { params.push(String(streamId)); sql += ` AND sc."studentId" IN (SELECT id FROM "Student" WHERE "streamId" = $${params.length})`; }

    // Order by subject.name asc, student.lastName asc
    sql += ` ORDER BY (SELECT name FROM "Subject" WHERE id = sc."subjectId") ASC, (SELECT "lastName" FROM "Student" WHERE id = sc."studentId") ASC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/scores/:id
export const getScoreById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT sc.*,
        (SELECT row_to_json(stu.*) FROM "Student" stu WHERE stu.id = sc."studentId") as student,
        (SELECT row_to_json(su.*) FROM "Subject" su WHERE su.id = sc."subjectId") as subject
      FROM "Score" sc
      WHERE sc.id = $1
    `, [id]);

    if (result.rows.length === 0) return next(createError('Score not found', 404));

    const score = result.rows[0];
    const streamRes = await query(`SELECT * FROM "Stream" WHERE id = $1`, [score.student.streamId]);
    score.student.stream = streamRes.rows[0];

    res.json(score);
  } catch (err) { next(err); }
};

// POST /api/scores — create single score
export const createScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, subjectId, caScore, examScore, term } = req.body;
    if (!studentId || !subjectId || caScore === undefined || examScore === undefined || !term) {
      return next(createError('studentId, subjectId, caScore, examScore, and term are required'));
    }
// Removed examScore validation (0-60) to allow any value
// Removed caScore validation (0-40) if needed

    const result = await query(`
      INSERT INTO "Score" ("studentId", "subjectId", term, "caScore", "examScore")
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ("studentId", "subjectId", term) 
      DO UPDATE SET "caScore" = EXCLUDED."caScore", "examScore" = EXCLUDED."examScore", "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *
    `, [studentId, subjectId, term, Number(caScore), Number(examScore)]);

    const score = result.rows[0];
    const stuRes = await query(`SELECT id, "admissionNumber", "firstName", "lastName" FROM "Student" WHERE id = $1`, [studentId]);
    const suRes = await query(`SELECT id, code, name FROM "Subject" WHERE id = $1`, [subjectId]);
    score.student = stuRes.rows[0];
    score.subject = suRes.rows[0];

    res.status(201).json(score);
  } catch (err: any) {
    if (err.code === '23503') return next(createError('Student or Subject not found', 404));
    next(err);
  }
};

// POST /api/scores/batch — create/update multiple scores at once
export const batchUpsertScores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scores } = req.body as { scores: { studentId: string; subjectId: string; caScore: number; examScore: number; term: string }[] };
    if (!Array.isArray(scores) || scores.length === 0) {
      return next(createError('scores array is required and must not be empty'));
    }

    for (const sc of scores) {
      if (!sc.studentId || !sc.subjectId || sc.caScore === undefined || sc.examScore === undefined || !sc.term) {
        return next(createError('Each score must have studentId, subjectId, caScore, examScore, term'));
      }
// Removed caScore validation (0-40) to allow any value
// Removed examScore validation (0-60) to allow any value
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const sc of scores) {
        const res = await client.query(`
          INSERT INTO "Score" ("studentId", "subjectId", term, "caScore", "examScore")
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT ("studentId", "subjectId", term) 
          DO UPDATE SET "caScore" = EXCLUDED."caScore", "examScore" = EXCLUDED."examScore", "updatedAt" = CURRENT_TIMESTAMP
          RETURNING *
        `, [sc.studentId, sc.subjectId, sc.term, sc.caScore, sc.examScore]);
        results.push(res.rows[0]);
      }
      await client.query('COMMIT');
      res.status(201).json({ saved: results.length, scores: results });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
};

// PUT /api/scores/:id
export const updateScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caScore, examScore } = req.body;
    const { id } = req.params;
// Removed caScore range validation
// Removed examScore range validation

    const fields = [];
    const params = [];
    if (caScore !== undefined) { params.push(Number(caScore)); fields.push(`"caScore" = $${params.length}`); }
    if (examScore !== undefined) { params.push(Number(examScore)); fields.push(`"examScore" = $${params.length}`); }

    if (fields.length === 0) return res.json(await (await query(`SELECT * FROM "Score" WHERE id = $1`, [id])).rows[0]);

    fields.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await query(`
      UPDATE "Score" SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *
    `, params);

    if (result.rows.length === 0) return next(createError('Score not found', 404));
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23503') return next(createError('Score not found', 404));
    next(err);
  }
};

// DELETE /api/scores/:id
export const deleteScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`DELETE FROM "Score" WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return next(createError('Score not found', 404));
    res.json({ message: 'Score deleted successfully' });
  } catch (err) { next(err); }
};

// GET /api/scores/stream/:streamId/rankings?term=
export const getStreamRankings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { term = 'Term 1 2026' } = req.query;
    const { streamId } = req.params;

    const studentsRes = await query(`
      SELECT stu.*, 
        (SELECT json_build_object('id', st.id, 'name', st.name) FROM "Stream" st WHERE st.id = stu."streamId") as stream,
        COALESCE(
          (SELECT json_agg(row_to_json(sc.*)) FROM "Score" sc WHERE sc."studentId" = stu.id AND sc.term = $2),
        '[]'::json) as scores
      FROM "Student" stu
      WHERE stu."streamId" = $1
    `, [streamId, String(term)]);

    const students = studentsRes.rows;
    const gradingRes = await query(`SELECT * FROM "GradingScale"`);
    const gradingScale = gradingRes.rows;

    const ranked = students.map(student => {
      const totalMarks = student.scores.reduce((s: number, sc: any) => s + sc.caScore + sc.examScore, 0);
      const subjectsCount = student.scores.length;
      const avg = subjectsCount > 0 ? totalMarks / subjectsCount : 0;
      const matched = gradingScale.find(g => avg >= g.minScore && avg <= g.maxScore);
      const grade = matched?.grade || (avg >= 80 ? 'A' : avg >= 40 ? 'E' : 'F');
      const remark = matched?.remark || (avg >= 40 ? 'Pass' : 'Fail');
      return {
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        totalMarks,
        averageScore: Math.round(avg * 100) / 100,
        grade,
        remark,
        subjectsCount
      };
    }).sort((a, b) => b.totalMarks - a.totalMarks)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    const classAvg = ranked.length > 0 ? ranked.reduce((s, r) => s + r.averageScore, 0) / ranked.length : 0;

    res.json({
      streamId,
      term,
      totalStudents: ranked.length,
      classAverage: Math.round(classAvg * 100) / 100,
      rankings: ranked,
    });
  } catch (err) { next(err); }
};
