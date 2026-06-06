import { Router } from 'express';
import {
  getAllStudents, getStudentById, getStudentReport,
  createStudent, updateStudent, updateStudentStatus, deleteStudent,
} from '../controllers/students';

const router = Router();

router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.get('/:id/report', getStudentReport);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.patch('/:id/status', updateStudentStatus);
router.delete('/:id', deleteStudent);

export default router;
