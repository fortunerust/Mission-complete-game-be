import express from 'express';
import cors from 'cors';
import routes from './routes';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(cors({
  origin: [
    'https://look-maxxing-game-frontend.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

export default app;
