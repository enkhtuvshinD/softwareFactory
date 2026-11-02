import { Router } from 'express';
import { requireRole } from '../http';
import { listSlots } from '../services/appointments';

export const slotsRouter = Router();

slotsRouter.get('/', requireRole('customer'), (req, res) => {
  res.json(listSlots(req.query.branchId, req.query.serviceId, req.query.date));
});
