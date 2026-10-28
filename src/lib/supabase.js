import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Proyecto Supabase "Indómita Modo On" (el mismo que usa la web).
// La clave "publishable" es pública por diseño; la seguridad real la dan las políticas RLS.
const SUPABASE_URL = 'https://mzygrfmceyzzxujgbbxx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lNFV4dr6eQ9hWMq5jKRqMg_ne_Mx1Kx';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
