import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import CardHistory from '../models/CardHistory';
import Character from '../models/Character';
import { CardHistoryType } from '../types';

/** Populated refs from User (map, character, cards). */
interface PlayerResponse {
  wallet: string;
  map: Record<string, unknown> | null;
  character: Record<string, unknown> | null;
  cardsInUse: Record<string, unknown>[];
  cardsPurchased: Record<string, unknown>[];
  energy: number;
  packs: number;
  experience: number;
  level: number;
  purchasedCharacters: mongoose.Types.ObjectId[];
}

function toPlayerResponse(user: mongoose.Document & {
  wallet: string;
  mapId?: mongoose.Types.ObjectId | Record<string, unknown>;
  characterId?: mongoose.Types.ObjectId | Record<string, unknown>;
  cardsInUse?: mongoose.Types.ObjectId[] | Record<string, unknown>[];
  cardsPurchased?: mongoose.Types.ObjectId[] | Record<string, unknown>[];
  energy?: number;
  packs?: number;
  experience?: number;
  level?: number;
  purchasedCharacters?: mongoose.Types.ObjectId[];
}): PlayerResponse {
  const map = user.mapId && typeof user.mapId === 'object' && !(user.mapId instanceof mongoose.Types.ObjectId)
    ? (user.mapId as Record<string, unknown>)
    : null;
  const character = user.characterId && typeof user.characterId === 'object' && !(user.characterId instanceof mongoose.Types.ObjectId)
    ? (user.characterId as Record<string, unknown>)
    : null;
  const toCardRecord = (c: mongoose.Types.ObjectId | Record<string, unknown>): Record<string, unknown> | null => {
    if (!c || c instanceof mongoose.Types.ObjectId) return null;
    const obj = c as unknown as { toObject?: () => Record<string, unknown> };
    return typeof obj.toObject === 'function' ? obj.toObject() : (c as Record<string, unknown>);
  };
  const cardsInUse = (user.cardsInUse?.map(toCardRecord).filter((x): x is Record<string, unknown> => x != null)) ?? [];
  const cardsPurchased = (user.cardsPurchased?.map(toCardRecord).filter((x): x is Record<string, unknown> => x != null)) ?? [];
  return {
    wallet: user.wallet,
    map: map ?? null,
    character: character ?? null,
    cardsInUse: cardsInUse,
    cardsPurchased: cardsPurchased,
    energy: user.energy ?? 0,
    packs: user.packs ?? 0,
    experience: user.experience ?? 0,
    level: user.level ?? 1,
    purchasedCharacters: user.purchasedCharacters ?? [],
  };
}

export const getPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wallet } = req.query;
    if (!wallet) {
      res.status(400).json({ error: 'wallet query is required' });
      return;
    }
    let user = await User.findOne({ wallet: String(wallet).trim() })
      .populate('mapId')
      .populate('characterId')
    if (!user) {
      const created = await User.create({
        wallet: String(wallet).trim(),
      });
      user = await User.findById(created._id)
        .populate('mapId')
        .populate('characterId')
    }
    if (!user) {
      res.status(500).json({ error: 'Failed to load player' });
      return;
    }
    const cardHistory = await CardHistory.find({ user: user._id }).populate('cardId');
    const cardsInUse = cardHistory?.filter((c) => c.action === 'use');
    const cardsPurchased = cardHistory?.filter((c) => c.action === 'purchase');
    res.json({
      ...toPlayerResponse(user),
      cardsInUse: cardsInUse ?? [],
      cardsPurchased: cardsPurchased ?? [],
    });
  } catch (err) {
    next(err);
  }
};

const ALLOWED_UPDATE_KEYS = ['name', 'physique', 'packs', 'slots', 'mapId', 'characterId', 'historyId', 'action'] as const;

export const updatePlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wallet, ...updates } = req.body;
    if (!wallet) {
      res.status(400).json({ error: 'wallet is required' });
      return;
    }
    const payload: Record<string, unknown> = {};
    ALLOWED_UPDATE_KEYS.forEach((k) => {
      if (updates[k] !== undefined) payload[k] = updates[k];
    });

    if (payload.characterId != null) {
      const currentUser = await User.findOne({ wallet: String(wallet).trim() }).select('level').lean();
      const character = await Character.findById(payload.characterId).select('level').lean();
      if (currentUser && character && (character.level ?? 1) > (currentUser.level ?? 1)) {
        res.status(400).json({ error: 'Character level exceeds your level. Level up to use this character.' });
        return;
      }
    }

    const user = await User.findOneAndUpdate(
      { wallet: String(wallet).trim() },
      { $set: payload },
      { new: true, runValidators: true }
    )
      .populate('mapId')
      .populate('characterId')
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (payload.action === 'use') {
      const inUseCount = await CardHistory.countDocuments({ user: user._id, action: 'use' });
      if (inUseCount >= 8) {
        res.status(400).json({ error: 'Cards in use limit reached (max 8)' });
        return;
      }
    }
    await CardHistory.updateOne(
      { user: user._id, _id: payload.historyId },
      { $set: { action: payload.action as 'use' | 'purchase' } }
    );
    
    const cardHistory = await CardHistory.find({ user: user._id }).populate('cardId');
    console.log("🔍 ~  ~ backend/controllers/playerController.ts:121 ~ cardHistory:", cardHistory);
    const cardsInUse = cardHistory?.filter((c) => c.action === 'use');
    const cardsPurchased = cardHistory?.filter((c) => c.action === 'purchase');
    res.json({
      ...toPlayerResponse(user),
      cardsInUse: cardsInUse ?? [],
      cardsPurchased: cardsPurchased ?? [],
    });
  } catch (err) {
    next(err);
  }
};
