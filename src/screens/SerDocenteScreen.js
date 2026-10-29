// SerDocenteScreen.js — centro del docente: solicitud + tus cursos.
// Para evaluar a alguien necesitamos ver su curso: la solicitud arranca con el nombre público y enseguida
// se carga el curso completo (video y PDF en cada clase). El estado (pendiente / aprobado / rechazado)
// solo lo cambia el admin. Igual que en la web.
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Aviso, Boton, BotonChico, Caja, Campo, PantallaForm, estilosForm } from '../components/FormularioBase';
import { actualizarDatosDocente, enviarSolicitudDocente, obtenerPerfil, obtenerSolicitudDocente } from '../lib/cuenta';
import { misCursosDocente } from '../lib/docente';
import { fechaCorta } from '../lib/formato';
import { colores, fuentes } from '../theme';

const ESTADO_CURSO = { borrador: 'BORRADOR', en_revision: 'EN REVISIÓN', publicado: 'PUBLICADO', pausado: 'PAUSADO' };

function textoEstado(doc, cursos) {
  if (doc.estado === 'aprobado') return ['APROBADO', '¡Ya sos docente de Modo On! Podés crear y enviar cursos para que los revisemos.', true];
  if (doc.estado === 'suspendido') return ['SUSPENDIDO', 'Tu cuenta de docente está suspendida por ahora. Escribinos si querés saber más.'];
  if (doc.estado === 'rechazado') return ['NO APROBADO', 'Esta vez no pudimos aprobar tu solicitud. Escribinos si querés revisarla juntos.'];
  const enRev = cursos.some((c) => c.estado === 'en_revision');
  const publicado = cursos.some((c) => c.estado === 'publicado');
  if (enRev || publicado) return ['EN REVISIÓN', 'Recibimos tu curso y lo estamos revisando. Apenas se resuelva, vas a verlo acá.'];
  if (cursos.length) return ['EN PREPARACIÓN', 'Tenés un curso en borrador. Completalo (con video y PDF en cada clase) y enviálo a revisión: es lo que evaluamos para aprobar tu solicitud.'];
  return ['FALTA TU CURSO', 'Para evaluar tu solicitud necesitamos ver tu curso. Cargalo completo y enviálo a revisión.'];
}

export default function SerDocenteScreen({ navigation }) {
  const [solicitud, setSolicitud] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [bio, setBio] = useState('');
  const [editando, setEditando] = useState(false);
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([obtenerSolicitudDocente(), obtenerPerfil().catch(() => null)]);
      setSolicitud(s);
      setCursos(s ? await misCursosDocente() : []);
      setNombre(s ? s.nombre_publico : p?.nombre || '');
      setBio(s ? s.bio_publica || '' : '');
      setEstado('ok');
    } catch (e) {
      console.log('Error cargando el centro del docente:', e);
      setEstado('error');
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function empezar() {
    const n = nombre.trim().replace(/\s+/g, ' ');
    if (n.length < 2) return setAviso({ texto: 'Escribí tu nombre público.', error: true });
    setEnviando(true);
    setAviso(null);
    try {
      await enviarSolicitudDocente({ nombre: n, bio: bio.trim() });
      await cargar();
      navigation.navigate('EditarCurso');
    } catch (e) {
      setAviso({ texto: e?.code === '23505' ? 'Ya enviaste una solicitud.' : 'No pudimos enviarla: ' + (e?.message || e), error: true });
    } finally {
      setEnviando(false);
    }
  }

  async function guardarDatos() {
    const n = nombre.trim().replace(/\s+/g, ' ');
    if (n.length < 2) return setAviso({ texto: 'Escribí tu nombre público.', error: true });
    setEnviando(true);
    setAviso(null);
    try {
      await actualizarDatosDocente({ nombre: n, bio: bio.trim() });
      setSolicitud({ ...solicitud, nombre_publico: n, bio_publica: bio.trim() || null });
      setAviso({ texto: 'Listo, guardamos los cambios.', error: false });
    } catch (e) {
      setAviso({ texto: 'No pudimos guardar: ' + (e?.message || e), error: true });
    } finally {
      setEnviando(false);
    }
  }

  if (estado === 'cargando') return <View style={estilosForm.centro}><ActivityIndicator color={colores.negro} /></View>;
  if (estado === 'error') {
    return (
      <View style={estilosForm.centro}>
        <Text style={styles.errorTexto}>No pudimos cargar esta sección.</Text>
        <Boton texto="Reintentar" onPress={() => { setEstado('cargando'); cargar(); }} />
      </View>
    );
  }

  /* ---------- Sin solicitud todavía ---------- */
  if (!solicitud) {
    return (
      <PantallaForm titulo="Ser docente" subtitulo="Enseñá lo que sabés. Revisamos cada curso antes de publicarlo.">
        <Caja>
          {[
            'Contanos cómo te llamás (nombre público).',
            'Cargá tu curso completo: datos, portada y, en cada clase, un video y un PDF.',
            'Lo revisamos. Si está bien, publicamos tu curso y quedás como docente.',
          ].map((t, i) => (
            <View key={t} style={styles.filaCheck}>
              <Text style={styles.check}>{i + 1}</Text>
              <Text style={styles.textoCheck}>{t}</Text>
            </View>
          ))}
        </Caja>
        <Caja>
          <Text style={styles.tituloForm}>Tus datos</Text>
          <Campo etiqueta="Nombre público" value={nombre} onChangeText={setNombre} maxLength={80} placeholder="Cómo querés que te vean los alumnos" />
          <Campo etiqueta="Sobre vos (opcional)" value={bio} onChangeText={setBio} maxLength={600} multilinea placeholder="Opcional: contanos algo sobre vos" ayuda="Hasta 600 caracteres. La ven los alumnos." />
          <Aviso texto={aviso?.texto} error={aviso?.error} />
          <Boton texto="Empezar y cargar mi curso" onPress={empezar} cargando={enviando} lima />
        </Caja>
      </PantallaForm>
    );
  }

  /* ---------- Con solicitud ---------- */
  const e = textoEstado(solicitud, cursos);
  const activo = solicitud.estado === 'pendiente' || solicitud.estado === 'aprobado';

  return (
    <PantallaForm titulo="Ser docente" subtitulo="Tu solicitud y tus cursos.">
      <Caja>
        <View style={styles.filaEstado}>
          <View style={[styles.pill, e[2] && styles.pillLima]}>
            <Text style={[styles.pillTexto, e[2] && { color: colores.negro }]}>{e[0]}</Text>
          </View>
          <Text style={styles.fecha}>Solicitud del {fechaCorta(solicitud.creado_en)}</Text>
        </View>
        <Text style={styles.textoEstado}>{e[1]}</Text>
      </Caja>

      {activo && (
        <Caja>
          <Text style={styles.tituloForm}>Tus cursos</Text>
          {!cursos.length && <Text style={styles.textoEstado}>Todavía no cargaste ningún curso.</Text>}
          {cursos.map((c) => {
            const editable = c.estado === 'borrador';
            return (
              <Pressable
                key={c.id}
                onPress={() => navigation.navigate('EditarCurso', { id: c.id })}
                style={({ pressed }) => [styles.curso, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.cursoTitulo} numberOfLines={2}>{c.titulo || 'Sin título'}</Text>
                  <View style={styles.filaEstado}>
                    <View style={styles.pillChica}><Text style={styles.pillChicaTexto}>{ESTADO_CURSO[c.estado] || c.estado}</Text></View>
                    <Text style={styles.fecha}>Actualizado el {fechaCorta(c.actualizado_en)}</Text>
                  </View>
                  {editable && !!c.nota_revision && <Text style={styles.devuelto}>Devuelto: {c.nota_revision}</Text>}
                </View>
                <Text style={styles.cursoAccion}>{editable ? 'Editar ›' : 'Ver ›'}</Text>
              </Pressable>
            );
          })}
          <Boton texto="＋ Crear un curso" onPress={() => navigation.navigate('EditarCurso')} lima />
        </Caja>
      )}

      {activo && (
        <Caja>
          <Text style={styles.tituloForm}>Mis datos de docente</Text>
          {editando ? (
            <>
              <Campo etiqueta="Nombre público" value={nombre} onChangeText={setNombre} maxLength={80} />
              <Campo etiqueta="Sobre vos" value={bio} onChangeText={setBio} maxLength={600} multilinea placeholder="Opcional" />
              <Aviso texto={aviso?.texto} error={aviso?.error} />
              <Boton texto="Guardar cambios" onPress={guardarDatos} cargando={enviando} lima />
            </>
          ) : (
            <>
              <Text style={styles.textoEstado}>{solicitud.nombre_publico}</Text>
              <BotonChico texto="Editar mis datos" suave onPress={() => { setAviso(null); setEditando(true); }} />
            </>
          )}
        </Caja>
      )}
    </PantallaForm>
  );
}

const styles = StyleSheet.create({
  filaEstado: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  pill: { backgroundColor: colores.negro, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 },
  pillLima: { backgroundColor: colores.lima },
  pillTexto: { fontFamily: fuentes.extra, fontSize: 10, letterSpacing: 0.8, color: colores.crema },
  pillChica: { backgroundColor: colores.borde, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  pillChicaTexto: { fontFamily: fuentes.extra, fontSize: 9, letterSpacing: 0.6, color: colores.apagado },
  fecha: { fontFamily: fuentes.medio, fontSize: 12, color: colores.tintaSuave },
  textoEstado: { fontFamily: fuentes.medio, fontSize: 14, lineHeight: 21, color: colores.negro },
  filaCheck: { flexDirection: 'row', gap: 12 },
  check: { fontFamily: fuentes.extra, fontSize: 14, color: colores.negro },
  textoCheck: { flex: 1, fontFamily: fuentes.medio, fontSize: 14, lineHeight: 20, color: colores.negro },
  tituloForm: { fontFamily: fuentes.extra, fontSize: 17, color: colores.negro },
  errorTexto: { fontFamily: fuentes.semi, fontSize: 15, color: colores.negro, marginBottom: 16, textAlign: 'center' },
  curso: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colores.borde, borderRadius: 14, padding: 12, backgroundColor: colores.crema },
  cursoTitulo: { fontFamily: fuentes.extra, fontSize: 15, color: colores.negro },
  cursoAccion: { fontFamily: fuentes.semi, fontSize: 13, color: colores.negro },
  devuelto: { fontFamily: fuentes.semi, fontSize: 12, color: '#8a1f12' },
});
