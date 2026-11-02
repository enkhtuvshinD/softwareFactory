import { Router } from 'express';
import { requireRole, sessionUser } from '../http';
import { staffDashboard } from '../services/reports';

export const staffDashboardRouter = Router();

staffDashboardRouter.get('/', requireRole('staff'), (_req, res) => {
  res.json(staffDashboard(sessionUser(res)));
});
