export type Role = 'owner' | 'renter';
export type FuelType = 'Gasoline' | 'Hybrid' | 'Electric';
export type Transmission = 'Automatic' | 'Manual';
export type CarStatus = 'available' | 'unavailable';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url: string;
}

export interface CarLocation {
  city: string;
  state?: string;
  pickup_address: string;
}

export interface CarSpecs {
  seats: number;
  fuel_type: FuelType;
  transmission: Transmission;
}

export interface Car {
  id: string;
  owner_id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  daily_rate: number;
  cleaning_fee: number;
  location: CarLocation;
  pickup_instructions: string;
  specs: CarSpecs;
  image_url: string;
  status: CarStatus;
}

export interface CarInput {
  title?: string;
  brand: string;
  model: string;
  year: number;
  daily_rate: number;
  cleaning_fee: number;
  location: CarLocation;
  pickup_instructions: string;
  specs: CarSpecs;
  image_url: string;
  status?: CarStatus;
}

export interface StoredBooking {
  id: string;
  renter_id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  days: number;
  daily_rate: number;
  cleaning_fee: number;
  total_price: number;
  pickup_location: string;
  status: Exclude<BookingStatus, 'completed'> | 'completed';
  created_at: string;
  car_title?: string;
  car_image_url?: string;
  car_owner_id?: string;
}

export interface Booking extends StoredBooking {
  car: { title: string; image_url: string; owner_id: string; pickup_instructions: string };
  renter: { name: string; email: string };
}

export interface Earnings {
  completed_rentals: number;
  total_revenue: number;
  pending_requests: number;
  confirmed_revenue: number;
  by_car: { car_id: string; title: string; completed_rentals: number; revenue: number }[];
}

export interface Db {
  users: User[];
  cars: Car[];
  bookings: StoredBooking[];
}

export interface CarFilters {
  make: string;
  model: string;
  location: string;
  maxPrice: string;
  transmission: string;
  fuel: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}
