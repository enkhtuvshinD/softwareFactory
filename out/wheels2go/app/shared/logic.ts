import type {
  Car,
  CarFilters,
  CarInput,
  Earnings,
  StoredBooking,
  BookingStatus,
} from './types';

export const MAX_RENTAL_DAYS = 30;

export const DATE_MESSAGES = {
  missing: 'Select a start and end date',
  order: 'End date must be after start date',
  past: 'Start date cannot be in the past',
  tooLong: 'Rentals are limited to 30 days',
  conflict: 'These dates conflict with an existing confirmed booking for this car',
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function localIsoDate(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function calcDays(start: string, end: string): number {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calcTotal(days: number, dailyRate: number, cleaningFee: number): number {
  return roundMoney(days * dailyRate + cleaningFee);
}

export function validateDates(
  start: string | undefined | null,
  end: string | undefined | null,
  today: string,
): string | null {
  if (!start || !end || !isValidIsoDate(start) || !isValidIsoDate(end)) return DATE_MESSAGES.missing;
  if (start < today) return DATE_MESSAGES.past;
  const days = calcDays(start, end);
  if (days < 1) return DATE_MESSAGES.order;
  if (days > MAX_RENTAL_DAYS) return DATE_MESSAGES.tooLong;
  return null;
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function effectiveStatus(
  booking: Pick<StoredBooking, 'status' | 'end_date'>,
  today: string,
): BookingStatus {
  if (booking.status === 'confirmed' && booking.end_date < today) return 'completed';
  return booking.status;
}

export function hasConfirmedConflict(
  bookings: StoredBooking[],
  carId: string,
  start: string,
  end: string,
  ignoreId?: string,
): boolean {
  return bookings.some(
    (b) =>
      b.car_id === carId &&
      b.id !== ignoreId &&
      b.status === 'confirmed' &&
      rangesOverlap(start, end, b.start_date, b.end_date),
  );
}

export function parseMaxPrice(raw: string): { value: number | null; error: boolean } {
  const trimmed = raw.trim();
  if (trimmed === '') return { value: null, error: false };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return { value: null, error: true };
  return { value, error: false };
}

export function filterCars(cars: Car[], filters: CarFilters): Car[] {
  const make = filters.make.trim().toLowerCase();
  const model = filters.model.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();
  const { value: max } = parseMaxPrice(filters.maxPrice);
  return cars.filter((car) => {
    if (make && !car.brand.toLowerCase().includes(make)) return false;
    if (model && !car.model.toLowerCase().includes(model)) return false;
    if (location) {
      const haystack = [car.location.city, car.location.state ?? '', car.location.pickup_address]
        .join('\n')
        .toLowerCase();
      if (!haystack.includes(location)) return false;
    }
    if (max !== null && car.daily_rate > max) return false;
    if (filters.transmission && car.specs.transmission !== filters.transmission) return false;
    if (filters.fuel && car.specs.fuel_type !== filters.fuel) return false;
    return true;
  });
}

export function defaultTitle(brand: string, model: string, year: number): string {
  return `${brand.trim()} ${model.trim()} ${year}`;
}

function hasMaxTwoDecimals(value: number): boolean {
  return Math.abs(Math.round(value * 100) - value * 100) < 1e-6;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateListing(
  input: unknown,
  currentYear: number,
): { fields: Record<string, string>; value: CarInput | null } {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
  const location = (raw.location && typeof raw.location === 'object' ? raw.location : {}) as Record<string, unknown>;
  const specs = (raw.specs && typeof raw.specs === 'object' ? raw.specs : {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const brand = asText(raw.brand);
  if (!brand) fields.brand = 'Make is required';
  else if (brand.length > 40) fields.brand = 'Make must be 40 characters or fewer';

  const model = asText(raw.model);
  if (!model) fields.model = 'Model is required';
  else if (model.length > 40) fields.model = 'Model must be 40 characters or fewer';

  const year = raw.year === '' || raw.year === null || raw.year === undefined ? NaN : Number(raw.year);
  if (Number.isNaN(year)) fields.year = 'Year is required';
  else if (!Number.isInteger(year) || year < 1980 || year > currentYear + 1)
    fields.year = `Year must be a whole number between 1980 and ${currentYear + 1}`;

  const rate = raw.daily_rate === '' || raw.daily_rate === null || raw.daily_rate === undefined ? NaN : Number(raw.daily_rate);
  if (Number.isNaN(rate)) fields.daily_rate = 'Daily rate is required';
  else if (rate <= 0 || rate > 10000) fields.daily_rate = 'Daily rate must be greater than 0 and at most 10,000';
  else if (!hasMaxTwoDecimals(rate)) fields.daily_rate = 'Daily rate can have at most 2 decimals';

  const fee = raw.cleaning_fee === '' || raw.cleaning_fee === null || raw.cleaning_fee === undefined ? NaN : Number(raw.cleaning_fee);
  if (Number.isNaN(fee)) fields.cleaning_fee = 'Cleaning fee is required';
  else if (fee < 0 || fee > 1000) fields.cleaning_fee = 'Cleaning fee must be between 0 and 1,000';
  else if (!hasMaxTwoDecimals(fee)) fields.cleaning_fee = 'Cleaning fee can have at most 2 decimals';

  const seats = specs.seats === '' || specs.seats === null || specs.seats === undefined ? NaN : Number(specs.seats);
  if (Number.isNaN(seats)) fields.seats = 'Seats is required';
  else if (!Number.isInteger(seats) || seats < 1 || seats > 12) fields.seats = 'Seats must be a whole number from 1 to 12';

  if (!['Gasoline', 'Hybrid', 'Electric'].includes(specs.fuel_type as string))
    fields.fuel_type = 'Fuel type is required';
  if (!['Automatic', 'Manual'].includes(specs.transmission as string))
    fields.transmission = 'Transmission is required';

  const imageUrl = asText(raw.image_url);
  if (!imageUrl) fields.image_url = 'Image URL is required';
  else if (!isHttpUrl(imageUrl)) fields.image_url = 'Image URL must start with http:// or https://';

  const city = asText(location.city);
  if (!city) fields.city = 'City is required';
  const pickupAddress = asText(location.pickup_address);
  if (!pickupAddress) fields.pickup_address = 'Pickup address is required';

  const instructions = asText(raw.pickup_instructions);
  if (!instructions) fields.pickup_instructions = 'Pickup instructions are required';
  else if (instructions.length > 500) fields.pickup_instructions = 'Pickup instructions must be 500 characters or fewer';

  if (raw.status !== undefined && raw.status !== 'available' && raw.status !== 'unavailable')
    fields.status = 'Status must be available or unavailable';

  if (Object.keys(fields).length > 0) return { fields, value: null };

  const state = asText(location.state);
  const title = asText(raw.title) || defaultTitle(brand, model, year);
  return {
    fields,
    value: {
      title,
      brand,
      model,
      year,
      daily_rate: rate,
      cleaning_fee: fee,
      location: { city, ...(state ? { state } : {}), pickup_address: pickupAddress },
      pickup_instructions: instructions,
      specs: {
        seats,
        fuel_type: specs.fuel_type as CarInput['specs']['fuel_type'],
        transmission: specs.transmission as CarInput['specs']['transmission'],
      },
      image_url: imageUrl,
      ...(raw.status ? { status: raw.status } : {}),
    },
  };
}

export function computeEarnings(
  ownerCars: Car[],
  bookings: StoredBooking[],
  today: string,
): Earnings {
  const carIds = new Set(ownerCars.map((c) => c.id));
  const own = bookings.filter((b) => carIds.has(b.car_id));
  const completed = own.filter((b) => effectiveStatus(b, today) === 'completed');
  const confirmedUpcoming = own.filter((b) => effectiveStatus(b, today) === 'confirmed');
  return {
    completed_rentals: completed.length,
    total_revenue: roundMoney(completed.reduce((sum, b) => sum + b.total_price, 0)),
    pending_requests: own.filter((b) => b.status === 'pending').length,
    confirmed_revenue: roundMoney(confirmedUpcoming.reduce((sum, b) => sum + b.total_price, 0)),
    by_car: ownerCars.map((car) => {
      const carCompleted = completed.filter((b) => b.car_id === car.id);
      return {
        car_id: car.id,
        title: car.title,
        completed_rentals: carCompleted.length,
        revenue: roundMoney(carCompleted.reduce((sum, b) => sum + b.total_price, 0)),
      };
    }),
  };
}

export function formatMoney(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function formatDailyRate(value: number): string {
  return Number.isInteger(value) ? `$${value.toLocaleString('en-US')}/day` : `${formatMoney(value)}/day`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function pluralDays(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

export function canCancel(booking: Pick<StoredBooking, 'status' | 'start_date'>, today: string): boolean {
  return (booking.status === 'pending' || booking.status === 'confirmed') && booking.start_date > today;
}
