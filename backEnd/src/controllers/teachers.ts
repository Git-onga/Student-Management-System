import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { createError } from '../middleware/errorHandler';

// GET /api/teachers
export const getAllTeachers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId } = req.query;
    let sql = `
      SELECT t.*,
        row_to_json(s1.*) as "subjectOne",
        row_to_json(s2.*) as "subjectTwo",
        COALESCE((SELECT COUNT(*) FROM "Timetable" tt WHERE tt."teacherId" = t.id), 0) as "lessonCount"
      FROM "Teacher" t
      LEFT JOIN "Subject" s1 ON t."subjectOneId" = s1.id
      LEFT JOIN "Subject" s2 ON t."subjectTwoId" = s2.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (subjectId) {
      params.push(String(subjectId));
      sql += ` AND (t."subjectOneId" = $${params.length} OR t."subjectTwoId" = $${params.length})`;
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
        row_to_json(s1.*) as "subjectOne",
        row_to_json(s2.*) as "subjectTwo",
        COALESCE((SELECT COUNT(*) FROM "Timetable" tt WHERE tt."teacherId" = t.id), 0) as "lessonCount"
      FROM "Teacher" t
      LEFT JOIN "Subject" s1 ON t."subjectOneId" = s1.id
      LEFT JOIN "Subject" s2 ON t."subjectTwoId" = s2.id
      WHERE t.id = $1
    `, [id]);
    
    if (result.rows.length === 0) return next(createError('Teacher not found', 404));
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// POST /api/teachers
export const createTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { empID, name, subjectOneId, subjectTwoId, telephone } = req.body;
    if (!empID || !name || !subjectOneId || !subjectTwoId) return next(createError('empID, name, subjectOneId, and subjectTwoId are required'));
    if (subjectOneId === subjectTwoId) return next(createError('A teacher must teach two different subjects'));
    
    const subjectCheck = await query(`SELECT id FROM "Subject" WHERE id = ANY($1::text[])`, [[subjectOneId, subjectTwoId]]);
    if (subjectCheck.rows.length !== 2) return next(createError('One or both subjects not found', 404));

    const result = await query(`
      INSERT INTO "Teacher" ("empID", name, telephone, "subjectOneId", "subjectTwoId")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [empID, name, telephone || '', subjectOneId, subjectTwoId]);
    
    const teacher = result.rows[0];
    res.status(201).json(teacher);
  } catch (err: any) {
    if (err.code === '23505') return next(createError('A teacher with this empID already exists'));
    next(err);
  }
};

// PUT /api/teachers/:id
export const updateTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { empID, name, telephone, subjectOneId, subjectTwoId } = req.body;
    const { id } = req.params;
    if (!empID || !name || !telephone || !subjectOneId || !subjectTwoId) return next(createError('empID, name, telephone, subjectOneId, and subjectTwoId are required'));
    if (subjectOneId === subjectTwoId) return next(createError('A teacher must teach two different subjects'));

    const subjectCheck = await query(`SELECT id FROM "Subject" WHERE id = ANY($1::text[])`, [[subjectOneId, subjectTwoId]]);
    if (subjectCheck.rows.length !== 2) return next(createError('One or both subjects not found', 404));

    const result = await query(`
      UPDATE "Teacher"
      SET "empID" = $1, name = $2, telephone = $3, "subjectOneId" = $4, "subjectTwoId" = $5, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [empID, name, telephone, subjectOneId, subjectTwoId, id]);
    
    if (result.rows.length === 0) return next(createError('Teacher not found', 404));
    
    const teacher = result.rows[0];
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
