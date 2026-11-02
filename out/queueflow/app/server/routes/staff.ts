import { Router } from 'express';
import { bodyOf, requireRole } from '../http';
import { createStaff, listStaff, updateStaff } from '../services/staff';
import type { StaffInput } from '../../shared/types';

export const staffRouter = Router();

staffRouter.use(requireRole('admin'));

staffRouter.get('/', (_req, res) => {
  res.json(listStaff());
});

staffRouter.post('/', (req, res) => {
  res.status(201).json(createStaff(bodyOf<StaffInput>(req)));
});

staffRouter.put('/:id', (req, res) => {
  res.json(updateStaff(req.params.id, bodyOf<StaffInput>(req)));
});
