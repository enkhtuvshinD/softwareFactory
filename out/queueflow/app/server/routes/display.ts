import { Router } from 'express';
import { displayView } from '../services/reports';

export const displayRouter = Router();

displayRouter.get('/:branchId', (req, res) => {
  res.json(displayView(req.params.branchId));
});
