import { Router } from 'express';
import { getCards, listCards, addCard, updateCard } from '../controllers/cardsController';

const router = Router();
router.get('/', getCards);
router.get('/list', listCards);
router.post('/', addCard);
router.put('/:id', updateCard);
export default router;
