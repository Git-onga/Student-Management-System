import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { createError } from '../middleware/errorHandler';

// GET /api/students
export const getAllStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { streamId, status, search } = req.query;
    let sql = `
      SELECT s.*, 
        (SELECT json_build_object('id', st.id, 'name', st.name) 
         FROM "Stream" st WHERE st.id = s."streamId") as stream
      FROM "Student" s
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (streamId) {
      params.push(String(streamId));
      sql += ` AND s."streamId" = $${params.length}`;
    }
    if (status) {
      params.push(String(status));
      sql += ` AND s.status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (s."firstName" ILIKE $${params.length} OR s."lastName" ILIKE $${params.length} OR s."admissionNumber" ILIKE $${params.length})`;
    }
    
    sql += ` ORDER BY s."lastName" ASC, s."firstName" ASC`;
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/students/:id
export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const studentRes = await query(`
      SELECT s.*, 
        row_to_json(st.*) as stream
      FROM "Student" s
      LEFT JOIN "Stream" st ON s."streamId" = st.id
      WHERE s.id = $1
    `, [id]);
    
    if (studentRes.rows.length === 0) return next(createError('Student not found', 404));
    const student = studentRes.rows[0];

    const scoresRes = await query(`
      SELECT sc.*, row_to_json(su.*) as subject
      FROM "Score" sc
      LEFT JOIN "Subject" su ON sc."subjectId" = su.id
      WHERE sc."studentId" = $1
    `, [id]);
    
    student.scores = scoresRes.rows;
    res.json(student);
  } catch (err) { next(err); }
};

// GET /api/students/:id/report?term=Term 1 2026
export const getStudentReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { term = 'Term 1 2026' } = req.query;
    const { id } = req.params;

    const studentRes = await query(`
      SELECT s.*, row_to_json(st.*) as stream
      FROM "Student" s
      LEFT JOIN "Stream" st ON s."streamId" = st.id
      WHERE s.id = $1
    `, [id]);
    
    if (studentRes.rows.length === 0) return next(createError('Student not found', 404));
    const student = studentRes.rows[0];

    const scoresRes = await query(`
      SELECT sc.*, row_to_json(su.*) as subject
      FROM "Score" sc
      LEFT JOIN "Subject" su ON sc."subjectId" = su.id
      WHERE sc."studentId" = $1 AND sc.term = $2
      ORDER BY su.name ASC
    `, [id, String(term)]);

    const gradingRes = await query(`SELECT * FROM "GradingScale"`);
    const gradingScale = gradingRes.rows;

    const subjectResults = scoresRes.rows.map(score => {
      const total = score.caScore + score.examScore;
      const matched = gradingScale.find(g => total >= g.minScore && total <= g.maxScore);
      const grade = matched?.grade || (total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : total >= 50 ? 'D' : total >= 40 ? 'E' : 'F');
      const remark = matched?.remark || (total >= 80 ? 'Excellent' : total >= 40 ? 'Pass' : 'Fail');
      return { subject: score.subject, caScore: score.caScore, examScore: score.examScore, total, grade, remark, term: score.term };
    });

    const overallTotal = subjectResults.reduce((s, r) => s + r.total, 0);
    const overallAvg = subjectResults.length > 0 ? overallTotal / subjectResults.length : 0;

    res.json({ 
      student, 
      stream: student.stream, 
      subjectResults, 
      overallTotal, 
      overallAverage: Math.round(overallAvg * 100) / 100, 
      term 
    });
  } catch (err) { next(err); }
};

// POST /api/students
export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { admissionNumber, firstName, lastName, dateOfBirth, gender, streamId, status } = req.body;
    if (!admissionNumber || !firstName || !lastName || !streamId) {
      return next(createError('admissionNumber, firstName, lastName, and streamId are required'));
    }
    
    const streamCheck = await query(`SELECT id, name FROM "Stream" WHERE id = $1`, [streamId]);
    if (streamCheck.rows.length === 0) return next(createError('Stream not found', 404));

    const result = await query(`
      INSERT INTO "Student" ("admissionNumber", "firstName", "lastName", "dateOfBirth", "gender", "streamId", "status")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      admissionNumber, firstName, lastName, dateOfBirth || '', gender || 'Male', streamId, status || 'active'
    ]);
    
    const student = result.rows[0];
    student.stream = streamCheck.rows[0];
    res.status(201).json(student);
  } catch (err: any) {
    if (err.code === '23505') return next(createError('A student with this admission number already exists'));
    next(err);
  }
};

// PUT /api/students/:id
export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { admissionNumber, firstName, lastName, dateOfBirth, gender, streamId, status } = req.body;
    const { id } = req.params;

    const streamCheck = await query(`SELECT id, name FROM "Stream" WHERE id = $1`, [streamId]);
    if (streamCheck.rows.length === 0) return next(createError('Stream not found', 404));

    const result = await query(`
      UPDATE "Student"
      SET "admissionNumber" = $1, "firstName" = $2, "lastName" = $3, "dateOfBirth" = $4, "gender" = $5, "streamId" = $6, "status" = $7, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [admissionNumber, firstName, lastName, dateOfBirth, gender, streamId, status, id]);

    if (result.rows.length === 0) return next(createError('Student not found', 404));
    
    const student = result.rows[0];
    student.stream = streamCheck.rows[0];
    res.json(student);
  } catch (err: any) {
    if (err.code === '23505') return next(createError('A student with this admission number already exists'));
    next(err);
  }
};

// PATCH /api/students/:id/status
export const updateStudentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const allowed = ['active', 'suspended', 'graduated'];
    if (!status || !allowed.includes(status)) return next(createError(`status must be one of: ${allowed.join(', ')}`));
    
    const result = await query(`
      UPDATE "Student" SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) return next(createError('Student not found', 404));
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/students/:id
export const deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM "Student" WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) return next(createError('Student not found', 404));
    res.json({ message: 'Student deleted successfully' });
  } catch (err) { next(err); }
};
