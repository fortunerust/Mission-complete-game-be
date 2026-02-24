import { Router } from 'express';
import { getPacks, purchasePacks } from '../controllers/packsController';

const router = Router();
router.get('/', getPacks);
router.post('/purchase', purchasePacks);
export default router;
