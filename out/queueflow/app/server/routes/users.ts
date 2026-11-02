import { Router } from 'express';
import { listUsers } from '../services/staff';

export const usersRouter = Router();

usersRouter.get('/', (_req, res) => {
  res.json(listUsers());
});
