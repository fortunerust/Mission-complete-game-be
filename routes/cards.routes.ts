import { Router } from 'express';
import { listCards, addCard, updateCard } from '../controllers/cardsController';

const router = Router();
router.get('/list', listCards);
router.post('/', addCard);
router.put('/:id', updateCard);
export default router;
