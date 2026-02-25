import { Router } from 'express';
import { getCharacters, addCharacter, updateCharacter, validateCharacterPurchase, purchaseCharacter } from '../controllers/charactersController';

const router = Router();
router.get('/', getCharacters);
router.get('/validate-purchase', validateCharacterPurchase);
router.post('/purchase', purchaseCharacter);
router.post('/', addCharacter);
router.put('/:id', updateCharacter);
export default router;
