// archivos.js — subir y abrir los archivos de un curso desde el celular.
//   Portada  → Supabase Storage (bucket "portadas")
//   PDF      → Cloudflare R2, con un enlace temporal que entrega la función "archivos"
//   Video    → Cloudflare Stream, subida reanudable (protocolo tus) en trozos de 5 MB
// Las claves de Cloudflare nunca están en la app: viven en la función "archivos" de Supabase.
import * as FileSystem from 'expo-file-system/legacy';
import { Linking } from 'react-native';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';

export function azar() {
  return Math.random().toString(36).slice(2, 8);
}

export function extension(nombre, porDefecto) {
  const e = String(nombre || '').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
  return e && e.length <= 5 ? e : porDefecto;
}

/* ---------------- Función "archivos" ---------------- */
async function llamar(accion, datos) {
  const { data, error } = await supabase.functions.invoke('archivos', { body: { accion, ...datos } });
  if (!error) return data;
  let msg = 'No se pudo comunicar con el servidor de archivos.';
  try {
    const j = await error.context.json();
    if (j?.error) msg = j.error;
  } catch (e) { /* sin detalle */ }
  throw new Error(msg);
}

export async function borrarRemoto(lo) {
  if (!lo || (!(lo.video_uids || []).length && !(lo.archivos || []).length)) return;
  try { await llamar('borrar', lo); } catch (e) { /* si falla, no frena nada */ }
}

// Abre el video o el PDF de una clase con un enlace temporal (la base decide quién puede verlo)
export async function verArchivo(claseId, tipo) {
  const r = await llamar('ver', { clase_id: claseId, tipo });
  await Linking.openURL(r.url);
}

/* ---------------- Portada ---------------- */
export async function subirPortada({ uri, mime, uid, cursoId, onProgreso }) {
  const sesion = (await supabase.auth.getSession()).data?.session;
  if (!sesion) throw new Error('Tu sesión se cerró. Volvé a ingresar.');
  const ext = extension(uri, mime === 'image/png' ? 'png' : 'jpg');
  const ruta = `${uid}/${cursoId}-${azar()}.${ext}`;
  const tarea = FileSystem.createUploadTask(
    `${SUPABASE_URL}/storage/v1/object/portadas/${ruta.split('/').map(encodeURIComponent).join('/')}`,
    uri,
    {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Bearer ${sesion.access_token}`,
        apikey: SUPABASE_ANON_KEY,
        'x-upsert': 'false',
        'cache-control': 'max-age=3600',
        'Content-Type': mime || 'image/jpeg',
      },
    },
    (p) => { if (onProgreso && p.totalBytesExpectedToSend) onProgreso(Math.round((p.totalBytesSent / p.totalBytesExpectedToSend) * 100)); }
  );
  const r = await tarea.uploadAsync();
  if (!r || r.status < 200 || r.status >= 300) {
    throw new Error('No se pudo subir la portada (error ' + (r?.status ?? '?') + ').');
  }
  return { ruta, url: supabase.storage.from('portadas').getPublicUrl(ruta).data.publicUrl };
}

export function rutaDePortada(url) {
  const marca = '/storage/v1/object/public/portadas/';
  const k = String(url || '').indexOf(marca);
  if (k < 0) return null;
  return decodeURIComponent(url.slice(k + marca.length).split('?')[0]);
}

export async function borrarPortada(ruta) {
  if (!ruta) return;
  try { await supabase.storage.from('portadas').remove([ruta]); } catch (e) { /* sin drama */ }
}

/* ---------------- PDF → R2 ---------------- */
export async function subirPdf({ claseId, uri, tamano, onProgreso }) {
  const r = await llamar('pdf_subida', { clase_id: claseId, tamano, tipo: 'application/pdf' });
  const tarea = FileSystem.createUploadTask(
    r.upload_url,
    uri,
    { httpMethod: 'PUT', uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT, headers: { 'Content-Type': 'application/pdf' } },
    (p) => { if (onProgreso && p.totalBytesExpectedToSend) onProgreso(Math.round((p.totalBytesSent / p.totalBytesExpectedToSend) * 100)); }
  );
  const res = await tarea.uploadAsync();
  if (!res || res.status < 200 || res.status >= 300) {
    throw new Error('No se pudo subir el PDF (error ' + (res?.status ?? '?') + ').');
  }
  return r.key;
}

/* ---------------- Video → Stream (tus, reanudable) ---------------- */
const TROZO = 5 * 1024 * 1024; // Stream pide múltiplos de 256 KiB: 5 MiB = 20 × 256 KiB
const ESPERAS = [0, 3000, 5000, 10000, 20000];
const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const TABLA = (() => { const t = new Uint8Array(128); ABC.split('').forEach((c, i) => { t[c.charCodeAt(0)] = i; }); return t; })();

// base64 → bytes (propio, sin depender de atob)
function base64ABytes(b64) {
  const limpio = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const n = Math.floor((limpio.length * 3) / 4);
  const out = new Uint8Array(n);
  let o = 0;
  for (let i = 0; i < limpio.length; i += 4) {
    const a = TABLA[limpio.charCodeAt(i)], b = TABLA[limpio.charCodeAt(i + 1)];
    const c = i + 2 < limpio.length ? TABLA[limpio.charCodeAt(i + 2)] : 0;
    const d = i + 3 < limpio.length ? TABLA[limpio.charCodeAt(i + 3)] : 0;
    if (o < n) out[o++] = (a << 2) | (b >> 4);
    if (o < n) out[o++] = ((b & 15) << 4) | (c >> 2);
    if (o < n) out[o++] = ((c & 3) << 6) | d;
  }
  return out;
}

async function offsetServidor(url) {
  const r = await fetch(url, { method: 'HEAD', headers: { 'Tus-Resumable': '1.0.0' } });
  if (!r.ok) throw new Error('HEAD ' + r.status);
  const o = Number(r.headers.get('Upload-Offset'));
  if (!Number.isFinite(o)) throw new Error('Sin offset');
  return o;
}

async function enviarTrozo(url, bytes, offset) {
  const r = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Tus-Resumable': '1.0.0',
      'Upload-Offset': String(offset),
      'Content-Type': 'application/offset+octet-stream',
    },
    body: bytes,
  });
  if (r.status !== 204 && r.status !== 200) throw new Error('PATCH ' + r.status);
  const nuevo = Number(r.headers.get('Upload-Offset'));
  return Number.isFinite(nuevo) ? nuevo : offset + bytes.length;
}

// Devuelve el id del video en Stream. Si se corta la conexión, retoma desde donde quedó.
export async function subirVideo({ claseId, uri, tamano, onProgreso }) {
  const r = await llamar('video_subida', { clase_id: claseId, tamano });
  let offset = 0;
  while (offset < tamano) {
    const largo = Math.min(TROZO, tamano - offset);
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64, position: offset, length: largo });
    const bytes = base64ABytes(b64);
    let avanzo = false;
    for (let intento = 0; intento < ESPERAS.length && !avanzo; intento++) {
      if (ESPERAS[intento]) await dormir(ESPERAS[intento]);
      try {
        offset = await enviarTrozo(r.upload_url, bytes, offset);
        avanzo = true;
      } catch (e) {
        // Puede haber llegado igual (o a medias): se le pregunta al servidor hasta dónde recibió
        try {
          const real = await offsetServidor(r.upload_url);
          if (real !== offset) { offset = real; avanzo = true; }
        } catch (e2) { /* sigue reintentando */ }
      }
    }
    if (!avanzo) throw new Error('Se cortó la subida del video. Probá de nuevo.');
    if (onProgreso) onProgreso(Math.min(100, Math.round((offset / tamano) * 100)));
  }
  return r.video_uid;
}
