/**
 * Seed MongoDB with Map, Mission, Character, Card.
 * Run: npm run seed (from backend dir, with MONGODB_URI set)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Map from '../models/Map';
import Mission from '../models/Mission';
import Character from '../models/Character';
import Card from '../models/Card';
import { mongodbUri } from '../config/config';

const MAPS = [
  { name: 'BEACH SIDE', imageSrc: '/images/maps/map1.png', order: 1, unlocked: true },
  { name: 'MIAMI NIGHTS', imageSrc: '/images/maps/map2.png', order: 2, unlocked: true },
  { name: 'LOCKED MAP', imageSrc: '/images/maps/map3.png', order: 3, unlocked: false },
];

const MISSIONS_BY_MAP_ORDER: Array<{ order: number; name: string; description: string; duration: string; yield: string; stars: number; icon: string }[]> = [
  [
    { order: 1, name: 'GYM SESSION', description: "Use the Gym to improve your character's overall physique.", duration: '2 HRS', yield: '15 PT', stars: 0, icon: 'gym' },
    { order: 2, name: 'LOCK IN', description: 'Focus and lock in to improve your skills.', duration: '1 HR', yield: '8 PT', stars: 0, icon: 'lock' },
    { order: 3, name: 'PERPS TRADING', description: 'Trade perpetual futures to earn rewards.', duration: '1 HR', yield: '10 PT', stars: 0, icon: 'trading' },
    { order: 4, name: 'POOL PARTY', description: 'Attend a pool party to boost your social stats.', duration: '3 HRS', yield: '20 PT', stars: 0, icon: 'pool' },
  ], 
  [
    { order: 1, name: 'POOL PARTY', description: 'Attend a pool party to boost your social stats.', duration: '3 HRS', yield: '20 PT', stars: 0, icon: 'pool' },
    { order: 2, name: 'PERPS TRADING', description: 'Trade perpetual futures to earn rewards.', duration: '1 HR', yield: '10 PT', stars: 0, icon: 'trading' },
    { order: 3, name: 'GYM SESSION', description: "Use the Gym to improve your character's overall physique.", duration: '2 HRS', yield: '15 PT', stars: 0, icon: 'gym' },
    { order: 4, name: 'LOCK IN', description: 'Focus and lock in to improve your skills.', duration: '1 HR', yield: '8 PT', stars: 0, icon: 'lock' },
  ],
  [
    { order: 1, name: 'LOCK IN', description: 'Focus and lock in to improve your skills.', duration: '1 HR', yield: '8 PT', stars: 0, icon: 'lock' },
    { order: 2, name: 'GYM SESSION', description: "Use the Gym to improve your character's overall physique.", duration: '2 HRS', yield: '15 PT', stars: 0, icon: 'gym' },
    { order: 3, name: 'POOL PARTY', description: 'Attend a pool party to boost your social stats.', duration: '3 HRS', yield: '20 PT', stars: 0, icon: 'pool' },
    { order: 4, name: 'PERPS TRADING', description: 'Trade perpetual futures to earn rewards.', duration: '1 HR', yield: '10 PT', stars: 0, icon: 'trading' },
  ],
];

const CHARACTERS = [
  { name: 'CHAD', imageSrc: '/images/characters/chad.svg', order: 1 },
  { name: 'CHUBBY', imageSrc: '/images/characters/chubby.svg', order: 2 },
];

const CARDS_DATA = [
  { name: 'Red Light Therapy', value: 'FX500', type: 'blue' as const, imageBg: '/images/card/bgs/fx500.svg', imageItem: '/images/card/items/fx500.svg', stats: { physique: 100, strength: 100, charisma: 100, rizz: 100 } },
  { name: 'Penthouse', value: 'FlooR45', type: 'pink' as const, imageBg: '/images/card/bgs/floor45.svg', imageItem: '', stats: { physique: 300, strength: 300, charisma: 300, rizz: 300 } },
  { name: 'Sixpack', value: 'CHAD', type: 'blue' as const, imageBg: '/images/card/bgs/chad.svg', imageItem: '/images/card/items/chad.svg', stats: { physique: 500, strength: 500, charisma: 500, rizz: 500 } },
  { name: 'OF Model', value: 'DuBAI HABIBI', type: 'pink' as const, imageBg: '/images/card/bgs/dubai.svg', imageItem: '/images/card/items/dubai.svg', stats: { physique: 1000, strength: 1000, charisma: 1000, rizz: 1000 } },
];

async function seed() {
  await mongoose.connect(mongodbUri);

  await Map.deleteMany({});
  const insertedMaps = await Map.insertMany(MAPS);
  console.log('Maps seeded');

  await Mission.deleteMany({});
  const missionDocs = insertedMaps.flatMap((map, idx) =>
    MISSIONS_BY_MAP_ORDER[idx].map((m) => ({ ...m, mapId: map._id }))
  );
  await Mission.insertMany(missionDocs);
  console.log('Missions seeded');

  await Character.deleteMany({});
  await Character.insertMany(CHARACTERS);
  console.log('Characters seeded');

  await Card.deleteMany({});
  await Card.insertMany(CARDS_DATA);
  console.log('Cards seeded');

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
