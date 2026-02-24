export interface CardType {
  _id?: string;
  name: string;
  value: string;
  type: 'blue' | 'pink';
  imageBg?: string;
  imageItem?: string;
  stats: {
    physique: number;
    strength: number;
    charisma: number;
    rizz: number;
  } | null;
}