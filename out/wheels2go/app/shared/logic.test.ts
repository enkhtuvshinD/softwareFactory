import { describe, expect, it } from 'vitest';
import seed from '../server/data/seed.json';
import {
  calcDays,
  calcTotal,
  canCancel,
  computeEarnings,
  effectiveStatus,
  filterCars,
  formatDailyRate,
  formatDateRange,
  formatMoney,
  hasConfirmedConflict,
  isValidIsoDate,
  rangesOverlap,
  validateDates,
  validateListing,
} from './logic';
import type { Car, CarFilters, StoredBooking } from './types';

const cars = seed.cars as Car[];
const bookings = seed.bookings as StoredBooking[];
const noFilters: CarFilters = { make: '', model: '', location: '', maxPrice: '', transmission: '', fuel: '' };
const today = '2026-11-01';

describe('pricing', () => {
  it('counts days exclusive of end date', () => {
    expect(calcDays('2026-12-01', '2026-12-04')).toBe(3);
    expect(calcDays('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('computes totals with worked examples', () => {
    expect(calcTotal(3, 85, 25)).toBe(280);
    expect(calcTotal(1, 110, 35)).toBe(145);
    expect(calcTotal(2, 19.99, 5)).toBe(44.98);
  });

  it('formats money and rates', () => {
    expect(formatMoney(1234)).toBe('$1,234.00');
    expect(formatDailyRate(85)).toBe('$85/day');
    expect(formatDailyRate(85.5)).toBe('$85.50/day');
    expect(formatDateRange('2026-12-01', '2026-12-04')).toBe('Dec 1, 2026 – Dec 4, 2026');
  });
});

describe('date validation', () => {
  it('accepts today as start', () => {
    expect(validateDates('2026-11-01', '2026-11-02', today)).toBeNull();
  });

  it('reports each error', () => {
    expect(validateDates('', '2026-11-02', today)).toBe('Select a start and end date');
    expect(validateDates('2026-11-05', '2026-11-05', today)).toBe('End date must be after start date');
    expect(validateDates('2026-11-05', '2026-11-03', today)).toBe('End date must be after start date');
    expect(validateDates('2026-10-31', '2026-11-03', today)).toBe('Start date cannot be in the past');
    expect(validateDates('2026-11-01', '2026-12-02', today)).toBe('Rentals are limited to 30 days');
    expect(validateDates('2026-11-01', '2026-12-01', today)).toBeNull();
  });

  it('rejects impossible calendar dates', () => {
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-02-28')).toBe(true);
  });
});

describe('overlap and status', () => {
  it('treats ranges as half-open', () => {
    expect(rangesOverlap('2026-11-11', '2026-11-14', '2026-11-10', '2026-11-13')).toBe(true);
    expect(rangesOverlap('2026-11-13', '2026-11-15', '2026-11-10', '2026-11-13')).toBe(false);
    expect(rangesOverlap('2026-11-07', '2026-11-10', '2026-11-10', '2026-11-13')).toBe(false);
  });

  it('only confirmed bookings of the same car conflict', () => {
    expect(hasConfirmedConflict(bookings, 'car_01', '2026-11-11', '2026-11-14')).toBe(true);
    expect(hasConfirmedConflict(bookings, 'car_02', '2026-11-11', '2026-11-14')).toBe(false);
    expect(hasConfirmedConflict(bookings, 'car_01', '2026-11-11', '2026-11-14', 'book_301')).toBe(false);
    const pending = [{ ...bookings[0], status: 'pending' as const }];
    expect(hasConfirmedConflict(pending, 'car_01', '2026-11-11', '2026-11-14')).toBe(false);
  });

  it('derives completed from confirmed past bookings only', () => {
    expect(effectiveStatus({ status: 'confirmed', end_date: '2026-10-31' }, today)).toBe('completed');
    expect(effectiveStatus({ status: 'confirmed', end_date: '2026-11-01' }, today)).toBe('confirmed');
    expect(effectiveStatus({ status: 'pending', end_date: '2026-10-01' }, today)).toBe('pending');
    expect(effectiveStatus({ status: 'cancelled', end_date: '2026-10-01' }, today)).toBe('cancelled');
  });

  it('allows cancelling only before start', () => {
    expect(canCancel({ status: 'confirmed', start_date: '2026-11-10' }, today)).toBe(true);
    expect(canCancel({ status: 'confirmed', start_date: '2026-11-01' }, today)).toBe(false);
    expect(canCancel({ status: 'cancelled', start_date: '2026-11-10' }, today)).toBe(false);
  });
});

describe('filterCars', () => {
  it('returns all cars with no filters', () => {
    expect(filterCars(cars, noFilters)).toHaveLength(3);
  });

  it('combines filters with AND, case-insensitively', () => {
    expect(filterCars(cars, { ...noFilters, make: 'tesla' }).map((c) => c.id)).toEqual(['car_01']);
    expect(filterCars(cars, { ...noFilters, make: 'tesla', maxPrice: '90' }).map((c) => c.id)).toEqual(['car_01']);
    expect(filterCars(cars, { ...noFilters, make: 'tesla', maxPrice: '80' })).toHaveLength(0);
    expect(filterCars(cars, { ...noFilters, fuel: 'Gasoline', maxPrice: '110' }).map((c) => c.id)).toEqual(['car_02']);
  });

  it('matches location against city, state and address', () => {
    expect(filterCars(cars, { ...noFilters, location: 'denver' })).toHaveLength(1);
    expect(filterCars(cars, { ...noFilters, location: 'ca' }).map((c) => c.id)).toContain('car_03');
    expect(filterCars(cars, { ...noFilters, location: 'lax' })).toHaveLength(1);
  });

  it('ignores a negative max price', () => {
    expect(filterCars(cars, { ...noFilters, maxPrice: '-5' })).toHaveLength(3);
  });

  it('filters by transmission exactly', () => {
    expect(filterCars(cars, { ...noFilters, transmission: 'Manual' })).toHaveLength(0);
  });
});

describe('validateListing', () => {
  const valid = {
    brand: 'Tesla',
    model: 'Model Y',
    year: 2023,
    daily_rate: 85,
    cleaning_fee: 25,
    location: { city: 'Miami', pickup_address: 'Airport Hub' },
    pickup_instructions: 'Meet at the hub',
    specs: { seats: 5, fuel_type: 'Electric', transmission: 'Automatic' },
    image_url: 'https://example.com/car.jpg',
  };

  it('accepts valid input and defaults the title', () => {
    const result = validateListing(valid, 2026);
    expect(result.fields).toEqual({});
    expect(result.value?.title).toBe('Tesla Model Y 2023');
  });

  it('reports field errors for empty input', () => {
    const { fields, value } = validateListing({}, 2026);
    expect(value).toBeNull();
    expect(fields.brand).toBe('Make is required');
    expect(Object.keys(fields)).toEqual(
      expect.arrayContaining(['model', 'year', 'daily_rate', 'cleaning_fee', 'seats', 'image_url', 'city', 'pickup_address', 'pickup_instructions']),
    );
  });

  it('enforces numeric ranges and URL scheme', () => {
    const { fields } = validateListing(
      { ...valid, year: 1979, daily_rate: 10.123, cleaning_fee: -1, image_url: 'ftp://x', specs: { ...valid.specs, seats: 13 } },
      2026,
    );
    expect(fields.year).toBeDefined();
    expect(fields.daily_rate).toBeDefined();
    expect(fields.cleaning_fee).toBeDefined();
    expect(fields.image_url).toBeDefined();
    expect(fields.seats).toBeDefined();
  });

  it('allows next year and a zero cleaning fee', () => {
    expect(validateListing({ ...valid, year: 2027, cleaning_fee: 0 }, 2026).value).not.toBeNull();
    expect(validateListing({ ...valid, year: 2028 }, 2026).fields.year).toBeDefined();
  });
});

describe('computeEarnings', () => {
  it('shows zero completed and expected confirmed revenue for the seed', () => {
    const e = computeEarnings(cars, bookings, today);
    expect(e.completed_rentals).toBe(0);
    expect(e.total_revenue).toBe(0);
    expect(e.pending_requests).toBe(0);
    expect(e.confirmed_revenue).toBe(280);
    expect(e.by_car).toHaveLength(3);
  });

  it('counts past confirmed bookings as completed revenue', () => {
    const e = computeEarnings(cars, bookings, '2026-12-01');
    expect(e.completed_rentals).toBe(1);
    expect(e.total_revenue).toBe(280);
    expect(e.confirmed_revenue).toBe(0);
    expect(e.by_car.find((c) => c.car_id === 'car_01')?.revenue).toBe(280);
  });
});
