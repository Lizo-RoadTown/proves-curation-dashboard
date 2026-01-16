import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// These values come from your .env file (already set up)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://guigtpwxlqwueylbbcpx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1aWd0cHd4bHF3dWV5bGJiY3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MjcxNjYsImV4cCI6MjA4NDEwMzE2Nn0.uOhcHyZ1FY64-oe7mjcKjgm8Gl0Gvm6mYxx-NDXeBC8'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
