# 🧪 Complete Testing Guide - MFA & Profile Features

## 🎯 What's New

### ✅ Features Added:
1. **Profile Page** (`/profile`) - View account info & manage MFA
2. **MFA Enable/Disable** - Toggle two-factor authentication
3. **QR Code Generation** - TOTP authenticator app setup
4. **Profile Navigation** - Link in the main header

---

## 📋 Step-by-Step Testing Instructions

### **Test 1: Register First User (Auto-Admin)**

**Steps:**
1. Clear database (optional for fresh start):
   ```bash
   $env:PGPASSWORD = 'belay1999'; psql -U postgres -h localhost -d dbb -f database/schema.sql
   ```

2. Start backend:
   ```bash
   cd backend
   npm run dev
   ```

3. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

4. Go to: `http://localhost:5174/register`

5. Fill the form:
   - **Username**: `admin`
   - **Full Name**: `Admin User`
   - **Email**: `admin@test.com`
   - **Password**: `Admin@12345678` (meets all requirements)
   - **Date of Birth**: Any date making you 18+
   - **Region**: Select any

6. Click "Create Account"

**✅ Expected Results:**
- Green toast: "🎉 Admin account created! You can login now."
- Backend console shows: `🎉 FIRST USER REGISTERED AS ADMIN: admin@test.com`
- **No OTP modal** (first user is auto-verified)
- Redirected to `/login`

**Database Checks:**
```sql
SELECT username, email, is_verified FROM users WHERE email = 'admin@test.com';
-- Should show: is_verified = true

SELECT * FROM user_roles WHERE user_id = (SELECT id FROM users WHERE email = 'admin@test.com');
-- Should show: role_id = 1 (Admin)

SELECT * FROM audit_logs WHERE event_type = 'registration' ORDER BY timestamp DESC LIMIT 1;
-- Should show the registration event
```

---

### **Test 2: Register Second User (Normal Flow with OTP)**

**Steps:**
1. Go to `/register` again

2. Fill form:
   - **Username**: `voter1`
   - **Full Name**: `John Voter`
   - **Email**: `voter@test.com`
   - **Password**: `Voter@12345678`
   - **Date of Birth**: 18+
   - **Region**: Any

3. Click "Create Account"

**✅ Expected Results:**
- Backend console shows: `📧 Verification OTP for voter@test.com: 123456` (6-digit code)
- Beautiful modal pops up: "Verify Your Email"
- Shows the email address
- Has 6-digit input field

4. Enter the OTP from console (e.g., `123456`)

5. Click "Verify & Continue"

**✅ Expected Results:**
- Green toast: "✅ Email verified! You can now login."
- Redirected to `/login`

**Database Checks:**
```sql
SELECT username, email, is_verified FROM users WHERE email = 'voter@test.com';
-- Should show: is_verified = true

SELECT * FROM otp_verifications WHERE user_id = (SELECT id FROM users WHERE email = 'voter@test.com');
-- Should be EMPTY (OTP deleted after verification)

SELECT * FROM audit_logs WHERE user_id = (SELECT id FROM users WHERE email = 'voter@test.com') ORDER BY timestamp DESC;
-- Should show: 'registration' and 'email_verification' events
```

---

### **Test 3: Login Without MFA**

**Steps:**
1. Go to `/login`

2. Enter:
   - **Username**: `admin`
   - **Password**: `Admin@12345678`

3. Click "Sign In Securely"

**✅ Expected Results:**
- Green toast: "✅ Welcome back!"
- Redirected to `/` (Admin Dashboard)
- Navigation shows: "Home" | "Profile" | User badge

**Database Checks:**
```sql
SELECT * FROM login_attempts WHERE user_id = (SELECT id FROM users WHERE username = 'admin') ORDER BY attempt_time DESC LIMIT 1;
-- Should show: success = true

SELECT * FROM refresh_tokens WHERE user_id = (SELECT id FROM users WHERE username = 'admin') ORDER BY created_at DESC LIMIT 1;
-- Should show: new refresh token with IP and user_agent

SELECT * FROM audit_logs WHERE event_type = 'login' ORDER BY timestamp DESC LIMIT 1;
-- Should show: successful login event
```

---

### **Test 4: Test Account Lockout**

**Steps:**
1. Logout (click logout button)

2. Go to `/login`

3. Enter:
   - **Username**: `voter1`
   - **Password**: `WrongPassword123!` (intentionally wrong)

4. Click "Sign In" **5 times**

**✅ Expected Results:**
- After 1st attempt: "Invalid credentials (4 attempts remaining)"
- After 2nd attempt: "Invalid credentials (3 attempts remaining)"
- After 3rd attempt: "Invalid credentials (2 attempts remaining)"
- After 4th attempt: "Invalid credentials (1 attempts remaining)"
- After 5th attempt: "Too many failed attempts. Account locked for 30 minutes."

5. Try correct password:

**✅ Expected Results:**
- Red toast: "Account locked. Try again in X minutes."

**Database Checks:**
```sql
SELECT failed_login_attempts, locked_until FROM users WHERE username = 'voter1';
-- Should show: failed_login_attempts = 5, locked_until = (30 min from now)

SELECT * FROM login_attempts WHERE user_id = (SELECT id FROM users WHERE username = 'voter1') ORDER BY attempt_time DESC LIMIT 5;
-- Should show: 5 failed attempts with failure_reason = 'Invalid password'
```

6. **Wait for lockout to expire** (or manually unlock in DB):
```sql
UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE username = 'voter1';
```

---

### **Test 5: Enable MFA on Profile**

**Steps:**
1. Login as `admin`

2. Click "Profile" in the navigation

**✅ Expected Results:**
- Beautiful profile page loads
- Shows:
  - **Username**: admin
  - **Full Name**: Admin User
  - **Email**: admin@test.com (with ✓ verified badge)
  - **Role**: Admin (in purple badge)
- **Security Card** shows:
  - "Two-Factor Auth: ⚠ Not Enabled"
  - Green "Enable MFA" button

3. Click "Enable MFA"

**✅ Expected Results:**
- Loading spinner briefly
- Beautiful modal pops up: "Setup Two-Factor Authentication"
- Shows:
  - QR code (you can scan with Google Authenticator/Authy)
  - Manual entry key (base32 string)
  - 3-step instructions

4. **Scan QR code** with your phone's authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)

5. Click "Complete Setup"

**✅ Expected Results:**
- Modal closes
- Green toast: "✅ MFA enabled successfully!"
- Security card now shows: "✓ Protected"
- Button changes to red "Disable MFA"

**Database Checks:**
```sql
SELECT mfa_enabled, mfa_secret FROM users WHERE username = 'admin';
-- Should show: mfa_enabled = true, mfa_secret = (base32 string)

SELECT * FROM audit_logs WHERE event_type = 'mfa_enabled' ORDER BY timestamp DESC LIMIT 1;
-- Should show: MFA enabled event
```

---

### **Test 6: Login With MFA**

**Steps:**
1. Logout

2. Go to `/login`

3. Enter:
   - **Username**: `admin`
   - **Password**: `Admin@12345678`

4. Click "Sign In Securely"

**✅ Expected Results:**
- Backend console shows: `🔐 MFA OTP for admin: 123456`
- Beautiful modal pops up: "Two-Factor Authentication"
- Shows: "Enter the 6-digit code from your authenticator app"
- Has 6-digit input field (auto-focused)

5. **Open your authenticator app** and get the 6-digit code

6. Enter the code from your app (not the console - that's a fallback)

7. Click "Verify & Sign In"

**✅ Expected Results:**
- Green toast: "✅ MFA verified! Welcome back."
- Redirected to Admin Dashboard
- Successfully logged in

**Database Checks:**
```sql
SELECT * FROM login_attempts WHERE user_id = (SELECT id FROM users WHERE username = 'admin') ORDER BY attempt_time DESC LIMIT 1;
-- Should show: success = true

SELECT * FROM audit_logs WHERE event_type = 'mfa_login' ORDER BY timestamp DESC LIMIT 1;
-- Should show: MFA login event

SELECT * FROM otp_verifications WHERE user_id = (SELECT id FROM users WHERE username = 'admin') AND purpose = 'mfa';
-- Should be EMPTY (OTP deleted after verification)
```

---

### **Test 7: Invalid MFA Code**

**Steps:**
1. Logout and login again with `admin`

2. When MFA modal appears, enter: `000000` (wrong code)

3. Click "Verify & Sign In"

**✅ Expected Results:**
- Red toast: "Invalid MFA code. Please try again."
- Modal stays open
- Can try again

4. Enter correct code from app

**✅ Expected Results:**
- Successfully logs in

---

### **Test 8: Disable MFA**

**Steps:**
1. While logged in as `admin`, go to `/profile`

2. Click red "Disable MFA" button

3. Confirm in the browser alert popup

**✅ Expected Results:**
- Toast: "MFA disabled"
- Security card shows: "⚠ Not Enabled" again
- Button changes back to green "Enable MFA"

**Database Checks:**
```sql
SELECT mfa_enabled FROM users WHERE username = 'admin';
-- Should show: mfa_enabled = false

SELECT * FROM audit_logs WHERE event_type = 'mfa_disabled' ORDER BY timestamp DESC LIMIT 1;
-- Should show: MFA disabled event
```

---

## 🎨 UI/UX Features to Notice

### **Profile Page:**
- ✅ Beautiful gradient background
- ✅ Card-based layout (account info + security)
- ✅ Icon-enhanced information display
- ✅ Color-coded status badges (green = protected, amber = not enabled)
- ✅ Smooth animations when modal opens/closes
- ✅ Security tips section

### **MFA Setup Modal:**
- ✅ Large QR code for easy scanning
- ✅ Manual entry key as backup
- ✅ Step-by-step instructions
- ✅ Numbered steps with icons
- ✅ Gradient button with icon

### **Login MFA Modal:**
- ✅ Centered 6-digit input (monospace font)
- ✅ Letter-spacing for better readability
- ✅ Auto-focus on input
- ✅ Only allows numbers
- ✅ Button disabled until 6 digits entered

---

## ✅ Complete Feature Checklist

### Registration:
- [x] Auto-admin for first user
- [x] OTP verification for subsequent users
- [x] Age validation (18+)
- [x] Password strength validation
- [x] CAPTCHA integration
- [x] Audit logging

### Login:
- [x] Username/password authentication
- [x] Account lockout (5 attempts, 30 min)
- [x] Failed attempt tracking
- [x] MFA challenge when enabled
- [x] JWT + refresh token generation
- [x] Session tracking (IP, user agent)
- [x] Audit logging

### MFA:
- [x] TOTP (Time-based OTP)
- [x] QR code generation
- [x] Enable/disable functionality
- [x] OTP verification with expiry
- [x] Attempt limiting (max 3)
- [x] Audit logging

### Profile:
- [x] Account information display
- [x] MFA status indicator
- [x] MFA toggle buttons
- [x] Beautiful UI with animations
- [x] Security tips

### Security:
- [x] bcrypt password hashing
- [x] JWT token auth (15 min)
- [x] Refresh tokens (7 days, revokable)
- [x] IP & user agent tracking
- [x] Comprehensive audit trail
- [x] OTP single-use tokens

---

## 🚀 Quick Test Script

If you want to test everything quickly:

```bash
# 1. Reset DB
cd backend
$env:PGPASSWORD = 'belay1999'; psql -U postgres -h localhost -d dbb -f database/schema.sql

# 2. Start backend (in one terminal)
npm run dev

# 3. Start frontend (in another terminal)
cd ../frontend
npm run dev

# 4. Test flow:
# - Register first user at /register → auto-admin, no OTP
# - Login → should work immediately
# - Go to /profile → enable MFA → scan QR
# - Logout → login again → MFA modal appears
# - Enter code from app → success!
# - Go to /profile → disable MFA → confirm
```

---

## 📊 Expected Database State After All Tests

```sql
-- Users table
SELECT username, email, is_verified, mfa_enabled, failed_login_attempts FROM users;
/*
 username |      email       | is_verified | mfa_enabled | failed_login_attempts 
----------+------------------+-------------+-------------+-----------------------
 admin    | admin@test.com   | t           | f (or t)    | 0
 voter1   | voter@test.com   | t           | f           | 0
*/

-- Audit logs (should have many entries)
SELECT event_type, COUNT(*) FROM audit_logs GROUP BY event_type;
/*
   event_type        | count 
---------------------+-------
 registration        | 2
 email_verification  | 1
 login               | X
 mfa_login           | Y
 mfa_enabled         | Z
 mfa_disabled        | W
*/

-- Login attempts
SELECT success, COUNT(*) FROM login_attempts GROUP BY success;
/*
 success | count 
---------+-------
 t       | X
 f       | 5
*/

-- Refresh tokens (should have entries for each successful login)
SELECT COUNT(*) FROM refresh_tokens WHERE revoked_at IS NULL;
-- Should be > 0

-- OTP verifications (should be empty - all used or expired)
SELECT COUNT(*) FROM otp_verifications;
-- Should be 0
```

---

## 🎉 Success Criteria

You know everything works if:
- ✅ First user becomes Admin automatically
- ✅ Second user must verify OTP
- ✅ Account locks after 5 failed attempts
- ✅ MFA can be enabled from profile
- ✅ QR code appears and can be scanned
- ✅ Login requires MFA code when enabled
- ✅ All actions are logged in audit_logs
- ✅ UI is beautiful with smooth animations
- ✅ Navigation has Profile link
- ✅ Profile page shows all user info

**All systems operational! 🚀**
