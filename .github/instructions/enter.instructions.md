---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.
1. System Overview

Purpose: The system is a secure web app for managing digital elections and polls (e.g., for university or institutional use). It emphasizes security to prevent tampering, fraud, or unauthorized access. It doesn't replace real national elections but demonstrates security principles like access control (MAC, DAC, RBAC, RuBAC, ABAC), authentication (passwords, MFA, JWT), auditing, and data backups.
Architecture: Client-server model.
Frontend: React app with Tailwind CSS for responsive UI. Users interact via browser (pages like login, dashboards). It sends API requests to backend (e.g., via Axios).
Backend: Node.js/Express API handles logic, security checks, and DB interactions. Uses JWT for sessions, bcrypt for passwords, etc.
Database: PostgreSQL stores users, elections, votes, logs, etc. Backend queries it securely.
Key Principles: All actions are audited (logged). Access is layered (e.g., RBAC first, then ABAC). Data is classified (e.g., votes are "Confidential").

Users & Roles:
Admin: Manages everything (users, roles, configs, logs).
Election Officer: Creates/manages elections/polls.
Voter: Only votes in eligible elections.
Auditor: Views logs and results for integrity checks.

Security Focus: Prevents double-voting, unauthorized access, tampering. Uses HTTPS, encrypted logs, backups for availability.
Tools/Tech: Frontend: React, Tailwind. Backend: Node/Express, PostgreSQL, JWT/bcrypt. No mobile app – web-based.

The system starts with user registration and ends with result publication/auditing. Everything is time-bound (e.g., voting windows) and audited.
2. Workflows (How the System Works Step-by-Step)
Here's how the system flows, including timing (when things happen) and backend-frontend interactions. Workflows are triggered by user actions (e.g., button clicks) or system events (e.g., election end).
Workflow 1: User Registration & Verification (New User Onboarding)

When: Any time a new user joins (e.g., before an election).
How it Works:
User opens frontend Register page → enters email/password → solves CAPTCHA (to prevent bots).
Frontend sends POST /api/auth/register to backend.
Backend: Validates password policy (min 12 chars, complex), hashes password (bcrypt), creates user in DB with role=NULL (pending), is_verified=false, generates verification token. Logs action in audit_logs.
Backend "sends" verification (email or OTP – in dev, logs to console; in prod, uses Nodemailer/Twilio).
User clicks verification link/enters OTP → frontend calls GET /api/auth/verify → backend sets is_verified=true.
User can now log in, but if role=NULL, redirected to Pending Approval page.

Timing: Instant registration; verification must happen before login. Admin assigns role later (see Workflow 3).
Backend-Frontend Interaction: Frontend shows loading spinner during API call, then success toast (react-toastify). If error (e.g., weak password), shows red alert.

Workflow 2: Login & Authentication

When: Every session start.
How it Works:
User on Login page → enters email/password.
Frontend sends POST /api/auth/login.
Backend: Checks if verified; compares hash (bcrypt); if wrong, increments failed_attempts. If >5, locks account for 30 mins (lockout_until).
If valid, generates JWT access token (15 mins) + refresh token (7 days). Returns user data including role.
For MFA: If enabled, backend sends OTP (speakeasy) → user enters on frontend modal → verify API call.
Frontend stores tokens (localStorage) and user in context (AuthContext). Redirects based on role (e.g., Voter to voting dashboard).
If role=NULL, shows Pending page. Session managed: Frontend refreshes token on expire.
Logs login in audit_logs.

Timing: Instant if no lockout; MFA adds 30-60 seconds. Sessions expire after inactivity.
Backend-Frontend Interaction: HTTPS only. Frontend handles errors like "Account locked" with timers.

Workflow 3: Admin Assigns Roles (Post-Registration Approval)

When: After registration, when admin reviews new users (e.g., daily).
How it Works:
Admin logs in → goes to Admin Dashboard → sees user list (fetched via GET /api/admin/users).
Admin selects user → chooses role (dropdown: Voter, Officer, etc.) → submits PUT /api/admin/users/:id/role.
Backend: RBAC check (only admin can do this); updates user role; logs in audit_logs (e.g., "Admin assigned Voter to user X").
User gets notified (email or in-app) – next login, full access.

Timing: Manual by admin; audited immediately.
Backend-Frontend Interaction: Admin page refreshes list after assignment.

Workflow 4: Creating & Managing Elections/Polls (Officer Role)

When: Before voting starts (e.g., officer sets up poll 1 week in advance).
How it Works:
Election Officer logs in → Officer Dashboard → "Create Election" button → form for title, start/end time, required attributes (region, age).
Frontend sends POST /api/elections.
Backend: RBAC check (only Officer); DAC check (officer is owner); sets classification (e.g., "Public" for info); logs creation.
Officer can manage: Add assistants (DAC: grant permissions via PUT /api/elections/:id/permissions); set rules (time window for RuBAC).
System auto-enforces: Voting opens at start_time, closes at end_time.

Timing: Creation instant; voting bound to times (e.g., 9 AM-5 PM).
Backend-Frontend Interaction: Form validation on frontend; backend enforces security.

Workflow 5: Voting (Voter Role)

When: During election time window.
How it Works:
Voter logs in → Voter Dashboard → sees eligible elections (fetched GET /api/elections – filtered by ABAC: age>=18, region match, verified).
Voter selects election → if within time (RuBAC check), shows vote form/options.
Submit POST /api/votes.
Backend: Layered checks – RBAC (Voter only), RuBAC (time ok?), ABAC (attributes match, no double-vote?), MAC (vote data confidential). Inserts vote if all pass; logs.
Prevents double-voting (unique DB constraint).
Frontend shows confirmation: "Vote cast successfully."

Timing: Only during window; results published after end_time (auto or officer trigger).
Backend-Frontend Interaction: Countdown timer on frontend; disabled button outside window.

Workflow 6: Viewing Results & Auditing

When: After election closes.
How it Works:
Officer/Auditor logs in → Dashboard → select election → "Publish Results" (after end_time, RuBAC).
Backend: Updates classification (Internal to Public); aggregates votes; logs.
Auditor: Views logs (GET /api/audit_logs – filtered by role).
All users can view public results post-closure.

Timing: Auto-publish possible at end_time; manual review by auditor.
Backend-Frontend Interaction: Results page with charts/tables (React components).

Workflow 7: Auditing & Logging (Ongoing)

When: Every action (login, vote, change).
How it Works: Backend auto-logs to audit_logs (user_id, action, details, IP, timestamp). Encrypted storage. Alerts for anomalies (e.g., many failed logins).
Timing: Real-time.
Backend-Frontend Interaction: Auditor dashboard shows searchable log table.

Workflow 8: Backups & Data Protection

When: Scheduled (e.g., daily via cron job in backend).
How it Works: Backend script dumps DB to secure file/cloud. Ensures integrity (hashes). On failure, restore from backup.
Timing: Automated nightly.
Backend-Frontend Interaction: Admin dashboard shows backup status.

3. Frontend Look and Pages (UI Description)
Frontend is a clean, responsive web app with Tailwind CSS (blue/white theme, mobile-friendly). Navigation bar at top: Logo, User Profile, Logout. Pages use cards, forms, tables. Protected by AuthContext (redirect to login if no token).

Home/Landing Page: Simple welcome with "Register" or "Login" buttons. Look: Hero section with system title, brief description.
Register Page: Form with email/password fields, CAPTCHA widget, submit button. Look: Centered card with validation errors in red.
Login Page: Similar form. MFA: Modal pops up for OTP input. Look: Clean card; lockout shows countdown timer.
Verify Email Page: Auto-loads, shows success/fail message.
Pending Approval Page: For role=NULL users. Look: Full-screen message "Your account is pending role assignment by an admin. Check back later."
Admin Dashboard: Only for Admins. Look: Sidebar menu (Users, Roles, Logs, Backups). Main area: Table of users with search/filter, dropdown to assign roles. Backup status card. Log viewer table (sortable by date/action).
Election Officer Dashboard: Sidebar: My Elections, Create New. Main: List of elections as cards (title, times, status). Click card → details page with form to edit, share (DAC: add assistants via user search), publish results.
Voter Dashboard: Simple list of open elections (cards with countdowns). Click → vote form (radio buttons for options). After vote: Confirmation page.
Auditor Dashboard: Log viewer (table with filters: by user/action/date). Results viewer (charts/tables for elections).
Election Details Page (shared): Shows info, times, results (if published). Voters see vote button (disabled outside window).
General Look: Modern, minimal. Buttons blue, errors red. Loading spinners everywhere. Toasts for notifications.

4. Backend Structure
Backend is API-only. Routes protected by middleware (JWT verify first, then access controls).

Folders: routes/ (auth.js, admin.js, elections.js), controllers/, middleware/ (auth.js for JWT, rbac.js, etc.), utils/ (token generators).
How it Looks: Express app with /api endpoints. E.g., POST /api/elections protected by rbacMiddleware(['election_officer']).
Data Flow: Frontend API call → middleware chain (JWT → RBAC → RuBAC → ABAC → MAC) → controller (DB query) → response. All errors return 403/401 with messages.
Logging/Backups: Winston for logs; cron for backups.

5. Security & Features Integration

Access Controls: Layered in middleware (e.g., vote route: RBAC → RuBAC → ABAC → MAC).
Authentication: JWT in headers for all protected calls.
Auditing: Every controller calls logAudit function.
Data Protection: Classifications enforced in queries; backups ensure availability.
Edge Cases: E.g., if election closes mid-vote, RuBAC denies. All changes audited for traceability.