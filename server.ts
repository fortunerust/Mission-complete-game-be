import app from './app';
import { connectDb } from './config/db';
import { port } from './config/config';

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  })
  .catch((err: Error) => {
    console.error(err);
    process.exit(1);
  });
