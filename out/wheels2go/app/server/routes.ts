import type { Express, Request, Response } from 'express';
import { readDb, writeDb } from './db';
import {
  DATE_MESSAGES,
  calcDays,
  calcTotal,
  computeEarnings,
  effectiveStatus,
  filterCars,
  hasConfirmedConflict,
  parseMaxPrice,
  toIsoDate,
  validateDates,
  validateListing,
} from '../shared/logic';
import type { Booking, Car, CarFilters, Db, StoredBooking, User } from '../shared/types';

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

function fail(res: Response, error: unknown) {
  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) },
    });
    return;
  }
  res.status(500).json({ error: { code: 'server_error', message: 'Unexpected server error' } });
}

function handler(fn: (req: Request, res: Response) => void) {
  return (req: Request, res: Response) => {
    try {
      fn(req, res);
    } catch (error) {
      fail(res, error);
    }
  };
}

function today() {
  return toIsoDate(new Date());
}

function activeUser(req: Request, db: Db): User {
  const id = req.header('X-User-Id');
  const user = db.users.find((u) => u.id === id);
  if (!user) throw new ApiError(403, 'forbidden', 'Unknown or missing user');
  return user;
}

function requireRole(user: User, role: User['role']) {
  if (user.role !== role) throw new ApiError(403, 'forbidden', `Only ${role}s can do this`);
}

function findCar(db: Db, id: string): Car {
  const car = db.cars.find((c) => c.id === id);
  if (!car) throw new ApiError(404, 'not_found', 'Car not found');
  return car;
}

function ownCar(db: Db, user: User, id: string): Car {
  requireRole(user, 'owner');
  const car = findCar(db, id);
  if (car.owner_id !== user.id) throw new ApiError(403, 'forbidden', 'You do not own this car');
  return car;
}

function carInputOrThrow(body: unknown) {
  const { fields, value } = validateListing(body, new Date().getUTCFullYear());
  if (!value) throw new ApiError(400, 'validation_error', 'Please correct the highlighted fields', fields);
  return value;
}

function nextId(prefix: string, items: { id: string }[], pad: number, min: number) {
  const max = items.reduce((m, item) => Math.max(m, Number(item.id.split('_')[1]) || 0), min - 1);
  return `${prefix}_${String(max + 1).padStart(pad, '0')}`;
}

function present(db: Db, stored: StoredBooking, now: string): Booking {
  const car = db.cars.find((c) => c.id === stored.car_id);
  const renter = db.users.find((u) => u.id === stored.renter_id);
  return {
    ...stored,
    status: effectiveStatus(stored, now),
    car: {
      title: car?.title ?? stored.car_title ?? 'Removed listing',
      image_url: car?.image_url ?? stored.car_image_url ?? '',
      owner_id: car?.owner_id ?? stored.car_owner_id ?? '',
      pickup_instructions: car?.pickup_instructions ?? '',
    },
    renter: { name: renter?.name ?? 'Unknown', email: renter?.email ?? '' },
  };
}

function activeBookingsOf(db: Db, carId: string) {
  return db.bookings.filter((b) => b.car_id === carId && (b.status === 'pending' || b.status === 'confirmed'));
}

export function registerRoutes(app: Express) {
  app.get('/api/users', handler((_req, res) => {
    res.json(readDb<Db>().users);
  }));

  app.get('/api/cars', handler((req, res) => {
    const db = readDb<Db>();
    const q = req.query;
    const filters: CarFilters = {
      make: String(q.make ?? ''),
      model: String(q.model ?? ''),
      location: String(q.location ?? ''),
      maxPrice: String(q.max_price ?? ''),
      transmission: String(q.transmission ?? ''),
      fuel: String(q.fuel ?? ''),
    };
    if (parseMaxPrice(filters.maxPrice).error) {
      throw new ApiError(400, 'validation_error', 'Max price must be a positive number', {
        max_price: 'Max price must be a positive number',
      });
    }
    res.json(filterCars(db.cars, filters));
  }));

  app.get('/api/cars/:id', handler((req, res) => {
    res.json(findCar(readDb<Db>(), req.params.id));
  }));

  app.post('/api/cars', handler((req, res) => {
    const db = readDb<Db>();
    const user = activeUser(req, db);
    requireRole(user, 'owner');
    const input = carInputOrThrow(req.body);
    const car: Car = {
      ...(input as Omit<Car, 'id' | 'owner_id' | 'status'>),
      title: input.title ?? '',
      id: nextId('car', db.cars, 2, 1),
      owner_id: user.id,
      status: 'available',
    };
    db.cars.push(car);
    writeDb(db);
    res.status(201).json(car);
  }));

  app.put('/api/cars/:id', handler((req, res) => {
    const db = readDb<Db>();
    const user = activeUser(req, db);
    const car = ownCar(db, user, req.params.id);
    const input = carInputOrThrow(req.body);
    const updated: Car = {
      ...(input as Omit<Car, 'id' | 'owner_id' | 'status'>),
      title: input.title ?? '',
      id: car.id,
      owner_id: car.owner_id,
      status: input.status ?? car.status,
    };
    db.cars[db.cars.indexOf(car)] = updated;
    writeDb(db);
    res.json(updated);
  }));

  app.patch('/api/cars/:id/availability', handler((req, res) => {
    const db = readDb<Db>();
    const user = activeUser(req, db);
    const car = ownCar(db, user, req.params.id);
    const status = req.body?.status;
    if (status !== 'available' && status !== 'unavailable') {
      throw new ApiError(400, 'validation_error', 'Status must be available or unavailable', {
        status: 'Status must be available or unavailable',
      });
    }
    car.status = status;
    writeDb(db);
    res.json(car);
  }));

  app.delete('/api/cars/:id', handler((req, res) => {
    const db = readDb<Db>();
    const user = activeUser(req, db);
    const car = ownCar(db, user, req.params.id);
    if (activeBookingsOf(db, car.id).length > 0) {
      throw new ApiError(409, 'conflict', 'This car has pending or confirmed bookings and cannot be deleted');
    }
    db.bookings.forEach((b) => {
      if (b.car_id === car.id) {
        b.car_title = car.title;
        b.car_image_url = car.image_url;
        b.car_owner_id = car.owner_id;
      }
    });
    db.cars = db.cars.filter((c) => c.id !== car.id);
    writeDb(db);
    res.status(204).end();
  }));

  app.get('/api/bookings', handler((req, res) => {
    const db = readDb<Db>();
    const user = activeUser(req, db);
    const now = today();
    const ownedIds = new Set(db.cars.filter((c) => c.owner_id === user.id).map((c) => c.id));
    const scoped = db.bookings.filter((b) =>
      user.role === 'renter' ? b.renter_id === user.id : ownedIds.has(b.car_id) || b.car_owner_id === user.id,
    );
    const sorted = [...scoped].sort((a, b) => b.created_at.localeCompare(a.created_at));
    res.json(sorted.map((b) => present(db, b, now)));
  }));

  app.post('/api/bookings', handler((req, res) => {
    const db = readDb<Db>();
    const user = activeUser(req, db);
    requireRole(user, 'renter');
    const { car_id, start_date, end_date } = req.body ?? {};
    const car = findCar(db, String(car_id));
    const dateError = validateDates(start_date, end_date, today());
    if (dateError) throw new ApiError(400, 'validation_error', dateError, { dates: dateError });
    if (car.owner_id === user.id) throw new ApiError(403, 'forbidden', 'You cannot book your own car');
    if (car.status !== 'available') throw new ApiError(409, 'unavailable', 'This car is currently unavailable');
    if (hasConfirmedConflict(db.bookings, car.id, start_date, end_date)) {
      throw new ApiError(409, 'conflict', DATE_MESSAGES.conflict);
    }
    const days = calcDays(start_date, end_date);
    const booking: StoredBooking = {
      id: nextId('book', db.bookings, 3, 301),
      renter_id: user.id,
      car_id: car.id,
      start_date,
      end_date,
      days,
      daily_rate: car.daily_rate,
      cleaning_fee: car.cleaning_fee,
      total_price: calcTotal(days, car.daily_rate, car.cleaning_fee),
      pickup_location: car.location.pickup_address,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    db.bookings.push(booking);
    writeDb(db);
    res.status(201).json(present(db, booking, today()));
  }));

  app.patch('/api/bookings/:id/status', handler((req, res) => {
    const db = readDb<Db>();
    const user = activeUser(req, db);
    const booking = db.bookings.find((b) => b.id === req.params.id);
    if (!booking) throw new ApiError(404, 'not_found', 'Booking not found');
    const status = req.body?.status;
    if (status !== 'confirmed' && status !== 'cancelled') {
      throw new ApiError(400, 'validation_error', 'Status must be confirmed or cancelled');
    }
    const now = today();
    const car = db.cars.find((c) => c.id === booking.car_id);
    const isOwner = user.role === 'owner' && (car?.owner_id ?? booking.car_owner_id) === user.id;
    const isRenter = user.role === 'renter' && booking.renter_id === user.id;
    if (!isOwner && !isRenter) throw new ApiError(403, 'forbidden', 'You cannot change this booking');

    if (status === 'confirmed') {
      if (!isOwner) throw new ApiError(403, 'forbidden', 'Only the car owner can approve bookings');
      if (booking.status !== 'pending') throw new ApiError(409, 'invalid_transition', 'Only pending bookings can be approved');
      if (hasConfirmedConflict(db.bookings, booking.car_id, booking.start_date, booking.end_date, booking.id)) {
        throw new ApiError(409, 'conflict', DATE_MESSAGES.conflict);
      }
      booking.status = 'confirmed';
    } else if (isOwner) {
      if (booking.status !== 'pending') throw new ApiError(409, 'invalid_transition', 'Only pending bookings can be rejected');
      booking.status = 'cancelled';
    } else {
      const cancellable =
        (booking.status === 'pending' || booking.status === 'confirmed') && booking.start_date > now;
      if (!cancellable) throw new ApiError(409, 'invalid_transition', 'This booking can no longer be cancelled');
      booking.status = 'cancelled';
    }
    writeDb(db);
    res.json(present(db, booking, now));
  }));

  app.get('/api/earnings', handler((req, res) => {
    const db = readDb<Db>();
    const user = activeUser(req, db);
    requireRole(user, 'owner');
    const ownerCars = db.cars.filter((c) => c.owner_id === user.id);
    res.json(computeEarnings(ownerCars, db.bookings, today()));
  }));
}
