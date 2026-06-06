import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { createError } from '../middleware/errorHandler';

// GET /api/subjects
export const getAllSubjects = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT s.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'empID', t."empID", 'name', t.name, 'telephone', t.telephone))
           FROM "Teacher" t WHERE t."subjectId" = s.id),
        '[]'::json) as teachers,
        COALESCE(
          (SELECT json_agg(json_build_object('teacher', row_to_json(t.*)))
           FROM "SubjectTeacher" st
           JOIN "Teacher" t ON st."teacherId" = t.id
           WHERE st."subjectId" = s.id),
        '[]'::json) as "subjectTeachers",
        COALESCE(
          (SELECT json_agg(json_build_object('stream', row_to_json(st.*)))
           FROM "StreamSubject" ss
           JOIN "Stream" st ON ss."streamId" = st.id
           WHERE ss."subjectId" = s.id),
        '[]'::json) as "streamSubjects",
        (SELECT json_build_object('scores', count(sc.id))
         FROM "Score" sc WHERE sc."subjectId" = s.id) as _count
      FROM "Subject" s
      ORDER BY s.name ASC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/subjects/:id
export const getSubjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT s.*,
        COALESCE(
          (SELECT json_agg(row_to_json(t.*))
           FROM "Teacher" t WHERE t."subjectId" = s.id),
        '[]'::json) as teachers,
        COALESCE(
          (SELECT json_agg(json_build_object('teacher', row_to_json(t.*)))
           FROM "SubjectTeacher" st
           JOIN "Teacher" t ON st."teacherId" = t.id
           WHERE st."subjectId" = s.id),
        '[]'::json) as "subjectTeachers",
        COALESCE(
          (SELECT json_agg(json_build_object('stream', row_to_json(st.*)))
           FROM "StreamSubject" ss
           JOIN "Stream" st ON ss."streamId" = st.id
           WHERE ss."subjectId" = s.id),
        '[]'::json) as "streamSubjects",
        COALESCE(
          (SELECT json_agg(json_build_object('student', row_to_json(stu.*), 'id', sc.id, 'caScore', sc."caScore", 'examScore', sc."examScore", 'term', sc.term))
           FROM "Score" sc
           JOIN "Student" stu ON sc."studentId" = stu.id
           WHERE sc."subjectId" = s.id),
        '[]'::json) as scores
      FROM "Subject" s
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) return next(createError('Subject not found', 404));
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// GET /api/subjects/:id/performance?term=Term 1 2026
export const getSubjectPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { term = 'Term 1 2026' } = req.query;
    const { id } = req.params;

    const scoresRes = await query(`
      SELECT sc.*, row_to_json(stu.*) as student, row_to_json(str.*) as stream
      FROM "Score" sc
      JOIN "Student" stu ON sc."studentId" = stu.id
      JOIN "Stream" str ON stu."streamId" = str.id
      WHERE sc."subjectId" = $1 AND sc.term = $2
    `, [id, String(term)]);

    const scores = scoresRes.rows.map(r => ({
      ...r,
      student: { ...r.student, stream: r.stream }
    }));

    if (scores.length === 0) {
      return res.json({ subjectId: id, term, studentCount: 0, mean: 0, passRate: 0, scores: [] });
    }

    const gradingRes = await query(`SELECT * FROM "GradingScale"`);
    const gradingScale = gradingRes.rows;

    const processed = scores.map(sc => {
      const total = sc.caScore + sc.examScore;
      const matched = gradingScale.find(g => total >= g.minScore && total <= g.maxScore);
      const grade = matched?.grade || (total >= 80 ? 'A' : total >= 40 ? 'E' : 'F');
      const remark = matched?.remark || (total >= 40 ? 'Pass' : 'Fail');
      return { student: sc.student, caScore: sc.caScore, examScore: sc.examScore, total, grade, remark };
    }).sort((a, b) => b.total - a.total);

    const mean = processed.reduce((s, r) => s + r.total, 0) / processed.length;
    const passed = processed.filter(r => r.total >= 40).length;

    res.json({
      subjectId: id,
      term,
      studentCount: processed.length,
      mean: Math.round(mean * 100) / 100,
      passRate: Math.round((passed / processed.length) * 1000) / 10,
      topScore: processed[0]?.total || 0,
      scores: processed,
    });
  } catch (err) { next(err); }
};

// POST /api/subjects
export const createSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, description } = req.body;
    if (!code || !name) return next(createError('code and name are required'));
    const result = await query(`
      INSERT INTO "Subject" (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [code, name, description || '']);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return next(createError('A subject with this code already exists'));
    next(err);
  }
};

// PUT /api/subjects/:id
export const updateSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, description } = req.body;
    const { id } = req.params;
    const result = await query(`
      UPDATE "Subject"
      SET code = $1, name = $2, description = $3, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [code, name, description, id]);
    
    if (result.rows.length === 0) return next(createError('Subject not found', 404));
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return next(createError('A subject with this code already exists'));
    next(err);
  }
};

// DELETE /api/subjects/:id
export const deleteSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`DELETE FROM "Subject" WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return next(createError('Subject not found', 404));
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) { next(err); }
};
