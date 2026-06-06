import { Router } from 'express';
import {
  getAllSubjects, getSubjectById, getSubjectPerformance,
  createSubject, updateSubject, deleteSubject,
} from '../controllers/subjects';
import {
  getClassAssignments, createClassAssignment, deleteClassAssignment,
  getSubjectTimetable, createTimetableSlot, deleteTimetableSlot,
} from '../controllers/timetable';

const router = Router();

router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);
router.get('/:id/performance', getSubjectPerformance);
router.get('/:id/class-assignments', getClassAssignments);
router.post('/:id/class-assignments', createClassAssignment);
router.delete('/:id/class-assignments/:assignmentId', deleteClassAssignment);
router.get('/:id/timetable', getSubjectTimetable);
router.post('/:id/timetable', createTimetableSlot);
router.delete('/:id/timetable/:slotId', deleteTimetableSlot);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

export default router;
