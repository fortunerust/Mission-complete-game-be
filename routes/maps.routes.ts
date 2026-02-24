import { Router } from 'express';
import { getMaps, addMap, updateMap } from '../controllers/mapsController';

const router = Router();
router.get('/', getMaps);
router.post('/', addMap);
router.put('/:id', updateMap);
export default router;
