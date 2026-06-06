import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { createError } from '../middleware/errorHandler';

// GET /api/streams
export const getAllStreams = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT st.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', s.id, 'admissionNumber', s."admissionNumber", 'firstName', s."firstName", 'lastName', s."lastName", 'status', s.status))
           FROM "Student" s WHERE s."streamId" = st.id), 
        '[]'::json) as students,
        COALESCE(
          (SELECT json_agg(json_build_object('subject', row_to_json(su.*)))
           FROM "StreamSubject" ss
           JOIN "Subject" su ON ss."subjectId" = su.id
           WHERE ss."streamId" = st.id),
        '[]'::json) as "streamSubjects"
      FROM "Stream" st
      ORDER BY st.name ASC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/streams/:id
export const getStreamById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT st.*,
        COALESCE(
          (SELECT json_agg(row_to_json(s.*))
           FROM "Student" s WHERE s."streamId" = st.id), 
        '[]'::json) as students,
        COALESCE(
          (SELECT json_agg(json_build_object('subject', row_to_json(su.*)))
           FROM "StreamSubject" ss
           JOIN "Subject" su ON ss."subjectId" = su.id
           WHERE ss."streamId" = st.id),
        '[]'::json) as "streamSubjects"
      FROM "Stream" st
      WHERE st.id = $1
    `, [id]);
    
    if (result.rows.length === 0) return next(createError('Stream not found', 404));
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// POST /api/streams
export const createStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, classTeacher, telephone, subject, empID, classCaptain, admNo } = req.body;
    if (!name) return next(createError('name is required'));
    const result = await query(`
      INSERT INTO "Stream" (name, "classTeacher", telephone, subject, "empID", "classCaptain", "admNo")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, classTeacher || '', telephone || '', subject || '', empID || '', classCaptain || '', admNo || '']);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return next(createError('A stream with this name already exists'));
    next(err);
  }
};

// PUT /api/streams/:id
export const updateStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, classTeacher, telephone, subject, empID, classCaptain, admNo } = req.body;
    const { id } = req.params;
    const result = await query(`
      UPDATE "Stream"
      SET
        name = COALESCE($1, name),
        "classTeacher" = COALESCE($2, "classTeacher"),
        telephone = COALESCE($3, telephone),
        subject = COALESCE($4, subject),
        "empID" = COALESCE($5, "empID"),
        "classCaptain" = COALESCE($6, "classCaptain"),
        "admNo" = COALESCE($7, "admNo"),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [name, classTeacher, telephone, subject, empID, classCaptain, admNo, id]);
    
    if (result.rows.length === 0) return next(createError('Stream not found', 404));
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return next(createError('A stream with this name already exists'));
    next(err);
  }
};

// DELETE /api/streams/:id
export const deleteStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`DELETE FROM "Stream" WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return next(createError('Stream not found', 404));
    res.json({ message: 'Stream deleted successfully' });
  } catch (err) { next(err); }
};

// POST /api/streams/:id/subjects — assign subject to stream
export const assignSubjectToStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId } = req.body;
    const { id } = req.params;
    if (!subjectId) return next(createError('subjectId is required'));
    const result = await query(`
      INSERT INTO "StreamSubject" ("streamId", "subjectId")
      VALUES ($1, $2)
      RETURNING *
    `, [id, subjectId]);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return next(createError('Subject already assigned to this stream'));
    next(err);
  }
};

// DELETE /api/streams/:id/subjects/:subjectId — remove subject from stream
export const removeSubjectFromStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      DELETE FROM "StreamSubject"
      WHERE "streamId" = $1 AND "subjectId" = $2
      RETURNING *
    `, [req.params.id, req.params.subjectId]);
    if (result.rows.length === 0) return next(createError('Assignment not found', 404));
    res.json({ message: 'Subject removed from stream' });
  } catch (err) { next(err); }
};
export const getSubjectsForStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT json_agg(json_build_object(
        'id', su.id,
        'name', su.name,
        'description', su.description
      )) as subjects
      FROM "StreamSubject" ss
      JOIN "Subject" su ON ss."subjectId" = su.id
      WHERE ss."streamId" = $1
    `, [id]);
    const subjects = result.rows[0]?.subjects || [];
    res.json(subjects);
  } catch (err) {
    next(err);
  }
};
