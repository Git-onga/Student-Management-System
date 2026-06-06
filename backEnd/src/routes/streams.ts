import { Router } from 'express';
import {
  getAllStreams, getStreamById, createStream, updateStream, deleteStream,
  assignSubjectToStream, removeSubjectFromStream,
} from '../controllers/streams';
import { getStreamTimetable } from '../controllers/timetable';

const router = Router();

router.get('/', getAllStreams);
router.get('/:id', getStreamById);
router.post('/', createStream);
router.put('/:id', updateStream);
router.delete('/:id', deleteStream);
router.post('/:id/subjects', assignSubjectToStream);
router.delete('/:id/subjects/:subjectId', removeSubjectFromStream);
router.get('/:id/timetable', getStreamTimetable);

export default router;
