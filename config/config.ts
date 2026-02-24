import 'dotenv/config';

const defaultUri = 'mongodb://localhost:27017/lm-game';
const mongodbUri = process.env.MONGODB_URI || defaultUri;

/** Return URI with password masked for safe logging. */
export function getMongodbUriForLog(): string {
  if (!mongodbUri.includes('@')) return mongodbUri;
  return mongodbUri.replace(/:[^@]+@/, ':****@');
}

export const port = Number(process.env.PORT) || 3001;
export const nodeEnv = process.env.NODE_ENV || 'development';
export { mongodbUri };
