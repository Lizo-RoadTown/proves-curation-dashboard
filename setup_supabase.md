# Dashboard Supabase Setup

## Step 1: Install Dependencies

Run this in the `curation_dashboard` folder:

```bash
npm install @supabase/supabase-js react @types/react react-dom @types/react-dom
```

## Step 2: Create Environment File

The `.env` variables are already in the root `.env` file. We'll use those.

## Step 3: Files Created

The following files will be created to connect to Supabase:

1. `src/lib/supabase.ts` - Supabase client configuration
2. `src/hooks/useExtractions.ts` - Hook to fetch extractions
3. `src/types/database.ts` - TypeScript types for database tables

## Next Steps

After running the install command above, I'll create the necessary files to connect to your Supabase database.
