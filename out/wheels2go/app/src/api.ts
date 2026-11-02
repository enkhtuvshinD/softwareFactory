import type { ApiErrorBody, Booking, Car, CarInput, Earnings, User } from '../shared/types';

export const USER_KEY = 'wheels2go.userId';
export const DEFAULT_USER_ID = 'usr_102';

export function storedUserId(): string {
  return localStorage.getItem(USER_KEY) ?? DEFAULT_USER_ID;
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': storedUserId(),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiRequestError(0, 'Could not reach the server. Check your connection and retry.');
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiRequestError(response.status, error?.message ?? 'Request failed', error?.fields);
  }
  return body as T;
}

const send = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  users: () => request<User[]>('/api/users'),
  cars: () => request<Car[]>('/api/cars'),
  car: (id: string) => request<Car>(`/api/cars/${id}`),
  createCar: (input: CarInput) => request<Car>('/api/cars', send('POST', input)),
  updateCar: (id: string, input: CarInput) => request<Car>(`/api/cars/${id}`, send('PUT', input)),
  setAvailability: (id: string, status: 'available' | 'unavailable') =>
    request<Car>(`/api/cars/${id}/availability`, send('PATCH', { status })),
  deleteCar: (id: string) => request<void>(`/api/cars/${id}`, send('DELETE')),
  bookings: () => request<Booking[]>('/api/bookings'),
  createBooking: (car_id: string, start_date: string, end_date: string) =>
    request<Booking>('/api/bookings', send('POST', { car_id, start_date, end_date })),
  setBookingStatus: (id: string, status: 'confirmed' | 'cancelled') =>
    request<Booking>(`/api/bookings/${id}/status`, send('PATCH', { status })),
  earnings: () => request<Earnings>('/api/earnings'),
};
