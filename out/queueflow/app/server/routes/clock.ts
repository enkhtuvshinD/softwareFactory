import { Router } from 'express';
import { readDb } from '../db';
import { failValidation, requireRole } from '../http';
import { advanceClock, currentClock, isValidAdvance, resetClock } from '../services/clock';
import { convertDueAppointments } from '../services/appointmentConversion';
import type { Db } from '../../shared/types';

export const clockRouter = Router();

clockRouter.get('/', (_req, res) => {
  res.json(currentClock(readDb<Db>()));
});

clockRouter.post('/advance', requireRole('admin'), (req, res) => {
  const minutes: unknown = req.body?.minutes;
  if (!isValidAdvance(minutes)) failValidation({ minutes: 'Minutes must be a whole number from 1 to 480' });
  const clock = advanceClock(minutes as number);
  convertDueAppointments();
  res.json(clock);
});

clockRouter.post('/reset', requireRole('admin'), (_req, res) => {
  res.json(resetClock());
});
