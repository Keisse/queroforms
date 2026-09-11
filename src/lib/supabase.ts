import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://avsjvosxtbfiyxuawknl.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YIVcbVfVzsr_e73BwhPPww_vBBQtD25';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
export const supabaseEnabled = true;
