import { Router } from 'express';
import { getCharacters, addCharacter, updateCharacter } from '../controllers/charactersController';

const router = Router();
router.get('/', getCharacters);
router.post('/', addCharacter);
router.put('/:id', updateCharacter);
export default router;
