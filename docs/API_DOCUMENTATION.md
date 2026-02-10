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
