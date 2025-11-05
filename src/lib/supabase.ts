import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nirziyviytqbofzissrw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pcnppeXZpeXF0Ym9memlzc3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODk0NTcsImV4cCI6MjA3NzU2NTQ1N30.oTnwU-1APvkcK5MQt6tWgTkkVeUQ-LcuLWmAOZEOI0Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
