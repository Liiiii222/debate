import express from 'express';
import { connectDB } from './config/database';

const app = express();
connectDB();

// TODO: Add your routes and middleware here

app.listen(3001, () => {
  console.log('Server running on port 3001');
}); 