# Testing Guide - User-Specific Terminal

## ✅ Development Server Running

Server is now running on: **http://localhost:3002**

## Test Scenarios

### Test 1: Terminal Username Display

**Steps:**
1. Login to SmartyAI
2. Open Terminal app from desktop
3. Check terminal prompt

**Expected:**
- Prompt should show your username (e.g., "adr@MacBook-Pro ~ %")
- NOT hardcoded "vibhav@MacBook-Pro"

**How to Verify:**
```bash
# In terminal, type:
whoami
# Should return your actual username, not "vibhav"
```

---

### Test 2: Name Command

**Steps:**
1. In terminal, type: `name`
2. Press Enter

**Expected:**
- Returns YOUR full name from MongoDB profile
- NOT "Vibhav Trivedi"

**Example:**
```
adr@MacBook-Pro ~ % name
Your Name (from MongoDB profile)
```

---

### Test 3: Skills Command

**Steps:**
1. Type: `skills`
2. Press Enter

**Expected:**
- Returns YOUR skills from MongoDB profile
- NOT hardcoded: "React, Next.js, TailwindCSS, TypeScript, Node.js"

**Example:**
```
adr@MacBook-Pro ~ % skills
Your skill1, Your skill2, Your skill3
```

---

### Test 4: Projects Command

**Steps:**
1. Type: `projects`
2. Press Enter

**Expected:**
- Returns YOUR projects from MongoDB resume data
- NOT hardcoded Vibhav's projects

**Example:**
```
adr@MacBook-Pro ~ % projects
• Your Project 1: Description
• Your Project 2: Description
```

---

### Test 5: Contact Command

**Steps:**
1. Type: `contact`
2. Press Enter

**Expected:**
- Returns YOUR email, GitHub, LinkedIn (if in profile)
- NOT hardcoded Vibhav's contact info

---

### Test 6: Different User Sessions

**Steps:**
1. Login as User A
2. Open terminal, type `name` - Should show User A's name
3. Logout
4. Login as User B
5. Open terminal, type `name` - Should show User B's name

**Expected:**
- Each user sees their own data
- Data isolation between users

---

## API Endpoints to Test

### 1. Get User Settings
```bash
curl http://localhost:3002/api/user/settings \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**
```json
{
  "terminalUsername": "adr",
  "fullName": "User Name",
  "userId": "xxx"
}
```

### 2. Update Terminal Username
```bash
curl -X POST http://localhost:3002/api/user/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"terminalUsername":"myname"}'
```

**Expected Response:**
```json
{
  "success": true,
  "terminalUsername": "myname"
}
```

### 3. Get User Profile Data
```bash
curl "http://localhost:3002/api/user/profile?userId=YOUR_USER_ID" \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**
```json
{
  "fullName": "User Name",
  "headline": "Developer",
  "skills": ["skill1", "skill2"],
  "projects": [...],
  "contact": {
    "email": "user@example.com",
    "phone": "+91 xxx",
    "socialLinks": [...]
  }
}
```

---

## What Was Fixed

### Before ❌
- Terminal: "vibhav@MacBook-Pro ~ %" (hardcoded)
- `name` command: "Vibhav Trivedi" (hardcoded)
- `skills` command: Fixed list (hardcoded)
- `projects` command: Vibhav's projects (hardcoded)
- `contact` command: Vibhav's email/GitHub (hardcoded)

### After ✅
- Terminal: Dynamic username from profile
- `name` command: Actual user's MongoDB data
- `skills` command: User's skills from profile
- `projects` command: User's resume projects
- `contact` command: User's actual contact info

---

## Troubleshooting

### Issue: Terminal still shows "vibhav"
**Solution:** 
1. Check browser console for errors
2. Verify you're logged in
3. Clear browser cache and reload
4. Check `/api/user/settings` returns your username

### Issue: Commands return "Guest User"
**Solution:**
1. Ensure you're logged in
2. Check MongoDB has your profile data
3. Verify userId is passed to handleCommand

### Issue: Build errors
**Solution:**
```bash
cd SmartyAI
npm run build
# Should pass with no errors
```

---

## Files Modified Summary

1. **Terminal Components:**
   - `/app/components/terminal/terminalinput.tsx` - Dynamic username
   - `/app/components/terminal/terminaloutput.tsx` - Dynamic username
   - `/app/components/terminal/terminalUI.tsx` - Passes userId

2. **Command Handler:**
   - `/lib/handleCommand.tsx` - Uses user profile API
   - No longer uses hardcoded `/lib/commands.ts`

3. **API Routes:**
   - `/app/api/user/settings/route.ts` - Username management
   - `/app/api/user/profile/route.ts` - Profile data provider

---

## Next Steps

After testing, if you want to:

1. **Allow users to change their terminal username:**
   - Create a settings UI
   - POST to `/api/user/settings` with new username

2. **Implement user-scoped search:**
   - Create search service with userId filter
   - Query: profile, projects, files, nodes

3. **Add conversation history:**
   - Implement per-user history (6-12 messages)
   - Not global singleton

---

## Success Criteria

✅ Terminal prompt shows correct username
✅ Commands return user-specific data
✅ Different users see different data
✅ No hardcoded Vibhav data
✅ Build passes
✅ Dev server runs without errors

---

## Video Demo Script

1. Login as User A
2. Open Terminal
3. Show prompt: "username@MacBook-Pro ~ %"
4. Run `name` - Shows User A's name
5. Run `skills` - Shows User A's skills
6. Logout, Login as User B
7. Open Terminal
8. Show prompt: "username@MacBook-Pro ~ %"
9. Run `name` - Shows User B's name
10. Demonstrate data isolation

---

**Status:** ✅ Implementation Complete and Ready for Testing

Run `http://localhost:3002` and test the terminal now!
