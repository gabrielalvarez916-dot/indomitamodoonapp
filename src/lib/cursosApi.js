import { supabase } from './supabase';

// Banners publicitarios activos del feed (ordenados).
export async function obtenerBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('id, imagen_url, link_destino, curso_id, tipo, duracion_segundos')
    .eq('activo', true)
    .eq('ubicacion', 'feed')
    .eq('tipo', 'imagen') // el video se suma más adelante
    .order('orden', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Categorías visibles = "tipos de curso" del filtro.
export async function obtenerCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre, slug, orden')
    .eq('visible', true)
    .order('orden', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Cursos publicados con valoraciones, estudiantes, clases y duración ya calculados.
export async function obtenerCursosFeed(ids = null) {
  const { data, error } = await supabase.rpc('cursos_feed', { p_ids: ids });
  if (error) throw error;
  return data || [];
}

// Todo lo que necesita la página del curso.
export async function obtenerCursoDetalle(id) {
  const [resumen, cuerpo, resenas, inscripcion] = await Promise.all([
    obtenerCursosFeed([id]),
    supabase
      .from('cursos')
      .select('descripcion, aprenderas, requisitos, modulos(id, titulo, orden, clases(id, titulo, tipo, duracion_seg, orden, es_vista_previa))')
      .eq('id', id)
      .single(),
    supabase
      .from('resenas')
      .select('id, autor_nombre, calificacion, comentario, creado_en')
      .eq('curso_id', id)
      .order('creado_en', { ascending: false })
      .limit(20),
    supabase.from('inscripciones').select('id').eq('curso_id', id).eq('estado', 'activa').maybeSingle(),
  ]);

  const curso = resumen[0];
  if (!curso) return null;
  if (cuerpo.error) throw cuerpo.error;

  const { data: docente } = await supabase
    .from('docentes')
    .select('nombre_publico, bio_publica, avatar_url')
    .eq('usuario_id', curso.docente_id)
    .maybeSingle();

  const modulos = (cuerpo.data.modulos || [])
    .sort((a, b) => a.orden - b.orden)
    .map((m) => ({ ...m, clases: (m.clases || []).sort((a, b) => a.orden - b.orden) }));

  return {
    curso,
    descripcion: cuerpo.data.descripcion || '',
    aprenderas: cuerpo.data.aprenderas || [],
    requisitos: cuerpo.data.requisitos || [],
    modulos,
    resenas: resenas.data || [],
    docente: docente || null,
    inscripto: !!inscripcion.data,
  };
}

// "Los estudiantes también compraron": primero por alumnos en común;
// si hay pocos, se completa con cursos de la misma categoría.
export async function obtenerTambienCompraron(curso) {
  const { data } = await supabase.rpc('cursos_tambien_compraron', { p_curso: curso.id });
  const idsAfines = (data || []).map((f) => f.curso_id);
  const afines = idsAfines.length ? await obtenerCursosFeed(idsAfines) : [];
  afines.sort((a, b) => idsAfines.indexOf(a.id) - idsAfines.indexOf(b.id));

  if (afines.length >= 6) return afines;

  const todos = await obtenerCursosFeed();
  const usados = new Set([curso.id, ...afines.map((c) => c.id)]);
  const mismaCategoria = todos.filter((c) => !usados.has(c.id) && c.categoria_id === curso.categoria_id);
  mismaCategoria.forEach((c) => usados.add(c.id));
  const resto = todos.filter((c) => !usados.has(c.id));
  return [...afines, ...mismaCategoria, ...resto].slice(0, 8);
}
