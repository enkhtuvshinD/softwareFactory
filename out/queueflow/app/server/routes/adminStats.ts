import { Router } from 'express';
import { requireRole } from '../http';
import { adminStats } from '../services/reports';

export const adminStatsRouter = Router();

adminStatsRouter.get('/stats', requireRole('admin'), (_req, res) => {
  res.json(adminStats());
});
