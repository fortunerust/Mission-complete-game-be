import { Router } from 'express';
import { getTransactions } from '../controllers/transactionsController';

const router = Router();
router.get('/', getTransactions);
export default router;
