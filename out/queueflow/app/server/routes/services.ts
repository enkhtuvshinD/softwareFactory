import { Router } from 'express';
import { bodyOf, optionalUser, requireRole } from '../http';
import { createService, listServices, updateService } from '../services/services';
import type { ServiceInput } from '../../shared/types';

export const servicesRouter = Router();

servicesRouter.get('/', (_req, res) => {
  res.json(listServices(optionalUser(res)));
});

servicesRouter.post('/', requireRole('admin'), (req, res) => {
  res.status(201).json(createService(bodyOf<ServiceInput>(req)));
});

servicesRouter.put('/:id', requireRole('admin'), (req, res) => {
  res.json(updateService(req.params.id, bodyOf<ServiceInput>(req)));
});
