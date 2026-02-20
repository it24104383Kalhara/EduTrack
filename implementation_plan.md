# Implementation Plan: Sport & Extra Curriculum Activities Component

## Goal Description
Develop the "Sport & Extra Curriculum Activities Management" component for the School Management System. Ideally, this module will handle athlete registration, attendance tracking, resource management, and achievement analytics. The project involves setting up a collaborative Git environment for 6 members.

## User Review Required
> [!IMPORTANT]
> Please confirm the specific branch names for the 6 members before we initialize the repository. I will use placeholder names for now (e.g., `member-1`, `member-2`).

> [!NOTE]
> I have assumed we will use an ORM like TypeORM or Prisma for MySQL interaction to ensure type safety with TypeScript. Let me know if you prefer raw SQL.

## Proposed Changes

### 1. Project Structure (Root Level)
We will establish a monorepo-style structure to keep frontend and backend organized but distinct.

```
/EduTrack
  /backend
    /src
      /config
      /controllers
      /models
      /routes
      /middleware
      /utils
    package.json
    tsconfig.json
  /frontend
    /src
      /components
      /pages
      /hooks
      /services
      /context
    package.json
    tsconfig.json
  /docs
  README.md
  .gitignore
```

### 2. Git Strategy
1.  **Main Branch**: `main` (Stable production-ready code)
2.  **Merge Branch**: `dev` or `integration` (Where features are merged before main)
3.  **Member Branches**:
    - `feature/transport-mgmt`
    - `feature/hostel-mgmt`
    - `feature/sport-mgmt` (Your branch)
    - `feature/student-progress`
    - `feature/health-mgmt`
    - `feature/library-mgmt`

### 3. Database Schema Design (MySQL) - Sport Component Focus
 > [!TIP]
 > All tables for this component will be prefixed with `sports_` to ensure they are easily distinguishable from other modules in the shared database.

#### Tables
1.  `sports_activities`: Stores sports, clubs, and societies.
    - `id`, `name`, `type` (Sport/Club), `in_charge_staff_id`, `description`
2.  `sports_memberships`: Join table for student memberships (was `students_activities`).
    - `id`, `student_id`, `activity_id`, `role` (Member, Captain, President), `joined_at`
3.  `sports_inventory`: Sports equipment.
    - `id`, `name`, `category`, `total_quantity`, `available_quantity`, `condition`
4.  `sports_inventory_logs`: Tracks borrowing/returns.
    - `id`, `item_id`, `borrowed_by_id`, `borrowed_at`, `returned_at`, `status`
5.  `sports_facilities`: Grounds and rooms.
    - `id`, `name`, `type` (Ground, Room, Hall)
6.  `sports_bookings`: Facility reservations.
    - `id`, `facility_id`, `booked_by_id`, `start_time`, `end_time`, `purpose`
7.  `sports_practice_sessions`: Scheduled practices.
    - `id`, `activity_id`, `coach_id`, `start_time`, `end_time`, `location_id`
8.  `sports_attendance`: Student attendance records.
    - `id`, `session_id`, `student_id`, `status` (Present/Absent/Excused), `timestamp`
9.  `sports_achievements`: Match results and awards.
    - `id`, `student_id`, `activity_id`, `title`, `date`, `merit_points`, `description`

### 4. Backend API (Node.js + Express)

#### Authentication & Roles
- Middleware to check roles: `admin`, `coach`, `teacher`.

#### Endpoints
- **Activities**: `GET /api/activities`, `POST /api/activities`, `PUT /api/activities/:id`
- **Registration**: `POST /api/activities/:id/join`, `DELETE /api/activities/:id/leave`
- **Attendance**:
    - `POST /api/attendance/session` (Create session)
    - `POST /api/attendance/mark` (Mark bulk attendance)
    - `GET /api/attendance/report/:studentId`
- **Resources**:
    - `GET /api/inventory`, `POST /api/inventory`
    - `POST /api/inventory/borrow`, `POST /api/inventory/return`
    - `POST /api/bookings`
- **Achievements**: `POST /api/achievements`, `GET /api/achievements/:studentId`

### 5. Frontend Architecture (React)
- **State Management**: Context API or Redux (if complex) for user session and notifications.
- **UI Components**: Reusable cards for activities, tables for inventory, calendars for booking.
- **Pages**:
    - `Dashboard` (Overview of upcoming practices, recent alerts)
    - `ActivityManager` (CRUD for sports/clubs)
    - `AttendanceTracker` (List of students -> Toggle Present/Absent)
    - `Inventory` (Current stock, loan form)
    - `StudentProfile` (View "Sports CV")

## Verification Plan

### Automated Tests
- **Backend**: Jest + Supertest for API endpoints (e.g., ensuring a student cannot be marked present if no session exists).
- **Frontend**: React Testing Library for component rendering (e.g., verifying the "Panic Button" or "Alert" UI functionality).

### Manual Verification
1.  **Setup**: Clone repo, install dependencies.
2.  **Scenario 1**: Register a new Sport. Add a student to it.
3.  **Scenario 2**: Schedule a practice session. Mark the student absent. Verify an alert is logged (simulated).
4.  **Scenario 3**: Borrow an item from inventory. Check available quantity decreases. Return it. Check quantity restores.
