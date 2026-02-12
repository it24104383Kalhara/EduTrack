# Sport & Extra Curriculum Activities - API Documentation

## Base URL
```
http://localhost:5000/api/sports
```

## Authentication
All protected endpoints require the following headers:
- `x-user-id`: User ID (number)
- `x-user-role`: User role (Admin | Coach | Teacher | Student)
- `x-user-name`: User name (optional)

---

## Activities Endpoints

### 1. Get All Activities
**GET** `/activities`

**Access:** Public

**Response:**
```json
[
  {
    "id": 1,
    "name": "Football",
    "type": "Sport",
    "in_charge_staff_id": 5,
    "description": "School football team",
    "created_at": "2026-02-10T10:00:00.000Z"
  }
]
```

### 2. Create Activity
**POST** `/activities`

**Access:** Admin, Coach

**Headers:**
```
x-user-id: 1
x-user-role: Coach
```

**Request Body:**
```json
{
  "name": "Basketball",
  "type": "Sport",
  "in_charge_staff_id": 5,
  "description": "School basketball team"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Basketball",
  "type": "Sport",
  "in_charge_staff_id": 5,
  "description": "School basketball team"
}
```

### 3. Delete Activity
**DELETE** `/activities/:id`

**Access:** Admin, Coach

**Headers:**
```
x-user-id: 1
x-user-role: Admin
```

**Response:** 204 No Content

---

## Membership Endpoints

### 1. Register Student to Activity
**POST** `/memberships/register`

**Access:** Admin, Coach

**Headers:**
```
x-user-id: 1
x-user-role: Coach
```

**Request Body:**
```json
{
  "student_id": 101,
  "activity_id": 1,
  "role": "Member"
}
```

**Roles:** Member | Captain | Vice-Captain | President | Secretary | Treasurer

**Response:**
```json
{
  "id": 1,
  "student_id": 101,
  "activity_id": 1,
  "role": "Member",
  "joined_at": "2026-02-10"
}
```

### 2. Get Student's Activities
**GET** `/memberships/student/:studentId`

**Access:** All authenticated users

**Headers:**
```
x-user-id: 101
x-user-role: Student
```

**Response:**
```json
[
  {
    "id": 1,
    "student_id": 101,
    "activity_id": 1,
    "role": "Member",
    "joined_at": "2026-02-10",
    "quit_at": null
  }
]
```

### 3. Get Activity Members
**GET** `/memberships/activity/:activityId`

**Access:** All authenticated users

**Headers:**
```
x-user-id: 1
x-user-role: Coach
```

**Response:**
```json
[
  {
    "id": 1,
    "student_id": 101,
    "activity_id": 1,
    "role": "Captain",
    "joined_at": "2026-02-10",
    "quit_at": null
  },
  {
    "id": 2,
    "student_id": 102,
    "activity_id": 1,
    "role": "Member",
    "joined_at": "2026-02-10",
    "quit_at": null
  }
]
```

### 4. Remove Student from Activity
**DELETE** `/memberships/:id`

**Access:** Admin, Coach

**Headers:**
```
x-user-id: 1
x-user-role: Coach
```

**Response:** 204 No Content

---

## Testing with Postman/Thunder Client

### Example: Create an Activity
1. Method: POST
2. URL: `http://localhost:5000/api/sports/activities`
3. Headers:
   - `x-user-id`: 1
   - `x-user-role`: Coach
   - `Content-Type`: application/json
4. Body:
```json
{
  "name": "Chess Club",
  "type": "Club",
  "description": "School chess club"
}
```

### Example: Register a Student
1. Method: POST
2. URL: `http://localhost:5000/api/sports/memberships/register`
3. Headers:
   - `x-user-id`: 1
   - `x-user-role`: Coach
   - `Content-Type`: application/json
4. Body:
```json
{
  "student_id": 101,
  "activity_id": 1,
  "role": "Member"
}
```

---

## Inventory Endpoints

### 1. Get All Inventory Items
**GET** `/inventory`

**Access:** All authenticated users

**Response:**
```json
[
  {
    "id": 1,
    "name": "Football",
    "category": "Balls",
    "total_quantity": 20,
    "available_quantity": 15,
    "condition": "Good",
    "last_updated": "2026-02-10T10:00:00.000Z"
  }
]
```

### 2. Get Inventory Item by ID
**GET** `/inventory/:id`

**Access:** All authenticated users

### 3. Create Inventory Item
**POST** `/inventory`

**Access:** Admin, Coach

**Request Body:**
```json
{
  "name": "Basketball",
  "category": "Balls",
  "total_quantity": 15,
  "available_quantity": 15,
  "condition": "New"
}
```

**Conditions:** New | Good | Fair | Poor | Broken

### 4. Update Inventory Item
**PUT** `/inventory/:id`

**Access:** Admin, Coach

**Request Body:**
```json
{
  "available_quantity": 10,
  "condition": "Fair"
}
```

### 5. Delete Inventory Item
**DELETE** `/inventory/:id`

**Access:** Admin only

### 6. Borrow Item
**POST** `/inventory/borrow`

**Access:** All authenticated users

**Request Body:**
```json
{
  "item_id": 1,
  "borrowed_by_id": 101
}
```

**Response:**
```json
{
  "log_id": 1,
  "message": "Item borrowed successfully"
}
```

### 7. Return Item
**PUT** `/inventory/return/:logId`

**Access:** All authenticated users

**Request Body:**
```json
{
  "status": "Returned"
}
```

**Status:** Returned | Lost | Damaged

### 8. Get Borrowing History
**GET** `/inventory/history?item_id=1&user_id=101`

**Access:** All authenticated users

**Query Parameters:**
- `item_id` (optional): Filter by item
- `user_id` (optional): Filter by user

---

## Facility Endpoints

### 1. Get All Facilities
**GET** `/facilities`

**Access:** All authenticated users

**Response:**
```json
[
  {
    "id": 1,
    "name": "Main Football Ground",
    "type": "Ground",
    "capacity": 100,
    "location_description": "Behind the main building"
  }
]
```

### 2. Create Facility
**POST** `/facilities`

**Access:** Admin, Coach

**Request Body:**
```json
{
  "name": "Basketball Court",
  "type": "Court",
  "capacity": 50,
  "location_description": "Near the gym"
}
```

**Types:** Ground | Room | Hall | Court | Pool

### 3. Delete Facility
**DELETE** `/facilities/:id`

**Access:** Admin only

### 4. Get Bookings
**GET** `/facilities/bookings?facility_id=1&user_id=5`

**Access:** All authenticated users

**Query Parameters:**
- `facility_id` (optional): Filter by facility
- `user_id` (optional): Filter by user

**Response:**
```json
[
  {
    "id": 1,
    "facility_id": 1,
    "booked_by_id": 5,
    "start_time": "2026-02-15T14:00:00",
    "end_time": "2026-02-15T16:00:00",
    "purpose": "Football practice",
    "status": "Approved"
  }
]
```

### 5. Create Booking
**POST** `/facilities/bookings`

**Access:** Admin, Coach, Teacher

**Request Body:**
```json
{
  "facility_id": 1,
  "booked_by_id": 5,
  "start_time": "2026-02-15T14:00:00",
  "end_time": "2026-02-15T16:00:00",
  "purpose": "Football practice",
  "status": "Pending"
}
```

**Status:** Pending | Approved | Rejected

**Note:** The system automatically checks for booking conflicts.

### 6. Update Booking Status
**PUT** `/facilities/bookings/:id/status`

**Access:** Admin, Coach

**Request Body:**
```json
{
  "status": "Approved"
}
```

### 7. Delete Booking
**DELETE** `/facilities/bookings/:id`

**Access:** Admin, Coach

---

## Attendance & Practice Session Endpoints

### 1. Create Practice Session
**POST** `/attendance/sessions`

**Access:** Admin, Coach

**Request Body:**
```json
{
  "activity_id": 1,
  "coach_id": 5,
  "start_time": "2026-02-15T14:00:00",
  "end_time": "2026-02-15T16:00:00",
  "location_id": 1
}
```

**Response:**
```json
{
  "id": 1,
  "activity_id": 1,
  "coach_id": 5,
  "start_time": "2026-02-15T14:00:00",
  "end_time": "2026-02-15T16:00:00",
  "location_id": 1
}
```

### 2. Get Practice Sessions
**GET** `/attendance/sessions?activity_id=1&coach_id=5`

**Access:** All authenticated users

**Query Parameters:**
- `activity_id` (optional): Filter by activity
- `coach_id` (optional): Filter by coach

### 3. Get Single Session
**GET** `/attendance/sessions/:id`

**Access:** All authenticated users

### 4. Delete Practice Session
**DELETE** `/attendance/sessions/:id`

**Access:** Admin, Coach

### 5. Mark Attendance (Single Student)
**POST** `/attendance/mark`

**Access:** Admin, Coach

**Request Body:**
```json
{
  "session_id": 1,
  "student_id": 101,
  "status": "Present"
}
```

**Status Options:** Present | Absent | Excused | Late

**Response:**
```json
{
  "id": 1,
  "session_id": 1,
  "student_id": 101,
  "status": "Present",
  "message": "Attendance marked successfully"
}
```

### 6. Mark Attendance (Bulk)
**POST** `/attendance/mark-bulk`

**Access:** Admin, Coach

**Request Body:**
```json
{
  "session_id": 1,
  "attendances": [
    { "student_id": 101, "status": "Present" },
    { "student_id": 102, "status": "Late" },
    { "student_id": 103, "status": "Absent" }
  ]
}
```

**Response:**
```json
{
  "message": "Bulk attendance marked successfully",
  "count": 3,
  "results": [
    { "id": 1, "student_id": 101, "status": "Present" },
    { "id": 2, "student_id": 102, "status": "Late" },
    { "id": 3, "student_id": 103, "status": "Absent" }
  ]
}
```

### 7. Get Session Attendance
**GET** `/attendance/session/:sessionId`

**Access:** All authenticated users

**Response:**
```json
[
  {
    "id": 1,
    "session_id": 1,
    "student_id": 101,
    "status": "Present",
    "recorded_at": "2026-02-15T14:05:00.000Z"
  }
]
```

### 8. Get Student Attendance History
**GET** `/attendance/student/:studentId`

**Access:** All authenticated users

### 9. Get Student Attendance Statistics
**GET** `/attendance/student/:studentId/stats?activity_id=1`

**Access:** All authenticated users

**Query Parameters:**
- `activity_id` (optional): Filter stats by specific activity

**Response:**
```json
{
  "student_id": 101,
  "total_sessions": 20,
  "present": 18,
  "absent": 1,
  "excused": 1,
  "late": 0,
  "attendance_rate": 90.00
}
```

### 10. Verify Student Practice (For Teachers)
**GET** `/attendance/verify/:studentId?time=2026-02-15T14:30:00`

**Access:** Admin, Coach, Teacher

**Query Parameters:**
- `time` (optional): ISO datetime to check. Defaults to current time.

**Use Case:** Teachers can verify if a student claiming to be at practice actually has a scheduled session.

**Response (Has Practice):**
```json
{
  "has_practice": true,
  "session": {
    "id": 1,
    "activity_id": 1,
    "coach_id": 5,
    "start_time": "2026-02-15T14:00:00",
    "end_time": "2026-02-15T16:00:00",
    "location_id": 1
  },
  "message": "Student has a valid practice session"
}
```

**Response (No Practice):**
```json
{
  "has_practice": false,
  "message": "Student does not have a scheduled practice at this time"
}
```

---

## Real-Time Alerts & Verification Endpoints

### 1. Initialize Alerts System (One-Time Setup)
**POST** `/alerts/initialize`

**Access:** Admin only

**Purpose:** Creates the alerts table in the database. Run this once during initial setup.

### 2. Create Alert
**POST** `/alerts`

**Access:** Admin, Coach, Teacher

**Request Body:**
```json
{
  "alert_type": "Missing_Student",
  "severity": "High",
  "title": "Student missed practice",
  "message": "Student ID 101 did not attend scheduled football practice",
  "related_student_id": 101,
  "related_session_id": 5
}
```

**Alert Types:** Missing_Student | Equipment_Issue | Facility_Conflict | General
**Severity:** Low | Medium | High | Critical
**Status:** Pending | Acknowledged | Resolved

### 3. Get Alerts
**GET** `/alerts?status=Pending&alert_type=Missing_Student`

**Access:** All authenticated users

### 4. Update Alert Status
**PUT** `/alerts/:id/status`

**Access:** Admin, Coach

**Request Body:**
```json
{
  "status": "Acknowledged"
}
```

### 5. Check for Missing Students (Automatic)
**POST** `/alerts/check-missing/:sessionId`

**Access:** Admin, Coach

**Purpose:** Automatically creates alerts for students who didn't attend their scheduled practice.

**Response:**
```json
{
  "message": "Checked for missing students",
  "alerts_created": 3,
  "session_id": 5
}
```

### 6. Get Alert Statistics
**GET** `/alerts/stats`

**Access:** Admin, Coach

**Response:**
```json
{
  "total_alerts": 45,
  "pending": 12,
  "by_type": {
    "missing_student": 30,
    "equipment_issue": 8
  }
}
```

---

## Achievement & Match Endpoints

### 1. Create Match (Upcoming or Past)
**POST** `/achievements/matches`

**Access:** Admin, Coach

**Request Body:**
```json
{
  "activity_id": 1,
  "date": "2026-02-20",
  "opponent": "St. Peters College",
  "result": "Upcoming",
  "location": "Home Ground",
  "notes": "Big match of the season"
}
```

**Result Options:** Win | Loss | Draw | Upcoming

**Response:**
```json
{
  "id": 1,
  "activity_id": 1,
  "date": "2026-02-20",
  "opponent": "St. Peters College",
  "result": "Upcoming",
  "location": "Home Ground",
  "notes": "Big match of the season",
  "message": "Match created successfully"
}
```

### 2. Get Matches
**GET** `/achievements/matches?activity_id=1`

**Access:** All authenticated users

**Query Parameters:**
- `activity_id` (optional): Filter matches by activity

### 3. Update Match Result
**PUT** `/achievements/matches/:id`

**Access:** Admin, Coach

**Request Body:**
```json
{
  "result": "Win",
  "score_team": 2,
  "score_opponent": 1,
  "notes": "Hard fought victory"
}
```

### 4. Delete Match
**DELETE** `/achievements/matches/:id`

**Access:** Admin only

### 5. Add Achievement / Merit Points
**POST** `/achievements/achievements`

**Access:** Admin, Coach

**Request Body:**
```json
{
  "student_id": 101,
  "activity_id": 1,
  "match_id": 1,
  "title": "Man of the Match",
  "description": "Scored the winning goal",
  "date": "2026-02-20",
  "merit_points": 50,
  "type": "Match_Award"
}
```

**Achievement Types:** Match_Award | Season_Award | Special_Recognition | Participation

### 6. Get Student Sports CV
**GET** `/achievements/cv/:studentId`

**Access:** All authenticated users

**Response:**
```json
{
  "total_merit_points": 120,
  "achievements": [
    {
      "id": 1,
      "title": "Man of the Match",
      "merit_points": 50,
      "date": "2026-02-20",
      "type": "Match_Award"
    }
  ],
  "current_activities": [
    {
      "id": 10,
      "activity_name": "Football",
      "role": "Captain"
    }
  ]
}
```

### 7. Get Leaderboard
**GET** `/achievements/leaderboard?limit=10`

**Access:** All authenticated users

**Response:**
```json
[
  {
    "student_id": 101,
    "total_points": 120
  },
  {
    "student_id": 105,
    "total_points": 95
  }
]
```

---

## Testing with Postman/Thunder Client

### Example: Create an Activity
1. Method: POST
2. URL: `http://localhost:5000/api/sports/activities`
3. Headers:
   - `x-user-id`: 1
   - `x-user-role`: Coach
   - `Content-Type`: application/json
4. Body:
```json
{
  "name": "Chess Club",
  "type": "Club",
  "description": "School chess club"
}
```

### Example: Register a Student
1. Method: POST
2. URL: `http://localhost:5000/api/sports/memberships/register`
3. Headers:
   - `x-user-id`: 1
   - `x-user-role`: Coach
   - `Content-Type`: application/json
4. Body:
```json
{
  "student_id": 101,
  "activity_id": 1,
  "role": "Member"
}
```

### Example: Borrow Equipment
1. Method: POST
2. URL: `http://localhost:5000/api/sports/inventory/borrow`
3. Headers:
   - `x-user-id`: 101
   - `x-user-role`: Student
   - `Content-Type`: application/json
4. Body:
```json
{
  "item_id": 1,
  "borrowed_by_id": 101
}
```

### Example: Book a Facility
1. Method: POST
2. URL: `http://localhost:5000/api/sports/facilities/bookings`
3. Headers:
   - `x-user-id`: 5
   - `x-user-role`: Coach
   - `Content-Type`: application/json
4. Body:
```json
{
  "facility_id": 1,
  "booked_by_id": 5,
  "start_time": "2026-02-15T14:00:00",
  "end_time": "2026-02-15T16:00:00",
  "purpose": "Football practice"
}
```
