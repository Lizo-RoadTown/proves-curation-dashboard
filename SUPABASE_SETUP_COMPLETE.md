# ✅ Supabase Dashboard Setup Complete

Your curation dashboard is now connected to Supabase! Here's what was done and how to run it.

## What Was Set Up

### 1. Supabase Client Library
- **File**: `src/lib/supabase.ts`
- **Purpose**: Configures connection to your Supabase database
- **Features**: Real-time subscriptions enabled

### 2. TypeScript Types
- **File**: `src/types/database.ts`
- **Purpose**: TypeScript definitions for all database tables
- **Tables**: staging_extractions, validation_decisions, teams, batch_claims

### 3. React Hook for Data
- **File**: `src/hooks/useExtractions.ts`
- **Purpose**: Fetch and manage extraction data
- **Features**:
  - Real-time updates (auto-refreshes when database changes)
  - `approveExtraction(id, reason)` function
  - `rejectExtraction(id, reason)` function
  - Loading and error states

### 4. Updated Components
- **File**: `src/app/components/PendingExtractions.tsx`
- **Changes**:
  - Now fetches real data from Supabase
  - Shows loading spinner while fetching
  - Displays error messages if connection fails
  - Real-time updates when data changes

### 5. Environment Variables
- **File**: `.env.local`
- **Contents**: Supabase URL and anonymous key (for browser access)

---

## How to Run the Dashboard

### Step 1: Install Dependencies

```bash
cd curation_dashboard
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase client
- All other existing dependencies from `package.json`

### Step 2: Start the Development Server

```bash
npm run dev
```

The dashboard will start at: **http://localhost:5173** (or the port Vite assigns)

### Step 3: View Pending Extractions

1. Open your browser to the local URL
2. Navigate to the "Pending" tab
3. You should see live data from your Supabase database!

---

## Testing with Real Data

### Add Test Extraction to Database

Go to Supabase SQL Editor and run:

```sql
INSERT INTO staging_extractions (
  candidate_key,
  candidate_type,
  candidate_payload,
  confidence_score,
  ecosystem,
  status
) VALUES (
  'TestRadioDriver',
  'component',
  '{"description": "Test component for dashboard"}',
  0.95,
  'fprime',
  'pending'
);
```

**The dashboard will automatically show this new extraction in real-time!**

---

## Next Steps

### 1. Implement Approve/Reject Buttons

The hooks are ready! You can call:

```typescript
const { approveExtraction, rejectExtraction } = useExtractions()

// In your button handlers:
await approveExtraction(extractionId, "Looks good!")
await rejectExtraction(extractionId, "Missing evidence")
```

### 2. Add Authentication

Currently using anonymous access. For production:
- Set up Supabase Auth (email/password)
- Replace `'dashboard_user'` with real user ID
- Enable Row-Level Security policies

### 3. Test Batch Claiming

Add batch claim functionality using the `batch_claims` table

### 4. Deploy to Vercel

```bash
# From dashboard folder
vercel deploy
```

---

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"

Run: `npm install` in the `curation_dashboard` folder

### "Failed to fetch extractions"

1. Check Supabase is accessible: https://guigtpwxlqwueylbbcpx.supabase.co
2. Verify `.env.local` has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
3. Check browser console for detailed error messages

### No data showing

1. Add test data using SQL above
2. Check Supabase Table Editor to verify data exists
3. Check browser console for errors

---

## Files Modified

✅ `src/lib/supabase.ts` - Created
✅ `src/types/database.ts` - Created
✅ `src/hooks/useExtractions.ts` - Created
✅ `src/app/components/PendingExtractions.tsx` - Updated
✅ `.env.local` - Created

---

**Status**: Ready to test! Run `npm install` then `npm run dev` in the `curation_dashboard` folder.
