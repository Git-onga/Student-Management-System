import { Router } from 'express';
import {
  getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher,
} from '../controllers/teachers';

const router = Router();

router.get('/', getAllTeachers);
router.get('/:id', getTeacherById);
router.post('/', createTeacher);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

export default router;
