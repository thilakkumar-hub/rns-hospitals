import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://plkeezokpzsfizhdiqyi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2Vlem9rcHpzZml6aGRpcXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTIyODgsImV4cCI6MjA5Mzg2ODI4OH0.TlhjXdwKiPK9ODRzW6ml27cPUgvO4w-xBikDR1SCVDg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
