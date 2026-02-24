import { Router } from 'express';
import { getMissions, addMission, updateMission } from '../controllers/missionsController';

const router = Router();
router.get('/', getMissions);
router.post('/', addMission);
router.put('/:id', updateMission);
export default router;
