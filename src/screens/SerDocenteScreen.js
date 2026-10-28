// SerDocenteScreen.js — solicitud para ser docente. El estado (pendiente / aprobado / rechazado)
// solo lo cambia el admin; acá la persona envía su nombre público y su biografía.
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Aviso, Boton, Caja, Campo, PantallaForm, estilosForm } from '../components/FormularioBase';
import { actualizarDatosDocente, enviarSolicitudDocente, obtenerPerfil, obtenerSolicitudDocente } from '../lib/cuenta';
import { fechaCorta } from '../lib/formato';
import { colores, fuentes } from '../theme';

const ESTADOS = {
  pendiente: { pill: 'EN REVISIÓN', lima: false, texto: 'Recibimos tu solicitud. La estamos revisando y apenas se resuelva vas a verlo acá.' },
  aprobado: { pill: 'APROBADO', lima: true, texto: '¡Ya sos docente de Modo On! Tu nombre público y tu bio aparecen en tus cursos.' },
  suspendido: { pill: 'SUSPENDIDO', lima: false, texto: 'Tu cuenta de docente está suspendida por ahora. Escribinos si querés saber más.' },
  rechazado: { pill: 'NO APROBADO', lima: false, texto: 'Esta vez no pudimos aprobar tu solicitud. Escribinos si querés revisarla juntos.' },
};

export default function SerDocenteScreen() {
  const [solicitud, setSolicitud] = useState(null);
  const [nombre, setNombre] = useState('');
  const [bio, setBio] = useState('');
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([obtenerSolicitudDocente(), obtenerPerfil().catch(() => null)]);
      setSolicitud(s);
      setNombre(s ? s.nombre_publico : p?.nombre || '');
      setBio(s ? s.bio_publica || '' : '');
      setEstado('ok');
    } catch (e) {
      console.log('Error cargando la solicitud de docente:', e);
      setEstado('error');
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function enviar() {
    const n = nombre.trim().replace(/\s+/g, ' ');
    const b = bio.trim();
    if (n.length < 2) return setAviso({ texto: 'Escribí tu nombre público.', error: true });
    if (!solicitud && b.length < 20) return setAviso({ texto: 'Contanos un poco más sobre vos (mínimo 20 caracteres).', error: true });
    setEnviando(true);
    setAviso(null);
    try {
      if (solicitud) {
        await actualizarDatosDocente({ nombre: n, bio: b });
        setAviso({ texto: 'Listo, guardamos los cambios.', error: false });
      } else {
        await enviarSolicitudDocente({ nombre: n, bio: b });
        await cargar();
      }
    } catch (e) {
      setAviso({ texto: e?.code === '23505' ? 'Ya enviaste una solicitud.' : 'No pudimos enviarla: ' + (e?.message || e), error: true });
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

  const info = solicitud ? ESTADOS[solicitud.estado] || { pill: String(solicitud.estado).toUpperCase(), lima: false, texto: '' } : null;
  const puedeEditar = !solicitud || solicitud.estado === 'pendiente' || solicitud.estado === 'aprobado';

  return (
    <PantallaForm titulo="Ser docente" subtitulo="Enseñá lo que sabés. Revisamos cada solicitud antes de aprobarla.">
      {info ? (
        <Caja>
          <View style={styles.filaEstado}>
            <View style={[styles.pill, info.lima && styles.pillLima]}>
              <Text style={[styles.pillTexto, info.lima && { color: colores.negro }]}>{info.pill}</Text>
            </View>
            <Text style={styles.fecha}>Solicitud del {fechaCorta(solicitud.creado_en)}</Text>
          </View>
          <Text style={styles.textoEstado}>{info.texto}</Text>
        </Caja>
      ) : (
        <Caja>
          {['Publicás tus cursos con tu nombre y tu bio.', 'Revisamos tu solicitud antes de aprobarla.', 'Si te aprueban, ya podés empezar a armar tu primer curso.'].map((t) => (
            <View key={t} style={styles.filaCheck}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.textoCheck}>{t}</Text>
            </View>
          ))}
        </Caja>
      )}

      {puedeEditar && (
        <Caja>
          <Text style={styles.tituloForm}>{solicitud ? 'Tus datos de docente' : 'Completá tu solicitud'}</Text>
          <Campo etiqueta="Nombre público" value={nombre} onChangeText={setNombre} maxLength={80} placeholder="Cómo querés que te vean los alumnos" />
          <Campo
            etiqueta="Biografía"
            value={bio}
            onChangeText={setBio}
            maxLength={600}
            multilinea
            placeholder="Contanos qué enseñás y tu experiencia"
            ayuda="Hasta 600 caracteres. La ven los alumnos."
          />
          <Aviso texto={aviso?.texto} error={aviso?.error} />
          <Boton texto={solicitud ? 'Guardar cambios' : 'Enviar solicitud'} onPress={enviar} cargando={enviando} lima={!solicitud} />
        </Caja>
      )}
    </PantallaForm>
  );
}

const styles = StyleSheet.create({
  filaEstado: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pill: { backgroundColor: colores.negro, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 },
  pillLima: { backgroundColor: colores.lima },
  pillTexto: { fontFamily: fuentes.extra, fontSize: 10, letterSpacing: 0.8, color: colores.crema },
  fecha: { fontFamily: fuentes.medio, fontSize: 12, color: colores.tintaSuave },
  textoEstado: { fontFamily: fuentes.medio, fontSize: 14, lineHeight: 21, color: colores.negro },
  filaCheck: { flexDirection: 'row', gap: 12 },
  check: { fontFamily: fuentes.extra, fontSize: 14, color: colores.negro },
  textoCheck: { flex: 1, fontFamily: fuentes.medio, fontSize: 14, lineHeight: 20, color: colores.negro },
  tituloForm: { fontFamily: fuentes.extra, fontSize: 17, color: colores.negro },
  errorTexto: { fontFamily: fuentes.semi, fontSize: 15, color: colores.negro, marginBottom: 16, textAlign: 'center' },
});
