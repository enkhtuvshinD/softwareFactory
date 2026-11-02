<!-- # Challenge Brief: "Wheels2Go" (P2P Mobility Marketplace — Car Only)

## Objective

Teams configure their Agentic AI Factory to ingest this prompt and autonomously generate structured requirements, UI design tokens, full-stack code, and automated QA validations.

Core Business Model: A two-sided marketplace where Car Owners list their vehicles for rent, and Renters discover, book, and manage car rentals with clear pickup/drop-off locations and transparent pricing.

## Input Prompt

Build a fully functional, responsive web application called Wheels2Go, a two-sided P2P car rental platform. The application must support two primary user roles: Car Owner and Renter.

Key Capabilities:

Car Listing Creation & Location Management (Owner Side):

- Owners can list cars with details including Make, Model, Year, Fuel/EV Type, Transmission, Daily Rental Rate, and Image URL.
- Every listing must specify a Pickup/Drop-off Location (e.g., City, Airport Hub, or Specific Address).

Discovery & Filtering (Renter Side):

- Renters can browse available cars in a grid/list view with search and filtering options (by Make/Brand, Location Keyword, Maximum Daily Rate, and Transmission).

Booking & Reservation Flow (Renter & Owner):

- Renters can select start and end dates for a car, automatically calculating the total price (Days × Daily Rate + Cleaning Fee).
- Owners can view incoming booking requests on their dashboard and update their status (Pending, Confirmed, or Cancelled).

## Core Feature Specifications by Role

### A. Car Owner Portal

- Listing Management: Add, edit, or toggle availability status for car listings.
- Location Setup: Set pickup instructions, drop-off rules, and address guidelines.
- Booking Requests Queue: View incoming rental requests from renters and approve or decline them.
- Earnings Tracker: Simple dashboard overview showing completed rentals and total revenue earned.

### B. Renter Portal

- Marketplace Catalog: Clean grid view displaying car cards with high-resolution image URLs, daily rates, fuel types, and location badges.
- Search & Filters: Filter inventory by make/model, maximum daily price, transmission (Automatic vs. Manual), and location keyword.
- Checkout & Calculation: Dynamic price breakdown displaying days count, daily rate, cleaning fee, and calculated total amount.
- My Bookings Dashboard: View upcoming, active, and completed rentals with status tags (Pending, Confirmed, Completed).

## Testable Requirements Matrix for Judges

| Module | Requirement | Test Action | Pass Criteria |
|---|---|---|---|
| TR-1: Car Listing Creation | Owners can list a new vehicle with all required specs and pickup location. | Create a listing: "Tesla Model Y 2023", $85/day, Location: "Airport Hub". | Listing appears instantly in the catalog feed with correct details and location badge. |
| TR-2: Search & Filter Validation | Renters can filter inventory by make and maximum daily rate. | Filter catalog by Make = "Tesla" or set Max Daily Rate = $90. | Non-matching cars disappear from the active feed in real time. |
| TR-3: Dynamic Pricing Math | Checkout flow calculates total cost accurately based on duration and fees. | Select a 3-day rental for an $85/day car with a $25 cleaning fee. | Checkout summary displays exactly $280.00 ($255 rental + $25 fee). |
| TR-4: Owner Booking Approval | Owners can manage rental request states from their portal. | Log into Owner view, locate a pending booking request, and click "Approve". | Booking status updates to Confirmed across both owner and renter portals. |

## Seed Data

The pre-populated seed dataset is provided separately as `seed.json` (users, cars, bookings). -->

# Hackathon Challenge: Wheels2Go

## Peer-to-Peer Car Rental Marketplace

Build a fully functional, responsive web application called **Wheels2Go**, a peer-to-peer car rental marketplace connecting Car Owners with Renters.

### 1. User Roles

The application must support two roles:

- **Car Owner:** Can create, edit, manage car listings, review booking requests, and track earnings.
- **Renter:** Can discover cars, filter listings, make reservations, and manage personal bookings.

Provide a simple way to switch between demo Owner and Renter accounts for judging purposes.

### 2. Car Owner Features

**Car Listing Management**

Owners can:

- Create new car listings.
- Edit existing listings.
- Enable or disable listing availability.
- Delete their own listings.

Each listing must include:

- Make, Model, Year
- Fuel Type (Gasoline, Hybrid, Electric)
- Transmission (Automatic, Manual)
- Number of Seats
- Daily Rental Rate
- Cleaning Fee
- Car Image URL
- Pickup Location and Address
- Pickup Instructions

**Booking Management**

Owners can:

- View incoming booking requests.
- Approve or reject pending requests.
- View booking details and renter information.
- Track booking status.

**Earnings Dashboard**

Display:

- Total completed rentals.
- Total revenue earned.
- Number of pending requests.
- Revenue summary.

### 3. Renter Features

**Car Marketplace**

Display available cars in a responsive grid layout.

Each car card must show:

- Car image
- Make, Model, Year
- Daily rental price
- Fuel type and transmission
- Number of seats
- Pickup location
- Availability status

**Search and Filtering**

Support filtering by:

- Make / Brand
- Model
- Location keyword
- Maximum daily rental price
- Transmission type
- Fuel type

Filters must work together and update results immediately.

Display a clear empty state when no matching cars are found.

### 4. Booking and Pricing

Renters must be able to:

- Select a car.
- Select rental start and end dates.
- Review pickup location.
- Submit a booking request.

**Pricing Formula:**

Total Price = (Rental Days × Daily Rate) + Cleaning Fee

Display a transparent price breakdown:

- Number of rental days
- Daily rate
- Rental subtotal
- Cleaning fee
- Final total

**Booking Validation:**

- End date must be after start date.
- Past dates cannot be selected.
- A car cannot have overlapping confirmed bookings.
- Unavailable cars cannot be booked.
- Invalid booking requests must display clear error messages.

### 5. Booking Status Lifecycle

Support the following booking statuses:

- Pending
- Confirmed
- Cancelled
- Completed

Only the owner can approve or reject pending booking requests.

When an owner approves a booking, the updated status must immediately appear in both Owner and Renter dashboards.

Cancelled and completed bookings must be reflected consistently across the application.

### 6. Data Persistence and Consistency

- Store application data persistently using the available database or local storage.
- Data must survive page refreshes.
- Changes to cars and bookings must be reflected across all relevant dashboards.
- Prevent duplicate or conflicting reservations.
- Maintain consistency between Owner and Renter views.

### 7. UI/UX Requirements

Create a modern, premium-quality car rental marketplace interface.

Design expectations:

- Clean and professional layout.
- Responsive desktop and mobile views.
- Consistent typography, spacing, and colors.
- High-quality car imagery.
- Clear status badges.
- Loading, empty, success, and error states.
- Intuitive navigation.

Prioritize usability and functional completeness over unnecessary animations.

### 8. Seed Dataset

Use the provided official seed JSON dataset containing:

- 2 demo users (1 Owner and 1 Renter).
- 3 cars (Tesla Model Y, Ford Bronco, BMW M3).
- 1 existing confirmed booking.

Preserve the original seed data and ensure it is available when the application starts.

### 9. Acceptance Criteria

The application must pass all the following tests:

**TR-1: Car Listing Creation**

- Create Tesla Model Y 2023.
- Daily rate: $85.
- Location: Airport Hub.
- Verify that the car appears immediately in the marketplace.

**TR-2: Search and Filtering**

- Filter by Tesla.
- Set maximum daily price to $90.
- Verify that only matching cars are displayed.

**TR-3: Dynamic Pricing**

- Select Tesla Model Y.
- Choose a 3-day rental.
- Daily rate: $85.
- Cleaning fee: $25.
- Expected total: $280.00.

**TR-4: Owner Booking Approval**

- Submit a booking as a Renter.
- Switch to Owner account.
- Approve the pending booking.
- Verify that both dashboards display Confirmed status.

**TR-5: Booking Conflict Prevention**

- Create a confirmed booking for a specific car and date range.
- Attempt to book the same car for overlapping dates.
- Verify that the second booking is rejected or blocked.

**TR-6: Data Persistence**

- Create a new car listing and booking.
- Refresh the application.
- Verify that all changes remain available.

### 10. Technical Quality and Delivery

- The application must be fully functional, not just a static UI prototype.
- All primary buttons and forms must work.
- Avoid placeholder functionality.
- No critical runtime errors.
- Validate all required inputs.
- Ensure consistent data across user roles.
- Provide a short README explaining how to run the application and access demo accounts.

### Final Objective

Deliver a working end-to-end car rental marketplace that demonstrates the AI Factory's ability to autonomously transform business requirements into a usable application, with consistent data, functional workflows, and verifiable automated QA results.
