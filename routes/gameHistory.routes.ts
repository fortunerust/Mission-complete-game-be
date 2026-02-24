import { Router } from 'express';
import { getByWallet, create, getRecentCompletions } from '../controllers/gameHistoryController';

const router = Router();
router.get('/', getByWallet);
router.post('/', create);
router.get('/recent-completions', getRecentCompletions);

export default router;
