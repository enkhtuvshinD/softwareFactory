import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Booking, BookingStatus, Car, CarStatus } from '../shared/types';
import {
  calcTotal,
  formatDailyRate,
  formatDateRange,
  formatMoney,
  pluralDays,
} from '../shared/logic';

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`badge badge-${status}`} data-testid="status-badge" data-status={status}>
      {capitalize(status)}
    </span>
  );
}

export function AvailabilityBadge({ status, overlay }: { status: CarStatus; overlay?: boolean }) {
  return (
    <span
      className={`badge ${status === 'available' ? 'badge-confirmed' : 'badge-unavailable'}${overlay ? ' badge-overlay' : ''}`}
      data-testid="availability-badge"
      data-status={status}
    >
      {capitalize(status)}
    </span>
  );
}

export function CarImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed) {
    return (
      <div className={`image-fallback ${className ?? ''}`} data-testid="image-fallback" role="img" aria-label={`${alt} (image unavailable)`}>
        <span>Image unavailable</span>
      </div>
    );
  }
  return (
    <img
      className={className}
      data-testid="car-image"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function CarCard({ car }: { car: Car }) {
  const location = [car.location.pickup_address, car.location.city].join(' · ');
  return (
    <article className="card car-card" data-testid="car-card" data-id={car.id}>
      <div className="car-card-media">
        <CarImage src={car.image_url} alt={car.title} className="car-card-image" />
        <AvailabilityBadge status={car.status} overlay />
      </div>
      <div className="card-body">
        <h2 className="car-card-title" data-testid="car-title">
          <Link to={`/cars/${car.id}`} className="car-link stretched" data-testid="car-link" aria-label={`View details: ${car.title}`}>
            {car.title}
          </Link>
        </h2>
        <p className="price" data-testid="car-price">{formatDailyRate(car.daily_rate)}</p>
        <div className="chips">
          <span className="chip" data-testid="car-fuel">{car.specs.fuel_type}</span>
          <span className="chip" data-testid="car-transmission">{car.specs.transmission}</span>
          <span className="chip" data-testid="car-seats">{car.specs.seats} seats</span>
        </div>
        <p className="muted small location" data-testid="car-location">{location}</p>
      </div>
    </article>
  );
}

export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className="field-error" id={`${id}-error-text`} role="alert" data-testid={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

interface ConfirmProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }: ConfirmProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-message">
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" data-testid="confirm-no" ref={cancelRef} onClick={onCancel}>
            Go back
          </button>
          <button type="button" className="btn btn-danger" data-testid="confirm-yes" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PriceBreakdown({
  days,
  dailyRate,
  cleaningFee,
}: {
  days: number | null;
  dailyRate: number;
  cleaningFee: number;
}) {
  const subtotal = days === null ? null : days * dailyRate;
  return (
    <dl className="breakdown" data-testid="price-breakdown">
      <div><dt>Days</dt><dd data-testid="price-days">{days === null ? '—' : pluralDays(days)}</dd></div>
      <div><dt>Daily rate</dt><dd data-testid="price-daily-rate">{formatMoney(dailyRate)}</dd></div>
      <div><dt>Rental subtotal</dt><dd data-testid="price-subtotal">{subtotal === null ? '—' : formatMoney(Math.round(subtotal * 100) / 100)}</dd></div>
      <div><dt>Cleaning fee</dt><dd data-testid="price-cleaning-fee">{formatMoney(cleaningFee)}</dd></div>
      <div className="breakdown-total"><dt>Total</dt><dd data-testid="price-total">{days === null ? '—' : formatMoney(calcTotal(days, dailyRate, cleaningFee))}</dd></div>
    </dl>
  );
}

interface BookingCardProps {
  booking: Booking;
  audience: 'renter' | 'owner';
  canCancel?: boolean;
  onCancel?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export function BookingCard({ booking, audience, canCancel, onCancel, onApprove, onReject }: BookingCardProps) {
  const pending = booking.status === 'pending';
  return (
    <article className="card booking-card" data-testid="booking-card" data-id={booking.id} data-status={booking.status}>
      <CarImage src={booking.car.image_url} alt={booking.car.title} className="booking-thumb" />
      <div className="booking-main">
        <div className="booking-head">
          <h3 data-testid="booking-car">{booking.car.title}</h3>
          <StatusBadge status={booking.status} />
        </div>
        {audience === 'owner' && (
          <p className="small">
            <span data-testid="booking-renter">{booking.renter.name}</span>{' '}
            <span className="muted" data-testid="booking-renter-email">{booking.renter.email}</span>
          </p>
        )}
        <p data-testid="booking-dates">{formatDateRange(booking.start_date, booking.end_date)}</p>
        <p className="small muted">
          <span data-testid="booking-days">{pluralDays(booking.days)}</span> · Total{' '}
          <strong className="total" data-testid="booking-total">{formatMoney(booking.total_price)}</strong>
        </p>
        <p className="small muted">Pickup: <span data-testid="booking-pickup">{booking.pickup_location}</span></p>
        {audience === 'renter' && booking.status === 'confirmed' && booking.car.pickup_instructions && (
          <p className="small" data-testid="booking-instructions">{booking.car.pickup_instructions}</p>
        )}
        <div className="actions">
          {audience === 'renter' && canCancel && (
            <button type="button" className="btn btn-secondary" data-testid="booking-cancel" onClick={onCancel}>
              Cancel booking
            </button>
          )}
          {audience === 'owner' && pending && (
            <>
              <button type="button" className="btn btn-primary" data-testid="booking-approve" onClick={onApprove}>
                Approve
              </button>
              <button type="button" className="btn btn-danger" data-testid="booking-reject" onClick={onReject}>
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function LoadState({
  loading,
  error,
  onRetry,
  loadingText,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  loadingText: string;
}) {
  if (loading) return <p className="state" data-testid="loading">{loadingText}</p>;
  if (error) {
    return (
      <div className="state state-error" data-testid="error-state" role="alert">
        <p>{error}</p>
        <button type="button" className="btn btn-secondary" data-testid="retry" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }
  return null;
}

export function AccessDenied() {
  return (
    <div className="state" data-testid="access-denied">
      <p>This page is not available for your account.</p>
      <Link to="/" className="btn btn-secondary">Marketplace</Link>
    </div>
  );
}
