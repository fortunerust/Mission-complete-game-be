import { Request, Response, NextFunction } from 'express';
import Map from '../models/Map';
import { MapType } from '../types';

const toMapShape = (m: MapType | null) =>
  m
    ? {
        _id: m._id,
        name: m.name,
        ...(m.imageSrc != null && { imageSrc: m.imageSrc }),
        order: m.order,
        unlocked: m.unlocked,
        selected: m.selected ?? false,
      }
    : null;

export const getMaps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const maps = await Map.find().sort({ order: 1 }).lean();
    const list = maps.map(toMapShape);
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const addMap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, imageSrc, order, unlocked, selected } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    if (!imageSrc) {
      res.status(400).json({ error: 'imageSrc is required' });
      return;
    }
    const existing = await Map.findOne({ order });
    if (existing) {
      res.status(409).json({ error: 'This map already exists' });
      return;
    }

    const newMap = {
      name,
      imageSrc,
      order,
      unlocked,
      selected
    }

    const map = new Map(newMap);
    
    await map.save();

    res.status(201).json(toMapShape(map));
  } catch (err) {
    next(err);
  }
};

export const updateMap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'id is required' });
      return;
    }
    const map = await Map.findOne({ _id: id });
    if (!map) {
      res.status(404).json({ error: 'Map not found' });
      return;
    }
    const { name, imageSrc, order, unlocked, selected } = req.body;
    if (name != null) map.name = name;
    if (imageSrc != null) map.imageSrc = imageSrc as unknown as string;
    if (order != null) map.order = order;
    if (unlocked !== undefined) map.unlocked = unlocked;
    if (selected !== undefined) map.selected = selected;
    await map.save();
    res.json(toMapShape(map));
  } catch (err) {
    next(err);
  }
};
