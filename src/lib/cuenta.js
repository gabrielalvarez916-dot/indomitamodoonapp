// cuenta.js — lo que cada persona ve y edita de lo suyo: sus cursos, su perfil y su solicitud de docente.
// Mismas tablas y reglas (RLS) que usa la web. El estado del docente solo lo cambia el admin.
import { supabase } from './supabase';
import { obtenerCursosFeed } from './cursosApi';

export async function usuarioActual() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user ?? null;
}

// Cursos con inscripción activa (en el orden en que se sumaron, el más nuevo primero).
// Solo aparecen los publicados cuyo docente está aprobado, igual que en la web.
export async function obtenerMisCursos() {
  const u = await usuarioActual();
  if (!u) return [];
  const { data, error } = await supabase
    .from('inscripciones')
    .select('curso_id, creado_en')
    .eq('usuario_id', u.id)
    .eq('estado', 'activa')
    .order('creado_en', { ascending: false });
  if (error) throw error;
  const ids = (data || []).map((i) => i.curso_id);
  if (!ids.length) return [];
  const cursos = await obtenerCursosFeed(ids);
  return cursos.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

/* ---------------- Perfil ---------------- */
export async function obtenerPerfil() {
  const u = await usuarioActual();
  if (!u) return null;
  const { data, error } = await supabase.from('perfiles').select('nombre, bio, avatar_url').eq('id', u.id).maybeSingle();
  if (error) throw error;
  const meta = u.user_metadata || {};
  return {
    email: u.email || '',
    nombre: data?.nombre || meta.full_name || meta.name || '',
    bio: data?.bio || '',
    avatar: data?.avatar_url || meta.avatar_url || meta.picture || '',
  };
}

export async function guardarPerfil({ nombre, bio }) {
  const u = await usuarioActual();
  const { data, error } = await supabase
    .from('perfiles')
    .update({ nombre, bio: bio || null })
    .eq('id', u.id)
    .select('id');
  if (error) throw error;
  if (!data?.length) throw new Error('la base no permitió guardar el cambio');
}

/* ---------------- Ser docente ---------------- */
export async function obtenerSolicitudDocente() {
  const u = await usuarioActual();
  if (!u) return null;
  const { data, error } = await supabase
    .from('docentes')
    .select('nombre_publico, bio_publica, estado, creado_en')
    .eq('usuario_id', u.id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function enviarSolicitudDocente({ nombre, bio }) {
  const u = await usuarioActual();
  const { error } = await supabase.from('docentes').insert({ usuario_id: u.id, nombre_publico: nombre, bio_publica: bio });
  if (error) throw error;
}

export async function actualizarDatosDocente({ nombre, bio }) {
  const u = await usuarioActual();
  const { data, error } = await supabase
    .from('docentes')
    .update({ nombre_publico: nombre, bio_publica: bio || null })
    .eq('usuario_id', u.id)
    .select('usuario_id');
  if (error) throw error;
  if (!data?.length) throw new Error('la base no permitió guardar el cambio');
}
