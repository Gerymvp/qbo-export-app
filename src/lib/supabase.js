// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage, // <-- Al usar sessionStorage, si cierras la pestaña, se borra.
    persistSession: true,           // <-- Permite que el F5 no te desloguee.
    autoRefreshToken: true,
  }
})