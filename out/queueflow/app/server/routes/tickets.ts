import { Router } from 'express';
import { requireRole, sessionUser } from '../http';
import { createWalkInTicket, listBranchTickets, listCustomerTickets, transitionTicket } from '../services/tickets';
import type { TicketAction } from '../../shared/queue';

export const ticketsRouter = Router();

ticketsRouter.post('/', requireRole('customer'), (req, res) => {
  res.status(201).json(createWalkInTicket(sessionUser(res), req.body?.branchId, req.body?.serviceId));
});

ticketsRouter.get('/mine', requireRole('customer'), (_req, res) => {
  res.json(listCustomerTickets(sessionUser(res)));
});

ticketsRouter.get('/', requireRole('staff', 'admin'), (req, res) => {
  res.json(listBranchTickets(sessionUser(res), req.query.branchId, req.query.date));
});

function transitionRoute(path: string, action: TicketAction, ...roles: Parameters<typeof requireRole>) {
  ticketsRouter.post(path, requireRole(...roles), (req, res) => {
    res.json(transitionTicket(sessionUser(res), req.params.id, action));
  });
}

transitionRoute('/:id/start', 'start', 'staff', 'customer', 'admin');
transitionRoute('/:id/complete', 'complete', 'staff', 'customer', 'admin');
transitionRoute('/:id/no-show', 'no_show', 'staff', 'customer', 'admin');
transitionRoute('/:id/cancel', 'cancel', 'staff', 'customer', 'admin');
