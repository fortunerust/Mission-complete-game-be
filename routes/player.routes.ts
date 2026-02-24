import { Router } from 'express';
import { getPlayer, updatePlayer } from '../controllers/playerController';

const router = Router();
router.get('/', getPlayer);
router.patch('/', updatePlayer);
export default router;
