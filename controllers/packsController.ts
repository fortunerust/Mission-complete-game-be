import { Request, Response } from 'express';
import { createTransaction } from './transactionsController';
import User from '../models/User';
import Pack from '../models/Pack';
import Card from '../models/Card';
import CardHistory from '../models/CardHistory';
import { CardHistoryType } from '../types';

/** Physique tiers and their selection chance (percent). Must sum to 100. */
const PHYSIQUE_WEIGHTS: { physique: number; chance: number }[] = [
  { physique: 100, chance: 50 },
  { physique: 300, chance: 20 },
  { physique: 500, chance: 10 },
  { physique: 1000, chance: 5 },
];

/** Pick one physique tier by weighted random (chances in percent). */
function pickPhysiqueTier(): number {
  const roll = Math.random() * 100;
  console.log("🔍 ~ pickPhysiqueTier ~ backend/controllers/packsController.ts:19 ~ roll:", roll);
  let acc = 0;
  for (const { physique, chance } of PHYSIQUE_WEIGHTS) {
    acc += chance;
    if (roll < acc) return physique;
  }
  return PHYSIQUE_WEIGHTS[PHYSIQUE_WEIGHTS.length - 1].physique;
}

/** Draw one random card with the given stats.physique from the Card collection. */
async function drawCardByPhysique(physique: number): Promise<{ _id: unknown; name: string; value: string; type: string; imageBg?: string; imageItem?: string; stats: { physique: number; strength: number; charisma: number; rizz: number } } | null> {
  const cards = await Card.aggregate([
    { $match: { 'stats.physique': physique } },
    { $sample: { size: 1 } },
    { $project: { name: 1, value: 1, type: 1, imageBg: 1, imageItem: 1, stats: 1 } },
  ]);
  return cards[0] ?? null;
}

export const getPacks = async (req: Request, res: Response): Promise<void> => {
  const packs = await Pack.find();
  res.json(packs.map((pack) => pack.price));
};

export const purchasePacks = async (req: Request, res: Response): Promise<void> => {
  const { user, type, quantity, totalCost, txSignature } = req.body;
  if (!user || !txSignature || !quantity || !totalCost) {
    res.status(400).json({ error: 'user, txSignature, quantity, and totalCost are required' });
    return;
  }
  const userDoc = await User.findOne({ wallet: user });
  if (!userDoc) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const qty = Number(quantity) || 0;
  if (qty < 1) {
    res.status(400).json({ error: 'quantity must be at least 1' });
    return;
  }

  const cardHistory: CardHistoryType[] = [];
  const cardHistoryIds: unknown[] = [];

  for (let i = 0; i < qty; i++) {
    const physique = pickPhysiqueTier();
    const card = await drawCardByPhysique(physique);
    if (card && card._id) {
      const cardHistoryEntry = await CardHistory.create({
        user: userDoc._id,
        cardId: card._id,
        action: 'purchase',
      });
      cardHistoryIds.push(cardHistoryEntry._id);
    }
  }

  // Populate card information for all created card history entries
  const populatedCardHistory = await CardHistory.find({
    _id: { $in: cardHistoryIds },
  }).populate('cardId');
  
  cardHistory.push(...populatedCardHistory);

  userDoc.packs += qty;
  await userDoc.save();

  const txId = await createTransaction(user, type, totalCost, txSignature);
  if (!txId) {
    res.status(500).json({ error: 'Failed to create transaction' });
    return;
  }
  res.json({
    success: true,
    packs: userDoc.packs,
    cardHistory: cardHistory,
    totalCost,
    txId,
  });
};
