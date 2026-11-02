import { Router } from 'express';
import { requireRole, sessionUser } from '../http';
import { callNext } from '../services/tickets';

export const queueRouter = Router();

queueRouter.post('/call-next', requireRole('staff'), (_req, res) => {
  res.json(callNext(sessionUser(res)));
});
