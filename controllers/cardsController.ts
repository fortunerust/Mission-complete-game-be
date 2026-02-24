import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Card from '../models/Card';
import { CardType } from '../types';  

const toCardShape = (c: CardType | null) =>
  c ? { _id: c._id, name: c.name, value: c.value, type: c.type, imageBg: c.imageBg, imageItem: c.imageItem, stats: c.stats } : null;

export const getCards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wallet } = req.query;
    if (!wallet) {
      res.status(400).json({ error: 'wallet query is required' });
      return;
    }
    const user = await User.findOne({ wallet: String(wallet).trim() })
      .populate('cardsInUse')
      .populate('cardsPurchased')
      .lean();
    if (!user) {
      res.json({ inUse: [], purchased: [] });
      return;
    }
    const inUse = (user.cardsInUse || []).map((c: unknown) => toCardShape(c as Parameters<typeof toCardShape>[0])).filter(Boolean);
    const purchased = (user.cardsPurchased || []).map((c: unknown) => toCardShape(c as Parameters<typeof toCardShape>[0])).filter(Boolean);
    res.json({ inUse, purchased });
  } catch (err) {
    next(err);
  }
};

export const listCards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cards = await Card.find().sort({ order: 1 }).lean();
    res.json(cards.map((c) => toCardShape(c)).filter(Boolean));
  } catch (err) {
    next(err);
  }
};

export const addCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, value, type, imageBg, imageItem, stats } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const existing = await Card.findOne({ name });
    if (existing) {
      res.status(409).json({ error: 'Card with this name already exists' });
      return;
    }
    const card = await Card.create({
      name,
      value: value != null ? String(value) : 'FX500',
      type: type === 'pink' ? 'pink' : 'blue',
      imageBg: imageBg != null ? String(imageBg) : '',
      imageItem: imageItem != null ? String(imageItem) : '',
      stats:
        stats && typeof stats === 'object'
          ? {
              physique: stats.physique != null ? Number(stats.physique) : 100,
              strength: stats.strength != null ? Number(stats.strength) : 100,
              charisma: stats.charisma != null ? Number(stats.charisma) : 100,
              rizz: stats.rizz != null ? Number(stats.rizz) : 100,
            }
          : undefined,
    });
    res.status(201).json(toCardShape(card));
  } catch (err) {
    next(err);
  }
};

export const updateCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'id is required' });
      return;
    }
    const card = await Card.findOne({ _id: id });
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    const { name, value, type, imageBg, imageItem, stats } = req.body;
    if (name != null) card.name = String(name);
    if (value != null) card.value = String(value);
    if (type === 'pink' || type === 'blue') card.type = type;
    if (imageBg != null) card.imageBg = imageBg as unknown as string;
    if (imageItem != null) card.imageItem = imageItem as unknown as string;
    if (stats && typeof stats === 'object' && card.stats) {
      if (stats.physique != null) card.stats.physique = Number(stats.physique);
      if (stats.strength != null) card.stats.strength = Number(stats.strength);
      if (stats.charisma != null) card.stats.charisma = Number(stats.charisma);
      if (stats.rizz != null) card.stats.rizz = Number(stats.rizz);
    }
    await card.save();
    res.json(toCardShape(card));
  } catch (err) {
    next(err);
  }
};
