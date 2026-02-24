import { Request, Response, NextFunction } from 'express';
import Character from '../models/Character';
import type { CharacterType } from '../types/character';

const toCharacterShape = (c: CharacterType | null) =>
  c ? { _id: c._id, name: c.name, imageSrc: c.imageSrc, level: c.level, order: c.order } : null;

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
    const { name, imageSrc, level, order } = req.body;
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
    const { name, imageSrc, level, order } = req.body;
    if (name != null) character.name = name;
    if (imageSrc != null) character.imageSrc = imageSrc as unknown as string;
    if (level != null) character.level = level;
    if (order != null) character.order = order;
    await character.save();
    res.json(toCharacterShape(character));
  } catch (err) {
    next(err);
  }
};
