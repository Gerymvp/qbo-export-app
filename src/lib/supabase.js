import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cvlrdndhldqdomdrxwqc.supabase.co';
const supabaseKey = 'sb_publishable_Ic12naK_mrxN-jXGIdZEzQ_ZKg2XSVc'; 

export const supabase = createClient(supabaseUrl, supabaseKey);