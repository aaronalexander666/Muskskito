import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdnfhizbywrcgqhiusik.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkbmZoaXpieXdyY2dxaGl1c2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODIzMTksImV4cCI6MjA3NjU1ODMxOX0.ba4yRKtqY0Jo3WaIZqrnyjtvLHkb4nkUIp-G1q_yzP0';

export const supabase = createClient(supabaseUrl, supabaseKey);

