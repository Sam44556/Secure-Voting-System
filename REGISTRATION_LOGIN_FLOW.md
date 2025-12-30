# Complete Registration & Login Flow Documentation

## 🎯 What Happens During Registration

### Step by Step Process:

| Step | Backend Action | Frontend Display | Security Feature | How to Test |
|------|---------------|------------------|------------------|-------------|
| 1 | User fills form (username, full_name, email, password, date_of_birth, region) | Beautiful gradient card with validation | **User Identity Collection** ✅ | Fill all fields, see live validation |
| 2 | Frontend validates & sends CAPTCHA token | Loading spinner | **CAPTCHA Anti-Bot** ✅ | Submit form successfully |
| 3 | Backend validates password (12+ chars, upper/lower/number/symbol) | Red toast if invalid | **Strong Password Policy** ✅ | Try "weak123" → see error |
| 4 | Backend validates age >= 18 from date_of_birth | Error toast if under 18 | **ABAC Age Check** ✅ | Try DOB < 18 years → blocked |
| 5 | Password hashed with bcrypt → inserted to DB | - | **Secure Password Storage** ✅ | Check DB: `password_hash` is encrypted |
| 6 | First user auto-assigned Admin role & verified | Green toast: "Admin created!" | **Bootstrap Security** ✅ | First registration gets Admin |
| 7 | For others: 6-digit OTP generated & stored in `otp_verifications` | OTP modal appears | **Email Verification (OTP)** ✅ | Console shows OTP code |
| 8 | Registration logged in `audit_logs` table | - | **Comprehensive Audit Trail** ✅ | Check `audit_logs`: `event_type='registration'` |

**Result**: User created, unverified (unless first), cannot login until OTP verified ✅

---

## 📧 OTP Verification Flow

| Step | Action | Display | Security Feature | Testing |
|------|--------|---------|------------------|---------|
| 1 | User enters 6-digit OTP from console | OTP input modal | **Secure Verification** ✅ | Enter correct OTP |
| 2 | Backend checks `otp_verifications` table (10 min expiry, max 3 attempts) | - | **Expiry & Rate Limit** ✅ | Try wrong OTP 3 times → blocked |
| 3 | If valid → delete OTP & set `is_verified = true` | Green toast: "Verified!" | **Single-Use Tokens** ✅ | OTP deleted from DB |
| 4 | Logged in `audit_logs` | Redirect to login | **Audit Logging** ✅ | Check `audit_logs`: `event_type='email_verification'` |

---

## 🔐 Login Flow (Without MFA)

| Step | Backend Action | Frontend Display | Security Feature | How to Test |
|------|---------------|------------------|------------------|-------------|
| 1 | User enters username + password | Beautiful login card | **Credential-Based Auth** ✅ | Valid credentials |
| 2 | Backend finds user with JOIN to `roles` table | - | **RBAC Preparation** ✅ | Check SQL: `array_agg(r.name) as roles` |
| 3 | Check if account locked (`locked_until > NOW()`) | Error: "Locked for X minutes" | **Account Lockout** ✅ | Do 5 wrong logins → locked 30 min |
| 4 | Compare password with bcrypt | If wrong → `failed_login_attempts++` | **Secure Comparison** ✅ | Wrong password logged |
| 5 | Log failed attempt in `login_attempts` table | Toast: "X attempts remaining" | **Attack Detection** ✅ | Check `login_attempts`: `success=false` |
| 6 | If 5+ failures → set `locked_until = NOW() + 30 min` | Account locked toast | **Brute Force Protection** ✅ | After 5 fails, locked |
| 7 | If correct → reset `failed_login_attempts = 0` | - | **Lockout Reset** ✅ | Successful login resets counter |
| 8 | Check if `is_verified = true` | Error if not verified | **Email Gate** ✅ | Unverified user blocked |
| 9 | Generate JWT access token (15 min expiry) | - | **JWT Auth** ✅ | Token in response |
| 10 | Generate refresh token (7 days) → store in `refresh_tokens` with IP/user_agent | - | **Session Management** ✅ | Check `refresh_tokens` table |
| 11 | Log success in `login_attempts` & `audit_logs` | Redirect to dashboard | **Audit Trail** ✅ | Both tables have `success=true` |

**Result**: User logged in with tokens, redirected to dashboard based on role ✅

---

## 🛡️ Login Flow (With MFA Enabled)

| Step | Backend Action | Frontend Display | Security Feature | Testing |
|------|---------------|------------------|------------------|---------|
| 1-8 | Same as non-MFA login (up to password check) | - | - | - |
| 9 | Check if `mfa_enabled = true` | - | **MFA Detection** ✅ | User has MFA on |
| 10 | Generate 6-digit OTP → insert into `otp_verifications` (purpose='mfa', 5 min expiry) | MFA modal pops up | **MFA Challenge** ✅ | Console shows OTP |
| 11 | Return `requiresMFA: true` to frontend | "Enter 6-digit code" | **Step-Up Auth** ✅ | Modal appears |
| 12 | User enters OTP → backend verifies in `otp_verifications` | - | **TOTP Verification** ✅ | Check DB for OTP |
| 13 | If valid → delete OTP → generate tokens (same as step 9-11 above) | Green toast: "MFA verified!" | **Complete MFA Flow** ✅ | Logged in after MFA |
| 14 | Log MFA login in `audit_logs` (`event_type='mfa_login'`) | Redirect to dashboard | **MFA Audit** ✅ | Check `audit_logs` |

**Result**: User securely logged in with 2FA protection ✅

---

## 📊 Project Requirements Fulfilled

### Authentication & Identification (7.0)
- ✅ **7.1** - User Registration with Email Verification (OTP)
- ✅ **7.2** - Strong Password Policies (12+ chars, complexity)
- ✅ **7.3** - Account Lockout (5 attempts, 30 min)
- ✅ **7.4** - JWT Token-Based Authentication
- ✅ **7.5** - Multi-Factor Authentication (MFA with OTP)

### Security Features (6.0)
- ✅ **6.3** - Secure User Registration & CAPTCHA
- ✅ **6.4** - Comprehensive Audit Logging

### Access Control (Preparation)
- ✅ **RBAC** - Roles table integration, multi-role support
- ✅ **ABAC** - Age validation (18+), region tracking
- ✅ **MAC** - Security classification ready

### Data Protection
- ✅ **Encryption** - bcrypt password hashing (10 rounds)
- ✅ **Session Security** - IP/User-Agent tracking
- ✅ **Token Security** - JWT (15 min) + Refresh (7 days, revokable)

---

## 🧪 Testing Checklist

### Registration Tests:
- [ ] Register first user → sees "Admin created" → can login immediately
- [ ] Register second user → gets OTP modal → verify OTP → login
- [ ] Try weak password → see error
- [ ] Try age < 18 → blocked
- [ ] Try duplicate username/email → error
- [ ] Check `users` table → password is hashed
- [ ] Check `audit_logs` → registration event exists
- [ ] Check `otp_verifications` → OTP with 10 min expiry

### Login Tests:
- [ ] Login with correct credentials → success
- [ ] Login with wrong password → attempt counter increases
- [ ] Do 5 wrong logins → account locked for 30 min
- [ ] Check `login_attempts` → failed attempts logged
- [ ] Login before email verification → blocked
- [ ] Login with MFA enabled → MFA modal appears
- [ ] Enter wrong MFA code → error
- [ ] Enter correct MFA code → logged in
- [ ] Check `refresh_tokens` → token stored with IP
- [ ] Check `audit_logs` → login event exists

### Database Checks:
```sql
-- Check user
SELECT * FROM users WHERE email = 'test@example.com';

-- Check audit logs
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;

-- Check login attempts
SELECT * FROM login_attempts ORDER BY attempt_time DESC LIMIT 10;

-- Check OTP
SELECT * FROM otp_verifications WHERE user_id = 'USER_UUID';

-- Check refresh tokens
SELECT * FROM refresh_tokens WHERE user_id = 'USER_UUID';
```

---

## 🎨 UI Features

### Registration Page:
- ✅ Beautiful gradient header (indigo to purple)
- ✅ Icon-enhanced input fields
- ✅ Live validation with error messages
- ✅ Smooth animations (framer-motion)
- ✅ OTP modal overlay
- ✅ Responsive design

### Login Page:
- ✅ Matching gradient design
- ✅ Loading states
- ✅ Security badges (AES-256, MFA)
- ✅ MFA modal with auto-focus
- ✅ Lockout warnings
- ✅ Attempts remaining counter

---

## 🚀 Quick Start

1. **Clear DB** (optional):
   ```bash
   $env:PGPASSWORD = 'belay1999'; psql -U postgres -h localhost -d dbb -f database/schema.sql
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test Flow**:
   - Go to http://localhost:5174/register
   - Create first user → Admin automatically
   - Create second user → OTP verification required
   - Login → If MFA enabled, verify code
   - Dashboard loads based on role

---

## ✅ All Features Implemented

Every security requirement from your specification is now live and testable! 🎉
