# Complaint Mechanism - Testing and Verification Guide

## Overview
This guide provides instructions for testing the complaint mechanism synchronization between the frontend and backend for the Cicero dashboard.

## Changes Summary

### 1. Frontend Changes

#### ComplaintForm Component (`components/ComplaintForm.tsx`)
- **Before**: Only sent `{ nrp }` 
- **After**: Now sends complete payload with:
  - `nrp` - User NRP (required)
  - `user_id` - Same as nrp
  - `client_id` - From auth context
  - `issue` - Default message "Kendala akses atau data tidak sesuai"

#### API Functions (`utils/api.ts`)
Both `postComplaintInstagram` and `postComplaintTiktok` now:
- Include `credentials: 'include'` in fetch options
- Handle 403 errors with user-friendly messages
- Guide users to check dashboard approval status and token validity

### 2. Payload Structure

#### Instagram Complaint Payload
```typescript
{
  nrp: string,              // Required - User NRP/NIP
  user_id?: string,         // User ID (usually same as nrp)
  username?: string,        // Instagram username (from rekap)
  username_ig?: string,     // Instagram username (alternative field)
  instagram?: string,       // Instagram username (duplicate for backend compatibility)
  client_id?: string,       // Client ID from auth context
  issue?: string,           // Description of issue
  nama?: string            // User's name
}
```

#### TikTok Complaint Payload
```typescript
{
  nrp: string,              // Required - User NRP/NIP
  user_id?: string,         // User ID (usually same as nrp)
  username?: string,        // TikTok username (from rekap)
  username_tiktok?: string, // TikTok username (alternative field)
  tiktok?: string,          // TikTok username (duplicate for backend compatibility)
  client_id?: string,       // Client ID from auth context
  issue?: string,           // Description of issue
  nama?: string            // User's name
}
```

### 3. API Endpoints

**Instagram Complaints**: `POST /api/dashboard/komplain/insta`
**TikTok Complaints**: `POST /api/dashboard/komplain/tiktok`

### 4. Authentication Requirements

According to the problem statement, backend should verify:
1. Dashboard user status must be `true`
2. Dashboard user must have non-empty `client_ids` array
3. Valid JWT token in Authorization header
4. Credentials should be included for cookie-based sessions

Example database check:
```sql
SELECT id, email, status, client_ids 
FROM dashboard_users 
WHERE email = '<user-email@example.com>';

-- Ensure:
-- 1. status = true
-- 2. client_ids array is not empty, e.g., ["client1", "client2"]
```

## Testing Instructions

### A. Manual Testing from Dashboard

1. **Login to Dashboard**
   - Navigate to the dashboard login page
   - Login with valid credentials
   - Ensure you're redirected to the dashboard

2. **Test Complaint Form**
   - Find the "Formulir Komplain" section on dashboard
   - Enter a valid NRP (e.g., "75020201")
   - Select platform (Instagram or TikTok)
   - Click "Kirim Komplain"
   - Verify success message appears

3. **Expected Request**
   - Check browser DevTools Network tab
   - Verify POST request to `/api/dashboard/komplain/insta` or `/api/dashboard/komplain/tiktok`
   - Verify headers include:
     - `Authorization: Bearer <token>`
     - `Content-Type: application/json`
   - Verify request has `credentials: 'include'`
   - Verify payload includes:
     ```json
     {
       "nrp": "75020201",
       "user_id": "75020201",
       "client_id": "POLDA_JABAR",
       "issue": "Kendala akses atau data tidak sesuai"
     }
     ```

### B. Manual Testing from Instagram Engagement Insight

1. **Navigate to Instagram Likes Page**
   - Go to `/likes/instagram`
   - Wait for data to load
   - Switch to "Rekap" tab

2. **Test Complaint Button**
   - Find a user in the table with an Instagram username
   - Click the "Komplain" button for that user
   - Verify success toast appears

3. **Expected Request**
   - Payload should include:
     ```json
     {
       "nrp": "<user_nrp>",
       "user_id": "<user_id>",
       "username_ig": "<instagram_username>",
       "instagram": "<instagram_username>",
       "client_id": "<client_id>",
       "issue": "Sudah melaksanakan Instagram belum terdata.",
       "nama": "<user_name>"
     }
     ```

### C. Manual Testing from TikTok Engagement Insight

1. **Navigate to TikTok Comments Page**
   - Go to `/comments/tiktok`
   - Wait for data to load
   - Switch to "Rekap" tab

2. **Test Complaint Button**
   - Find a user in the table with a TikTok username
   - Click the "Komplain" button for that user
   - Verify success toast appears

3. **Expected Request**
   - Payload should include:
     ```json
     {
       "nrp": "<user_nrp>",
       "user_id": "<user_id>",
       "username_tiktok": "<tiktok_username>",
       "tiktok": "<tiktok_username>",
       "client_id": "<client_id>",
       "issue": "Sudah komentar TikTok belum terdata.",
       "nama": "<user_name>"
     }
     ```

### D. Testing 403 Error Handling

1. **Simulate 403 Error**
   - This requires backend configuration or token manipulation
   - Use browser DevTools to intercept and modify responses (if possible)

2. **Expected Behavior**
   - When 403 error occurs, user should see toast message:
     > "Akses ditolak. Periksa: (1) Apakah akun dashboard Anda sudah di-approve? (2) Apakah token masih valid?"

3. **Verification Steps**
   - Check database for dashboard user status:
     ```sql
     SELECT status, client_ids FROM dashboard_users WHERE email = '<user_email>';
     ```
   - Ensure `status = true`
   - Ensure `client_ids` is not empty array

## Backend Verification Checklist

The backend should:
- [ ] Accept POST requests at `/api/dashboard/komplain/insta`
- [ ] Accept POST requests at `/api/dashboard/komplain/tiktok`
- [ ] Verify Authorization Bearer token
- [ ] Check dashboard user status is `true`
- [ ] Check dashboard user has non-empty `client_ids` array
- [ ] Return 403 when user is not approved or token is invalid
- [ ] Return success message when complaint is recorded
- [ ] Support various field name variations (nrp, nrp_nip, nrpNip, etc.)

## Common Issues and Troubleshooting

### Issue 1: "Token tidak ditemukan"
- **Cause**: User not logged in or token expired
- **Solution**: Redirect to login page and login again

### Issue 2: "NRP wajib diisi"
- **Cause**: Empty NRP field in form
- **Solution**: Enter a valid NRP before submitting

### Issue 3: "Username IG/TikTok belum tersedia"
- **Cause**: User in rekap table doesn't have username set
- **Solution**: Update user profile with social media username first

### Issue 4: 403 Access Denied
- **Cause**: Dashboard user not approved or invalid token
- **Solution**: 
  1. Check database: `SELECT status, client_ids FROM dashboard_users WHERE ...`
  2. Ensure status is true
  3. Ensure client_ids array is not empty
  4. Check token validity

### Issue 5: Backend not receiving client_id
- **Cause**: Auth context not providing clientId
- **Solution**: Check localStorage for 'client_id' key, re-login if missing

## Automated Tests

Run the test suite:
```bash
cd cicero-dashboard
npm test -- __tests__/complaint.test.ts
```

All 10 tests should pass:
- ✓ sends correct payload with all required fields (Instagram)
- ✓ sends minimal payload with only nrp (Instagram)
- ✓ handles 403 error with helpful message (Instagram)
- ✓ returns success message from backend (Instagram)
- ✓ sends correct payload with all required fields (TikTok)
- ✓ sends minimal payload with only nrp (TikTok)
- ✓ handles 403 error with helpful message (TikTok)
- ✓ returns success message from backend (TikTok)
- ✓ handles various field name variations (Instagram)
- ✓ handles various field name variations (TikTok)

## Success Criteria

The complaint mechanism is working correctly when:
1. ✅ Dashboard complaint form sends complete payload with nrp, user_id, client_id, and issue
2. ✅ Instagram rekap komplain button sends all required fields including username
3. ✅ TikTok rekap komplain button sends all required fields including username
4. ✅ All requests include Authorization header with Bearer token
5. ✅ All requests include credentials: 'include'
6. ✅ 403 errors show helpful messages guiding users to check approval status
7. ✅ Success messages appear after successful complaint submission
8. ✅ Backend receives and processes complaints correctly
9. ✅ All automated tests pass

## Contact

For issues or questions about this implementation, please refer to:
- PR: [Link to PR]
- Issue: Handle authentication and complaint mechanism synchronization
