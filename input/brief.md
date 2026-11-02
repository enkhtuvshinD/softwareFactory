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

| Module                           | Requirement                                                                | Test Action                                                                 | Pass Criteria                                                                          |
| -------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| TR-1: Car Listing Creation       | Owners can list a new vehicle with all required specs and pickup location. | Create a listing: "Tesla Model Y 2023", $85/day, Location: "Airport Hub".   | Listing appears instantly in the catalog feed with correct details and location badge. |
| TR-2: Search & Filter Validation | Renters can filter inventory by make and maximum daily rate.               | Filter catalog by Make = "Tesla" or set Max Daily Rate = $90.               | Non-matching cars disappear from the active feed in real time.                         |
| TR-3: Dynamic Pricing Math       | Checkout flow calculates total cost accurately based on duration and fees. | Select a 3-day rental for an $85/day car with a $25 cleaning fee.           | Checkout summary displays exactly $280.00 ($255 rental + $25 fee).                     |
| TR-4: Owner Booking Approval     | Owners can manage rental request states from their portal.                 | Log into Owner view, locate a pending booking request, and click "Approve". | Booking status updates to Confirmed across both owner and renter portals.              |

## Seed Data

The pre-populated seed dataset is provided separately as `seed.json` (users, cars, bookings). -->

//2

<!-- # Hackathon Challenge: Wheels2Go

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

Deliver a working end-to-end car rental marketplace that demonstrates the AI Factory's ability to autonomously transform business requirements into a usable application, with consistent data, functional workflows, and verifiable automated QA results. -->

#3

<!-- # Build QueueFlow — Smart Queue & Appointment Management Platform

Build a fully functional, responsive web application called QueueFlow.

QueueFlow is a digital queue management and appointment booking platform that helps service businesses manage customers, staff, service counters, and waiting queues efficiently.

## 1. User Roles

Support three roles:

**Customer**

- View available service branches.
- Browse available services.
- Book appointments.
- Generate a queue ticket.
- Track queue position and estimated waiting time.
- View booking and service history.

**Staff**

- View assigned service queues.
- Call the next customer.
- Start customer service.
- Complete or cancel service.
- Mark customers as No-Show.
- View currently serving customers.

**Admin**

- Manage branches.
- Manage services and service durations.
- Manage staff members.
- Assign staff to service counters.
- Monitor all queues.
- View operational statistics.

Provide demo accounts and an easy role-switching mechanism for judging.

## 2. Branch and Service Management

Admins can create and manage multiple branches.

Each branch must include:

- Branch name.
- Address.
- Operating hours.
- Available services.
- Assigned staff.
- Number of service counters.

Each service must include:

- Service name.
- Description.
- Estimated duration in minutes.
- Service category.
- Active/inactive status.

## 3. Customer Queue Booking

Customers can:

- Select a branch.
- Select a service.
- Choose Walk-in Queue or Scheduled Appointment.
- Generate a unique queue ticket.
- View ticket number.
- View current queue position.
- View estimated waiting time.

Queue tickets must have the following statuses:

- Waiting
- Called
- Serving
- Completed
- Cancelled
- No-Show

## 4. Queue Management Algorithm

Implement a working queue management system.

Requirements:

- Assign sequential ticket numbers per branch and service per business day.
- Call customers in FIFO order (First In, First Out).
- Prevent the same ticket from being called twice.
- Allow staff to call the next waiting customer.
- Automatically update queue positions when a customer is served or cancelled.
- Calculate estimated waiting time using the number of people ahead and average service duration.
- Prevent a staff member from serving multiple customers simultaneously.

When a customer is called, their ticket must update in the customer dashboard.

## 5. Staff Dashboard

Display:

- Assigned branch and counter.
- Current serving customer.
- Waiting customer count.
- Next customer.
- Completed services today.
- Average service duration.

Provide functional buttons:

- Call Next
- Start Service
- Complete Service
- No-Show
- Cancel Ticket

All actions must update the shared queue state.

## 6. Customer Appointment Management

Customers can schedule appointments by selecting:

- Branch.
- Service.
- Date.
- Available time slot.

Requirements:

- Do not allow booking in the past.
- Prevent overlapping appointments for the same staff member or counter.
- Display available time slots.
- Allow customers to cancel upcoming appointments.
- Convert an appointment into a queue ticket when its service time arrives.

## 7. Admin Dashboard and Analytics

Display:

- Total customers today.
- Currently waiting customers.
- Customers being served.
- Completed services.
- Cancelled tickets.
- Average waiting time.
- Average service duration.
- Branch performance comparison.

Use clear charts and summary cards.

## 8. Real-Time Updates

Customer, Staff, and Admin dashboards must reflect queue changes consistently.

When staff calls the next customer:

- Customer ticket status changes to Called.
- Queue position updates.
- Admin dashboard updates.
- Staff dashboard displays the current customer.

Use WebSocket or an equivalent real-time mechanism where available. If unavailable, implement a reliable shared-state update strategy.

## 9. Data Persistence

- Persist branches, services, staff, appointments, and tickets.
- Data must survive browser refreshes.
- Ensure consistent data across all roles.
- Prevent duplicate ticket generation.
- Validate all critical operations.

## 10. UI/UX Requirements

Build a professional SaaS dashboard.

Design direction:

- Modern and minimal interface.
- Clear typography and spacing.
- Responsive desktop and mobile layouts.
- Distinct status indicators.
- Queue display optimized for large screens.
- Intuitive navigation.
- Loading, empty, success, and error states.

Prioritize functional workflows over decorative animations.

## 11. Seed Dataset

Create initial demo data:

Branches:

- Central Branch
- Downtown Branch

Services:

- General Consultation (15 minutes)
- Document Verification (10 minutes)
- Customer Support (20 minutes)

Staff:

- Sarah Johnson — Central Branch
- Michael Chen — Central Branch
- David Wilson — Downtown Branch

Customers:

- Alex Rivera
- Emma Brown
- James Miller

Create sample queue tickets with different statuses so the dashboards are immediately testable.

## 12. Acceptance Criteria

TR-1: Queue Ticket Generation

- Customer selects Central Branch.
- Selects General Consultation.
- Generates a queue ticket.
- Verify that a unique ticket number is created.

TR-2: FIFO Queue Processing

- Create three waiting tickets.
- Staff clicks Call Next three times, completing each service between calls.
- Verify that tickets are processed in FIFO order.

TR-3: Real-Time Status Synchronization

- Customer opens their ticket dashboard.
- Staff calls that customer.
- Verify that customer sees Called status without manually refreshing.

TR-4: Queue Position and Waiting Time

- Generate multiple tickets.
- Complete or cancel one ticket.
- Verify that the remaining queue positions and estimated waiting times are recalculated correctly.

TR-5: Appointment Conflict Prevention

- Book a specific time slot.
- Attempt to book the same staff member or counter at the same time.
- Verify that the conflicting appointment is rejected.

TR-6: Admin Analytics

- Complete several service tickets.
- Verify that dashboard statistics reflect the actual ticket data.

## 13. Technical Quality

- Build a fully working application, not a static prototype.
- All primary buttons and forms must work.
- Maintain data consistency across roles.
- Handle invalid operations with clear messages.
- Avoid duplicate tickets and conflicting appointments.
- Include demo accounts and setup instructions.
- No critical runtime errors.

## Final Objective

Deliver a complete digital queue management platform demonstrating the AI Factory's ability to autonomously understand business workflows, generate requirements, design interfaces, implement application logic, maintain data consistency, and validate functionality through automated QA tests. -->

//4

<!-- # Build GymFlow — AI-Powered Gym Workout Planner

Build a fully functional, responsive web application called **GymFlow**, an intelligent gym workout planning and fitness progress tracking platform.

The application helps users create personalized workout schedules based on their fitness goals, experience level, available training days, and preferred workout duration.

## 1. User Profile & Fitness Assessment

Users must be able to create and manage their fitness profiles.

Collect the following information:

- Name
- Age
- Gender (optional)
- Height (cm)
- Weight (kg)
- Fitness goal:
  - Muscle Building (Hypertrophy)
  - Weight Loss
  - Strength Training
  - General Fitness
- Experience level:
  - Beginner
  - Intermediate
  - Advanced
- Available training days per week
- Preferred workout duration (30, 45, 60, or 90 minutes)
- Available equipment:
  - Full Gym
  - Dumbbells
  - Barbell
  - Bodyweight Only

## 2. Workout Plan Generator

Generate a personalized weekly workout schedule based on the user's profile.

The workout generator must consider:

- Fitness goal.
- Training experience.
- Available training days.
- Target muscle groups.
- Recovery time between sessions.
- Available equipment.
- Workout duration.

Support the following training splits:

- Full Body
- Upper / Lower
- Push / Pull / Legs (PPL)
- Bro Split

Generate a complete 7-day schedule.

Each workout day must include:

- Training day name.
- Target muscle groups.
- Exercise list.
- Number of sets.
- Repetitions.
- Rest time between sets.
- Recommended exercise order.

Include appropriate rest and recovery days.

## 3. Exercise Library

Create an exercise database with:

- Exercise name.
- Target muscle group.
- Secondary muscle groups.
- Equipment required.
- Difficulty level.
- Exercise instructions.
- Sets and repetition recommendations.

Muscle groups:

- Chest
- Back
- Shoulders
- Biceps
- Triceps
- Legs
- Glutes
- Abs
- Calves

Users must be able to search and filter exercises by muscle group and equipment.

## 4. Workout Session Tracking

Users can start a workout session from their weekly plan.

During a session, users can:

- View the current exercise.
- Record weight lifted.
- Record completed repetitions.
- Mark sets as completed.
- Track rest time.
- Skip or replace an exercise.
- Finish the workout.

Save completed workout sessions in their history.

## 5. Progressive Overload

Implement a workout progression tracking feature.

For each exercise:

- Store previous workout weights and repetitions.
- Display previous performance.
- Suggest increasing weight or repetitions when appropriate.
- Track personal records (PR).
- Display progression history.

Progression suggestions must be conservative and appropriate for the user's experience level.

## 6. Fitness Dashboard

Create a dashboard displaying:

- Current weekly workout schedule.
- Total workouts completed.
- Total training volume.
- Current body weight.
- Workout consistency.
- Personal records.
- Weekly training statistics.

Calculate training volume as:

Total Volume = Sum of (Weight × Repetitions × Completed Sets)

Display progress using charts and visual statistics.

## 7. Body Measurement Tracking

Allow users to record:

- Body weight.
- Chest circumference.
- Waist circumference.
- Arm circumference.
- Thigh circumference.

Display historical progress using charts.

## 8. Workout Plan Management

Users can:

- Generate a new workout plan.
- Edit their existing workout plan.
- Replace exercises.
- Change workout days.
- Adjust sets and repetitions.
- Mark workouts as completed.
- Regenerate a plan when their goals or availability change.

Do not overwrite workout history when regenerating a plan.

## 9. Smart Workout Recommendations

Provide rule-based workout recommendations based on:

- Missed workout days.
- Training frequency.
- Recent exercise performance.
- Recovery days.
- Training consistency.

Avoid scheduling the same major muscle group on consecutive days without adequate recovery.

Do not recommend aggressive weight increases or excessive training volume.

## 10. UI/UX Requirements

Design a premium fitness SaaS dashboard.

Design direction:

- Modern dark-themed gym interface.
- Clean typography.
- Responsive desktop and mobile layouts.
- Exercise cards with visual illustrations or images.
- Weekly calendar view.
- Progress charts.
- Clear workout completion indicators.
- Intuitive workout session interface.

Prioritize usability and functional completeness over unnecessary animations.

## 11. Data Persistence

- Persist user profiles.
- Persist workout plans.
- Persist exercise records.
- Persist workout history.
- Persist body measurements.
- Data must survive page refreshes.
- Maintain consistency across dashboard views.

## 12. Seed Dataset

Create a demo user:

Name: Alex Rivera
Age: 25
Height: 175 cm
Weight: 70 kg
Fitness Goal: Muscle Building
Experience: Intermediate
Training Days: 4 days per week
Workout Duration: 60 minutes
Equipment: Full Gym

Create an exercise library containing at least 20 exercises across all major muscle groups.

Generate an initial 4-day Upper/Lower workout plan.

## 13. Acceptance Criteria

TR-1: Workout Plan Generation

Create a profile with Muscle Building, Intermediate experience, and 4 available training days.

Expected result: A 4-day workout plan with appropriate training and recovery days.

TR-2: Exercise Customization

Replace an exercise in the weekly workout plan.

Expected result: The new exercise appears in the plan and the old exercise is removed without affecting other workout days.

TR-3: Workout Tracking

Start a workout, record 3 sets of 10 repetitions at 50 kg for an exercise, and complete the session.

Expected result: Workout history records the completed sets and total volume of 1,500 kg.

TR-4: Progressive Overload

Complete an exercise session and enter new performance data in the next session.

Expected result: Previous performance is displayed and an appropriate progression suggestion is generated.

TR-5: Body Progress Tracking

Record body weight at multiple dates.

Expected result: Dashboard displays a historical weight progression chart.

TR-6: Data Persistence

Create a workout plan and complete a session. Refresh the application.

Expected result: All workout plans, history, and measurements remain available.

## 14. Technical Quality

- Fully functional application, not a static prototype.
- All primary buttons and forms must work.
- Validate all inputs.
- No critical runtime errors.
- Maintain data consistency.
- Include demo user access.
- Provide setup instructions in README.

## Final Objective

Deliver a complete gym workout planning and tracking platform that transforms user fitness profiles into personalized training schedules, tracks workout performance, supports progressive overload, and visualizes long-term fitness progress. -->

# AI Factory Hackathon Challenge: Wheels2Go

## Build a Production-Quality Peer-to-Peer Car Rental Marketplace

You are an autonomous senior full-stack engineering team operating as an AI Factory.

Your mission is to transform the following business requirements into a fully functional, visually polished, reliable web application called **Wheels2Go**.

Do not build a static prototype or a collection of disconnected UI screens. Build a complete, working product with real user workflows, persistent data, business logic, and verifiable test results.

---

# 1. Product Vision

Wheels2Go is a peer-to-peer car rental marketplace that connects people who own cars with people who need to rent them.

The platform has two primary user experiences:

- **Car Owners:** List vehicles, manage availability, handle rental requests, and track earnings.
- **Renters:** Discover vehicles, compare options, make reservations, and manage their trips.

The application should feel like a modern commercial car rental platform, not a generic CRUD dashboard.

Prioritize a seamless booking experience, clear pricing, trustworthy information, and intuitive navigation.

# 2. Engineering Principles

Follow these principles throughout development:

1. Functional completeness over visual mockups.
2. Reusable components and clean architecture.
3. Consistent data across all user roles.
4. Reliable booking and pricing calculations.
5. Persistent storage with proper data validation.
6. Responsive design across desktop, tablet, and mobile.
7. No dead buttons, fake interactions, or placeholder workflows.
8. Clear loading, success, empty, and error states.
9. Minimal unnecessary dependencies.
10. Deliver a working application, not just source code that looks correct.

Before implementing anything, inspect the existing repository, available tools, framework, database, and official seed dataset.

Reuse the existing project structure and technology stack where practical. Do not unnecessarily replace working infrastructure.

# 3. User Roles and Demo Authentication

Implement two demo user roles:

### Car Owner

- Manage personal vehicle listings.
- Create, edit, enable, disable, and delete listings.
- Review incoming booking requests.
- Approve or reject pending requests.
- Track completed rentals and earnings.

### Renter

- Browse and search available cars.
- View detailed vehicle information.
- Submit booking requests.
- View booking history.
- Cancel eligible reservations.

### Demo Account Switching

Provide a visible and intuitive account switcher for hackathon judges.

It must allow switching between the seeded Owner and Renter accounts without requiring external authentication.

Important:

- Switching accounts must update the entire application context.
- Role-specific navigation and permissions must be enforced.
- Owner-only actions must not be available to Renters.
- Data must remain consistent when switching accounts.

# 4. Owner Experience

Build a dedicated Owner Dashboard.

### 4.1 Dashboard Overview

Display:

- Total listed vehicles.
- Active listings.
- Total completed rentals.
- Total earnings.
- Pending booking requests.
- Recent booking activity.

Use meaningful KPI cards and readable visualizations.

### 4.2 Vehicle Management

Owners can:

- Create new vehicle listings.
- Edit existing listings.
- Activate or deactivate listings.
- Delete their own listings.
- View their vehicle inventory.

Each vehicle must contain:

- Make
- Model
- Year
- Fuel type: Gasoline, Hybrid, Electric
- Transmission: Automatic, Manual
- Number of seats
- Daily rental price
- Cleaning fee
- Vehicle image URL
- Pickup location
- Full pickup address
- Pickup instructions
- Availability status
- Owner reference

Validation:

- Required fields cannot be empty.
- Rental price and cleaning fee cannot be negative.
- Year must be valid.
- Seats must be a positive integer.
- Image URLs must be valid when provided.
- Invalid submissions must display helpful validation messages.

### 4.3 Booking Management

Owners must have a dedicated booking management page.

Display:

- Renter information.
- Vehicle information.
- Rental start and end dates.
- Number of rental days.
- Total booking price.
- Booking creation date.
- Current booking status.

Available actions:

- Approve pending requests.
- Reject pending requests.
- View complete booking details.

Only the vehicle owner can approve or reject requests for their own vehicles.

An owner cannot approve a conflicting reservation.

### 4.4 Earnings Dashboard

Calculate earnings using completed rentals.

Display:

- Total completed rentals.
- Total revenue.
- Revenue by vehicle.
- Recent completed bookings.
- Revenue summary.

Do not count pending, cancelled, or rejected bookings as earned revenue.

# 5. Renter Experience

Build a dedicated Marketplace experience.

### 5.1 Marketplace Homepage

Create a premium marketplace landing page with:

- Attractive hero section.
- Prominent search functionality.
- Featured available vehicles.
- Vehicle category or brand shortcuts.
- Clear calls to action.
- Trust-building information.

### 5.2 Vehicle Cards

Display vehicles in a responsive grid.

Every card must include:

- High-quality vehicle image.
- Make, model, and year.
- Daily rental price.
- Fuel type.
- Transmission.
- Number of seats.
- Pickup location.
- Availability status.
- View details action.

Use consistent image dimensions and professional card layouts.

### 5.3 Vehicle Details

Create a dedicated vehicle details view.

Display:

- Large vehicle image gallery or hero image.
- Vehicle specifications.
- Owner information.
- Pickup location and address.
- Pickup instructions.
- Daily rental rate.
- Cleaning fee.
- Availability information.
- Booking form.

The booking action must be intuitive and easy to find.

### 5.4 Search and Filtering

Implement real, combinable filters:

- Make / Brand
- Model
- Location keyword
- Maximum daily rental price
- Transmission
- Fuel type

Requirements:

- All filters must work together.
- Results update immediately.
- Search must be case-insensitive.
- Filters must work with partial text matches where appropriate.
- Provide a clear-all-filters action.
- Show the number of matching vehicles.
- Display a helpful empty state when no vehicles match.

Do not implement filters that only change their visual appearance.

# 6. Booking Engine and Pricing

Implement a complete reservation workflow.

### 6.1 Booking Process

A Renter must be able to:

1. Select a vehicle.
2. Select a rental start date.
3. Select a rental end date.
4. Review pickup information.
5. Review the complete price breakdown.
6. Submit a booking request.
7. Receive clear confirmation that the request was submitted.

### 6.2 Pricing Calculation

Use the following formula:

Total Price = (Rental Days × Daily Rate) + Cleaning Fee

Example:

- Vehicle: Tesla Model Y
- Daily rate: $85
- Rental duration: 3 days
- Cleaning fee: $25

Expected calculation:

- Rental subtotal: $255
- Cleaning fee: $25
- Final total: $280

The UI must update the pricing breakdown immediately when dates change.

Use one consistent date calculation rule throughout the application. Treat the rental period as a half-open interval: start date inclusive, end date exclusive.

### 6.3 Booking Validation

Enforce all of the following:

- Start date cannot be in the past.
- End date must be after start date.
- Rental duration must be at least one day.
- Unavailable vehicles cannot be booked.
- A vehicle cannot have overlapping confirmed bookings.
- Invalid requests must be rejected.
- Display meaningful error messages.
- Prevent duplicate submissions.

### 6.4 Conflict Prevention

This is a critical business requirement.

Use the following overlap condition:

`newStart < existingEnd && newEnd > existingStart`

A new booking must be blocked if it overlaps with an existing confirmed booking for the same vehicle.

The conflict check must happen when submitting the booking and again when the owner approves a pending request.

If multiple users attempt to reserve the same vehicle simultaneously, the application must prevent conflicting confirmed bookings through an atomic database operation, transaction, or appropriate locking mechanism supported by the selected persistence layer.

Do not rely exclusively on frontend validation.

# 7. Booking Status Lifecycle

Implement these statuses:

- Pending
- Confirmed
- Cancelled
- Completed

### Status Rules

**Pending**

- Created when a Renter submits a valid booking.
- Visible in both Owner and Renter dashboards.

**Confirmed**

- Set only when the Owner approves a pending request.
- Must pass the booking conflict check.
- Immediately reflected in both dashboards.

**Cancelled**

- Set when an eligible booking is cancelled.
- Must release the reservation period.
- Must be reflected consistently across the application.

**Completed**

- Represents a finished rental.
- Included in completed rental statistics and earnings.
- Must not be counted as revenue before completion.

Rejecting a pending request should transition it to Cancelled.

Implement appropriate permission checks and prevent invalid status transitions.

# 8. Data Persistence and Architecture

Use the database or persistent storage already available in the project.

If no backend database exists, use a suitable persistent storage implementation and explain its limitations.

Requirements:

- Data survives browser refreshes.
- Vehicle changes appear across all relevant pages.
- Booking changes appear across both dashboards.
- Owner and Renter views use the same source of truth.
- Prevent duplicate and conflicting reservations.
- Preserve existing seeded records.
- Maintain relationships between users, vehicles, and bookings.

Suggested data entities:

**User**

- id
- name
- email
- role

**Car**

- id
- ownerId
- make
- model
- year
- fuelType
- transmission
- seats
- dailyRate
- cleaningFee
- imageUrl
- pickupLocation
- pickupAddress
- pickupInstructions
- isAvailable

**Booking**

- id
- carId
- ownerId
- renterId
- startDate
- endDate
- rentalDays
- dailyRate
- cleaningFee
- totalPrice
- status
- createdAt
- updatedAt

Store the price values used at booking time so historical bookings do not change when an owner updates vehicle pricing.

# 9. Official Seed Dataset

The hackathon provides an official JSON seed dataset.

It contains:

- 2 demo users: 1 Owner and 1 Renter.
- 3 vehicles:
  - Tesla Model Y
  - Ford Bronco
  - BMW M3
- 1 existing confirmed booking.

Critical requirements:

- Inspect the provided seed JSON before implementation.
- Preserve original IDs and relationships.
- Do not replace the official seed data with invented data.
- Ensure seed data is available on the initial application launch.
- Avoid duplicating seed records on subsequent launches.
- Ensure the existing confirmed booking is included in availability calculations.
- Keep demo account switching connected to the actual seeded users.

# 10. Premium UI/UX Design Direction

Create a modern, premium automotive marketplace.

### Visual Direction

Use a clean, sophisticated visual language inspired by premium mobility and travel platforms.

Suggested direction:

- Neutral backgrounds.
- Strong typography.
- High-quality vehicle imagery.
- Consistent spacing.
- Subtle borders and shadows.
- Carefully designed cards.
- Clear visual hierarchy.
- Professional status indicators.
- Consistent iconography.

Avoid:

- Generic dashboard templates.
- Excessive gradients.
- Unnecessary animations.
- Crowded layouts.
- Random colors.
- Oversized components.
- Placeholder images.
- Inconsistent typography.

### Navigation

Provide intuitive navigation for both roles.

Renter navigation:

- Explore Cars
- My Bookings
- Profile / Account Switcher

Owner navigation:

- Dashboard
- My Vehicles
- Bookings
- Earnings
- Profile / Account Switcher

### Responsive Design

The application must work properly on:

- Desktop
- Tablet
- Mobile

Ensure forms, navigation, booking dialogs, vehicle cards, and dashboards adapt to smaller screens.

### Interaction States

Implement:

- Loading states.
- Empty states.
- Form validation states.
- Success notifications.
- Error notifications.
- Confirmation dialogs for destructive actions.
- Disabled states for unavailable actions.

# 11. Automated QA and Acceptance Testing

Do not consider the application complete until the following scenarios have been executed.

### TR-1: Vehicle Creation

1. Switch to Owner.
2. Create a Tesla Model Y 2023.
3. Set daily rate to $85.
4. Set cleaning fee to $25.
5. Set pickup location to Airport Hub.
6. Save the vehicle.
7. Verify it appears immediately in the marketplace.

Expected: PASS.

### TR-2: Search and Filtering

1. Open the marketplace.
2. Filter by Tesla.
3. Set maximum daily price to $90.
4. Verify only matching vehicles are displayed.

Expected: Only matching vehicles appear.

### TR-3: Dynamic Pricing

1. Select Tesla Model Y.
2. Choose a three-day rental.
3. Verify daily rate is $85.
4. Verify cleaning fee is $25.
5. Verify the total is $280.

Expected: $280.00.

### TR-4: Owner Booking Approval

1. Switch to Renter.
2. Submit a valid booking.
3. Switch to Owner.
4. Open incoming booking requests.
5. Approve the pending request.
6. Switch back to Renter.
7. Verify the booking status.

Expected: Both dashboards show Confirmed.

### TR-5: Booking Conflict Prevention

1. Create a confirmed booking for a specific vehicle.
2. Attempt another booking for the same vehicle with overlapping dates.
3. Submit the second request.

Expected: The conflicting reservation is rejected or blocked with a clear error.

Also verify that non-overlapping dates can still be booked.

### TR-6: Data Persistence

1. Create a new vehicle.
2. Create a booking.
3. Refresh the browser.
4. Switch between Owner and Renter.

Expected: All records and statuses remain consistent.

### Additional QA

Test:

- Invalid dates.
- Past dates.
- Missing required fields.
- Negative rental prices.
- Unavailable vehicles.
- Booking cancellation.
- Vehicle deletion.
- Disabled listings.
- Unauthorized owner actions.
- Duplicate submissions.
- Empty marketplace results.
- Responsive mobile layout.

Use automated browser tests where available. Otherwise, perform systematic manual verification and document the results.

Do not report a test as PASS unless it was actually executed and verified.

# 12. Implementation Workflow

Work autonomously through the following phases.

**Phase 1 — Repository Inspection**

- Inspect existing project files.
- Identify framework and architecture.
- Locate the official seed dataset.
- Identify available database and development tools.
- Understand existing application functionality.

**Phase 2 — Architecture**

- Define data models.
- Define user role permissions.
- Design booking lifecycle.
- Implement pricing and availability rules.
- Establish shared data state.

**Phase 3 — Core Development**

- Build the marketplace.
- Build vehicle management.
- Build booking workflows.
- Build Owner and Renter dashboards.
- Implement persistence.

**Phase 4 — UI/UX Polish**

- Improve visual consistency.
- Optimize responsive layouts.
- Add meaningful interaction states.
- Verify navigation and accessibility.

**Phase 5 — QA**

- Execute all acceptance tests.
- Fix discovered bugs.
- Check browser console and runtime errors.
- Verify persistence and cross-role consistency.

**Phase 6 — Delivery**

- Provide a README.
- Explain how to start the application.
- Document demo accounts.
- Document implemented functionality.
- Provide automated QA results.
- List any known limitations honestly.

# 13. Definition of Done

The project is complete only when:

- All primary workflows function end to end.
- Owner and Renter roles work correctly.
- Vehicle CRUD operations work.
- Marketplace filtering works.
- Booking and pricing calculations are correct.
- Conflicting reservations are prevented.
- Booking status updates are consistent.
- Data persists after refresh.
- Official seed data is preserved.
- Responsive UI is implemented.
- No critical runtime errors remain.
- Acceptance tests have been executed.
- README documentation is included.

# FINAL INSTRUCTION

Act as an autonomous senior engineering team.

Do not stop after planning or generating a visual mockup.

Inspect the repository, make implementation decisions, build the complete application, run it, test it, fix issues, and deliver a working product.

Prioritize a fully functional, reliable, and impressive end-to-end experience.

**The final deliverable must be a working Wheels2Go marketplace that a hackathon judge can open, explore, and test immediately.**
