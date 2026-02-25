import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Character from '../models/Character';
import User from '../models/User';
import { createTransaction } from './transactionsController';
import type { CharacterType } from '../types/character';

const toCharacterShape = (c: CharacterType | null) =>
  c ? { _id: c._id, name: c.name, imageSrc: c.imageSrc, level: c.level, order: c.order, price: c.price } : null;

export const getCharacters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const characters = await Character.find().sort({ order: 1 }).lean();
    const list = characters.map(toCharacterShape);
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const addCharacter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, imageSrc, level, order, price } = req.body;
    if (!name || !imageSrc) {
      res.status(400).json({ error: 'name and imageSrc are required' });
      return;
    }
    const existing = await Character.findOne({ name });
    if (existing) {
      res.status(409).json({ error: 'Character with this name already exists' });
      return;
    }
    const character = await Character.create({
      name,
      imageSrc,
      level: level != null ? Number(level) : 1,
      order: order != null ? Number(order) : 0,
      price: price != null ? Number(price) : 0,
    });
    res.status(201).json(toCharacterShape(character));
  } catch (err) {
    next(err);
  }
};

export const updateCharacter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'id is required' });
      return;
    }
    const character = await Character.findOne({ _id: id });
    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }
    const { name, imageSrc, level, order, price } = req.body;
    if (name != null) character.name = name;
    if (imageSrc != null) character.imageSrc = imageSrc as unknown as string;
    if (level != null) character.level = level;
    if (order != null) character.order = order;
    if (price != null) (character as CharacterType).price = Number(price);
    await character.save();
    res.json(toCharacterShape(character));
  } catch (err) {
    next(err);
  }
};

export const validateCharacterPurchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wallet, characterId } = req.query;
    if (!wallet || !characterId) {
      res.status(400).json({ error: 'wallet and characterId are required' });
      return;
    }
    const user = await User.findOne({ wallet: String(wallet).trim() });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const character = await Character.findById(characterId);
    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }
    // Check if already purchased
    const characterIdObj = typeof characterId === 'string' ? characterId : String(characterId);
    const isPurchased = user.purchasedCharacters?.some(
      (id) => id.toString() === characterIdObj
    );
    if (isPurchased) {
      res.status(400).json({ error: 'Character already purchased' });
      return;
    }
    res.json({
      valid: true,
      price: character.price,
      characterId: character._id,
    });
  } catch (err) {
    next(err);
  }
};

export const purchaseCharacter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, characterId, totalCost, txSignature } = req.body;
    if (!user || !characterId || !txSignature || totalCost == null) {
      res.status(400).json({ error: 'user, characterId, totalCost, and txSignature are required' });
      return;
    }
    const userDoc = await User.findOne({ wallet: user });
    if (!userDoc) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const character = await Character.findById(characterId);
    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }
    // Check if already purchased
    const characterIdObj = typeof characterId === 'string' ? characterId : String(characterId);
    const isPurchased = userDoc.purchasedCharacters?.some(
      (id) => id.toString() === characterIdObj
    );
    if (isPurchased) {
      res.status(400).json({ error: 'Character already purchased' });
      return;
    }
    // Add character to purchasedCharacters
    if (!userDoc.purchasedCharacters) {
      userDoc.purchasedCharacters = [];
    }
    if (character._id) {
      userDoc.purchasedCharacters.push(character._id as unknown as typeof userDoc.purchasedCharacters[0]);
      userDoc.characterId = character._id as unknown as typeof userDoc.characterId;
    }
    await userDoc.save();
    // Create transaction record
    const txId = await createTransaction(user, 'character_purchase', Number(totalCost), txSignature);
    if (!txId) {
      res.status(500).json({ error: 'Failed to create transaction' });
      return;
    }
    // Populate character info for response
    const updatedUser = await User.findById(userDoc._id)
      .populate('characterId');
    
    const characterInfo = updatedUser?.characterId && typeof updatedUser.characterId === 'object' && !(updatedUser.characterId instanceof mongoose.Types.ObjectId)
      ? (updatedUser.characterId as Record<string, unknown>)
      : null;
    
    res.json({
      success: true,
      purchasedCharacters: userDoc.purchasedCharacters,
      character: characterInfo,
      txId,
    });
  } catch (err) {
    next(err);
  }
};
