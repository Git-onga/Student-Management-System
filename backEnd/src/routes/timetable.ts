import { Router } from 'express';
import {
  getAllTimetable,
  createTimetableSlotGeneric,
  deleteTimetableSlotById,
  generateUnifiedTimetable,
} from '../controllers/timetable';

const router = Router();

router.get('/', getAllTimetable);
router.post('/', createTimetableSlotGeneric);
router.post('/generate', generateUnifiedTimetable);
router.delete('/:slotId', deleteTimetableSlotById);

export default router;
