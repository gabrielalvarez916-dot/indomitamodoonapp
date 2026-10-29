// EditarCursoScreen.js — el docente arma su curso desde el celular: datos, portada, temario
// (módulos y clases con video y PDF subidos) y envío a revisión. Mismas reglas que la web:
// mientras el curso es borrador se edita todo; una vez enviado queda en solo lectura.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Switch, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Aviso, Boton, BotonChico, Caja, Campo, CampoGuardable, Chips, PantallaForm, estilosForm } from '../components/FormularioBase';
import SlotArchivo from '../components/SlotArchivo';
import { borrarPortada, borrarRemoto, rutaDePortada, subirPortada } from '../lib/archivos';
import { usuarioActual } from '../lib/cuenta';
import {
  actualizarClase, borrarClase, borrarCurso, borrarModulo, crearClase, crearCurso, crearModulo, enviarARevision,
  fijarPortada, guardarCurso, intercambiarOrden, obtenerCategorias, obtenerCursoEditable, obtenerEscalones,
  obtenerEstadoDocente, pendientesDeEnvio, renombrarModulo,
} from '../lib/docente';
import { duracionClase } from '../lib/formato';
import { colores, fuentes } from '../theme';

const MAX_PORTADA = 5 * 1024 * 1024;
const TIPOS_PORTADA = ['image/jpeg', 'image/png', 'image/webp'];

const ESTADO_TXT = {
  en_revision: ['EN REVISIÓN', 'Tu curso está en revisión. Lo estamos mirando y apenas lo resolvamos vas a verlo acá. Mientras tanto no se puede editar.'],
  publicado: ['PUBLICADO', 'Tu curso está publicado y ya lo pueden ver los alumnos.'],
  pausado: ['PAUSADO', 'Tu curso está pausado: por ahora no se muestra en el feed.'],
};

const lineas = (t) => String(t || '').split('\n').map((x) => x.trim().slice(0, 200)).filter(Boolean).slice(0, 12);
const mensaje = (e) => (e && e.message) || String(e);
function rutasDeClase(cl) {
  const ct = cl.contenido || {};
  return { video_uids: ct.video_uid ? [ct.video_uid] : [], archivos: ct.archivo_path ? [ct.archivo_path] : [] };
}
function sumar(acum, r) {
  return { video_uids: acum.video_uids.concat(r.video_uids), archivos: acum.archivos.concat(r.archivos) };
}

export default function EditarCursoScreen({ navigation, route }) {
  const cursoId = route.params?.id || null;
  const [fase, setFase] = useState('cargando'); // cargando | ok | error | nodocente | noencontrado
  const [uid, setUid] = useState(null);
  const [curso, setCurso] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [escalones, setEscalones] = useState([]);
  const [hayAlguna, setHayAlguna] = useState(false); // subida en curso (para bloquear acciones y avisar al salir)
  const subiendo = useRef(0);

  const cargar = useCallback(async () => {
    try {
      const u = await usuarioActual();
      setUid(u.id);
      const est = await obtenerEstadoDocente();
      if (est !== 'pendiente' && est !== 'aprobado') return setFase('nodocente');
      const [cats, escs, c] = await Promise.all([obtenerCategorias(), obtenerEscalones(), cursoId ? obtenerCursoEditable(cursoId) : Promise.resolve(null)]);
      setCategorias(cats);
      setEscalones(escs);
      if (cursoId && !c) return setFase('noencontrado');
      setCurso(c);
      setFase('ok');
    } catch (e) {
      console.log('Error cargando el curso:', e);
      setFase('error');
    }
  }, [cursoId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Refresca solo el curso (después de cada cambio) sin volver a pedir categorías y precios
  const recargar = useCallback(async () => {
    if (!cursoId) return;
    const c = await obtenerCursoEditable(cursoId);
    if (c) setCurso(c);
  }, [cursoId]);

  const marcarSubida = useCallback((v) => {
    subiendo.current += v ? 1 : -1;
    setHayAlguna(subiendo.current > 0);
  }, []);

  // Si hay una subida a medias, se avisa antes de salir
  useEffect(() => {
    const quitar = navigation.addListener('beforeRemove', (e) => {
      if (subiendo.current <= 0) return;
      e.preventDefault();
      Alert.alert('Hay una subida en curso', 'Si salís ahora, la subida se corta. ¿Salir igual?', [
        { text: 'Quedarme', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return quitar;
  }, [navigation]);

  useEffect(() => { navigation.setOptions({ title: curso?.titulo || 'Nuevo curso' }); }, [navigation, curso?.titulo]);

  if (fase === 'cargando') return <View style={estilosForm.centro}><ActivityIndicator color={colores.negro} /></View>;
  if (fase !== 'ok') {
    const textos = {
      error: 'No pudimos cargar el curso.',
      nodocente: 'Primero necesitás tener tu solicitud de docente en curso.',
      noencontrado: 'No encontramos este curso.',
    };
    return (
      <View style={estilosForm.centro}>
        <Text style={styles.errorTexto}>{textos[fase]}</Text>
        {fase === 'error'
          ? <Boton texto="Reintentar" onPress={() => { setFase('cargando'); cargar(); }} />
          : <Boton texto="Volver" onPress={() => navigation.goBack()} />}
      </View>
    );
  }

  const editable = !curso || curso.estado === 'borrador';
  const estadoInfo = curso && !editable ? ESTADO_TXT[curso.estado] || [String(curso.estado).toUpperCase(), ''] : null;

  return (
    <PantallaForm titulo={curso ? curso.titulo : 'Nuevo curso'} subtitulo={editable ? 'Completá los datos, armá el temario y enviálo a revisión.' : null}>
      {curso && editable && !!curso.nota_revision && (
        <Aviso error texto={'Te devolvimos el curso para que lo corrijas: ' + curso.nota_revision} />
      )}
      {estadoInfo && (
        <Caja>
          <View style={styles.pill}><Text style={styles.pillTexto}>{estadoInfo[0]}</Text></View>
          <Text style={styles.texto}>{estadoInfo[1]}</Text>
        </Caja>
      )}

      <SeccionDatos
        key={curso ? 'c-' + curso.id : 'nuevo'}
        curso={curso}
        editable={editable}
        categorias={categorias}
        escalones={escalones}
        uid={uid}
        bloqueado={hayAlguna}
        marcarSubida={marcarSubida}
        recargar={recargar}
        onCreado={(id) => navigation.replace('EditarCurso', { id })}
      />

      {curso ? (
        <SeccionTemario curso={curso} editable={editable} bloqueado={hayAlguna} marcarSubida={marcarSubida} recargar={recargar} />
      ) : (
        <Caja>
          <Text style={styles.h2}>2. Temario</Text>
          <Text style={styles.texto}>Guardá primero los datos del curso y después vas a poder cargar módulos y clases.</Text>
        </Caja>
      )}

      {curso && editable && (
        <SeccionEnviar curso={curso} bloqueado={hayAlguna} navigation={navigation} />
      )}
    </PantallaForm>
  );
}

/* ================= 1. DATOS ================= */
function SeccionDatos({ curso, editable, categorias, escalones, uid, bloqueado, marcarSubida, recargar, onCreado }) {
  const c = curso || {};
  const [titulo, setTitulo] = useState(c.titulo || '');
  const [sub, setSub] = useState(c.subtitulo || '');
  const [desc, setDesc] = useState(c.descripcion || '');
  const [catId, setCatId] = useState(c.categoria_id || null);
  const [precio, setPrecio] = useState(c.precio_usd || null);
  const [aprender, setAprender] = useState((c.aprenderas || []).join('\n'));
  const [req, setReq] = useState((c.requisitos || []).join('\n'));
  const [portadaLocal, setPortadaLocal] = useState(null); // portada elegida antes de crear el curso
  const [subiendoPortada, setSubiendoPortada] = useState(null); // null o porcentaje
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);

  async function elegirPortada() {
    if (bloqueado) return Alert.alert('Esperá un momento', 'Hay una subida en curso. Esperá a que termine.');
    setAviso(null);
    let r;
    try {
      r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.85 });
    } catch (e) {
      return setAviso({ texto: 'No pudimos abrir la galería: ' + mensaje(e), error: true });
    }
    if (r.canceled) return;
    const a = r.assets[0];
    const mime = a.mimeType || 'image/jpeg';
    if (!TIPOS_PORTADA.includes(mime)) return setAviso({ texto: 'La portada tiene que ser JPG, PNG o WebP.', error: true });
    if (a.fileSize && a.fileSize > MAX_PORTADA) return setAviso({ texto: 'La portada pesa más de 5 MB.', error: true });
    const elegida = { uri: a.uri, mime };
    if (!curso) { setPortadaLocal(elegida); return; }
    await subirYFijar(elegida, curso.id);
  }

  // Sube la portada, la guarda en el curso y borra la anterior
  async function subirYFijar(p, id) {
    const vieja = curso ? rutaDePortada(curso.portada_url) : null;
    marcarSubida(true);
    setSubiendoPortada(0);
    try {
      const { ruta, url } = await subirPortada({ uri: p.uri, mime: p.mime, uid, cursoId: id, onProgreso: setSubiendoPortada });
      try { await fijarPortada(id, url); } catch (e) { borrarPortada(ruta); throw e; }
      if (vieja) borrarPortada(vieja);
      await recargar();
    } finally {
      setSubiendoPortada(null);
      marcarSubida(false);
    }
  }

  async function guardar() {
    const t = titulo.trim().replace(/\s+/g, ' ');
    if (t.length < 4) return setAviso({ texto: 'Poné un título para el curso (mínimo 4 letras).', error: true });
    if (!catId) return setAviso({ texto: 'Elegí una categoría.', error: true });
    const campos = {
      titulo: t, subtitulo: sub.trim() || null, descripcion: desc.trim() || null,
      categoria_id: catId, precio_usd: precio || null, aprenderas: lineas(aprender), requisitos: lineas(req),
    };
    setGuardando(true);
    setAviso(null);
    try {
      if (!curso) {
        const id = await crearCurso(campos);
        if (portadaLocal) {
          try { await subirYFijar(portadaLocal, id); } catch (e) { Alert.alert('Curso creado', 'No pudimos subir la portada (' + mensaje(e) + '). La podés cargar de nuevo desde acá.'); }
        }
        onCreado(id);
      } else {
        await guardarCurso(curso.id, campos);
        await recargar();
        setAviso({ texto: 'Datos guardados.', error: false });
      }
    } catch (e) {
      setAviso({ texto: 'No se pudo guardar: ' + mensaje(e), error: true });
    } finally {
      setGuardando(false);
    }
  }

  const portadaUri = portadaLocal?.uri || c.portada_url;
  return (
    <Caja>
      <Text style={styles.h2}>1. Datos del curso</Text>
      <Campo etiqueta="Título" value={titulo} onChangeText={setTitulo} maxLength={100} editable={editable} placeholder="Ej.: Marketing digital desde cero" />
      <Campo etiqueta="Subtítulo" value={sub} onChangeText={setSub} maxLength={140} editable={editable} placeholder="Una frase que explique para qué sirve" ayuda="Opcional pero recomendado: aparece debajo del título en el feed." />
      <Campo etiqueta="Descripción" value={desc} onChangeText={setDesc} maxLength={4000} editable={editable} multilinea placeholder="Contá de qué trata el curso, a quién le sirve y qué se van a llevar." />

      <View style={{ gap: 8 }}>
        <Text style={styles.etiqueta}>Categoría</Text>
        <Chips opciones={categorias.map((k) => ({ valor: k.id, etiqueta: k.nombre }))} valor={catId} onElegir={setCatId} deshabilitado={!editable} />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.etiqueta}>Precio</Text>
        <Chips
          opciones={escalones.map((e) => ({ valor: e.precio_web_usd, etiqueta: 'USD ' + e.precio_web_usd }))}
          valor={precio}
          onElegir={setPrecio}
          deshabilitado={!editable}
        />
        <Text style={styles.ayuda}>
          {precio
            ? 'Web: USD ' + precio + ' · App: USD ' + Number((escalones.find((e) => e.precio_web_usd === precio) || {}).precio_app_usd || 0).toFixed(2).replace('.', ',')
            : 'Elegís el precio web; el de la app se calcula solo.'}
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.etiqueta}>Portada</Text>
        <View style={styles.portada}>
          {portadaUri ? <Image source={{ uri: portadaUri }} style={styles.portadaImg} resizeMode="cover" /> : <Text style={styles.ayuda}>Sin portada todavía</Text>}
        </View>
        {subiendoPortada !== null && <Text style={styles.estado}>Subiendo… {subiendoPortada}%</Text>}
        {editable && subiendoPortada === null && (
          <View style={styles.fila}>
            <BotonChico texto={portadaUri ? 'Cambiar portada' : 'Elegir portada'} lima={!portadaUri} onPress={elegirPortada} />
          </View>
        )}
        {!!portadaLocal && !curso && <Text style={styles.ayuda}>Se sube cuando guardes los datos.</Text>}
        <Text style={styles.ayuda}>JPG, PNG o WebP · hasta 5 MB · proporción 16:9 (por ejemplo 1280 × 720).</Text>
      </View>

      <Campo etiqueta="Qué se aprende" value={aprender} onChangeText={setAprender} maxLength={2500} editable={editable} multilinea ayuda="Una cosa por línea." placeholder={'Armar una campaña en redes\nMedir resultados'} />
      <Campo etiqueta="Requisitos" value={req} onChangeText={setReq} maxLength={2500} editable={editable} multilinea ayuda="Una por línea. Dejalo vacío si no hace falta nada." />

      <Aviso texto={aviso?.texto} error={aviso?.error} />
      {editable && <Boton texto={curso ? 'Guardar datos' : 'Guardar y seguir con el temario'} onPress={guardar} cargando={guardando} lima={!curso} />}
    </Caja>
  );
}

/* ================= 2. TEMARIO ================= */
function SeccionTemario({ curso, editable, bloqueado, marcarSubida, recargar }) {
  const mods = curso.modulos;

  async function accion(fn) {
    if (bloqueado) return Alert.alert('Esperá un momento', 'Hay una subida en curso. Esperá a que termine.');
    try { await fn(); await recargar(); } catch (e) { Alert.alert('No se pudo completar', mensaje(e)); }
  }

  const agregarModulo = () => accion(() => {
    const n = mods.length;
    const orden = n ? Math.max(...mods.map((m) => m.orden)) + 1 : 0;
    return crearModulo(curso.id, 'Módulo ' + (n + 1), orden);
  });

  return (
    <Caja>
      <Text style={styles.h2}>2. Temario</Text>
      <Text style={styles.texto}>
        {editable ? 'Armá los módulos y, dentro de cada uno, las clases. Cada clase lleva un video y un PDF que subís desde tu celular.' : 'Contenido del curso.'}
      </Text>
      {!mods.length && <Text style={styles.vacio}>Todavía no hay módulos. Agregá el primero.</Text>}
      {mods.map((m, i) => (
        <TarjetaModulo
          key={m.id}
          m={m}
          i={i}
          lista={mods}
          editable={editable}
          bloqueado={bloqueado}
          accion={accion}
          marcarSubida={marcarSubida}
          recargar={recargar}
        />
      ))}
      {editable && <Boton texto="＋ Agregar módulo" onPress={agregarModulo} lima />}
    </Caja>
  );
}

function TarjetaModulo({ m, i, lista, editable, bloqueado, accion, marcarSubida, recargar }) {
  const mover = (dir) => accion(() => intercambiarOrden('modulos', m, lista[i + dir]));

  function borrar() {
    Alert.alert('Borrar módulo', `¿Borrar "${m.titulo}" con sus ${m.clases.length} clases y sus archivos? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar', style: 'destructive',
        onPress: () => accion(async () => {
          const rutas = m.clases.reduce((a, cl) => sumar(a, rutasDeClase(cl)), { video_uids: [], archivos: [] });
          await borrarModulo(m.id);
          borrarRemoto(rutas);
        }),
      },
    ]);
  }

  const agregarClase = () => accion(() => {
    const n = m.clases.length;
    const orden = n ? Math.max(...m.clases.map((c) => c.orden)) + 1 : 0;
    return crearClase(m.id, 'Clase ' + (n + 1), orden);
  });

  if (!editable) {
    return (
      <View style={styles.modulo}>
        <Text style={styles.h3}>{i + 1}. {m.titulo}</Text>
        {m.clases.map((cl) => (
          <Text key={cl.id} style={styles.texto}>
            • {cl.titulo} — {cl.contenido?.video_uid ? 'video ✓' : 'sin video'} · {cl.contenido?.archivo_path ? 'PDF ✓' : 'sin PDF'}
            {cl.duracion_seg ? ' · ' + duracionClase(cl.duracion_seg) : ''}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.modulo}>
      <CampoGuardable
        etiqueta={`Módulo ${i + 1}`}
        valor={m.titulo}
        maxLength={100}
        onGuardar={async (t) => {
          const limpio = t.trim().replace(/\s+/g, ' ');
          if (!limpio) throw new Error('El módulo necesita un título.');
          await renombrarModulo(m.id, limpio);
          await recargar();
        }}
        onError={(e) => Alert.alert('No se pudo guardar', mensaje(e))}
      />
      <View style={styles.fila}>
        <BotonChico texto="↑ Subir" suave deshabilitado={i === 0} onPress={() => mover(-1)} />
        <BotonChico texto="↓ Bajar" suave deshabilitado={i === lista.length - 1} onPress={() => mover(1)} />
        <BotonChico texto="Borrar módulo" mal onPress={borrar} />
      </View>
      {!m.clases.length && <Text style={styles.vacio}>Este módulo todavía no tiene clases.</Text>}
      {m.clases.map((cl, k) => (
        <TarjetaClase key={cl.id} cl={cl} k={k} lista={m.clases} bloqueado={bloqueado} accion={accion} marcarSubida={marcarSubida} recargar={recargar} />
      ))}
      <BotonChico texto="＋ Agregar clase" onPress={agregarClase} />
    </View>
  );
}

function TarjetaClase({ cl, k, lista, bloqueado, accion, marcarSubida, recargar }) {
  const mover = (dir) => accion(() => intercambiarOrden('clases', cl, lista[k + dir]));
  const guardarCampo = async (cambios) => { await actualizarClase(cl.id, cambios); await recargar(); };

  function borrar() {
    Alert.alert('Borrar clase', `¿Borrar "${cl.titulo}" y sus archivos? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar', style: 'destructive',
        onPress: () => accion(async () => {
          const rutas = rutasDeClase(cl);
          await borrarClase(cl.id);
          borrarRemoto(rutas);
        }),
      },
    ]);
  }

  return (
    <View style={styles.clase}>
      <Text style={styles.h3}>Clase {k + 1}{cl.duracion_seg ? ' · ' + duracionClase(cl.duracion_seg) : ''}</Text>
      <CampoGuardable
        etiqueta="Título"
        valor={cl.titulo}
        maxLength={120}
        onGuardar={async (t) => {
          const limpio = t.trim().replace(/\s+/g, ' ');
          if (!limpio) throw new Error('La clase necesita un título.');
          await guardarCampo({ titulo: limpio });
        }}
        onError={(e) => Alert.alert('No se pudo guardar', mensaje(e))}
      />
      <CampoGuardable
        etiqueta="Descripción"
        valor={cl.descripcion || ''}
        maxLength={1000}
        multilinea
        placeholder="Descripción de la clase (opcional)"
        onGuardar={(t) => guardarCampo({ descripcion: t.trim() || null })}
        onError={(e) => Alert.alert('No se pudo guardar', mensaje(e))}
      />
      <SlotArchivo tipo="video" clase={cl} editable bloqueado={bloqueado} onSubiendo={marcarSubida} onCambio={recargar} />
      <SlotArchivo tipo="pdf" clase={cl} editable bloqueado={bloqueado} onSubiendo={marcarSubida} onCambio={recargar} />
      <View style={styles.filaSwitch}>
        <Switch
          value={!!cl.es_vista_previa}
          onValueChange={async (v) => { try { await guardarCampo({ es_vista_previa: v }); } catch (e) { Alert.alert('No se pudo guardar', mensaje(e)); } }}
          trackColor={{ false: '#cfcabb', true: colores.negro }}
          thumbColor={colores.blanco}
        />
        <Text style={styles.textoSwitch}>Vista previa gratis (cualquiera puede ver esta clase antes de comprar)</Text>
      </View>
      <View style={styles.fila}>
        <BotonChico texto="↑" suave deshabilitado={k === 0} onPress={() => mover(-1)} />
        <BotonChico texto="↓" suave deshabilitado={k === lista.length - 1} onPress={() => mover(1)} />
        <BotonChico texto="Borrar clase" mal onPress={borrar} />
      </View>
    </View>
  );
}

/* ================= 3. ENVIAR ================= */
function SeccionEnviar({ curso, bloqueado, navigation }) {
  const [enviando, setEnviando] = useState(false);
  const pendientes = pendientesDeEnvio(curso);
  const completo = pendientes.every((p) => p[0]);

  function enviar() {
    if (bloqueado) return Alert.alert('Esperá un momento', 'Hay una subida en curso. Esperá a que termine.');
    Alert.alert('Enviar a revisión', 'Una vez enviado no vas a poder editar el curso hasta que lo revisemos. ¿Enviarlo ahora?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Enviar',
        onPress: async () => {
          setEnviando(true);
          try {
            await enviarARevision(curso.id);
            Alert.alert('¡Listo!', 'Tu curso fue enviado a revisión.');
            navigation.goBack();
          } catch (e) {
            Alert.alert('No se pudo enviar', mensaje(e));
          } finally {
            setEnviando(false);
          }
        },
      },
    ]);
  }

  function borrar() {
    if (bloqueado) return Alert.alert('Esperá un momento', 'Hay una subida en curso. Esperá a que termine.');
    Alert.alert('Borrar borrador', `¿Borrar el curso "${curso.titulo}" con todo su contenido? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar', style: 'destructive',
        onPress: async () => {
          try {
            const rutas = curso.modulos.reduce((a, m) => m.clases.reduce((b, cl) => sumar(b, rutasDeClase(cl)), a), { video_uids: [], archivos: [] });
            const portada = rutaDePortada(curso.portada_url);
            await borrarCurso(curso.id);
            borrarRemoto(rutas);
            if (portada) borrarPortada(portada);
            navigation.goBack();
          } catch (e) {
            Alert.alert('No se pudo borrar', mensaje(e));
          }
        },
      },
    ]);
  }

  return (
    <Caja>
      <Text style={styles.h2}>3. Enviar a revisión</Text>
      <Text style={styles.texto}>Para poder enviarlo, el curso tiene que estar completo. Guardá los datos antes de enviar.</Text>
      <View style={{ gap: 6 }}>
        {pendientes.map((p, i) => (
          <Text key={i} style={[styles.check, { color: p[0] ? '#37500A' : '#8a1f12' }]}>{p[0] ? '✓' : '○'}  {p[1]}</Text>
        ))}
      </View>
      <Boton texto="Enviar a revisión" onPress={enviar} cargando={enviando} lima deshabilitado={!completo} />
      <BotonChico texto="Borrar este borrador" mal onPress={borrar} />
    </Caja>
  );
}

const styles = StyleSheet.create({
  h2: { fontFamily: fuentes.extra, fontSize: 17, color: colores.negro },
  h3: { fontFamily: fuentes.extra, fontSize: 14, color: colores.negro },
  texto: { fontFamily: fuentes.medio, fontSize: 14, lineHeight: 21, color: colores.negro },
  vacio: { fontFamily: fuentes.medio, fontSize: 13, color: colores.tintaSuave },
  etiqueta: { fontFamily: fuentes.extra, fontSize: 12, letterSpacing: 0.4, color: colores.negro },
  ayuda: { fontFamily: fuentes.medio, fontSize: 12, color: colores.tintaSuave },
  estado: { fontFamily: fuentes.semi, fontSize: 13, color: colores.negro },
  check: { fontFamily: fuentes.semi, fontSize: 14 },
  errorTexto: { fontFamily: fuentes.semi, fontSize: 15, color: colores.negro, marginBottom: 16, textAlign: 'center' },
  pill: { alignSelf: 'flex-start', backgroundColor: colores.negro, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 },
  pillTexto: { fontFamily: fuentes.extra, fontSize: 10, letterSpacing: 0.8, color: colores.crema },
  fila: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filaSwitch: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textoSwitch: { flex: 1, fontFamily: fuentes.medio, fontSize: 12, color: colores.negro },
  portada: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colores.borde, backgroundColor: colores.crema, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  portadaImg: { width: '100%', height: '100%' },
  modulo: { borderWidth: 1.5, borderColor: colores.negro, borderRadius: 16, padding: 14, gap: 12, backgroundColor: colores.blanco },
  clase: { borderWidth: 1, borderColor: colores.borde, borderRadius: 14, padding: 12, gap: 12, backgroundColor: colores.blanco },
});
