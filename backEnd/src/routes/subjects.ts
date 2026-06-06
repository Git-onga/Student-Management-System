import { Router } from 'express';
import {
  getAllSubjects, getSubjectById, getSubjectPerformance,
  createSubject, updateSubject, deleteSubject,
} from '../controllers/subjects';

const router = Router();

router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);
router.get('/:id/performance', getSubjectPerformance);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

export default router;
