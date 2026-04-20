# Sports & Extra Curricular Activities Management – Functional Description

## 1. Overview

The Sports & Extra Curricular Activities Management component is a comprehensive digital platform developed to streamline the end-to-end administration of sports, clubs, and societies within a school environment. The module replaces traditional paper-based workflows with an integrated system that automates student registration, attendance tracking, equipment management, and performance analytics. It employs a role-based access control model that defines distinct operational privileges for five stakeholder roles—**Admin**, **Coach**, **Teacher**, **Student**, and **Principal**—ensuring that each user interacts only with the functionalities relevant to their responsibilities.

The component is architecturally divided into five core functional modules:

1. Digital Membership & Activity Management
2. Attendance Validation & Strategic Reporting
3. Real-Time Verification & Alert System
4. Resource & Inventory Management
5. Achievement Tracking & Merit Point Analytics

---

## 2. Digital Membership & Activity Management

This module facilitates the creation and management of extracurricular activities and the registration of students into those activities.

### 2.1 Activity Management

The system supports three categories of extracurricular activities: **Sports** (e.g., Cricket, Basketball), **Clubs** (e.g., Robotics Club, Art Club), and **Societies** (e.g., Literary Society, Science Society). Authorized users (Admin or Coach) can create new activities by specifying the activity name, type, in-charge staff member, and an optional description. The Activities Page displays all registered activities in a structured list with filtering capabilities based on category. Each activity can be viewed in detail, edited, or deleted. When an activity is deleted, the system performs a cascading cleanup, automatically removing all associated memberships, practice sessions, attendance records, reports, and notifications to maintain referential integrity across the database.

### 2.2 Student Registration & Role Assignment

Student registration into activities is handled through a role-differentiated process:

- **Coach-Driven Registration (Sports):** The Coach is responsible for registering students into sports activities. The system integrates with the school's central student registration database, enabling the Coach to search for students by name in real time using an autocomplete search interface. Upon selecting a student, the system automatically fetches and populates the student's details—including the student ID, full name, grade, and class teacher's name—eliminating the need for manual data entry and reducing the likelihood of errors.

- **Self-Registration (Clubs & Societies):** For non-sport activities such as clubs and societies, the system displays all available activities to students, who may register themselves. This approach reduces the administrative burden on staff while encouraging student participation.

During registration, the Coach assigns a designated role to each student within the activity. The system supports the following membership roles: **Member**, **Captain**, **Vice-Captain**, **President**, **Secretary**, and **Treasurer**. Role uniqueness is enforced at the activity level—for instance, only one student may hold the Captain role within a given sport at any time. The system validates this constraint before confirming the assignment, thereby preventing duplicate leadership assignments.

The system also records the date of enrollment and tracks membership status. When a student is removed from an activity, the membership is soft-deleted by recording a quit date, preserving the historical record for future reference and reporting purposes.

---

## 3. Attendance Validation & Strategic Reporting

This module enables Coaches to schedule practice sessions, mark student attendance, and generate formal attendance reports that follow a structured approval pipeline.

### 3.1 Practice Session Management

Coaches can create practice sessions for each activity by specifying the session date, start time, end time, and an optional facility location. All scheduled sessions are displayed in reverse chronological order, allowing Coaches to manage upcoming and past sessions efficiently. Sessions can be deleted when no longer required, which automatically cascades the deletion to any associated attendance records.

### 3.2 Attendance Marking

Upon selecting a practice session, the system displays a list of all students currently registered as active members of the corresponding activity. Adjacent to each student's name, the Coach is presented with a color-coded status selection interface offering four attendance states:

| Status | Description |
|---|---|
| **Present** | The student attended the practice session. |
| **Absent** | The student did not attend the practice session. |
| **Late** | The student attended but arrived after the scheduled start time. |
| **Excused** | The student was present at school during the day but could not attend the session due to an injury, illness, or other valid reason. |

The Coach can mark attendance individually for each student or use the **bulk mark** functionality to assign a default status (e.g., "Present") to all students simultaneously—a feature designed for efficiency when the majority of students are present. The system supports upsert behaviour: if an attendance record already exists for a given student in a session, subsequent marking operations update the existing record rather than creating duplicates. A real-time progress indicator visualizes how many students have been marked out of the total, and a confirmation modal is presented before saving to ensure data integrity.

### 3.3 Attendance Report Generation & Approval Workflow

The attendance reporting system implements a multi-tier approval pipeline involving three stakeholder roles: **Coach → Principal → Teacher**.

**Step 1 – Report Generation (Coach):**
After marking attendance for a given day, the Coach can generate a daily attendance report for a specific activity. The system automatically computes the report statistics by aggregating the attendance data from all sessions conducted on the selected date. The generated report includes a breakdown of total students, present count, absent count, late count, and excused count, along with detailed per-student information that displays each student's name, grade, class teacher name, and attendance status.

**Step 2 – Report Submission & Principal Review:**
The generated report is submitted to the Principal's Dashboard, where it appears in a queue of pending reports. The Principal can review the full report details, including the per-student breakdown with grade and class teacher information, and then take one of two actions:
- **Approve:** The report is marked as approved, and the reviewed timestamp and reviewer identity are recorded.
- **Reject:** A confirmation modal is presented before rejection to prevent accidental administrative errors. The report is marked as rejected with the corresponding review metadata.

**Step 3 – Teacher Notification:**
Upon approval, the system enables the Principal to send targeted notifications to the relevant class teachers. The notification targeting is automated—the system identifies the affected teachers based on the grades and class teacher assignments of the students listed in the report. Each teacher receives a notification containing the report date, activity name, attendance summary (present/absent/total counts), and an instructional message. Teachers can view their notifications on a dedicated Teacher Notifications Page, where each notification can be marked as "Read" or "Actioned" to track follow-up status.

---

## 4. Real-Time Verification & Alert System

This module implements a cross-referencing mechanism between classroom attendance and practice session attendance to identify discrepancies and trigger real-time alerts.

### 4.1 Attendance Cross-Check Logic

The system performs a **Cross-Check** between the school's classroom attendance records and the sports session attendance records. This logic addresses two critical scenarios:

- **Scenario A – Absent at school, listed in practice session:** If a student was marked absent from their morning classroom attendance but appears in the practice session's student list, the system flags this student's entry with a visible warning message in the attendance list. This informs the Coach that the student was not present at school and may not be eligible to participate.

- **Scenario B – Absent from classroom but present at practice (Red Alert):** If a student was marked absent in the classroom but is subsequently marked as present in the practice session, the system generates an immediate **"Red Alert"** notification, which is dispatched to the relevant class teacher's dashboard. This alert serves as a critical safety and accountability measure, prompting the teacher to investigate the discrepancy—for instance, the student may have arrived at school late or may have an unauthorized absence from class.

### 4.2 Missing Student Alerts

When attendance is finalized for a session, the system automatically identifies registered members who were not marked in any attendance category. For each such missing student, a high-severity alert is generated, recording the student ID, the associated session, and the responsible Coach. These alerts are categorized by type (Missing Student, Equipment Issue, Facility Conflict, General) and severity level (Low, Medium, High, Critical), enabling administrators to prioritize and resolve issues efficiently.

Alert statistics are aggregated and displayed on the Admin dashboard, including breakdowns by status (Pending, Acknowledged, Resolved), type, and severity. Each alert can be individually acknowledged or resolved by authorized personnel.

---

## 5. Resource & Inventory Management

This module provides tools for tracking sports equipment inventory and managing facility bookings.

### 5.1 Equipment Inventory Tracking

The system maintains a centralized inventory of all sports equipment, with each item characterized by its name, category, total quantity, available quantity, and current condition. Equipment condition is tracked using a five-tier grading system: **New**, **Good**, **Fair**, **Poor**, and **Broken**. When the total quantity of an item is updated, the system automatically adjusts the available quantity by the same delta to maintain consistency.

### 5.2 Equipment Reservation & Booking System

Students are required to book sports equipment and facilities (grounds, courts, halls, pools) prior to their scheduled playtime. The reservation process captures the following information for each booking:

- **Student Details:** Student name, class grade, and class teacher name (auto-populated from the registration database).
- **Booking Details:** Equipment item, quantity, reservation start time, and reservation end time.

The system enforces availability constraints: when a reservation is created, the requested quantity is decremented from the available stock. The **"Book" button is locked** for time slots that are already reserved (e.g., if the volleyball court is booked from 2:00 PM – 4:00 PM, that slot becomes unavailable to other users). Each booking is assigned a status of **Reserved**, and the system supports two subsequent status transitions:

- **Returned:** When the booking period concludes (either automatically when the reservation end time passes or when manually closed by the Coach/Admin), the system prompts for a **Return Condition** input. The Coach or Admin must assess and select the condition of the returned equipment from the options: New, Good, Fair, Poor, or Broken. This return condition is recorded in the reservation log, and if the returned condition differs from the original, the system updates the equipment's overall condition rating in the inventory accordingly. The reserved quantity is then restored to the available stock.

- **Cancelled:** If a booking is cancelled before the scheduled time, the reserved quantity is immediately restored to the available inventory without requiring a condition assessment.

### 5.3 Borrowing Logs

In addition to the student reservation system, the module maintains a separate borrowing log that records staff and student equipment loans. Each log entry captures the borrower identity, borrow timestamp, return timestamp, and return status (Returned, Lost, or Damaged). Items marked as Lost or Damaged are not restored to the available quantity, reflecting the actual inventory state.

---

## 6. Achievement Tracking & Merit Point Analytics

This module implements a comprehensive performance tracking system that records match results, calculates merit points using a weighted formula, generates student leaderboards, and produces downloadable "Sports CV" documents.

### 6.1 Match Result Recording

The Coach has exclusive access to record match and competition results through a dedicated **"Add Match Result"** form. The form captures the following fields:

| Field | Description |
|---|---|
| **Activity** | The sport or activity associated with the match. |
| **Date** | The date on which the match was conducted. |
| **Opponent** | The name of the opposing team or school. |
| **Result** | The match outcome: Won, Lost, Draw, or Participation. |
| **Level** | The competition tier: School, Zonal, District, Provincial, or National. |
| **Score (Team / Opponent)** | Optional numeric scores for both teams. |
| **Location** | The venue where the match was held. |
| **Participants** | A checklist of registered members who participated in the match. |

Upon saving a match result, the system automatically awards merit points to every selected participant based on a predefined **Points Matrix** that accounts for both the competition level and the match outcome.

### 6.2 Merit Point Calculation Formula

The total merit points for each student are calculated as a cumulative score derived from three components:

**Total Score = Attendance Points + Match Points + Role Bonus Points**

#### Component 1: Attendance Points

Attendance points are calculated based on the student's practice session attendance percentage, weighted by a factor of 0.2.

```
Attendance % = (Sessions Attended as "Present" / Total Sessions) × 100
Attendance Points = Attendance % × 0.2
```

**Example:** If a student attended 18 out of 20 Cricket sessions in Term 1:
- Attendance % = (18 / 20) × 100 = **90%**
- Attendance Points = 90 × 0.2 = **18 Points**
- Maximum possible Attendance Points = 100% × 0.2 = **20 Points**

#### Component 2: Match Points (Level × Result Matrix)

Match points are awarded automatically to all participants of a recorded match. The points are determined by the following matrix:

| Competition Level | Won | Lost | Draw | Participation |
|---|---|---|---|---|
| **National** | 75 | 10 | 10 | 15 |
| **Provincial** | 50 | 8 | 8 | 12 |
| **District** | 30 | 6 | 6 | 10 |
| **Zonal** | 20 | 5 | 5 | 10 |
| **School** | 10 | 3 | 3 | 5 |

**Example:** If a student participates in 3 Provincial-level matches and wins all three:
- Match Points = 3 × 50 = **150 Points**

If a student participates in a Zonal-level event without a competitive result:
- Participation Points = **10 Points**

#### Component 3: Role Bonus Points (Captaincy & Leadership)

When the Coach assigns a leadership role (Captain, Vice-Captain, Secretary, etc.) to a student during the registration phase, the system awards additional bonus points to recognize the responsibility. These are classified as "Special Recognition" achievements.

**Example:** If a student is assigned as Captain: **+20 Bonus Points**

#### Cumulative Score Example

For a student who is the Cricket Captain with strong attendance and match performance:
- Attendance Points: 18 (90% attendance)
- Match Points: 150 (3 Provincial wins × 50)
- Captaincy Bonus: 20
- **Total Score = 18 + 150 + 20 = 188 Points**

### 6.3 Student Leaderboard

The system generates a live leaderboard that ranks students by their cumulative merit points. The leaderboard can be filtered by activity, displaying each student's name, activity, total points, and assigned role. This leaderboard serves as the basis for determining eligibility for school colours, awards, and other honours at the end of the academic year.

### 6.4 Time-Series Analytics

The dashboard includes interactive analytics graphs that visualize merit point accumulation trends over time. The data can be filtered by activity and viewed across three temporal granularities: **Weekly**, **Monthly**, and **Yearly**. These time-series charts enable administrators and coaches to identify performance trends, seasonal patterns, and the impact of specific competitions on overall student engagement.

### 6.5 Sports CV Generation

The system compiles a comprehensive **Sports CV** for each student, aggregating all achievement data into a structured profile. The Sports CV includes:

- **Current Activity Memberships:** A list of all active sports, clubs, and societies the student is enrolled in, along with their assigned role.
- **Achievement Breakdown:** A categorized summary of all earned merit points, grouped by type—Attendance Points, Match Awards, Participation Points, and Special Recognition.
- **Point Totals:** A cumulative summary displaying attendance-based points, match-based points, role-based bonus points, and the grand total.

The Sports CV can be exported as a **PDF document** using the jsPDF library. Students have access to download their own Sports CV, while Coaches can generate and download CVs for any student within their assigned activities. This document serves as an official performance record that can be used for school colours eligibility assessment, award nominations, university applications, and scholarship evaluations.

---

## 7. Dashboard & Role-Based Views

The system provides a centralized dashboard that adapts its content based on the authenticated user's role:

- **Admin/Principal Portal:** Displays aggregate statistics including total activities (Sports, Clubs, Societies), inventory status with interactive donut charts showing available vs. reserved equipment ratios, pending alert counts, and a recent updates feed. The Principal additionally accesses the report approval queue.
- **Coach Portal:** Provides quick access to activity management, attendance marking, report generation, match recording, and inventory oversight.
- **Teacher Portal:** Displays incoming notifications from the attendance report workflow, requiring acknowledgement and follow-up action.
- **Student Portal:** Shows enrolled activities, personal achievements, and access to download the Sports CV.

The dashboard features dynamic analytics rendered with animated SVG-based visualizations and interactive hover tooltips, providing an intuitive and data-rich overview of the module's operational state.

---

## 8. Security & Session Management

The component implements a robust authentication and authorization framework:

- **Role-Based Route Protection:** All application routes are wrapped with a `ProtectedRoute` component that enforces authentication. Certain routes additionally restrict access to specific roles (e.g., Attendance and Inventory pages are accessible only to Admin and Coach roles; the Principal Dashboard is restricted to Admin; Teacher Notifications are restricted to Admin and Teacher).

- **Unauthorized Access Handling:** If an authenticated user attempts to access a route outside their permitted role, the system renders a dedicated "Restricted Access" page rather than simply redirecting, providing a clear and professional user experience.

- **Session Failsafe:** The frontend implements an automatic session invalidation mechanism. If the backend server becomes unreachable (detected via network error interception on API responses), the system automatically clears the user's session data and redirects to the login page. This prevents users from operating on a stale or disconnected session.

- **Target Memory Redirection:** When an unauthenticated user attempts to access a protected route, the system records the intended destination. After successful login, the user is automatically redirected to their originally intended page, ensuring a seamless navigation experience.
