// CursoScreen.js — página de cada curso.
// Arriba repite la tarjeta (portada, título, sinopsis, docente, valoraciones,
// última actualización) y después: lo que aprenderás, qué incluye, contenido
// (plan de estudios), requisitos, descripción, docente, valoraciones y
// "los estudiantes también compraron". Barra de compra fija abajo.

import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Portada from '../components/Portada';
import Estrellas from '../components/Estrellas';
import TarjetaCompacta from '../components/TarjetaCompacta';
import { obtenerCursoDetalle, obtenerTambienCompraron } from '../lib/cursosApi';
import { duracionClase, duracionLarga, estudiantesTexto, fechaCorta, mesAnio, precioTexto } from '../lib/formato';
import { colores, fuentes } from '../theme';

function Seccion({ titulo, children }) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

function IconoClase({ tipo }) {
  const nombre = tipo === 'video' ? 'play-circle-outline' : tipo === 'pdf' ? 'document-text-outline' : 'download-outline';
  return <Ionicons name={nombre} size={20} color={colores.tintaSuave} />;
}

export default function CursoScreen({ route, navigation }) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const [datos, setDatos] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error | noexiste
  const [abiertos, setAbiertos] = useState({});
  const [descCompleta, setDescCompleta] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const d = await obtenerCursoDetalle(id);
        if (!vivo) return;
        if (!d) return setEstado('noexiste');
        setDatos(d);
        if (d.modulos[0]) setAbiertos({ [d.modulos[0].id]: true }); // el primer módulo viene abierto
        setEstado('ok');
        obtenerTambienCompraron(d.curso).then((r) => vivo && setRelacionados(r)).catch(() => {});
      } catch (e) {
        console.log('Error cargando el curso:', e);
        if (vivo) setEstado('error');
      }
    })();
    return () => { vivo = false; };
  }, [id]);

  if (estado === 'cargando') return <View style={styles.centro}><ActivityIndicator color={colores.negro} /></View>;
  if (estado !== 'ok') {
    return (
      <View style={styles.centro}>
        <Text style={styles.vacioTitulo}>{estado === 'noexiste' ? 'Este curso ya no está disponible' : 'No pudimos cargar el curso'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.botonVolver}><Text style={styles.botonVolverTexto}>Volver</Text></Pressable>
      </View>
    );
  }

  const { curso: c, descripcion, aprenderas, requisitos, modulos, resenas, docente, inscripto } = datos;
  const clases = modulos.flatMap((m) => m.clases);
  const segVideo = clases.filter((k) => k.tipo === 'video').reduce((s, k) => s + (k.duracion_seg || 0), 0);
  const descargables = clases.filter((k) => k.tipo !== 'video').length;
  const tieneNota = Number(c.cant_resenas) > 0;
  const estudiantes = estudiantesTexto(c.cant_estudiantes);
  const act = mesAnio(c.actualizado_en);

  const incluye = [
    segVideo > 0 && { icono: 'play-circle-outline', texto: `${duracionLarga(segVideo)} de video bajo demanda` },
    clases.length > 0 && { icono: 'list-outline', texto: `${clases.length} clases en ${modulos.length} ${modulos.length === 1 ? 'módulo' : 'módulos'}` },
    descargables > 0 && { icono: 'download-outline', texto: `${descargables} ${descargables === 1 ? 'recurso descargable' : 'recursos descargables'}` },
    { icono: 'infinite-outline', texto: 'Acceso de por vida' },
    { icono: 'phone-portrait-outline', texto: 'Acceso desde el celular' },
    { icono: 'ribbon-outline', texto: 'Certificado de finalización' },
  ].filter(Boolean);

  function alAccionPrincipal() {
    Alert.alert('Próximamente', inscripto
      ? 'El reproductor de clases llega en el próximo paso.'
      : 'El pago y la inscripción se activan en el próximo paso.');
  }

  return (
    <View style={styles.pantalla}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}>
        {/* ---- Parte de arriba: igual que la tarjeta del feed ---- */}
        <Portada uri={c.portada_url} />
        <View style={styles.cabecera}>
          {!!c.categoria_nombre && (
            <View style={styles.pillCategoria}><Text style={styles.pillCategoriaTexto}>{c.categoria_nombre.toUpperCase()}</Text></View>
          )}
          <Text style={styles.titulo}>{c.titulo}</Text>
          {!!c.subtitulo && <Text style={styles.sinopsis}>{c.subtitulo}</Text>}

          <View style={styles.filaNota}>
            {tieneNota ? (
              <>
                <Text style={styles.nota}>{Number(c.promedio).toFixed(1).replace('.', ',')}</Text>
                <Estrellas valor={Number(c.promedio)} size={16} />
                <Text style={styles.meta}>({c.cant_resenas} {Number(c.cant_resenas) === 1 ? 'valoración' : 'valoraciones'})</Text>
              </>
            ) : (
              <View style={styles.pillNuevo}><Text style={styles.pillNuevoTexto}>NUEVO</Text></View>
            )}
            {!!estudiantes && <Text style={styles.meta}>· {estudiantes}</Text>}
          </View>
          <Text style={styles.meta}>Creado por <Text style={styles.docenteNombre}>{c.docente_nombre}</Text></Text>
          {!!act && (
            <View style={styles.filaMeta}>
              <Ionicons name="refresh-outline" size={14} color={colores.tintaSuave} />
              <Text style={styles.meta}>Última actualización: {act}</Text>
            </View>
          )}
        </View>

        {/* ---- Lo que aprenderás ---- */}
        {aprenderas.length > 0 && (
          <Seccion titulo="Lo que aprenderás">
            <View style={styles.cajaBlanca}>
              {aprenderas.map((t, i) => (
                <View key={i} style={styles.filaCheck}>
                  <Ionicons name="checkmark" size={18} color={colores.negro} style={{ marginTop: 2 }} />
                  <Text style={styles.textoCheck}>{t}</Text>
                </View>
              ))}
            </View>
          </Seccion>
        )}

        {/* ---- Este curso incluye ---- */}
        <Seccion titulo="Este curso incluye">
          <View style={styles.cajaBlanca}>
            {incluye.map((it, i) => (
              <View key={i} style={styles.filaCheck}>
                <Ionicons name={it.icono} size={20} color={colores.negro} />
                <Text style={styles.textoCheck}>{it.texto}</Text>
              </View>
            ))}
          </View>
        </Seccion>

        {/* ---- Contenido del curso (plan de estudios) ---- */}
        <Seccion titulo="Contenido del curso">
          {modulos.length === 0 ? (
            <Text style={styles.texto}>El docente todavía está cargando las clases.</Text>
          ) : (
            <>
              <Text style={[styles.meta, { marginBottom: 10 }]}>
                {modulos.length} {modulos.length === 1 ? 'módulo' : 'módulos'} · {clases.length} {clases.length === 1 ? 'clase' : 'clases'}
                {segVideo > 0 ? ` · ${duracionLarga(segVideo)} en total` : ''}
              </Text>
              <View style={styles.cajaBlancaSinPad}>
                {modulos.map((m, idx) => {
                  const abierto = !!abiertos[m.id];
                  const seg = m.clases.reduce((s, k) => s + (k.duracion_seg || 0), 0);
                  return (
                    <View key={m.id} style={idx > 0 && styles.separador}>
                      <Pressable onPress={() => setAbiertos((a) => ({ ...a, [m.id]: !a[m.id] }))} style={styles.moduloCab} accessibilityRole="button">
                        <Ionicons name={abierto ? 'chevron-up' : 'chevron-down'} size={18} color={colores.negro} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.moduloTitulo}>{m.titulo}</Text>
                          <Text style={styles.meta}>{m.clases.length} {m.clases.length === 1 ? 'clase' : 'clases'}{seg > 0 ? ` · ${duracionLarga(seg)}` : ''}</Text>
                        </View>
                      </Pressable>
                      {abierto && m.clases.map((k) => (
                        <View key={k.id} style={styles.claseFila}>
                          <IconoClase tipo={k.tipo} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.claseTitulo}>{k.titulo}</Text>
                            {k.es_vista_previa && <Text style={styles.vistaPrevia}>Vista previa</Text>}
                          </View>
                          {!!duracionClase(k.duracion_seg) && <Text style={styles.meta}>{duracionClase(k.duracion_seg)}</Text>}
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </Seccion>

        {/* ---- Requisitos ---- */}
        {requisitos.length > 0 && (
          <Seccion titulo="Requisitos">
            {requisitos.map((t, i) => (
              <View key={i} style={styles.filaCheck}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.textoCheck}>{t}</Text>
              </View>
            ))}
          </Seccion>
        )}

        {/* ---- Descripción ---- */}
        {!!descripcion && (
          <Seccion titulo="Descripción">
            <Text style={styles.texto} numberOfLines={descCompleta ? undefined : 6}>{descripcion}</Text>
            {descripcion.length > 280 && (
              <Pressable onPress={() => setDescCompleta((v) => !v)} hitSlop={8}>
                <Text style={styles.verMas}>{descCompleta ? 'Ver menos' : 'Ver más'}</Text>
              </Pressable>
            )}
          </Seccion>
        )}

        {/* ---- Docente ---- */}
        <Seccion titulo="Docente">
          <View style={styles.docenteFila}>
            {docente?.avatar_url ? (
              <Image source={{ uri: docente.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarInicial]}>
                <Text style={styles.avatarLetra}>{(c.docente_nombre || '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.docenteTitulo}>{docente?.nombre_publico || c.docente_nombre}</Text>
              {!!docente?.bio_publica && <Text style={[styles.texto, { marginTop: 4 }]}>{docente.bio_publica}</Text>}
            </View>
          </View>
        </Seccion>

        {/* ---- Valoraciones ---- */}
        <Seccion titulo="Valoraciones">
          {tieneNota ? (
            <>
              <View style={styles.resumenNota}>
                <Text style={styles.notaGrande}>{Number(c.promedio).toFixed(1).replace('.', ',')}</Text>
                <View>
                  <Estrellas valor={Number(c.promedio)} size={18} />
                  <Text style={styles.meta}>{c.cant_resenas} {Number(c.cant_resenas) === 1 ? 'valoración' : 'valoraciones'}</Text>
                </View>
              </View>
              {resenas.slice(0, 5).map((r) => (
                <View key={r.id} style={styles.resena}>
                  <View style={styles.resenaCab}>
                    <Text style={styles.resenaNombre}>{r.autor_nombre}</Text>
                    <Text style={styles.meta}>{fechaCorta(r.creado_en)}</Text>
                  </View>
                  <Estrellas valor={r.calificacion} size={13} />
                  {!!r.comentario && <Text style={[styles.texto, { marginTop: 6 }]}>{r.comentario}</Text>}
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.texto}>Todavía no hay valoraciones. ¡Podés ser la primera persona en dejar una!</Text>
          )}
        </Seccion>

        {/* ---- Los estudiantes también compraron ---- */}
        {relacionados.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text style={[styles.seccionTitulo, { paddingHorizontal: 20 }]}>Los estudiantes también compraron</Text>
            <FlatList
              horizontal
              data={relacionados}
              keyExtractor={(r) => r.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingTop: 12 }}
              renderItem={({ item }) => <TarjetaCompacta curso={item} onPress={() => navigation.push('Curso', { id: item.id })} />}
            />
          </View>
        )}
      </ScrollView>

      {/* ---- Barra de compra fija ---- */}
      <View style={[styles.barra, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.barraPrecio}>{inscripto ? 'Ya es tuyo' : precioTexto(c)}</Text>
          {!inscripto && !c.es_gratis && <Text style={styles.barraNota}>Acceso de por vida</Text>}
        </View>
        <Pressable onPress={alAccionPrincipal} style={({ pressed }) => [styles.botonComprar, pressed && { opacity: 0.85 }]} accessibilityRole="button">
          <Text style={styles.botonComprarTexto}>{inscripto ? 'Ir al curso' : c.es_gratis ? 'Empezar gratis' : 'Comprar curso'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.crema },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.crema, padding: 32, gap: 16 },
  vacioTitulo: { fontFamily: fuentes.extra, fontSize: 18, color: colores.negro, textAlign: 'center' },
  botonVolver: { backgroundColor: colores.negro, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 28 },
  botonVolverTexto: { fontFamily: fuentes.semi, color: colores.crema, fontSize: 14 },

  cabecera: { padding: 20, gap: 8 },
  pillCategoria: { alignSelf: 'flex-start', backgroundColor: colores.negro, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 10 },
  pillCategoriaTexto: { fontFamily: fuentes.semi, fontSize: 10, letterSpacing: 1.2, color: colores.crema },
  titulo: { fontFamily: fuentes.extra, fontSize: 26, lineHeight: 31, letterSpacing: -0.6, color: colores.negro },
  sinopsis: { fontFamily: fuentes.texto, fontSize: 15, lineHeight: 23, color: colores.tintaSuave },
  filaNota: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  filaMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nota: { fontFamily: fuentes.extra, fontSize: 15, color: '#8A5A00' },
  meta: { fontFamily: fuentes.texto, fontSize: 13, color: colores.tintaSuave },
  docenteNombre: { fontFamily: fuentes.semi, color: colores.negro },
  pillNuevo: { backgroundColor: colores.lima, borderRadius: 99, paddingVertical: 3, paddingHorizontal: 9 },
  pillNuevoTexto: { fontFamily: fuentes.extra, fontSize: 10, letterSpacing: 1, color: colores.negro },

  seccion: { paddingHorizontal: 20, marginTop: 28 },
  seccionTitulo: { fontFamily: fuentes.extra, fontSize: 20, letterSpacing: -0.4, color: colores.negro, marginBottom: 12 },
  texto: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 22, color: colores.tintaSuave },
  verMas: { fontFamily: fuentes.semi, fontSize: 14, color: colores.negro, marginTop: 8, textDecorationLine: 'underline' },

  cajaBlanca: { backgroundColor: colores.blanco, borderRadius: 16, borderWidth: 1, borderColor: colores.borde, padding: 16, gap: 12 },
  cajaBlancaSinPad: { backgroundColor: colores.blanco, borderRadius: 16, borderWidth: 1, borderColor: colores.borde, overflow: 'hidden' },
  filaCheck: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  textoCheck: { flex: 1, fontFamily: fuentes.medio, fontSize: 14, lineHeight: 21, color: colores.negro },
  bullet: { fontFamily: fuentes.extra, fontSize: 16, color: colores.negro, lineHeight: 21, width: 18, textAlign: 'center' },

  separador: { borderTopWidth: 1, borderTopColor: colores.borde },
  moduloCab: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, backgroundColor: '#FBFAF4' },
  moduloTitulo: { fontFamily: fuentes.semi, fontSize: 15, color: colores.negro },
  claseFila: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colores.borde },
  claseTitulo: { fontFamily: fuentes.medio, fontSize: 14, color: colores.negro },
  vistaPrevia: { fontFamily: fuentes.semi, fontSize: 11, color: '#4A6B00', marginTop: 2 },

  docenteFila: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colores.negro },
  avatarInicial: { alignItems: 'center', justifyContent: 'center', backgroundColor: colores.lima },
  avatarLetra: { fontFamily: fuentes.extra, fontSize: 26, color: colores.negro },
  docenteTitulo: { fontFamily: fuentes.extra, fontSize: 17, color: colores.negro },

  resumenNota: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  notaGrande: { fontFamily: fuentes.extra, fontSize: 44, letterSpacing: -1, color: colores.negro },
  resena: { backgroundColor: colores.blanco, borderRadius: 14, borderWidth: 1, borderColor: colores.borde, padding: 14, marginBottom: 10 },
  resenaCab: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  resenaNombre: { fontFamily: fuentes.semi, fontSize: 14, color: colores.negro },

  barra: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colores.blanco, borderTopWidth: 1, borderTopColor: colores.borde,
    paddingTop: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16,
  },
  barraPrecio: { fontFamily: fuentes.extra, fontSize: 22, letterSpacing: -0.4, color: colores.negro },
  barraNota: { fontFamily: fuentes.texto, fontSize: 12, color: colores.tintaSuave },
  botonComprar: { backgroundColor: colores.lima, borderRadius: 999, paddingVertical: 15, paddingHorizontal: 28 },
  botonComprarTexto: { fontFamily: fuentes.semi, fontSize: 15, color: colores.negro },
});
