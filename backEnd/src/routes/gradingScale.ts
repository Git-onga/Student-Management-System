import { Router } from 'express';
import { getGradingScale, replaceGradingScale, updateGradingEntry } from '../controllers/gradingScale';

const router = Router();

router.get('/', getGradingScale);
router.put('/', replaceGradingScale);
router.patch('/:grade', updateGradingEntry);

export default router;
