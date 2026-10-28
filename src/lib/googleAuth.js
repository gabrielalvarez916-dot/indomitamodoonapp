import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';

// Client ID de tipo "Aplicación web" del proyecto de Google Cloud que ya usa
// Supabase para Modo On (Supabase → Authentication → Providers → Google).
// La librería nativa lo pide como "webClientId" para emitir un id_token válido.
// ⚠️ PENDIENTE: pegar acá el Client ID real.
export const WEB_CLIENT_ID = 'PENDIENTE.apps.googleusercontent.com';

let configurado = false;
function configurar() {
  if (configurado) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, offlineAccess: false });
  configurado = true;
}

// Devuelve { ok: true } | { ok: false, cancelado?: true, mensaje?: string }
export async function ingresarConGoogle() {
  if (WEB_CLIENT_ID.startsWith('PENDIENTE')) {
    return { ok: false, mensaje: 'Falta configurar el Client ID de Google en src/lib/googleAuth.js.' };
  }
  try {
    configurar();
    await GoogleSignin.hasPlayServices();
    const info = await GoogleSignin.signIn();
    const idToken = info?.data?.idToken ?? info?.idToken;
    if (!idToken) return { ok: false, cancelado: true };

    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    if (e?.code === 'SIGN_IN_CANCELLED' || e?.code === '-5') return { ok: false, cancelado: true };
    console.log('Error en el login con Google:', e);
    return { ok: false, mensaje: 'No pudimos conectar con Google. Probá de nuevo.' };
  }
}
