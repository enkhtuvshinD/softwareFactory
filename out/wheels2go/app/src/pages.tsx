import { useCallback, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiRequestError } from './api';
import {
  AccessDenied,
  AvailabilityBadge,
  BookingCard,
  CarCard,
  CarImage,
  ConfirmDialog,
  Field,
  LoadState,
  PriceBreakdown,
} from './components';
import { useAsync, useSession, useToast } from './hooks';
import {
  DATE_MESSAGES,
  calcDays,
  canCancel,
  filterCars,
  formatDailyRate,
  formatMoney,
  localIsoDate,
  parseMaxPrice,
  validateDates,
  validateListing,
} from '../shared/logic';
import type { Booking, Car, CarFilters, CarInput } from '../shared/types';

const emptyFilters: CarFilters = { make: '', model: '', location: '', maxPrice: '', transmission: '', fuel: '' };

export function MarketplacePage() {
  const { user } = useSession();
  const cars = useAsync(() => api.cars(), [user?.id]);
  const [filters, setFilters] = useState<CarFilters>(emptyFilters);
  const set = (key: keyof CarFilters) => (value: string) => setFilters((f) => ({ ...f, [key]: value }));
  const maxPrice = parseMaxPrice(filters.maxPrice);
  const results = filterCars(cars.data ?? [], filters);
  const clear = () => setFilters(emptyFilters);
  const ready = !cars.loading && !cars.error && cars.data;

  return (
    <>
      <h1 className="page-title">Find a car</h1>
      <section className="card filters" data-testid="filters" aria-label="Filters">
        <div className="filter-grid">
          <Field id="filter-make" label="Make / Brand">
            <input id="filter-make" data-testid="filter-make" type="text" value={filters.make} onChange={(e) => set('make')(e.target.value)} />
          </Field>
          <Field id="filter-model" label="Model">
            <input id="filter-model" data-testid="filter-model" type="text" value={filters.model} onChange={(e) => set('model')(e.target.value)} />
          </Field>
          <Field id="filter-location" label="Location keyword">
            <input id="filter-location" data-testid="filter-location" type="text" value={filters.location} onChange={(e) => set('location')(e.target.value)} />
          </Field>
          <div className="field">
            <label htmlFor="filter-max-price">Max daily price ($)</label>
            <input
              id="filter-max-price"
              data-testid="filter-max-price"
              type="number"
              min="0"
              step="any"
              value={filters.maxPrice}
              aria-invalid={maxPrice.error || undefined}
              aria-describedby={maxPrice.error ? 'filter-max-price-error-text' : undefined}
              onChange={(e) => set('maxPrice')(e.target.value)}
            />
            {maxPrice.error && (
              <p className="field-error" id="filter-max-price-error-text" role="alert" data-testid="filter-max-price-error">
                Max price must be a positive number
              </p>
            )}
          </div>
          <Field id="filter-transmission" label="Transmission">
            <select id="filter-transmission" data-testid="filter-transmission" value={filters.transmission} onChange={(e) => set('transmission')(e.target.value)}>
              <option value="">Any</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </Field>
          <Field id="filter-fuel" label="Fuel type">
            <select id="filter-fuel" data-testid="filter-fuel" value={filters.fuel} onChange={(e) => set('fuel')(e.target.value)}>
              <option value="">Any</option>
              <option value="Gasoline">Gasoline</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Electric">Electric</option>
            </select>
          </Field>
        </div>
      </section>
      <LoadState loading={cars.loading} error={cars.error} onRetry={cars.reload} loadingText="Loading cars…" />
      {ready && (
        <>
          <div className="result-row">
            <p className="result-count" data-testid="result-count" aria-live="polite">
              {results.length} {results.length === 1 ? 'car' : 'cars'}
            </p>
            <button type="button" className="btn btn-secondary btn-sm" data-testid="clear-filters" onClick={clear}>
              Clear filters
            </button>
          </div>
          {results.length === 0 ? (
            <div className="state" data-testid="empty-state">
              <p>No cars match your filters</p>
              <button type="button" className="btn btn-primary" data-testid="empty-clear-filters" onClick={clear}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="car-grid">
              {results.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function BookingPanel({ car }: { car: Car }) {
  const { user } = useSession();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = localIsoDate();

  if (user?.role === 'owner') {
    return (
      <aside className="card panel" data-testid="booking-panel">
        <h2>Book this car</h2>
        <p data-testid="booking-owner-note">Owners cannot book cars. Switch to a renter account to book.</p>
      </aside>
    );
  }

  const unavailable = car.status !== 'available';
  const bothSet = Boolean(start && end);
  const dateError = bothSet ? validateDates(start, end, today) : null;
  const days = bothSet && !dateError ? calcDays(start, end) : null;
  const shownError = dateError ?? serverError ?? submitError;

  const changeDate = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setServerError(null);
    setSubmitError(null);
    setSuccess(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSuccess(false);
    setServerError(null);
    const error = validateDates(start, end, today);
    if (error) {
      setSubmitError(error);
      return;
    }
    setBusy(true);
    try {
      await api.createBooking(car.id, start, end);
      setSuccess(true);
    } catch (e) {
      setServerError(e instanceof ApiRequestError ? e.message : 'Could not send the request');
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="card panel" data-testid="booking-panel">
      <h2>Book this car</h2>
      <form onSubmit={submit} noValidate>
        <Field id="booking-start" label="Start date">
          <input id="booking-start" data-testid="booking-start" type="date" min={today} value={start} disabled={unavailable} onChange={(e) => changeDate(setStart)(e.target.value)} />
        </Field>
        <Field id="booking-end" label="End date">
          <input id="booking-end" data-testid="booking-end" type="date" min={today} value={end} disabled={unavailable} onChange={(e) => changeDate(setEnd)(e.target.value)} />
        </Field>
        <PriceBreakdown days={days} dailyRate={car.daily_rate} cleaningFee={car.cleaning_fee} />
        {unavailable && (
          <p className="notice" data-testid="booking-unavailable">This car is currently unavailable</p>
        )}
        {!unavailable && shownError && (
          <p className="field-error" role="alert" data-testid="booking-error">{shownError}</p>
        )}
        {success && (
          <p className="notice notice-success" role="status" data-testid="booking-success">
            Booking request sent. Status: Pending.{' '}
            <Link to="/my-bookings" data-testid="go-my-bookings">View My Bookings</Link>
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block" data-testid="booking-submit" disabled={unavailable || busy}>
          {busy ? 'Sending…' : 'Request booking'}
        </button>
      </form>
    </aside>
  );
}

export function CarDetailPage() {
  const { id = '' } = useParams();
  const { user } = useSession();
  const car = useAsync(() => api.car(id), [id, user?.id]);

  if (car.loading || (car.error && !car.error.includes('not found'))) {
    return <LoadState loading={car.loading} error={car.error} onRetry={car.reload} loadingText="Loading car…" />;
  }
  if (car.error || !car.data) {
    return (
      <div className="state" data-testid="not-found">
        <p>Car not found</p>
        <Link to="/" className="btn btn-secondary">Back to marketplace</Link>
      </div>
    );
  }
  const c = car.data;
  const location = [c.location.city, c.location.state].filter(Boolean).join(', ');
  return (
    <>
      <Link to="/" className="back-link">← Back to marketplace</Link>
      <div className="detail-layout" data-testid="car-detail" data-id={c.id}>
        <div className="detail-main">
          <CarImage src={c.image_url} alt={c.title} className="detail-image" />
          <div className="detail-head">
            <h1 data-testid="detail-title">{c.title}</h1>
            <AvailabilityBadge status={c.status} />
          </div>
          <dl className="spec-list">
            <div><dt>Year</dt><dd>{c.year}</dd></div>
            <div><dt>Fuel</dt><dd data-testid="detail-fuel">{c.specs.fuel_type}</dd></div>
            <div><dt>Transmission</dt><dd data-testid="detail-transmission">{c.specs.transmission}</dd></div>
            <div><dt>Seats</dt><dd data-testid="detail-seats">{c.specs.seats}</dd></div>
            <div><dt>Daily rate</dt><dd data-testid="detail-price">{formatDailyRate(c.daily_rate)}</dd></div>
            <div><dt>Cleaning fee</dt><dd data-testid="detail-cleaning-fee">{formatMoney(c.cleaning_fee)}</dd></div>
          </dl>
          <section className="card card-body">
            <h2>Pickup</h2>
            <p data-testid="detail-location">{c.location.pickup_address} — {location}</p>
            <h3 className="small-heading">Pickup instructions</h3>
            <p data-testid="detail-instructions">{c.pickup_instructions}</p>
          </section>
        </div>
        <BookingPanel car={c} />
      </div>
    </>
  );
}

function groupBookings(bookings: Booking[], today: string) {
  const groups = { upcoming: [] as Booking[], active: [] as Booking[], completed: [] as Booking[], cancelled: [] as Booking[] };
  for (const b of bookings) {
    if (b.status === 'cancelled') groups.cancelled.push(b);
    else if (b.status === 'completed') groups.completed.push(b);
    else if (b.status === 'confirmed' && b.start_date <= today && today < b.end_date) groups.active.push(b);
    else groups.upcoming.push(b);
  }
  groups.upcoming.sort((a, b) => a.start_date.localeCompare(b.start_date));
  return groups;
}

export function MyBookingsPage() {
  const { user } = useSession();
  const { notify } = useToast();
  const bookings = useAsync(() => api.bookings(), [user?.id]);
  const [target, setTarget] = useState<Booking | null>(null);
  const today = localIsoDate();

  if (user?.role !== 'renter') return <AccessDenied />;

  const cancel = async () => {
    if (!target) return;
    const id = target.id;
    setTarget(null);
    try {
      await api.setBookingStatus(id, 'cancelled');
      notify('success', 'Booking cancelled');
    } catch (e) {
      notify('error', e instanceof ApiRequestError ? e.message : 'Could not cancel booking');
    }
    bookings.reload();
  };

  const list = bookings.data ?? [];
  const groups = groupBookings(list, today);
  const sections: [keyof typeof groups, string][] = [
    ['upcoming', 'Upcoming'],
    ['active', 'Active'],
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
  ];
  const ready = !bookings.loading && !bookings.error && bookings.data;

  return (
    <>
      <h1 className="page-title">My Bookings</h1>
      <LoadState loading={bookings.loading} error={bookings.error} onRetry={bookings.reload} loadingText="Loading bookings…" />
      {ready && list.length === 0 && (
        <div className="state" data-testid="empty-state">
          <p>You have no bookings yet</p>
          <Link to="/" className="btn btn-primary">Browse cars</Link>
        </div>
      )}
      {ready && list.length > 0 &&
        sections.map(([key, label]) => (
          <section key={key} className="group" data-testid={`group-${key}`} aria-labelledby={`group-${key}-title`}>
            <h2 id={`group-${key}-title`}>{label} <span className="count">({groups[key].length})</span></h2>
            {groups[key].length === 0 ? (
              <p className="muted">No bookings</p>
            ) : (
              <div className="stack">
                {groups[key].map((b) => (
                  <BookingCard key={b.id} booking={b} audience="renter" canCancel={canCancel(b, today)} onCancel={() => setTarget(b)} />
                ))}
              </div>
            )}
          </section>
        ))}
      {target && (
        <ConfirmDialog
          title="Cancel this booking?"
          message={`${target.car.title}, ${target.start_date} to ${target.end_date}. The dates will be freed.`}
          onConfirm={cancel}
          onCancel={() => setTarget(null)}
        />
      )}
    </>
  );
}

export function OwnerListingsPage() {
  const { user } = useSession();
  const { notify } = useToast();
  const cars = useAsync(() => api.cars(), [user?.id]);
  const [target, setTarget] = useState<Car | null>(null);

  if (user?.role !== 'owner') return <AccessDenied />;

  const mine = (cars.data ?? []).filter((c) => c.owner_id === user.id);

  const toggle = async (car: Car) => {
    try {
      await api.setAvailability(car.id, car.status === 'available' ? 'unavailable' : 'available');
    } catch (e) {
      notify('error', e instanceof ApiRequestError ? e.message : 'Could not update listing');
    }
    cars.reload();
  };

  const remove = async () => {
    if (!target) return;
    const id = target.id;
    setTarget(null);
    try {
      await api.deleteCar(id);
      notify('success', 'Listing deleted');
    } catch (e) {
      notify('error', e instanceof ApiRequestError ? e.message : 'Could not delete listing');
    }
    cars.reload();
  };

  const ready = !cars.loading && !cars.error && cars.data;
  return (
    <>
      <div className="title-row">
        <h1 className="page-title">My Listings</h1>
        <Link to="/owner/listings/new" className="btn btn-primary" data-testid="add-listing">Add listing</Link>
      </div>
      <LoadState loading={cars.loading} error={cars.error} onRetry={cars.reload} loadingText="Loading listings…" />
      {ready && mine.length === 0 && (
        <div className="state" data-testid="empty-state"><p>You have no listings yet</p></div>
      )}
      {ready && (
        <div className="stack">
          {mine.map((car) => (
            <article key={car.id} className="card listing-row" data-testid="listing-row" data-id={car.id}>
              <CarImage src={car.image_url} alt={car.title} className="booking-thumb" />
              <div className="booking-main">
                <div className="booking-head">
                  <h2 className="listing-title" data-testid="listing-title">{car.title}</h2>
                  <AvailabilityBadge status={car.status} />
                </div>
                <p className="price" data-testid="listing-price">{formatDailyRate(car.daily_rate)}</p>
                <p className="small muted">{car.location.pickup_address} · {car.location.city}</p>
              </div>
              <div className="actions">
                <Link to={`/owner/listings/${car.id}/edit`} className="btn btn-secondary" data-testid="listing-edit">Edit</Link>
                <button type="button" className="btn btn-secondary" data-testid="listing-toggle" onClick={() => toggle(car)}>
                  {car.status === 'available' ? 'Make unavailable' : 'Make available'}
                </button>
                <button type="button" className="btn btn-danger" data-testid="listing-delete" onClick={() => setTarget(car)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {target && (
        <ConfirmDialog
          title="Delete this listing?"
          message={`${target.title} will be removed from the marketplace. This cannot be undone.`}
          onConfirm={remove}
          onCancel={() => setTarget(null)}
        />
      )}
    </>
  );
}

interface FormState {
  brand: string;
  model: string;
  year: string;
  fuel: string;
  transmission: string;
  seats: string;
  dailyRate: string;
  cleaningFee: string;
  imageUrl: string;
  city: string;
  state: string;
  pickupAddress: string;
  instructions: string;
  title: string;
}

const blankForm: FormState = {
  brand: '', model: '', year: '', fuel: 'Gasoline', transmission: 'Automatic', seats: '5', dailyRate: '',
  cleaningFee: '', imageUrl: '', city: '', state: '', pickupAddress: '', instructions: '', title: '',
};

const fieldKeyByApiKey: Record<string, string> = {
  brand: 'field-brand',
  model: 'field-model',
  year: 'field-year',
  fuel_type: 'field-fuel',
  transmission: 'field-transmission',
  seats: 'field-seats',
  daily_rate: 'field-daily-rate',
  cleaning_fee: 'field-cleaning-fee',
  image_url: 'field-image-url',
  city: 'field-city',
  state: 'field-state',
  pickup_address: 'field-pickup-address',
  pickup_instructions: 'field-instructions',
  title: 'field-title',
};

function toFormState(car: Car): FormState {
  return {
    brand: car.brand,
    model: car.model,
    year: String(car.year),
    fuel: car.specs.fuel_type,
    transmission: car.specs.transmission,
    seats: String(car.specs.seats),
    dailyRate: String(car.daily_rate),
    cleaningFee: String(car.cleaning_fee),
    imageUrl: car.image_url,
    city: car.location.city,
    state: car.location.state ?? '',
    pickupAddress: car.location.pickup_address,
    instructions: car.pickup_instructions,
    title: car.title,
  };
}

function toPayload(form: FormState, status?: Car['status']): unknown {
  const numeric = (value: string) => (value.trim() === '' ? '' : Number(value));
  return {
    title: form.title,
    brand: form.brand,
    model: form.model,
    year: numeric(form.year),
    daily_rate: numeric(form.dailyRate),
    cleaning_fee: numeric(form.cleaningFee),
    location: { city: form.city, state: form.state, pickup_address: form.pickupAddress },
    pickup_instructions: form.instructions,
    specs: { seats: numeric(form.seats), fuel_type: form.fuel, transmission: form.transmission },
    image_url: form.imageUrl,
    ...(status ? { status } : {}),
  };
}

function ListingForm({ car }: { car?: Car }) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [form, setForm] = useState<FormState>(car ? toFormState(car) : blankForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const bind = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });
  const err = (testid: string) => errors[testid];
  const aria = (testid: string) => ({
    'aria-invalid': err(testid) ? true : undefined,
    'aria-describedby': err(testid) ? `${testid}-error-text` : undefined,
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = toPayload(form, car?.status);
    const local = validateListing(payload, new Date().getFullYear());
    if (!local.value) {
      setErrors(Object.fromEntries(Object.entries(local.fields).map(([k, v]) => [fieldKeyByApiKey[k] ?? k, v])));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const input = local.value as CarInput;
      if (car) await api.updateCar(car.id, input);
      else await api.createCar(input);
      notify('success', car ? 'Listing updated' : 'Listing created');
      navigate('/owner/listings');
    } catch (e) {
      if (e instanceof ApiRequestError && e.fields) {
        setErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [fieldKeyByApiKey[k] ?? k, v])));
      } else {
        notify('error', e instanceof ApiRequestError ? e.message : 'Could not save listing');
      }
      setBusy(false);
    }
  };

  return (
    <form className="card form-card" data-testid="listing-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <Field id="field-brand" label="Make" error={err('field-brand')}>
          <input id="field-brand" data-testid="field-brand" type="text" {...bind('brand')} {...aria('field-brand')} />
        </Field>
        <Field id="field-model" label="Model" error={err('field-model')}>
          <input id="field-model" data-testid="field-model" type="text" {...bind('model')} {...aria('field-model')} />
        </Field>
        <Field id="field-year" label="Year" error={err('field-year')}>
          <input id="field-year" data-testid="field-year" type="number" {...bind('year')} {...aria('field-year')} />
        </Field>
        <Field id="field-seats" label="Seats" error={err('field-seats')}>
          <input id="field-seats" data-testid="field-seats" type="number" {...bind('seats')} {...aria('field-seats')} />
        </Field>
        <Field id="field-fuel" label="Fuel type" error={err('field-fuel')}>
          <select id="field-fuel" data-testid="field-fuel" {...bind('fuel')} {...aria('field-fuel')}>
            <option value="Gasoline">Gasoline</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Electric">Electric</option>
          </select>
        </Field>
        <Field id="field-transmission" label="Transmission" error={err('field-transmission')}>
          <select id="field-transmission" data-testid="field-transmission" {...bind('transmission')} {...aria('field-transmission')}>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </Field>
        <Field id="field-daily-rate" label="Daily rate ($)" error={err('field-daily-rate')}>
          <input id="field-daily-rate" data-testid="field-daily-rate" type="number" step="0.01" {...bind('dailyRate')} {...aria('field-daily-rate')} />
        </Field>
        <Field id="field-cleaning-fee" label="Cleaning fee ($)" error={err('field-cleaning-fee')}>
          <input id="field-cleaning-fee" data-testid="field-cleaning-fee" type="number" step="0.01" {...bind('cleaningFee')} {...aria('field-cleaning-fee')} />
        </Field>
      </div>
      <Field id="field-image-url" label="Image URL" error={err('field-image-url')}>
        <input id="field-image-url" data-testid="field-image-url" type="url" {...bind('imageUrl')} {...aria('field-image-url')} />
      </Field>
      <div className="form-grid">
        <Field id="field-city" label="City" error={err('field-city')}>
          <input id="field-city" data-testid="field-city" type="text" {...bind('city')} {...aria('field-city')} />
        </Field>
        <Field id="field-state" label="State (optional)" error={err('field-state')}>
          <input id="field-state" data-testid="field-state" type="text" {...bind('state')} {...aria('field-state')} />
        </Field>
      </div>
      <Field id="field-pickup-address" label="Pickup address" error={err('field-pickup-address')}>
        <input id="field-pickup-address" data-testid="field-pickup-address" type="text" {...bind('pickupAddress')} {...aria('field-pickup-address')} />
      </Field>
      <Field id="field-instructions" label="Pickup instructions" error={err('field-instructions')}>
        <textarea id="field-instructions" data-testid="field-instructions" rows={3} {...bind('instructions')} {...aria('field-instructions')} />
      </Field>
      <Field id="field-title" label="Listing title (optional)" error={err('field-title')}>
        <input id="field-title" data-testid="field-title" type="text" {...bind('title')} {...aria('field-title')} />
      </Field>
      <div className="actions">
        <button type="submit" className="btn btn-primary" data-testid="listing-save" disabled={busy}>
          {busy ? 'Saving…' : 'Save listing'}
        </button>
        <Link to="/owner/listings" className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}

export function NewListingPage() {
  const { user } = useSession();
  if (user?.role !== 'owner') return <AccessDenied />;
  return (
    <div className="narrow-form">
      <h1 className="page-title">Add listing</h1>
      <ListingForm />
    </div>
  );
}

export function EditListingPage() {
  const { id = '' } = useParams();
  const { user } = useSession();
  const car = useAsync(() => api.car(id), [id]);
  if (user?.role !== 'owner') return <AccessDenied />;
  if (car.loading || car.error) {
    return <LoadState loading={car.loading} error={car.error} onRetry={car.reload} loadingText="Loading listing…" />;
  }
  if (!car.data || car.data.owner_id !== user.id) return <AccessDenied />;
  return (
    <div className="narrow-form">
      <h1 className="page-title">Edit listing</h1>
      <ListingForm car={car.data} />
    </div>
  );
}

const tabs = ['all', 'pending', 'confirmed', 'cancelled', 'completed'] as const;

export function OwnerRequestsPage() {
  const { user } = useSession();
  const { notify } = useToast();
  const bookings = useAsync(() => api.bookings(), [user?.id]);
  const [tab, setTab] = useState<(typeof tabs)[number]>('all');
  const [rejecting, setRejecting] = useState<Booking | null>(null);

  const act = useCallback(
    async (id: string, status: 'confirmed' | 'cancelled', message: string) => {
      try {
        await api.setBookingStatus(id, status);
        notify('success', message);
      } catch (e) {
        notify('error', e instanceof ApiRequestError ? e.message : DATE_MESSAGES.conflict);
      }
      bookings.reload();
    },
    [notify, bookings.reload],
  );

  if (user?.role !== 'owner') return <AccessDenied />;

  const all = bookings.data ?? [];
  const visible = all
    .filter((b) => tab === 'all' || b.status === tab)
    .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'));
  const ready = !bookings.loading && !bookings.error && bookings.data;

  return (
    <>
      <h1 className="page-title">Booking Requests</h1>
      <div className="tabs" role="group" aria-label="Filter by status">
        {tabs.map((t) => (
          <button key={t} type="button" className="tab" data-testid={`tab-${t}`} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <LoadState loading={bookings.loading} error={bookings.error} onRetry={bookings.reload} loadingText="Loading requests…" />
      {ready && visible.length === 0 && (
        <div className="state" data-testid="empty-state"><p>No booking requests</p></div>
      )}
      {ready && (
        <div className="stack">
          {visible.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              audience="owner"
              onApprove={() => act(b.id, 'confirmed', 'Booking confirmed')}
              onReject={() => setRejecting(b)}
            />
          ))}
        </div>
      )}
      {rejecting && (
        <ConfirmDialog
          title="Reject this request?"
          message={`${rejecting.renter.name} will see the booking as Cancelled.`}
          confirmLabel="Confirm"
          onConfirm={() => {
            const id = rejecting.id;
            setRejecting(null);
            act(id, 'cancelled', 'Booking rejected');
          }}
          onCancel={() => setRejecting(null)}
        />
      )}
    </>
  );
}

export function EarningsPage() {
  const { user } = useSession();
  const earnings = useAsync(() => api.earnings(), [user?.id]);
  if (user?.role !== 'owner') return <AccessDenied />;
  const e = earnings.data;
  return (
    <>
      <h1 className="page-title">Earnings</h1>
      <LoadState loading={earnings.loading} error={earnings.error} onRetry={earnings.reload} loadingText="Loading earnings…" />
      {e && !earnings.loading && !earnings.error && (
        <>
          <div className="stat-grid">
            <div className="card stat"><p className="stat-label">Completed rentals</p><p className="stat-value" data-testid="stat-completed">{e.completed_rentals}</p></div>
            <div className="card stat"><p className="stat-label">Total revenue</p><p className="stat-value" data-testid="stat-revenue">{formatMoney(e.total_revenue)}</p></div>
            <div className="card stat"><p className="stat-label">Pending requests</p><p className="stat-value" data-testid="stat-pending">{e.pending_requests}</p></div>
            <div className="card stat"><p className="stat-label">Expected from confirmed</p><p className="stat-value" data-testid="stat-confirmed-revenue">{formatMoney(e.confirmed_revenue)}</p></div>
          </div>
          <h2>Revenue by car</h2>
          {e.completed_rentals === 0 && <p className="muted" data-testid="earnings-empty">No completed rentals yet.</p>}
          <div className="table-wrap">
            <table className="table" data-testid="earnings-table">
              <thead>
                <tr><th scope="col">Car</th><th scope="col">Completed rentals</th><th scope="col">Revenue</th></tr>
              </thead>
              <tbody>
                {e.by_car.map((row) => (
                  <tr key={row.car_id} data-testid="earnings-row" data-id={row.car_id}>
                    <td>{row.title}</td>
                    <td>{row.completed_rentals}</td>
                    <td>{formatMoney(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
