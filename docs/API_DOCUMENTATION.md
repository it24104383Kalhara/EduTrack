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
