import type { Express } from 'express';
import { attachUser, handleErrors } from '../http';
import { convertDueAppointments } from '../services/appointmentConversion';
import { adminStatsRouter } from './adminStats';
import { appointmentsRouter } from './appointments';
import { branchesRouter } from './branches';
import { clockRouter } from './clock';
import { displayRouter } from './display';
import { queueRouter } from './queue';
import { servicesRouter } from './services';
import { slotsRouter } from './slots';
import { staffDashboardRouter } from './staffDashboard';
import { staffRouter } from './staff';
import { ticketsRouter } from './tickets';
import { usersRouter } from './users';

const CONVERSION_INTERVAL_MS = 5000;
const NO_STORE = 'no-store';

export function registerRoutes(app: Express) {
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', NO_STORE);
    convertDueAppointments();
    next();
  });
  app.use('/api', attachUser);
  app.use('/api/users', usersRouter);
  app.use('/api/branches', branchesRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/staff/dashboard', staffDashboardRouter);
  app.use('/api/staff', staffRouter);
  app.use('/api/clock', clockRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/queue', queueRouter);
  app.use('/api/slots', slotsRouter);
  app.use('/api/appointments', appointmentsRouter);
  app.use('/api/admin', adminStatsRouter);
  app.use('/api/display', displayRouter);
  app.use('/api', handleErrors);
  setInterval(convertDueAppointments, CONVERSION_INTERVAL_MS).unref();
}
