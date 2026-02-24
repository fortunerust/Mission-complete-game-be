import { Router } from 'express';
import healthRoutes from './health.routes';
import playerRoutes from './player.routes';
import missionsRoutes from './missions.routes';
import cardsRoutes from './cards.routes';
import mapsRoutes from './maps.routes';
import packsRoutes from './packs.routes';
import transactionsRoutes from './transactions.routes';
import charactersRoutes from './characters.routes';
import gameHistoryRoutes from './gameHistory.routes';

const router = Router();
router.use('/health', healthRoutes);
router.use('/player', playerRoutes);
router.use('/missions', missionsRoutes);
router.use('/game-history', gameHistoryRoutes);
router.use('/cards', cardsRoutes);
router.use('/maps', mapsRoutes);
router.use('/packs', packsRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/characters', charactersRoutes);

export default router;
