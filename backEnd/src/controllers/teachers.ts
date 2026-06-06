import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { createError } from '../middleware/errorHandler';

// GET /api/teachers
export const getAllTeachers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId } = req.query;
    let sql = `
      SELECT t.*, row_to_json(s.*) as subject,
        COALESCE((SELECT COUNT(*) FROM "Timetable" tt WHERE tt."teacherId" = t.id), 0) as "lessonCount"
      FROM "Teacher" t
      LEFT JOIN "Subject" s ON t."subjectId" = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (subjectId) {
      params.push(String(subjectId));
      sql += ` AND t."subjectId" = $${params.length}`;
    }
    sql += ` ORDER BY t.name ASC`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/teachers/:id
export const getTeacherById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT t.*,
        row_to_json(s.*) as subject,
        COALESCE((SELECT COUNT(*) FROM "Timetable" tt WHERE tt."teacherId" = t.id), 0) as "lessonCount",
        COALESCE(
          (SELECT json_agg(json_build_object('subject', row_to_json(su.*)))
           FROM "SubjectTeacher" st
           JOIN "Subject" su ON st."subjectId" = su.id
           WHERE st."teacherId" = t.id),
        '[]'::json) as "subjectTeachers"
      FROM "Teacher" t
      LEFT JOIN "Subject" s ON t."subjectId" = s.id
      WHERE t.id = $1
    `, [id]);
    
    if (result.rows.length === 0) return next(createError('Teacher not found', 404));
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// POST /api/teachers
export const createTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { empID, name, subjectId, telephone } = req.body;
    if (!empID || !name || !subjectId) return next(createError('empID, name, and subjectId are required'));
    
    const subjectCheck = await query(`SELECT * FROM "Subject" WHERE id = $1`, [subjectId]);
    if (subjectCheck.rows.length === 0) return next(createError('Subject not found', 404));

    const result = await query(`
      INSERT INTO "Teacher" ("empID", name, "subjectId", telephone)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [empID, name, subjectId, telephone || '']);
    
    const teacher = result.rows[0];
    teacher.subject = subjectCheck.rows[0];
    res.status(201).json(teacher);
  } catch (err: any) {
    if (err.code === '23505') return next(createError('A teacher with this empID already exists'));
    next(err);
  }
};

// PUT /api/teachers/:id
export const updateTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { empID, name, subjectId, telephone } = req.body;
    const { id } = req.params;

    const subjectCheck = await query(`SELECT * FROM "Subject" WHERE id = $1`, [subjectId]);
    if (subjectCheck.rows.length === 0) return next(createError('Subject not found', 404));

    const result = await query(`
      UPDATE "Teacher"
      SET "empID" = $1, name = $2, "subjectId" = $3, telephone = $4, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [empID, name, subjectId, telephone, id]);
    
    if (result.rows.length === 0) return next(createError('Teacher not found', 404));
    
    const teacher = result.rows[0];
    teacher.subject = subjectCheck.rows[0];
    res.json(teacher);
  } catch (err: any) {
    if (err.code === '23505') return next(createError('A teacher with this empID already exists'));
    next(err);
  }
};

// DELETE /api/teachers/:id
export const deleteTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`DELETE FROM "Teacher" WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return next(createError('Teacher not found', 404));
    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) { next(err); }
};
