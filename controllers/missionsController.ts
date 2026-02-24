import { Request, Response, NextFunction } from 'express';
import Mission from '../models/Mission';
import { MissionType } from '../types';

const toMissionShape = (m: MissionType | null) =>
  m
    ? {
        _id: m._id,
        mapId: m.mapId,
        order: m.order,
        name: m.name,
        description: m.description,
        duration: m.duration,
        yield: m.yield,
        stars: m.stars,
        imageSrc: m.imageSrc,
      }
    : null;

export const getMissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mapId } = req.query;
    const filter = mapId ? { mapId } : {};
    const missions = await Mission.find(filter).sort({ order: 1 }).lean();
    const list = missions.map(toMissionShape);
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const addMission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mapId, order, name, description, duration, yield: y, stars, imageSrc } = req.body;
    if (!mapId || !name) {
      res.status(400).json({ error: 'mapId and name are required' });
      return;
    }
    const existing = await Mission.findOne({ mapId, order });
    if (existing) {
      res.status(409).json({ error: 'Mission with this mapId and name already exists' });
      return;
    }
    const mission = await Mission.create({
      mapId,
      order,
      name,
      description: description != null ? description : '',
      duration: duration != null ? duration : '2 HRS',
      yield: y != null ? Number(y) : 0,
      stars: stars != null ? stars : 0,
      imageSrc: imageSrc != null ? imageSrc : '/images/missioins/gym.svg',
    });
    res.status(201).json(toMissionShape(mission));
  } catch (err) {
    next(err);
  }
};

export const updateMission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'id is required' });
      return;
    }
    const mission = await Mission.findOne({ _id: id });
    if (!mission) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }
    const { mapId, order, name, description, duration, yield: y, stars, imageSrc } = req.body;
    if (mapId != null) mission.mapId = mapId;
    if (order != null) mission.order = order;
    if (name != null) mission.name = name;
    if (description != null) mission.description = description;
    if (duration != null) mission.duration = duration;
    if (y != null) mission.yield = Number(y);
    if (stars != null) mission.stars = stars;
    if (imageSrc != null) mission.imageSrc = imageSrc as unknown as string;
    await mission.save();
    res.json(toMissionShape(mission));
  } catch (err) {
    next(err);
  }
};
