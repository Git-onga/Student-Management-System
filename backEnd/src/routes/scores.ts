import { Router } from 'express';
import {
  getAllScores, getScoreById, createScore, batchUpsertScores,
  updateScore, deleteScore, getStreamRankings,
} from '../controllers/scores';

const router = Router();

router.get('/', getAllScores);
router.get('/stream/:streamId/rankings', getStreamRankings);
router.get('/:id', getScoreById);
router.post('/', createScore);
router.post('/batch', batchUpsertScores);
router.put('/:id', updateScore);
router.delete('/:id', deleteScore);

export default router;
