import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://avsjvosxtbfiyxuawknl.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2c2p2b3N4dGJmaXl4dWF3a25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4OTM4NjMsImV4cCI6MjEwNDQ2OTg2M30.yedT-_CZOER4TLNMk-5LQlUHowkcMt7mdo5jap2H134';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseEnabled = true;
