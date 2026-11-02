# Challenge Brief: "Wheels2Go" (P2P Mobility Marketplace — Car Only)

## Objective

Teams configure their Agentic AI Factory to ingest this prompt and autonomously generate structured requirements, UI design tokens, full-stack code, and automated QA validations.

Core Business Model: A two-sided marketplace where Car Owners list their vehicles for rent, and Renters discover, book, and manage car rentals with clear pickup/drop-off locations and transparent pricing.

## Input Prompt

Build a fully functional, responsive web application called Wheels2Go, a two-sided P2P car rental platform. The application must support two primary user roles: Car Owner and Renter.

Key Capabilities:

Car Listing Creation & Location Management (Owner Side):

- Owners can list cars with details including Make, Model, Year, Fuel/EV Type, Transmission, Daily Rental Rate, Hourly Rental Rate, and Image URL.
- Every listing must specify a Pickup/Drop-off Location (e.g., City, Airport Hub, or Specific Address).

Discovery & Filtering (Renter Side):

- Renters can browse available cars in a grid/list view with search and filtering options (by Make/Brand, Location Keyword, Maximum Daily Rate, and Transmission).

Booking & Reservation Flow (Renter & Owner):

- Renters choose a daily or an hourly rental for a car. Daily rentals use start and end dates and cost Days × Daily Rate + Cleaning Fee. Hourly rentals use a date, a start time and a number of hours (minimum 2) and cost Hours × Hourly Rate + Cleaning Fee. The total price is calculated automatically.
- Owners can view incoming booking requests on their dashboard and update their status (Pending, Confirmed, or Cancelled).

## Core Feature Specifications by Role

### A. Car Owner Portal

- Listing Management: Add, edit, or toggle availability status for car listings.
- Location Setup: Set pickup instructions, drop-off rules, and address guidelines.
- Booking Requests Queue: View incoming rental requests from renters and approve or decline them.
- Earnings Tracker: Simple dashboard overview showing completed rentals and total revenue earned.

### B. Renter Portal

- Marketplace Catalog: Clean grid view displaying car cards with high-resolution image URLs, daily and hourly rates, fuel types, and location badges.
- Search & Filters: Filter inventory by make/model, maximum daily price, transmission (Automatic vs. Manual), and location keyword.
- Checkout & Calculation: Dynamic price breakdown displaying the rental type, days or hours count, the applicable rate, cleaning fee, and calculated total amount.
- My Bookings Dashboard: View upcoming, active, and completed rentals with status tags (Pending, Confirmed, Completed).

## Testable Requirements Matrix for Judges

| Module                           | Requirement                                                                | Test Action                                                                          | Pass Criteria                                                                          |
| -------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| TR-1: Car Listing Creation       | Owners can list a new vehicle with all required specs and pickup location. | Create a listing: "Tesla Model Y 2023", $85/day, $15/hour, Location: "Airport Hub".  | Listing appears instantly in the catalog feed with both rates and the location badge.  |
| TR-2: Search & Filter Validation | Renters can filter inventory by make and maximum daily rate.               | Filter catalog by Make = "Tesla" or set Max Daily Rate = $100.                       | Non-matching cars disappear from the active feed in real time.                         |
| TR-3: Hourly Pricing Math        | Checkout flow calculates hourly rentals accurately.                        | Select a 5-hour rental for a $15/hour car with a $25 cleaning fee.                   | Checkout summary displays exactly $100.00 ($75 rental + $25 fee).                      |
| TR-4: Owner Booking Approval     | Owners can manage rental request states from their portal.                 | Log into Owner view, locate a pending booking request, and click "Approve".          | Booking status updates to Confirmed across both owner and renter portals.              |

## Seed Data

The pre-populated seed dataset is provided separately as `seed.json` (users, cars, bookings).
