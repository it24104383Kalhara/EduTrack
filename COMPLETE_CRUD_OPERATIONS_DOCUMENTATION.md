# EduTrack: Complete CRUD Operations Documentation

**Version**: 1.0.0  
**Date**: April 1, 2026  
**Scope**: Entire EduTrack Application CRUD Operations  
**Architecture**: RESTful API with React Frontend

---

## 📋 Table of Contents

1. [Students CRUD Operations](#students-crud)
2. [Grades CRUD Operations](#grades-crud)
3. [Subjects CRUD Operations](#subjects-crud)
4. [Marks CRUD Operations](#marks-crud)
5. [Attendance CRUD Operations](#attendance-crud)
6. [Users CRUD Operations](#users-crud)
7. [Email Logs CRUD Operations](#email-logs-crud)
8. [Frontend API Integration](#frontend-api)

---

## 👥 Students CRUD Operations

### **Backend Routes** (`backend/src/routes/students.ts`)

#### **CREATE - Student Registration**
```typescript
// POST /api/students/register
router.post('/register', validateStudentRegistration, async (req: AuthRequest, res: Response)
```
**Location**: `backend/src/routes/students.ts:22`  
**Validation**: `validateStudentRegistration` middleware  
**Model Method**: `StudentModel.create(studentData)`  
**Database Query**: `STUDENT_QUERIES.CREATE`

#### **READ - Get All Students**
```typescript
// GET /api/students
router.get('/', async (req: AuthRequest, res: Response)
```
**Location**: `backend/src/routes/students.ts:65`  
**Model Method**: `StudentModel.findAll()`  
**Database Query**: `STUDENT_QUERIES.FIND_ALL`

#### **READ - Get Student by ID**
```typescript
// GET /api/students/:id
router.get('/:id', async (req: AuthRequest, res: Response)
```
**Location**: `backend/src/routes/students.ts:119`  
**Model Method**: `StudentModel.findById(id)`  
**Database Query**: `STUDENT_QUERIES.FIND_BY_ID`

#### **UPDATE - Update Student**
```typescript
// PUT /api/students/:id
router.put('/:id', async (req: AuthRequest, res: Response)
```
**Location**: `backend/src/routes/students.ts:180`  
**Model Method**: `StudentModel.update(id, studentData)`  
**Database Query**: `STUDENT_QUERIES.UPDATE`

#### **DELETE - Delete Student**
```typescript
// DELETE /api/students/:id
router.delete('/:id', async (req: AuthRequest, res: Response)
```
**Location**: `backend/src/routes/students.ts:252`  
**Model Method**: `StudentModel.delete(studentId)`  
**Database Query**: `STUDENT_QUERIES.DELETE`

### **Backend Model** (`backend/src/models/Student.ts`)

#### **CREATE Method**
```typescript
static async create(studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student>
```
**Location**: `backend/src/models/Student.ts:45`

#### **READ Methods**
```typescript
static async findAll(): Promise<Student[]>
static async findById(id: number): Promise<Student | null>
```
**Location**: `backend/src/models/Student.ts:65, 85`

#### **UPDATE Method**
```typescript
static async update(id: number, studentData: Partial<Student>): Promise<Student>
```
**Location**: `backend/src/models/Student.ts:105`

#### **DELETE Method**
```typescript
static async delete(id: number): Promise<boolean>
```
**Location**: `backend/src/models/Student.ts:125`

---

## 📚 Grades CRUD Operations

### **Backend Routes** (`backend/src/routes/grades.ts`)

#### **CREATE - Create Grade**
```typescript
// POST /api/grades/create
router.post('/create', async (req: Request, res: Response)
```
**Location**: `backend/src/routes/grades.ts:15`  
**Model Method**: `GradeModel.create(gradeData)`  
**Database Query**: `GRADE_QUERIES.CREATE`

#### **READ - Get All Grades**
```typescript
// GET /api/grades
router.get('/', async (req: Request, res: Response)
```
**Location**: `backend/src/routes/grades.ts:45`  
**Model Method**: `GradeModel.findAll()`  
**Database Query**: `GRADE_QUERIES.FIND_ALL`

#### **READ - Get Grade by ID**
```typescript
// GET /api/grades/:id
router.get('/:id', async (req: Request, res: Response)
```
**Location**: `backend/src/routes/grades.ts:75`  
**Model Method**: `GradeModel.findById(id)`  
**Database Query**: `GRADE_QUERIES.FIND_BY_ID`

#### **UPDATE - Update Grade**
```typescript
// PUT /api/grades/:id
router.put('/:id', async (req: Request, res: Response)
```
**Location**: `backend/src/routes/grades.ts:105`  
**Model Method**: `GradeModel.update(id, gradeData)`  
**Database Query**: `GRADE_QUERIES.UPDATE`

#### **DELETE - Delete Grade**
```typescript
// DELETE /api/grades/:id
router.delete('/:id', async (req: Request, res: Response)
```
**Location**: `backend/src/routes/grades.ts:427`  
**Model Method**: `GradeModel.delete(gradeId)`  
**Database Query**: `GRADE_QUERIES.DELETE`

#### **DELETE - Clear All Grades**
```typescript
// DELETE /api/grades/clear
router.delete('/clear', async (req: Request, res: Response)
```
**Location**: `backend/src/routes/grades.ts:390`  
**Model Method**: `GradeModel.clearAll()`  
**Database Query**: `GRADE_QUERIES.CLEAR_ALL_GRADES`

### **Student Assignment Operations**

#### **CREATE - Assign Student to Grade**
```typescript
// POST /api/grades/:gradeId/assign-student/:studentId
router.post('/:gradeId/assign-student/:studentId', async (req: Request, res: Response)
```
**Location**: `backend/src/routes/grades.ts:520`

#### **DELETE - Remove Student from Grade**
```typescript
// DELETE /api/grades/:gradeId/remove-student/:studentId
router.delete('/:gradeId/remove-student/:studentId', async (req: Request, res: Response)
```
**Location**: `backend/src/routes/grades.ts:582`

### **Backend Model** (`backend/src/models/Grade.ts`)

#### **CREATE Method**
```typescript
static async create(gradeData: Omit<Grade, 'id' | 'created_at' | 'updated_at'>): Promise<Grade>
```
**Location**: `backend/src/models/Grade.ts:45`

#### **READ Methods**
```typescript
static async findAll(): Promise<Grade[]>
static async findById(id: number): Promise<Grade | null>
static async findByTeacher(teacherId: number): Promise<Grade[]>
```
**Location**: `backend/src/models/Grade.ts:65, 85, 105`

#### **UPDATE Method**
```typescript
static async update(id: number, gradeData: Partial<Grade>): Promise<Grade>
```
**Location**: `backend/src/models/Grade.ts:125`

#### **DELETE Methods**
```typescript
static async delete(id: number): Promise<boolean>
static async clearAll(): Promise<number>
```
**Location**: `backend/src/models/Grade.ts:145, 165`

---

## 📖 Subjects CRUD Operations

### **Backend Routes** (`backend/src/routes/subjects.ts`)

#### **CREATE - Create Subject**
```typescript
// POST /api/subjects
router.post('/', async (req, res) => {
```
**Location**: `backend/src/routes/subjects.ts:110`  
**Model Method**: `SubjectModel.create(subjectData)`  
**Database Query**: `SUBJECT_QUERIES.CREATE`

#### **READ - Get All Subjects**
```typescript
// GET /api/subjects
router.get('/', async (req, res) => {
```
**Location**: `backend/src/routes/subjects.ts:15`  
**Model Method**: `SubjectModel.findAll()`  
**Database Query**: `SUBJECT_QUERIES.FIND_ALL`

#### **READ - Get Subject by ID**
```typescript
// GET /api/subjects/:id
router.get('/:id', async (req, res) => {
```
**Location**: `backend/src/routes/subjects.ts:35`  
**Model Method**: `SubjectModel.findById(id)`  
**Database Query**: `SUBJECT_QUERIES.FIND_BY_ID`

#### **READ - Get Subjects by Type**
```typescript
// GET /api/subjects/type/:type
router.get('/type/:type', async (req, res) => {
```
**Location**: `backend/src/routes/subjects.ts:55`  
**Model Method**: `SubjectModel.findByType(type)`  
**Database Query**: `SUBJECT_QUERIES.FIND_BY_TYPE`

#### **UPDATE - Update Subject**
```typescript
// PUT /api/subjects/:id
router.put('/:id', async (req, res) => {
```
**Location**: `backend/src/routes/subjects.ts:225`  
**Model Method**: `SubjectModel.update(id, subjectData)`  
**Database Query**: `SUBJECT_QUERIES.UPDATE`

#### **DELETE - Delete Subject**
```typescript
// DELETE /api/subjects/:id
router.delete('/:id', async (req, res) => {
```
**Location**: `backend/src/routes/subjects.ts:323`  
**Model Method**: `SubjectModel.delete(parseInt(id))`  
**Database Query**: `SUBJECT_QUERIES.DELETE`

### **Student-Subject Assignment Operations**

#### **CREATE - Bulk Assign Subjects to Student**
```typescript
// POST /api/subjects/student-assignment
router.post('/student-assignment', async (req, res) => {
```
**Location**: `backend/src/routes/subjects.ts:372`

#### **DELETE - Remove Student from Subject**
```typescript
// DELETE /api/subjects/student/:studentId/grade/:gradeId
router.delete('/student/:studentId/grade/:gradeId', async (req, res) => {
```
**Location**: `backend/src/routes/subjects.ts:410`

### **Backend Model** (`backend/src/models/Subject.ts`)

#### **CREATE Method**
```typescript
static async create(subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject>
```
**Location**: `backend/src/models/Subject.ts:45`

#### **READ Methods**
```typescript
static async findAll(): Promise<Subject[]>
static async findById(id: number): Promise<Subject | null>
static async findByType(type: string): Promise<Subject[]>
static async findByCode(code: string, excludeId?: number): Promise<Subject | null>
```
**Location**: `backend/src/models/Subject.ts:65, 85, 105, 125`

#### **UPDATE Method**
```typescript
static async update(id: number, subjectData: Partial<Subject>): Promise<Subject>
```
**Location**: `backend/src/models/Subject.ts:145`

#### **DELETE Method**
```typescript
static async delete(id: number): Promise<boolean>
```
**Location**: `backend/src/models/Subject.ts:165`

---

## 📝 Marks CRUD Operations

### **Backend Routes** (`backend/src/routes/marks.ts`)

#### **CREATE - Create Single Mark**
```typescript
// POST /api/marks
router.post('/', async (req, res) => {
```
**Location**: `backend/src/routes/marks.ts:12`  
**Model Method**: `MarksModel.create(markData)`  
**Database Query**: `MARKS_QUERIES.CREATE`

#### **CREATE - Bulk Create Marks**
```typescript
// POST /api/marks/bulk
router.post('/bulk', async (req, res) => {
```
**Location**: `backend/src/routes/marks.ts:115`

#### **READ - Get Marks by Grade/Subject/Term**
```typescript
// GET /api/marks/grade/:gradeId/subject/:subjectId/term/:term
router.get('/grade/:gradeId/subject/:subjectId/term/:term', async (req, res) => {
```
**Location**: `backend/src/routes/marks.ts:250`

#### **READ - Get Marks by Student/Grade/Term**
```typescript
// GET /api/marks/student/:studentId/grade/:gradeId/term/:term
router.get('/student/:studentId/grade/:gradeId/term/:term', async (req, res) => {
```
**Location**: `backend/src/routes/marks.ts:270`

#### **READ - Get All Marks by Grade/Term**
```typescript
// GET /api/marks/grade/:gradeId/term/:term
router.get('/grade/:gradeId/term/:term', async (req, res) => {
```
**Location**: `backend/src/routes/marks.ts:290`

#### **READ - Get Mark by ID**
```typescript
// GET /api/marks/:id
router.get('/:id', async (req, res) => {
```
**Location**: `backend/src/routes/marks.ts:310`

#### **UPDATE - Update Mark**
```typescript
// PUT /api/marks/:id
router.put('/:id', async (req, res) => {
```
**Location**: `backend/src/routes/marks.ts:430`  
**Model Method**: `MarksModel.update(id, markData)`  
**Database Query**: `MARKS_QUERIES.UPDATE`

#### **DELETE - Delete Mark**
```typescript
// DELETE /api/marks/:id
router.delete('/:id', async (req, res) => {
```
**Location**: `backend/src/routes/marks.ts:508`  
**Model Method**: `MarksModel.delete(id)`  
**Database Query**: `MARKS_QUERIES.DELETE`

### **Special Read Operations**

#### **Student Result Calculation**
```typescript
// GET /api/marks/result/student/:studentId/grade/:gradeId/term/:term
router.get('/result/student/:studentId/grade/:gradeId/term/:term', async (req, res) => {
```
**Location**: `backend/src/routes/marks.ts:554`

#### **Grade Statistics**
```typescript
// GET /api/marks/statistics/grade/:gradeId/term/:term
router.get('/statistics/grade/:gradeId/term/:term', async (req, res) => {
```
**Location**: `backend/src/routes/marks.ts:580`

### **Backend Model** (`backend/src/models/Marks.ts`)

#### **CREATE Method**
```typescript
static async create(markData: Omit<Mark, 'id' | 'percentage' | 'grade_obtained' | 'created_at' | 'updated_at'>): Promise<Mark>
```
**Location**: `backend/src/models/Marks.ts:45`

#### **READ Methods**
```typescript
static async findById(id: number): Promise<Mark | null>
static async findByGradeTerm(gradeId: number, term: string): Promise<Mark[]>
static async findByStudentGradeTerm(studentId: number, gradeId: number, term: string): Promise<Mark[]>
static async getLowMarks(threshold: number): Promise<Mark[]>
```
**Location**: `backend/src/models/Marks.ts:65, 85, 105, 125`

#### **UPDATE Method**
```typescript
static async update(id: number, markData: Partial<Mark>): Promise<Mark>
```
**Location**: `backend/src/models/Marks.ts:145`

#### **DELETE Method**
```typescript
static async delete(id: number): Promise<boolean>
```
**Location**: `backend/src/models/Marks.ts:165`

---

## 📊 Attendance CRUD Operations

### **Backend Routes** (`backend/src/routes/attendance.ts`, `backend/src/routes/attendanceMark.ts`)

#### **CREATE - Mark Attendance (Bulk)**
```typescript
// POST /api/attendance/mark
router.post('/mark', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/attendance.ts:15`  
**Model Method**: `AttendanceModel.markAttendanceBulk(attendanceRecords)`  
**Database Query**: `ATTENDANCE_MARK_QUERIES.MARK`

#### **CREATE - Mark Single Attendance**
```typescript
// POST /api/attendance-mark/single
router.post('/single', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/attendanceMark.ts:15`

#### **READ - Get Attendance by Grade/Date**
```typescript
// GET /api/attendance/grade/:gradeId/date/:date
router.get('/grade/:gradeId/date/:date', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/attendance.ts:45`  
**Model Method**: `AttendanceModel.getAttendanceByGradeAndDate(gradeId, date)`  
**Database Query**: `ATTENDANCE_MARK_QUERIES.FIND_BY_GRADE_DATE`

#### **READ - Get Attendance Summary**
```typescript
// GET /api/attendance/grade/:gradeId/date/:date/summary
router.get('/grade/:gradeId/date/:date/summary', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/attendance.ts:75`

#### **READ - Get Attendance Dates**
```typescript
// GET /api/attendance/grade/:gradeId/dates
router.get('/grade/:gradeId/dates', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/attendance.ts:95`

#### **READ - Get Student Attendance Report**
```typescript
// GET /api/attendance/student/:studentId/report
router.get('/student/:studentId/report', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/attendance.ts:115`

#### **READ - Get Grade Attendance Report**
```typescript
// GET /api/attendance/grade/:gradeId/report
router.get('/grade/:gradeId/report', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/attendance.ts:145`

#### **READ - Get All Attendance**
```typescript
// GET /api/attendance
router.get('/', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/attendance.ts:175`

#### **UPDATE - Update Attendance Status**
```typescript
// PUT /api/attendance-mark/:studentId/:date
router.put('/:studentId/:date', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/attendanceMark.ts:45`

#### **DELETE - Delete Attendance by Grade/Date**
```typescript
// DELETE /api/attendance-mark/grade/:grade/section/:section/date/:date
router.delete('/grade/:grade/section/:section/date/:date', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/attendanceMark.ts:406`  
**Model Method**: `AttendanceMarkModel.deleteAttendanceByGradeAndDate(grade, section, date)`  
**Database Query**: `ATTENDANCE_MARK_QUERIES.DELETE_BY_GRADE_DATE`

### **Backend Model** (`backend/src/models/Attendance.ts`)

#### **CREATE Methods**
```typescript
static async markAttendanceBulk(attendanceRecords: Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'marked_at'>[]): Promise<boolean>
static async markAttendance(attendanceData: Omit<Attendance, 'id' | 'created_at' | 'updated_at' | 'marked_at'>): Promise<Attendance>
```
**Location**: `backend/src/models/Attendance.ts:70, 106`

#### **READ Methods**
```typescript
static async getAttendanceByStudentAndDate(studentId: number, date: string): Promise<Attendance | null>
static async getAttendanceByGradeAndDate(gradeId: number, date: string): Promise<Attendance[]>
static async getAttendanceSummary(gradeId: number, date: string): Promise<AttendanceSummary | null>
static async getAttendanceDates(gradeId: number): Promise<string[]>
static async getStudentAttendanceReport(studentId: number, startDate?: string, endDate?: string): Promise<AttendanceReport>
static async getGradeAttendanceReport(gradeId: number, startDate?: string, endDate?: string): Promise<AttendanceReport[]>
```
**Location**: `backend/src/models/Attendance.ts:139, 167, 198, 233, 257, 314`

#### **DELETE Method**
```typescript
static async deleteAttendance(gradeId: number, date: string): Promise<boolean>
```
**Location**: `backend/src/models/Attendance.ts:354`

---

## 👤 Users CRUD Operations

### **Backend Routes** (`backend/src/routes/users.ts`)

#### **CREATE - User Registration**
```typescript
// POST /api/auth/register (in auth.ts)
router.post('/register', async (req, res) => {
```
**Location**: `backend/src/routes/auth.ts:15`  
**Model Method**: `UserModel.create(userData)`  
**Database Query**: `USER_QUERIES.CREATE`

#### **READ - Get All Teachers**
```typescript
// GET /api/users/teachers
router.get('/teachers', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/users.ts:15`  
**Model Method**: `UserModel.getAllTeachers()`  
**Database Query**: `USER_QUERIES.GET_ALL_TEACHERS`

#### **READ - Get Pending Users**
```typescript
// GET /api/users/pending
router.get('/pending', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/users.ts:35`  
**Model Method**: `UserModel.getPending()`  
**Database Query**: `USER_QUERIES.GET_PENDING`

#### **READ - Get User by ID**
```typescript
// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/users.ts:55`  
**Model Method**: `UserModel.findById(id)`  
**Database Query**: `USER_QUERIES.FIND_BY_ID`

#### **UPDATE - Update Teacher Profile**
```typescript
// PUT /api/users/teachers/:id
router.put('/teachers/:id', authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/users.ts:41`  
**Direct Database Updates**: Multiple table synchronization

#### **UPDATE - Update User Status**
```typescript
// PUT /api/users/:id/status
router.put('/:id/status', authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/users.ts:225`  
**Model Method**: `UserModel.updateStatus(id, status)`  
**Database Query**: `USER_QUERIES.UPDATE_STATUS`

#### **DELETE - User not directly deletable** (Status update to 'rejected' used instead)

### **Backend Model** (`backend/src/models/User.ts`)

#### **CREATE Method**
```typescript
static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User>
```
**Location**: `backend/src/models/User.ts:45`

#### **READ Methods**
```typescript
static async findById(id: number): Promise<User | null>
static async findByUsername(username: string): Promise<User | null>
static async getAllTeachers(): Promise<User[]>
static async getPending(): Promise<User[]>
```
**Location**: `backend/src/models/User.ts:65, 85, 105, 125`

#### **UPDATE Methods**
```typescript
static async updateStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<boolean>
static async updatePassword(username: string, newPassword: string): Promise<boolean>
```
**Location**: `backend/src/models/User.ts:145, 165`

---

## 📧 Email Logs CRUD Operations

### **Backend Routes** (`backend/src/routes/email-alerts.ts`)

#### **CREATE - Create Email Log**
```typescript
// Automatic creation in EmailService.sendLowMarksAlert()
await EmailLogModel.create({
  mark_id: alertData.id,
  student_id: alertData.student_id,
  parent_email: alertData.parent_email,
  email_type: 'low_mark_alert',
  status: 'sent'
});
```
**Location**: `backend/src/services/EmailService.ts:74`

#### **READ - Get Email Statistics**
```typescript
// GET /api/email-alerts/statistics
router.get('/statistics', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/email-alerts.ts:15`

#### **READ - Get Email Logs by Status**
```typescript
// GET /api/email-alerts/status/:status
router.get('/status/:status', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/email-alerts.ts:35`

#### **READ - Get Email Logs by Student**
```typescript
// GET /api/email-alerts/student/:studentId
router.get('/student/:studentId', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/email-alerts.ts:55`

#### **DELETE - Cleanup Old Email Logs**
```typescript
// DELETE /api/email-alerts/cleanup/:days
router.delete('/cleanup/:days', async (req: Request, res: Response) => {
```
**Location**: `backend/src/routes/email-alerts.ts:75`

### **Backend Model** (`backend/src/models/EmailLog.ts`)

#### **CREATE Method**
```typescript
static async create(logData: Omit<EmailLog, 'id' | 'created_at'>): Promise<EmailLog>
```
**Location**: `backend/src/models/EmailLog.ts:45`

#### **READ Methods**
```typescript
static async findById(id: number): Promise<EmailLog | null>
static async findByMarkId(markId: number): Promise<EmailLog | null>
static async getStatistics(days?: number): Promise<EmailStatistics>
static async findByStatus(status: 'sent' | 'failed', limit?: number): Promise<EmailLog[]>
static async findByStudentId(studentId: number, limit?: number): Promise<EmailLog[]>
```
**Location**: `backend/src/models/EmailLog.ts:65, 85, 105, 125, 145`

#### **DELETE Methods**
```typescript
static async delete(id: number): Promise<boolean>
static async cleanupOld(days: number): Promise<number>
```
**Location**: `backend/src/models/EmailLog.ts:165, 185`

---

## 🌐 Frontend API Integration

### **API Service** (`frontend/src/services/api.ts`)

#### **Students API**
```typescript
// Location: frontend/src/services/api.ts:469-492
const studentApi = {
  // Create
  async create(studentData: Omit<Student, 'id' | 'created_at'>): Promise<Student>
  // Read
  async findAll(): Promise<Student[]>
  async findById(id: number): Promise<Student>
  // Update
  async update(id: number, studentData: Partial<Student>): Promise<Student>
  // Delete
  async delete(id: number): Promise<boolean>
}
```

#### **Grades API**
```typescript
// Location: frontend/src/services/api.ts:373-421
const gradeApi = {
  // Create
  async create(gradeData: Omit<Grade, 'id' | 'created_at' | 'students'>): Promise<Grade>
  // Read
  async findAll(): Promise<Grade[]>
  async findById(id: number): Promise<Grade>
  // Update
  async update(id: number, gradeData: Partial<Grade>): Promise<Grade>
  // Delete
  async delete(id: number): Promise<boolean>
  async clearAll(): Promise<boolean>
  // Special Operations
  async assignStudent(gradeId: number, studentId: number): Promise<boolean>
  async removeStudent(gradeId: number, studentId: number): Promise<boolean>
}
```

#### **Subjects API**
```typescript
// Location: frontend/src/services/api.ts:513-570
const subjectApi = {
  // Create
  async create(subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<Subject>
  // Read
  async findAll(): Promise<Subject[]>
  async findById(id: number): Promise<Subject>
  async findByType(type: string): Promise<Subject[]>
  // Update
  async update(id: number, subjectData: Partial<Subject>): Promise<Subject>
  // Delete
  async delete(id: number): Promise<boolean>
  // Special Operations
  async assignStudentsToSubject(subjectId: number, gradeId: number, studentIds: number[]): Promise<boolean>
  async removeStudentFromSubject(studentId: number, gradeId: number): Promise<boolean>
  async getSubjectEnrollment(subjectId: number, gradeId: number): Promise<StudentSubject[]>
}
```

#### **Marks API**
```typescript
// Location: frontend/src/services/api.ts:642-705
const marksApi = {
  // Create
  async create(markData: Omit<Mark, 'id' | 'percentage' | 'grade_obtained' | 'created_at' | 'updated_at'>): Promise<Mark>
  async createBulk(marksData: Omit<Mark, 'id' | 'percentage' | 'grade_obtained' | 'created_at' | 'updated_at'>[]): Promise<Mark[]>
  // Read
  async findByGradeSubjectTerm(gradeId: number, subjectId: number, term: string): Promise<MarkWithDetails[]>
  async findByStudentGradeTerm(studentId: number, gradeId: number, term: string): Promise<MarkWithDetails[]>
  async findByGradeTerm(gradeId: number, term: string): Promise<MarkWithDetails[]>
  async findById(id: number): Promise<Mark>
  // Update
  async update(id: number, markData: Partial<Mark>): Promise<Mark>
  // Delete
  async delete(id: number): Promise<boolean>
  // Special Operations
  async calculateStudentResult(studentId: number, gradeId: number, term: string): Promise<StudentResult>
  async getGradeStatistics(gradeId: number, term: string): Promise<GradeStatistics>
}
```

#### **Attendance API**
```typescript
// Location: frontend/src/services/api.ts:580-640
const attendanceApi = {
  // Create
  async markAttendance(request: AttendanceMarkRequest): Promise<{ summary: AttendanceSummary }>
  // Read
  async getAttendanceByGradeAndDate(gradeId: number, date: string): Promise<GradeAttendanceResponse>
  async getAttendanceDates(gradeId: number): Promise<string[]>
  async getStudentAttendanceReport(studentId: number, startDate?: string, endDate?: string): Promise<AttendanceReport>
  async getGradeAttendanceReport(gradeId: number, startDate?: string, endDate?: string): Promise<AttendanceReport[]>
  async getStatistics(): Promise<AttendanceStatistics>
  // Update
  async updateAttendance(studentId: number, date: string, status: 'present' | 'absent' | 'late'): Promise<AttendanceMark>
  // Delete
  async deleteAttendance(gradeId: number, date: string): Promise<DeleteAttendanceResponse>
}
```

### **Attendance API Service** (`frontend/src/services/attendanceApi.ts`)

```typescript
// Location: frontend/src/services/attendanceApi.ts:149-242
class AttendanceApi {
  // Create
  static async markAttendance(request: AttendanceMarkRequest): Promise<{ summary: AttendanceSummary }>
  // Read
  static async getAttendanceByGradeAndDate(gradeId: number, date: string): Promise<GradeAttendanceResponse>
  static async getAttendanceDates(gradeId: number): Promise<string[]>
  static async getStudentAttendanceReport(studentId: number, startDate?: string, endDate?: string): Promise<AttendanceReport>
  static async getGradeAttendanceReport(gradeId: number, startDate?: string, endDate?: string): Promise<AttendanceReport[]>
  static async getStatistics(): Promise<AttendanceStatistics>
  // Delete
  static async deleteAttendance(gradeId: number, date: string): Promise<DeleteAttendanceResponse>
}
```

---

## 🗄️ Database Query Layer

### **Database Queries** (`backend/src/models/DatabaseQueries.ts`)

#### **Student Queries**
```typescript
// Location: backend/src/models/DatabaseQueries.ts:223-235
export const STUDENT_QUERIES = {
  CREATE: `INSERT INTO students (...) VALUES (?, ?, ?, ...)`,
  FIND_BY_ID: 'SELECT * FROM students WHERE id = ?',
  FIND_ALL: 'SELECT * FROM students ORDER BY created_at DESC',
  UPDATE: (setClause: string) => `UPDATE students SET ${setClause} WHERE id = ?`,
  DELETE: 'DELETE FROM students WHERE id = ?'
}
```

#### **Grade Queries**
```typescript
// Location: backend/src/models/DatabaseQueries.ts:237-372
export const GRADE_QUERIES = {
  FIND_ALL: `SELECT g.*, (...) as students FROM grades g ...`,
  FIND_BY_ID: `SELECT g.*, (...) as students FROM grades g WHERE g.id = ?`,
  CREATE: 'INSERT INTO grades (grade, grade_part, teacher_id) VALUES (?, ?, ?)',
  UPDATE: (setClause: string) => `UPDATE grades SET ${setClause} WHERE id = ?`,
  DELETE: 'DELETE FROM grades WHERE id = ?',
  // Special assignment queries
  ASSIGN_STUDENT: `INSERT INTO student_assignment (...) SELECT ?, s.id, ...`,
  REMOVE_STUDENT: `DELETE FROM student_assignment WHERE grade_id = ? AND student_id = ?`
}
```

#### **Subject Queries**
```typescript
// Location: backend/src/models/DatabaseQueries.ts:374-405
export const SUBJECT_QUERIES = {
  FIND_ALL: 'SELECT id, name, code, grades, stream, type, category, is_optional FROM subjects ORDER BY type ASC, name ASC',
  FIND_BY_ID: 'SELECT id, name, code, grades, stream, type, category, is_optional FROM subjects WHERE id = ?',
  CREATE: `INSERT INTO subjects (name, code, grades, stream, type, category, is_optional) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  UPDATE: (setClause: string) => `UPDATE subjects SET ${setClause} WHERE id = ?`,
  DELETE: 'DELETE FROM subjects WHERE id = ?',
  FIND_BY_CODE: (excludeId: boolean) => `SELECT ... FROM subjects WHERE code = ? ${excludeId ? 'AND id != ?' : ''}`,
  FIND_DUPLICATE: (hasStream: boolean, excludeId: boolean) => `SELECT ... FROM subjects WHERE LOWER(name) = LOWER(?) ...`
}
```

#### **Marks Queries**
```typescript
// Location: backend/src/models/DatabaseQueries.ts:429-546
export const MARKS_QUERIES = {
  CREATE: `INSERT INTO marks (student_id, subject_id, grade_id, term, exam_type, marks_obtained, max_marks, remarks, exam_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  FIND_BY_ID: 'SELECT * FROM marks WHERE id = ?',
  FIND_DETAILS_BY_STUDENT_GRADE_TERM: `SELECT m.*, s.first_name, s.last_name, ... FROM marks m JOIN students s ON ...`,
  FIND_DETAILS_BY_GRADE_SUBJECT_TERM: `SELECT m.*, s.first_name, s.last_name, ... FROM marks m JOIN students s ON ...`,
  UPDATE: (setClause: string) => `UPDATE marks SET ${setClause} WHERE id = ?`,
  DELETE: 'DELETE FROM marks WHERE id = ?',
  // Special calculation queries
  CALCULATE_STUDENT_RESULT: `SELECT m.student_id, ..., SUM(m.marks_obtained) as total_marks_obtained FROM marks m ...`,
  GET_LOW_MARKS: `SELECT m.*, s.first_name, s.last_name, ... FROM marks m ... WHERE m.percentage < ?`
}
```

#### **Attendance Queries**
```typescript
// Location: backend/src/models/DatabaseQueries.ts:549-615
export const ATTENDANCE_MARK_QUERIES = {
  MARK: `INSERT INTO attendance_mark (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE ...`,
  FIND_BY_STUDENT_DATE: 'SELECT * FROM attendance_mark WHERE student_id = ? AND marked_date = ?',
  FIND_BY_GRADE_DATE: `SELECT am.*, s.first_name, s.last_name, s.parent_phone FROM attendance_mark am INNER JOIN students s ON ...`,
  UPDATE: `UPDATE attendance_mark SET status = ?, updated_date = ?, updated_time = ?, marked_by = ? WHERE student_id = ? AND marked_date = ?`,
  DELETE_BY_GRADE_DATE: 'DELETE FROM attendance_mark WHERE grade = ? AND section = ? AND marked_date = ?',
  // Summary and statistics queries
  GET_SUMMARY: `SELECT COUNT(*) as total_students, COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count FROM attendance_mark WHERE grade = ? AND section = ? AND marked_date = ?`
}
```

---

## 📊 CRUD Operations Summary

### **Total CRUD Endpoints**: 67+

#### **Students**: 5 endpoints
- CREATE: `/api/students/register`
- READ: `/api/students`, `/api/students/:id`
- UPDATE: `/api/students/:id`
- DELETE: `/api/students/:id`

#### **Grades**: 8 endpoints
- CREATE: `/api/grades/create`
- READ: `/api/grades`, `/api/grades/:id`
- UPDATE: `/api/grades/:id`
- DELETE: `/api/grades/:id`, `/api/grades/clear`
- Special: `/api/grades/:gradeId/assign-student/:studentId`, `/api/grades/:gradeId/remove-student/:studentId`

#### **Subjects**: 7 endpoints
- CREATE: `/api/subjects`
- READ: `/api/subjects`, `/api/subjects/:id`, `/api/subjects/type/:type`
- UPDATE: `/api/subjects/:id`
- DELETE: `/api/subjects/:id`
- Special: `/api/subjects/student-assignment`, `/api/subjects/student/:studentId/grade/:gradeId`

#### **Marks**: 8 endpoints
- CREATE: `/api/marks`, `/api/marks/bulk`
- READ: `/api/marks/grade/:gradeId/subject/:subjectId/term/:term`, `/api/marks/student/:studentId/grade/:gradeId/term/:term`, `/api/marks/grade/:gradeId/term/:term`, `/api/marks/:id`
- UPDATE: `/api/marks/:id`
- DELETE: `/api/marks/:id`
- Special: `/api/marks/result/student/:studentId/grade/:gradeId/term/:term`, `/api/marks/statistics/grade/:gradeId/term/:term`

#### **Attendance**: 8 endpoints
- CREATE: `/api/attendance/mark`, `/api/attendance-mark/single`
- READ: `/api/attendance/grade/:gradeId/date/:date`, `/api/attendance/grade/:gradeId/date/:date/summary`, `/api/attendance/grade/:gradeId/dates`, `/api/attendance/student/:studentId/report`, `/api/attendance/grade/:gradeId/report`, `/api/attendance`
- UPDATE: `/api/attendance-mark/:studentId/:date`
- DELETE: `/api/attendance-mark/grade/:grade/section/:section/date/:date`

#### **Users**: 6 endpoints
- CREATE: `/api/auth/register`
- READ: `/api/users/teachers`, `/api/users/pending`, `/api/users/:id`
- UPDATE: `/api/users/teachers/:id`, `/api/users/:id/status`
- DELETE: Not directly supported (status update used)

#### **Email Logs**: 5 endpoints
- CREATE: Automatic in EmailService
- READ: `/api/email-alerts/statistics`, `/api/email-alerts/status/:status`, `/api/email-alerts/student/:studentId`
- DELETE: `/api/email-alerts/cleanup/:days`

---

## 🎯 Key Features

### **RESTful Design**
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Consistent URL patterns
- Proper status codes (200, 201, 400, 404, 500)

### **Data Integrity**
- Foreign key constraints
- Unique constraints
- Transaction management for complex operations

### **Error Handling**
- Comprehensive error responses
- Validation at multiple levels
- Detailed logging

### **Frontend Integration**
- Type-safe API interfaces
- Consistent response handling
- Error propagation to UI

### **Security**
- Authentication middleware
- Authorization checks
- Input validation

---

**Last Updated**: April 1, 2026  
**Document Version**: 1.0.0  
**Next Review**: June 1, 2026
