import { Router } from 'express';
import { bodyOf, optionalUser, requireRole } from '../http';
import { createBranch, listBranches, updateBranch } from '../services/branches';
import type { BranchInput } from '../../shared/types';

export const branchesRouter = Router();

branchesRouter.get('/', (_req, res) => {
  res.json(listBranches(optionalUser(res)));
});

branchesRouter.post('/', requireRole('admin'), (req, res) => {
  res.status(201).json(createBranch(bodyOf<BranchInput>(req)));
});

branchesRouter.put('/:id', requireRole('admin'), (req, res) => {
  res.json(updateBranch(req.params.id, bodyOf<BranchInput>(req)));
});
