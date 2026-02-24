import express from 'express';
import cors from 'cors';
import routes from './routes';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://look-maxxing-game-frontend.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

export default app;
