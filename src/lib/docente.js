// docente.js — lo que hace un docente con sus cursos: crear, editar el temario y enviar a revisión.
// Mismas tablas, consultas y reglas (RLS) que el editor de la web. La base exige el curso completo
// para enviarlo y solo deja editar borradores.
import { supabase } from './supabase';
import { usuarioActual } from './cuenta';
import { normalizar } from './formato';
import { azar } from './archivos';

function chequear({ data, error }) {
  if (error) throw error;
  return data;
}
const uno = (x) => (Array.isArray(x) ? x[0] : x);

// Escribe y confirma que la base dejó hacer el cambio (si falta un permiso, no falla en silencio)
async function escribir(consulta) {
  const d = chequear(await consulta);
  if (!d || !d.length) throw new Error('la base no permitió el cambio');
  return d;
}

export function slugDe(t) {
  return normalizar(t).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

/* ---------------- Lecturas ---------------- */
export async function misCursosDocente() {
  const u = await usuarioActual();
  return chequear(await supabase
    .from('cursos')
    .select('id, titulo, estado, nota_revision, actualizado_en')
    .eq('docente_id', u.id)
    .order('actualizado_en', { ascending: false })) || [];
}

export async function obtenerCategorias() {
  return chequear(await supabase.from('categorias').select('id, nombre').order('orden', { ascending: true }).order('nombre', { ascending: true })) || [];
}

export async function obtenerEscalones() {
  return chequear(await supabase
    .from('escalones_precio')
    .select('precio_web_usd, precio_app_usd')
    .eq('activo', true)
    .order('precio_web_usd', { ascending: true })) || [];
}

export async function obtenerEstadoDocente() {
  const u = await usuarioActual();
  const d = chequear(await supabase.from('docentes').select('estado').eq('usuario_id', u.id).maybeSingle());
  return d?.estado || null;
}

export async function obtenerCursoEditable(id) {
  const u = await usuarioActual();
  const c = chequear(await supabase
    .from('cursos')
    .select('id, titulo, subtitulo, descripcion, categoria_id, precio_usd, portada_url, estado, nota_revision, aprenderas, requisitos, modulos(id, titulo, orden, clases(id, titulo, descripcion, tipo, duracion_seg, orden, es_vista_previa, clases_contenido(video_uid, archivo_path, descargable)))')
    .eq('id', id)
    .eq('docente_id', u.id)
    .maybeSingle());
  if (!c) return null;
  c.modulos = (c.modulos || []).slice().sort((a, b) => a.orden - b.orden).map((m) => ({
    ...m,
    clases: (m.clases || []).slice().sort((a, b) => a.orden - b.orden).map(({ clases_contenido, ...cl }) => ({ ...cl, contenido: uno(clases_contenido) || null })),
  }));
  return c;
}

/* ---------------- Curso ---------------- */
export async function crearCurso(campos) {
  const u = await usuarioActual();
  const fila = chequear(await supabase
    .from('cursos')
    .insert({ ...campos, docente_id: u.id, slug: (slugDe(campos.titulo) || 'curso') + '-' + azar() })
    .select('id')
    .single());
  return fila.id;
}

export function guardarCurso(id, campos) {
  return escribir(supabase.from('cursos').update(campos).eq('id', id).select('id'));
}

export function fijarPortada(id, url) {
  return escribir(supabase.from('cursos').update({ portada_url: url }).eq('id', id).select('id'));
}

export async function enviarARevision(id) {
  chequear(await supabase.rpc('enviar_curso_a_revision', { _curso: id }));
}

export function borrarCurso(id) {
  return escribir(supabase.from('cursos').delete().eq('id', id).select('id'));
}

/* ---------------- Módulos ---------------- */
export async function crearModulo(cursoId, titulo, orden) {
  return chequear(await supabase.from('modulos').insert({ curso_id: cursoId, titulo, orden }).select('id').single());
}
export function renombrarModulo(id, titulo) {
  return escribir(supabase.from('modulos').update({ titulo }).eq('id', id).select('id'));
}
export function borrarModulo(id) {
  return escribir(supabase.from('modulos').delete().eq('id', id).select('id'));
}

/* ---------------- Clases ---------------- */
export async function crearClase(moduloId, titulo, orden) {
  return chequear(await supabase.from('clases').insert({ modulo_id: moduloId, titulo, tipo: 'video', orden }).select('id').single());
}
export function actualizarClase(id, cambios) {
  return escribir(supabase.from('clases').update(cambios).eq('id', id).select('id'));
}
export function borrarClase(id) {
  return escribir(supabase.from('clases').delete().eq('id', id).select('id'));
}

// Intercambia el orden de dos elementos (módulos o clases)
export async function intercambiarOrden(tabla, a, b) {
  await Promise.all([
    escribir(supabase.from(tabla).update({ orden: b.orden }).eq('id', a.id).select('id')),
    escribir(supabase.from(tabla).update({ orden: a.orden }).eq('id', b.id).select('id')),
  ]);
}

/* ---------------- Archivos de la clase ---------------- */
// Guarda la referencia del video (video_uid) o del PDF (archivo_path) de una clase
export function guardarContenido(claseId, existe, campos) {
  return existe
    ? escribir(supabase.from('clases_contenido').update(campos).eq('clase_id', claseId).select('clase_id'))
    : escribir(supabase.from('clases_contenido').insert({ clase_id: claseId, descargable: true, ...campos }).select('clase_id'));
}
export function fijarDescargable(claseId, valor) {
  return escribir(supabase.from('clases_contenido').update({ descargable: valor }).eq('clase_id', claseId).select('clase_id'));
}

/* ---------------- Lista de lo que falta para enviar ---------------- */
export function pendientesDeEnvio(c) {
  const mods = c.modulos || [];
  const clases = mods.flatMap((m) => m.clases);
  const sinVideo = clases.filter((x) => !x.contenido?.video_uid).length;
  const sinPdf = clases.filter((x) => !x.contenido?.archivo_path).length;
  const plural = (n, uno1, varios) => `${n} ${n === 1 ? uno1 : varios}`;
  return [
    [!!c.titulo?.trim(), 'Título'],
    [!!c.descripcion?.trim(), 'Descripción'],
    [!!c.portada_url, 'Portada'],
    [!!c.precio_usd, 'Precio'],
    [mods.length > 0, 'Al menos un módulo'],
    [mods.length > 0 && mods.every((m) => m.clases.length > 0), 'Todos los módulos tienen clases'],
    [clases.length > 0 && sinVideo === 0, clases.length ? (sinVideo ? plural(sinVideo, 'clase sin video', 'clases sin video') : 'Todas las clases tienen video') : 'Al menos una clase con video'],
    [clases.length > 0 && sinPdf === 0, clases.length ? (sinPdf ? plural(sinPdf, 'clase sin PDF', 'clases sin PDF') : 'Todas las clases tienen PDF') : 'Al menos una clase con PDF'],
  ];
}
