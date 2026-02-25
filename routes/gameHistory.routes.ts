import { Router } from 'express';
import { getByWallet, create, getRecentCompletions, getClaimableInfo, claimTokens } from '../controllers/gameHistoryController';

const router = Router();
router.get('/', getByWallet);
router.post('/', create);
router.get('/recent-completions', getRecentCompletions);
router.get('/claimable-info', getClaimableInfo);
router.post('/claim-tokens', claimTokens);

export default router;
