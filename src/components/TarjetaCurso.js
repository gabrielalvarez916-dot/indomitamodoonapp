// TarjetaCurso.js — tarjeta del feed (estilo Udemy):
// portada, categoría, título, sinopsis, docente, valoraciones, clases/duración,
// última actualización y precio.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Portada from './Portada';
import Estrellas from './Estrellas';
import { colores, fuentes } from '../theme';
import { duracionLarga, estudiantesTexto, mesAnio, precioTexto } from '../lib/formato';

export default function TarjetaCurso({ curso: c, onPress }) {
  const tieneNota = Number(c.cant_resenas) > 0;
  const dur = duracionLarga(c.duracion_seg);
  const estudiantes = estudiantesTexto(c.cant_estudiantes);
  const act = mesAnio(c.actualizado_en);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tarjeta, pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`Curso ${c.titulo}`}
    >
      <View>
        <Portada uri={c.portada_url} />
        {!!c.categoria_nombre && (
          <View style={styles.pillCategoria}>
            <Text style={styles.pillCategoriaTexto}>{c.categoria_nombre.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.cuerpo}>
        <Text style={styles.titulo} numberOfLines={2}>{c.titulo}</Text>
        {!!c.subtitulo && <Text style={styles.sinopsis} numberOfLines={3}>{c.subtitulo}</Text>}
        <Text style={styles.docente} numberOfLines={1}>
          Creado por <Text style={styles.docenteNombre}>{c.docente_nombre}</Text>
        </Text>

        <View style={styles.filaNota}>
          {tieneNota ? (
            <>
              <Text style={styles.nota}>{Number(c.promedio).toFixed(1).replace('.', ',')}</Text>
              <Estrellas valor={Number(c.promedio)} />
              <Text style={styles.cantNotas}>({c.cant_resenas})</Text>
            </>
          ) : (
            <View style={styles.pillNuevo}>
              <Text style={styles.pillNuevoTexto}>NUEVO</Text>
            </View>
          )}
          {!!estudiantes && <Text style={styles.meta}>· {estudiantes}</Text>}
        </View>

        <Text style={styles.meta}>
          {[Number(c.cant_clases) > 0 && `${c.cant_clases} clases`, dur, act && `Actualizado ${act}`].filter(Boolean).join(' · ')}
        </Text>

        <View style={styles.filaPrecio}>
          {c.es_gratis ? (
            <View style={styles.pillGratis}>
              <Text style={styles.pillGratisTexto}>GRATIS</Text>
            </View>
          ) : (
            <Text style={styles.precio}>{precioTexto(c)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.blanco, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: colores.borde, marginHorizontal: 16, marginBottom: 18,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  pillCategoria: { position: 'absolute', left: 12, top: 12, backgroundColor: colores.negro, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 10 },
  pillCategoriaTexto: { fontFamily: fuentes.semi, fontSize: 10, letterSpacing: 1.2, color: colores.crema },
  cuerpo: { padding: 16, gap: 6 },
  titulo: { fontFamily: fuentes.extra, fontSize: 18, lineHeight: 23, letterSpacing: -0.3, color: colores.negro },
  sinopsis: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 20, color: colores.tintaSuave },
  docente: { fontFamily: fuentes.texto, fontSize: 13, color: colores.tintaSuave, marginTop: 2 },
  docenteNombre: { fontFamily: fuentes.semi, color: colores.negro },
  filaNota: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  nota: { fontFamily: fuentes.extra, fontSize: 14, color: '#8A5A00' },
  cantNotas: { fontFamily: fuentes.texto, fontSize: 12, color: colores.tintaSuave },
  meta: { fontFamily: fuentes.texto, fontSize: 12, color: colores.tintaSuave },
  pillNuevo: { backgroundColor: colores.lima, borderRadius: 99, paddingVertical: 3, paddingHorizontal: 9 },
  pillNuevoTexto: { fontFamily: fuentes.extra, fontSize: 10, letterSpacing: 1, color: colores.negro },
  filaPrecio: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  precio: { fontFamily: fuentes.extra, fontSize: 20, letterSpacing: -0.3, color: colores.negro },
  pillGratis: { backgroundColor: colores.lima, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 14 },
  pillGratisTexto: { fontFamily: fuentes.extra, fontSize: 13, letterSpacing: 1, color: colores.negro },
});
