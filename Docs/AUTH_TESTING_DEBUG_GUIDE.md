# FlowGateX Authentication Workflow - Testing & Debugging Guide

**Version**: February 11, 2026

---

## Overview

This guide helps developers test and debug the FlowGateX authentication workflow to ensure all CRUD operations work correctly and enforce the workflow strictly.

---

## Part 1: Environment Setup

### Enable Debug Logging

```typescript
// src/lib/logger.ts is already configured
// Enable verbose logging to see auth flow

// In browser console:
localStorage.setItem('debug', '*'); // Enable all logs
localStorage.removeItem('debug'); // Disable logs
```

### Check Firebase Configuration

```typescript
// src/lib/firebase.ts
// Verify these are set correctly:

✅ VITE_FIREBASE_API_KEY
✅ VITE_FIREBASE_AUTH_DOMAIN
✅ VITE_FIREBASE_PROJECT_ID
✅ VITE_FIREBASE_STORAGE_BUCKET
✅ VITE_FIREBASE_MESSAGING_SENDER_ID
✅ VITE_FIREBASE_APP_ID

// Check:.env.local file
```

### Test Mock Mode

```typescript
// src/lib/firebase.ts
// Set to test without Firebase:
VITE_MOCK_MODE = true;

// This uses mockAuth for testing
// Real Firebase calls are skipped
```

---

## Part 2: Registration Workflow Testing

### Test 1: Valid Registration

**Steps**:

1. Navigate to `/register`
2. Enter valid data:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe@example.com"
   - Password: "SecurePass123!"
   - Confirm: "SecurePass123!"
   - DOB: "2000-01-15"
   - Gender: "Male"
   - Accept terms: ✓
3. Click through all steps
4. Click "Create Account"

**Expected Result**:

- ✅ User created message
- ✅ Verification email notification
- ✅ Redirect to confirmation screen
- ✅ Firestore document created at `/users/{uid}`

**Debug Logs to Check**:

```
🔐 Registration validation passed for: john.doe@example.com
⏳ Step 1: Creating Firebase Auth user...
✅ Firebase Auth user created: abc123def456
⏳ Step 2: Updating Firebase Auth profile...
✅ Firebase Auth profile updated
⏳ Step 3: Sending email verification...
📧 Verification email sent to: john.doe@example.com
⏳ Step 4: Creating Firestore user document...
✅ Firestore user document created: abc123def456
✅ User registration completed successfully: abc123def456
```

---

### Test 2: Register with Invalid Email

**Steps**:

1. Navigate to `/register`
2. Enter invalid email: "notanemail"
3. Try to proceed to next step

**Expected Result**:

- ❌ Error message: "Please enter a valid email address."
- ❌ Step 1 not completed
- ❌ No Firebase calls made

**Debug Logs**:

```
No Firebase operations should occur
Error shown client-side before submission
```

---

### Test 3: Register Underage User

**Steps**:

1. Navigate to `/register`
2. Valid data but DOB: "2015-01-01" (under 13 years old)
3. Attempt to register

**Expected Result**:

- ❌ Error: "You must be at least 13 years old to create an account."
- ❌ Registration blocked
- ❌ No Firebase operations

---

### Test 4: Register with Weak Password

**Steps**:

1. Navigate to `/register`
2. Password: "123" (too short)
3. Try to register

**Expected Result**:

- ❌ Form validation error (client-side)
- ❌ Firebase doesn't receive call

**Alternative Test**:

- Direct API call with weak password
- Should get: "Password must be at least 6 characters long."

---

### Test 5: Register with Existing Email

**Steps**:

1. Register normally (Test 1)
2. Try to register again with same email
3. Submit form

**Expected Result**:

- ❌ Error: "An account with this email already exists. Try signing in instead."
- ❌ User not duplicated

**Debug Logs**:

```
❌ Firebase registration error: auth/email-already-in-use
```

---

### Test 6: Firestore Write Failure Recovery (Self-Healing)

**Steps - Setup**:

1. In Firebase Console:
   - Temporarily block write access to `/users` collection
   - Or manually delete user doc after successful registration

**Steps - Test**:

1. Register new user (Step 1: Valid Registration)
2. Watch console logs
3. Login to app as that user

**Expected Result**:

- ⚠️ Registration succeeds (Auth user created)
- ⚠️ Firestore write fails - logged but doesn't block
- ⏳ Next login triggers self-healing
- ✅ Profile auto-created on next login

**Debug Logs**:

```
⚠️ Firestore write failed, but Auth user exists
Self-healing will create profile on next login

// Then on login:
⏳ Waiting for user profile creation...
✅ User profile loaded from Firestore
```

---

## Part 3: Login Workflow Testing

### Test 7: Valid Email/Password Login

**Steps**:

1. Register user first (Test 1)
2. Navigate to `/login`
3. Enter email: "john.doe@example.com"
4. Password: "SecurePass123!"
5. Role: "Attendee"
6. Click "Sign In"

**Expected Result**:

- ✅ Login successful
- ✅ Redirect to attendee dashboard
- ✅ User data loaded in Zustand store
- ✅ Real-time profile sync active

**Debug Logs**:

```
✅ Firebase Auth user created/validated
📝 Firestore profile updated
✅ User profile loaded from Firestore
🎯 Role-based navigation
```

---

### Test 8: Login with Wrong Password

**Steps**:

1. Navigate to `/login`
2. Email: registered user email
3. Password: "WrongPassword"
4. Click "Sign In"

**Expected Result**:

- ❌ Error: "Invalid email or password. Please try again."
- ❌ User not logged in
- ❌ Zustand store unchanged

---

### Test 9: Login with Wrong Role

**Prerequisites**:

- User registered as "Attendee"
- Try to login as "Organizer"

**Steps**:

1. Navigate to `/login`
2. Valid credentials
3. Select Role: "Organizer" (wrong role)
4. Click "Sign In"

**Expected Result**:

- ❌ Error: "You are not authorized to login as organizer. Please select the correct role."
- ❌ User automatically signed out
- ❌ Redirected back to login

**Debug Logs**:

```
auth/unauthorized-role
Access denied. You are not authorized to login as organizer.
```

---

### Test 10: Real-Time Profile Sync

**Steps**:

1. Login as valid user (Test 7)
2. User A: Open app in Browser Tab A
3. User A: Edit profile in Browser Tab B (or admin updates it)
4. Watch Browser Tab A

**Expected Result**:

- ✅ Profile updates appear in Tab A within 1-2 seconds
- ✅ Real-time listener catches Firestore changes
- ✅ No page refresh needed

**Debug Logs**:

```
📡 onSnapshot fired with updated document
✅ User profile loaded from Firestore
```

---

### Test 11: Timeout Fallback

**Steps - Setup**:

1. In Firebase Console:
   - Temporarily disable Firestore database access
   - Or simulate network delay

**Steps - Test**:

1. Try to login
2. Wait 10+ seconds
3. Observe what happens

**Expected Result**:

- ⏳ Loading spinner shows for ~10 seconds
- ✅ Fallback activates (uses basic Auth data)
- ✅ Dashboard loads with limited profile
- ✅ Self-healing logs appear

**Debug Logs**:

```
⏳ Waiting for user profile creation...
⚠️ User profile load timed out (10s). Using basic auth data.
```

---

### Test 12: Deleted Account Detection

**Steps**:

1. Login as valid user
2. Open admin/Firebase panel
3. Manually set `isDeleted: true` in user doc
4. Refresh app or try to navigate

**Expected Result**:

- ⚠️ User logged out
- ✅ Redirected to login
- ✅ Account marked as deleted message (optional)

**Debug Logs**:

```
⚠️ User account is marked as deleted
```

---

## Part 4: Profile Update Testing

### Test 13: Update Own Profile

**Steps**:

1. Login as valid user
2. Navigate to user profile page
3. Change:
   - First Name
   - Phone Number
   - Gender
4. Click "Save"

**Expected Result**:

- ✅ Profile updated successfully
- ✅ Changes appear immediately
- ✅ Firestore document updated
- ✅ Firebase Auth profile synced (for displayName/photo)
- ✅ Zustand store updated
- ✅ Real-time listeners notified

**Debug Logs**:

```
📝 Firestore profile updated for user: uid
🔐 Firebase Auth profile synced for user: uid
```

---

### Test 14: Reject Invalid Profile Update

**Steps**:

1. Direct API call attempt to update profile with:
   - Empty displayName
   - Invalid phone number
   - Empty first name
2. Submit

**Expected Result**:

- ❌ Error returned before Firestore update
- ❌ No partial updates applied
- ❌ Original profile unchanged

**Debug Logs**:

```
❌ Profile update failed: Invalid display name
```

---

### Test 15: Prevent Cross-User Updates

**Steps - Setup**:

1. Get User A's UID
2. Login as User B
3. Directly call updateUserProfile(userA.uid, updates)

**Expected Result**:

- ❌ Error: "Cannot update profile: user mismatch or not authenticated."
- ❌ User A's profile unchanged
- ❌ User B cannot modify other profiles

**Debug Logs**:

```
auth/unauthorized-user
Cannot update profile: user mismatch
```

---

## Part 5: Password Management Testing

### Test 16: Correct Password Change

**Steps**:

1. Login as valid user
2. Navigate to security settings
3. Enter:
   - Current password: (correct password)
   - New password: "NewSecure123!"
   - Confirm: "NewSecure123!"
4. Click "Change Password"

**Expected Result**:

- ✅ Password changed successfully
- ✅ Firestore timestamp updated
- ✅ User session remains active
- ✅ Old password no longer works

**Debug Logs**:

```
🔐 Password updated for user: uid
📝 Firestore timestamp updated for password change
```

---

### Test 17: Reject Same Password

**Steps**:

1. Login as valid user
2. Current password: "SecurePass123!"
3. New password: "SecurePass123!" (same)
4. Submit

**Expected Result**:

- ❌ Error: "New password must be different from current password."
- ❌ Password not changed
- ❌ No Firebase calls made

---

### Test 18: Reject Wrong Current Password

**Steps**:

1. Login as valid user
2. Current password: "WrongPassword"
3. New password: "NewSecure123!"
4. Submit

**Expected Result**:

- ❌ Error: "Current password is incorrect."
- ❌ Re-authentication fails
- ❌ Password not changed

**Debug Logs**:

```
auth/wrong-password
Current password is incorrect
```

---

### Test 19: Forgot Password Flow

**Steps**:

1. Navigate to `/forgot-password`
2. Enter registered email
3. Click "Send Reset Link"
4. Check email for reset link
5. Click link (opens `/reset-password?oobCode=...`)
6. Enter new password and confirm
7. Click "Reset Password"

**Expected Result**:

- ✅ Reset email received
- ✅ Reset link valid
- ✅ New password set
- ✅ Can login with new password
- ✅ Firestore timestamp updated

**Debug Logs**:

```
📧 Verification email re-sent
confirmPasswordReset called with valid token
🔐 Password updated for user
```

---

### Test 20: Reset Link Expiration

**Steps**:

1. Request password reset
2. Wait 24+ hours (or manually expire token in Firebase)
3. Click reset link
4. Try to submit new password

**Expected Result**:

- ❌ Error: "This reset link has expired. Please request a new one."
- ❌ Cannot access reset form
- ❌ Must request new reset link

---

## Part 6: Account Deletion Testing

### Test 21: Delete Account Successfully

**Steps**:

1. Login as valid user
2. Navigate to settings → security
3. Click "Delete Account"
4. Enter password when prompted
5. Confirm deletion

**Expected Result**:

- ✅ Account marked as deleted in Firestore
- ✅ Sensitive data cleared (email, phone)
- ✅ Auth account deleted
- ✅ User logged out
- ✅ Redirected to home
- ✅ Firestore soft-delete timestamp set

**Debug Logs**:

```
🔓 User re-authenticated for account deletion
📝 User marked as deleted in Firestore
🗑️ Firestore user document deleted
🗑️ Firebase Auth account deleted
```

---

### Test 22: Reject Wrong Password on Delete

**Steps**:

1. Login as valid user
2. Navigate to delete account
3. Enter wrong password
4. Confirm

**Expected Result**:

- ❌ Error: "Password is incorrect. Cannot delete account."
- ❌ Account not deleted
- ❌ User still logged in

---

### Test 23: Verify Deleted Account Can't Login

**Steps**:

1. Delete account (Test 21)
2. Try to login with deleted account credentials
3. Submit

**Expected Result**:

- ❌ Error: "Invalid email or password" or "No user found"
- ❌ Cannot access account

---

## Part 7: Error Handling & Edge Cases

### Test 24: Network Failure During Registration

**Setup**: Use browser DevTools to throttle network or go offline

**Steps**:

1. Start registration
2. Simulate network failure after Auth created
3. Before Firestore write

**Expected Result**:

- ❌ Error shown to user
- ✅ User created in Auth
- ✅ Next login triggers self-healing
- ⚠️ Partial account state handled

---

### Test 25: Concurrent Registration Attempts

**Steps**:

1. Open two browser tabs
2. Same email, different passwords
3. Submit both simultaneously
4. See which one succeeds

**Expected Result**:

- ✅ One succeeds, one fails with email-already-in-use
- ✅ No duplicate users created
- ✅ Database consistency maintained

---

### Test 26: Very Long Field Values

**Steps**:

1. Try to register with:
   - 500+ character email
   - 500+ character first name
   - Very long phone number

**Expected Result**:

- Validation should handle gracefully
- Either truncate or reject with clear error
- No crashes or strange behavior

---

## Part 8: Firebase Security Rules Testing

### Test 27: Verify Security Rules Enforce Access

**Steps**:

1. From browser console:

```javascript
// Try direct Firestore read
const db = getFirestore();
const userRef = doc(db, 'users', 'DIFFERENT_USER_UID');
getDoc(userRef);
```

**Expected Result**:

- ❌ Permission denied error
- ❌ Cannot read other users' profiles
- ✅ Security rules working

---

### Test 28: Verify Write Rules

**Steps**:

1. From browser console:

```javascript
// Try direct write to other user
const db = getFirestore();
await updateDoc(doc(db, 'users', 'OTHER_USER_UID'), {
  role: 'admin',
});
```

**Expected Result**:

- ❌ Permission denied
- ❌ Cannot escalate privileges
- ✅ Rules enforced

---

## Part 9: Monitoring & Logging

### Check Logs

All auth operations should show in browser console:

```
✅ Success operations
⚠️ Warnings (timeouts, auto-healing)
❌ Errors with codes
📧 Email operations
🔐 Auth operations
📝 Firestore operations
🎯 Navigation decisions
```

### Monitor Performance

```javascript
// Check Firebase latency
performance.mark('auth-start');
// ... auth operation
performance.mark('auth-end');
performance.measure('auth-op', 'auth-start', 'auth-end');
```

### Check State

```javascript
// From browser console
// Get current auth state
const { user, isAuthenticated, isLoading } = useAuthStore.getState();
console.log(user);
```

---

## Part 10: Checklist for Deployment

- [ ] All 28 tests pass
- [ ] No console errors
- [ ] Proper error messages shown to users
- [ ] Timestamps correct in all databases
- [ ] Real-time sync working
- [ ] Role validation working
- [ ] Email verification emails sent
- [ ] Password requirements enforced
- [ ] Account deletion complete
- [ ] Self-healing mechanism functional
- [ ] Logging shows correct flow
- [ ] No orphaned data
- [ ] Firebase rules validated
- [ ] Performance acceptable
- [ ] Accessibility verified

---

## Part 11: Troubleshooting Guide

### "User stuck in loading state"

**Check**:

- Is Firestore accessible?
- Does user doc exist?
- Check timeout logs (10s message)
- Does self-healing fallback appear?

### "Wrong role after update"

**Check**:

- Did Firestore update complete?
- Are both Auth and Firestore in sync?
- Check `role` field in `/users/{uid}`
- Did real-time listener fire?

### "Can't change password"

**Check**:

- Is current password correct?
- Is new password different from current?
- Does Firebase Auth allow updates?
- Is Firestore timestamp updating?

### "Account still accessible after delete"

**Check**:

- Is `isDeleted: true` set?
- Did both Auth and Firestore delete?
- Did session clear?
- Try logging out and back in

---

**Guide Status**: Complete  
**Last Updated**: February 11, 2026
