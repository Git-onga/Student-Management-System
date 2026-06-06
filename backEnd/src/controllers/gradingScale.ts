import { Request, Response, NextFunction } from 'express';
import { query, pool } from '../db';
import { createError } from '../middleware/errorHandler';

// GET /api/grading-scale
export const getGradingScale = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const scale = await query(`SELECT * FROM "GradingScale" ORDER BY "minScore" DESC`);
    res.json(scale.rows);
  } catch (err) { next(err); }
};

// PUT /api/grading-scale — replace entire scale
export const replaceGradingScale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scale } = req.body as {
      scale: { grade: string; minScore: number; maxScore: number; remark: string }[];
    };
    if (!Array.isArray(scale) || scale.length === 0) {
      return next(createError('scale array is required'));
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM "GradingScale"`);
      
      for (const item of scale) {
        await client.query(`
          INSERT INTO "GradingScale" (grade, "minScore", "maxScore", remark)
          VALUES ($1, $2, $3, $4)
        `, [item.grade, item.minScore, item.maxScore, item.remark]);
      }
      
      await client.query('COMMIT');
      
      const updated = await client.query(`SELECT * FROM "GradingScale" ORDER BY "minScore" DESC`);
      res.json({ replaced: scale.length, scale: updated.rows });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
};

// PATCH /api/grading-scale/:grade — update single grade entry
export const updateGradingEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { minScore, maxScore, remark } = req.body;
    const { grade } = req.params;

    const fields = [];
    const params = [];
    if (minScore !== undefined) { params.push(Number(minScore)); fields.push(`"minScore" = $${params.length}`); }
    if (maxScore !== undefined) { params.push(Number(maxScore)); fields.push(`"maxScore" = $${params.length}`); }
    if (remark) { params.push(remark); fields.push(`remark = $${params.length}`); }
    
    if (fields.length === 0) {
      const entry = await query(`SELECT * FROM "GradingScale" WHERE grade = $1`, [grade]);
      return res.json(entry.rows[0]);
    }
    
    params.push(grade);
    const result = await query(`
      UPDATE "GradingScale" SET ${fields.join(', ')} WHERE grade = $${params.length} RETURNING *
    `, params);
    
    if (result.rows.length === 0) return next(createError(`Grade '${grade}' not found`, 404));
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};
