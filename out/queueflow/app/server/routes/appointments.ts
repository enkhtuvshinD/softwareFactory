import { Router } from 'express';
import { requireRole, sessionUser } from '../http';
import { bookAppointment, cancelAppointment, listCustomerAppointments } from '../services/appointments';

export const appointmentsRouter = Router();

appointmentsRouter.use(requireRole('customer'));

appointmentsRouter.post('/', (req, res) => {
  const { branchId, serviceId, date, startTime } = req.body ?? {};
  res.status(201).json(bookAppointment(sessionUser(res), branchId, serviceId, date, startTime));
});

appointmentsRouter.get('/mine', (_req, res) => {
  res.json(listCustomerAppointments(sessionUser(res)));
});

appointmentsRouter.post('/:id/cancel', (req, res) => {
  res.json(cancelAppointment(sessionUser(res), req.params.id));
});
