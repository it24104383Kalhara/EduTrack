# EduTrack Student Registration Backend

Complete backend API for the EduTrack Student Registration System with full CRUD operations and validation.

## Features

🎓 **Student Registration**
- Complete student registration form with validation
- Parent/guardian information management
- Database integration with MySQL
- Comprehensive error handling
- RESTful API design

� **API Features**
- Student CRUD operations
- Input validation and sanitization
- TypeScript support
- CORS enabled
- Health check endpoints

## Database Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure database:**
   - Copy `.env.example` to `.env`
   - Update your MySQL credentials in `.env`:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=edutrack
     PORT=5000
     NODE_ENV=development
     ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

The server will automatically create the `students` table on startup.

## Development

Start the development server:
```bash
npm run dev
```

## Student Registration API Endpoints

### Student Management
- `POST /api/students/register` - Register new student
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### System
- `GET /` - API information and endpoints
- `GET /health` - Health check

## Student Registration Schema

### Required Fields
- `first_name` (string, 2-100 chars, letters only)
- `last_name` (string, 2-100 chars, letters only)
- `date_of_birth` (date, must be at least 3 years old)
- `gender` (enum: 'male', 'female', 'other')
- `religion` (string)
- `address` (text, min 10 chars)
- `nationality` (string)
- `parent_type` (enum: 'father', 'mother', 'guardian')
- `parent_name` (string)
- `parent_phone` (string, phone format)
- `parent_address` (text, min 10 chars)
- `parent_gender` (enum: 'male', 'female', 'other')
- `parent_religion` (string)
- `parent_nationality` (string)

### Optional Fields
- `parent_email` (email format)

## Example Registration Request

```bash
POST /api/students/register
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "2010-05-15",
  "gender": "male",
  "religion": "christian",
  "address": "123 Main St, City, State",
  "nationality": "American",
  "parent_type": "father",
  "parent_name": "Robert Doe",
  "parent_phone": "+1-555-123-4567",
  "parent_address": "123 Main St, City, State",
  "parent_gender": "male",
  "parent_email": "parent@example.com",
  "parent_religion": "christian",
  "parent_nationality": "American"
}
```

## Example Responses

### Success Response
```json
{
  "success": true,
  "message": "Student registered successfully!",
  "data": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "parent_name": "Robert Doe",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "first_name",
      "message": "First name must contain only letters and be at least 2 characters long"
    }
  ]
}
```

## Testing the API

### Using curl
```bash
# Test registration
curl -X POST http://localhost:5000/api/students/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John","last_name":"Doe","date_of_birth":"2010-05-15","gender":"male","religion":"christian","address":"123 Main St","nationality":"American","parent_type":"father","parent_name":"Robert Doe","parent_phone":"555-123-4567","parent_address":"123 Main St","parent_gender":"male","parent_religion":"christian","parent_nationality":"American"}'

# Get all students
curl http://localhost:5000/api/students

# Health check
curl http://localhost:5000/health
```

## Frontend Integration

The frontend is configured to connect to this backend at `http://localhost:5000`. The registration form will:
- Send data to `/api/students/register`
- Handle validation errors from the backend
- Show success messages with registration ID
- Reset form after successful registration

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts      # Database configuration
│   ├── middleware/
│   │   └── validation.ts    # Input validation middleware
│   ├── models/
│   │   └── Student.ts       # Student model and database operations
│   ├── routes/
│   │   └── students.ts      # Student routes
│   └── index.ts             # Main application file
├── .env.example             # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Error Handling

The API includes comprehensive error handling for:
- Database connection errors
- Validation errors with detailed field information
- Duplicate entries
- Missing resources (404 errors)
- Server errors (500 errors)

All errors return appropriate HTTP status codes and descriptive JSON responses.

## Build

Build for production:
```bash
npm run build
npm start
```

## License

ISC
