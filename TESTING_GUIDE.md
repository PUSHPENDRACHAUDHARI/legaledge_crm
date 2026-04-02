# Testing Guide: CRM Data Persistence Fixes

## Pre-Test Setup

### Prerequisites
1. Backend Django server running on `http://localhost:8000`
2. Frontend React app running on `http://localhost:5173` (or configured Vite port)
3. SQLite database with sample data
4. Browser DevTools available (F12)

### Database State
- Ensure you have activities in the database from > 12 hours ago
- Ensure at least one "completed" task exists (to verify it's not shown)
- Ensure multiple recent activities exist (to test sorting)

---

## Test 1: Dashboard Loads with All Activities

### Purpose
Verify that Recent Activities shows ALL activities, not just those from the last 12 hours.

### Steps
1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Login to app** with valid credentials
4. **Navigate to Dashboard/Home page**
5. **Observe Console Output:**
   ```
   [CRM] Fetching data for user: [Your Name]
   [CRM] ✓ contacts: 6 records
   [CRM] ✓ leads: 5 records
   [CRM] ✓ deals: 7 records
   [CRM] ✓ tasks: 6 records
   [CRM] ✓ companies: 4 records
   [CRM] ✓ tickets: 3 records
   [CRM] ✓ meetings: 4 records
   [CRM] ✓ activities: 25 records ← IMPORTANT
   [CRM] ✓ notes: 8 records
   [CRM] Data fetch complete: 9/9 successful
   ```
6. **Look at Recent Activities widget** (usually on dashboard)
   - Should show activities sorted by latest first
   - Should NO LONGER show message "No activity in the last 12 hours."
   - Should show message "No activities logged." if empty

### Expected Result ✅
- Activities from > 12 hours ago appear in the list
- All activities visible (no time cutoff)
- Console shows successful load of activities

### If Failed ❌
- Check browser console for errors
- Verify `/api/activities/` endpoint is returning data
- Check if activities in database have valid timestamps

---

## Test 2: Page Refresh Preserves Authentication & Fetches Fresh Data

### Purpose
Verify that on page refresh, authentication persists and data is refetched from API.

### Steps
1. **Login to app**
2. **Open DevTools Console** (F12)
3. **Navigate to any page** (e.g., Contacts)
4. **Create a new contact** (Quick check: ensure it appears in list)
5. **Note the activity** in console that was logged
6. **Press F5** to refresh page
7. **Watch Console:**
   ```
   [CRM] Fetching data for user: [Same User]
   [CRM] ✓ contacts: 7 records ← INCREASED!
   [CRM] ✓ leads: 5 records
   ... etc
   ```
8. **Check Contacts page** - new contact should still be there

### Expected Result ✅
- Page reloaded without redirecting to login
- Auth token persisted from storage
- All data refetched from API
- New contact visible after refresh
- No 401 errors in console

### If Failed ❌
- **Redirected to login:** Token might be expired or invalid
- **Old data shown:** API fetch might have failed
- **New contact missing:** Data sync issue
- Check `/api/contacts/` endpoint accessibility
- Verify auth token in DevTools → Application → Storage

---

## Test 3: Logout Clears Only Auth Tokens

### Purpose
Verify that logout removes only authentication credentials, not CRM data from context.

### Steps
1. **Login to app**
2. **Open DevTools → Application → Storage**
3. **Expand localStorage** and note these keys exist:
   ```
   crm_token        ← Present
   crm_user         ← Present
   sidebar_bookmarks ← Present
   ```
4. **Click Logout button** (usually in top-right menu)
5. **Watch as page redirects to /login**
6. **Check localStorage again:**
   ```
   crm_token        ← REMOVED ✓
   crm_user         ← REMOVED ✓
   sidebar_bookmarks ← STILL THERE ✓
   ```

### Expected Result ✅
- Redirected to login page
- Auth tokens (`crm_token`, `crm_user`) deleted
- UI preferences (`sidebar_bookmarks`) preserved
- No React errors in console
- Context data not visible (but not cleared, just orphaned)

### If Failed ❌
- **Auth tokens still present:** Logout handler not working
- **Bookmarks deleted:** Too aggressive cleanup
- Navigate to `/login` manually and verify behavior

---

## Test 4: Activities Filter Shows All (No 12-Hour Cutoff)

### Purpose
Verify Recent Activities shows all activities regardless of age.

### Steps
1. **Login and go to Dashboard**
2. **Scroll to Recent Activities section**
3. **Look for the fallback text:**
   - ✅ Should say: "No activities logged."
   - ❌ Should NOT say: "No activity in the last 12 hours."
4. **Go to Deals page**
5. **Look at activity history** for a deal
   - Should show all activities for that deal
   - No time gate applied
6. **Go to Leads page**
7. **Look at activity history** for a lead
   - Should show all activities for that lead
   - No time gate applied

### Expected Result ✅
- All activity history visible on entity pages
- No 12-hour cutoff mentioned anywhere
- Fallback message updated

### If Failed ❌
- Still seeing old message
- Activities still 12-hour-gated
- Check if `Home.jsx` changes took effect

---

## Test 5: API Failure Handling

### Purpose
Verify app gracefully handles API failures without crashing.

### Steps
1. **Login to app normally**
2. **Open DevTools → Network tab**
3. **Go to Network conditions** (gear icon)
4. **Set condition to "Offline"**
5. **Refresh page (F5)**
6. **Observe:**
   - Console shows errors for each failed API call
   - App doesn't crash
   - Falls back to initial store data (if available)
   - Console shows:
     ```
     [CRM] ✗ contacts failed: NetworkError
     [CRM] ✗ leads failed: NetworkError
     ... etc (9 failures expected)
     ```
7. **Go back online** (Network conditions → No throttling)
8. **Refresh page again**
9. **Verify data loads normally:**
   ```
   [CRM] ✓ contacts: 6 records
   [CRM] ✓ leads: 5 records
   ... etc (9 successes)
   ```

### Expected Result ✅
- App doesn't crash when API is down
- Clear error messages in console
- App recovers when API comes back online
- Data reloads correctly

### If Failed ❌
- App crashes or shows blank page
- Unclear error messages
- Data doesn't load when API returns
- Check Promise.allSettled() implementation

---

## Test 6: Complete CRUD Cycle with API Sync

### Purpose
Verify Create/Read/Update/Delete operations sync between app and database.

### Substep 1: CREATE
1. **Go to Contacts page**
2. **Click "Add Contact"**
3. **Fill form:**
   - Name: "API Test Contact"
   - Email: "test@example.com"
   - Phone: "+91-9999999999"
4. **Click Save**
5. **Expected:** Contact appears in list
6. **Check console:** Should see `addActivity` called
7. **Refresh page (F5)**
8. **Expected:** Contact still there (came from API)

### Substep 2: UPDATE
1. **Click on "API Test Contact"**
2. **Edit name to "API Test Updated"**
3. **Save changes**
4. **Expected:** Name updates immediately
5. **Refresh page**
6. **Expected:** Updated name persists

### Substep 3: READ (Already Verified)
1. **Navigate away and back to Contacts**
2. **Expected:** "API Test Updated" still visible

### Substep 4: DELETE
1. **Find "API Test Updated" contact**
2. **Click Delete/Trash icon**
3. **Confirm deletion**
4. **Expected:** Contact disappears from list
5. **Refresh page**
6. **Expected:** Contact still gone (deleted from DB)

### Expected Result ✅
- All CRUD operations complete successfully
- Data persists after page refresh
- No errors in console
- Activity logged for each operation

### If Failed ❌
- Operations don't appear immediately
- Data reverts after refresh
- Errors in console
- Check API endpoints are responding

---

## Test 7: Recent Activities Widget (Extended)

### Purpose
Verify the Recent Activities widget displays correctly with all fixes applied.

### Steps
1. **Go to Dashboard**
2. **Find "Recent Activities" widget**
3. **Verify structure:**
   ```
   Recent Activities
   ┌─────────────────────────────┐
   │ [Badge] Action      Time    │
   │ Lead: Opportunity created   │ ← Should show recent activity
   │ 3/23/2026, 2:34 PM         │
   ├─────────────────────────────┤
   │ [Badge] Action      Time    │
   │ Deal: Stage changed         │ ← Even if from > 12 hours ago
   │ 3/10/2026, 10:15 AM        │
   ├─────────────────────────────┤
   │ [Badge] Action      Time    │
   │ Contact: Updated            │ ← No time cutoff
   │ 2/28/2026, 5:44 PM         │
   └─────────────────────────────┘
   ```
4. **Verify sort order:** Latest at top
5. **Verify no duplicate filtering:** Should show all

### Expected Result ✅
- All activities displayed regardless of age
- Properly sorted by timestamp (newest first)
- No activities filtered out by time
- Proper badges and formatting

### If Failed ❌
- Still seeing 12-hour cutoff
- Activities missing
- Wrong sort order
- Check Home.jsx implementation

---

## Test 8: Authentication Edge Cases

### Purpose
Test edge cases in authentication flow.

### Case 1: Expired Token
1. **Login normally**
2. **Wait for token to expire** (or manually manipulate in DevTools)
3. **Perform an action** (e.g., create contact)
4. **Expected:**
   - App attempts refresh
   - If refresh succeeds: Action proceeds
   - If refresh fails: Redirected to login with error

### Case 2: Invalid Token
1. **Go to DevTools → Application → Storage**
2. **Edit `crm_token` to something invalid** (e.g., remove a character)
3. **Refresh page**
4. **Expected:**
   - Redirected to login
   - Error message shown
   - No blank page or crash

### Case 3: Missing Token
1. **Go to DevTools → Application → Storage**
2. **Delete `crm_token` entry**
3. **Refresh page**
4. **Expected:**
   - Redirected to login immediately
   - No data loaded
   - No console errors

### Expected Result ✅
- Graceful handling of all auth edge cases
- Clear user feedback on redirect
- No app crashes or blank screens

---

## Troubleshooting Guide

### Issue: Data not loading on refresh
**Symptoms:** Page reloads but returns to login, or shows no data
**Solutions:**
1. Check token validity: `localStorage.getItem('crm_token')`
2. Check console for 401 errors
3. Verify Django backend is running
4. Clear localStorage and login again: 
   ```javascript
   localStorage.clear(); 
   location.reload();
   ```

### Issue: Still seeing "No activity in the last 12 hours"
**Symptoms:** Old message shown instead of new one
**Solutions:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Verify `Home.jsx` changes are deployed
4. Check that `npm run build` captured latest changes

### Issue: Activities not showing on Deals/Leads pages
**Symptoms:** Activity history sections show no data
**Solutions:**
1. Create activities for those entities first
2. Check console for API errors
3. Verify `/api/activities/` returns activity data
4. Check entity type (deal/lead) matches in database

### Issue: App crashes during API failure
**Symptoms:** Blank screen, console errors
**Solutions:**
1. Check if Promise.allSettled() is being used (not Promise.all())
2. Verify error handling in CRMContext
3. Check browser console for specific error
4. Ensure all API endpoints return proper JSON

### Issue: Logout not working
**Symptoms:** Auth token still in storage after logout
**Solutions:**
1. Check `clearStoredAuth()` in auth.js
2. Verify `handleLogout()` calls `clearStoredAuth()`
3. Check browser console for logout errors
4. Verify both localStorage AND sessionStorage are cleared

---

## Performance Checklist

- [ ] Initial load completes within 2 seconds
- [ ] Page refresh completes within 2 seconds (cached data)
- [ ] No console errors or warnings
- [ ] All 9 API calls shown successful in console
- [ ] Memory usage stable (no leaks after multiple nav cycles)
- [ ] No duplicate API calls on same page view

---

## Acceptance Criteria

✅ All tests pass  
✅ No time-based activity filters  
✅ API is primary data source  
✅ localStorage used only for auth  
✅ Logout preserves context data  
✅ Error handling is graceful  
✅ Console provides visibility  
✅ Data persists on refresh  

---

Once all tests pass, the CRM app data persistence fixes are ready for production!
