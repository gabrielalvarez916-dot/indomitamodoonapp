// Tarjeta chica para el carrusel "Los estudiantes también compraron".
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Portada from './Portada';
import Estrellas from './Estrellas';
import { colores, fuentes } from '../theme';
import { precioTexto } from '../lib/formato';

export default function TarjetaCompacta({ curso: c, onPress }) {
  const tieneNota = Number(c.cant_resenas) > 0;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tarjeta, pressed && { opacity: 0.9 }]} accessibilityRole="button">
      <Portada uri={c.portada_url} />
      <View style={styles.cuerpo}>
        <Text style={styles.titulo} numberOfLines={2}>{c.titulo}</Text>
        <Text style={styles.docente} numberOfLines={1}>{c.docente_nombre}</Text>
        {tieneNota && (
          <View style={styles.fila}>
            <Text style={styles.nota}>{Number(c.promedio).toFixed(1).replace('.', ',')}</Text>
            <Estrellas valor={Number(c.promedio)} size={12} />
          </View>
        )}
        <Text style={styles.precio}>{precioTexto(c)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: { width: 240, backgroundColor: colores.blanco, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colores.borde },
  cuerpo: { padding: 12, gap: 4 },
  titulo: { fontFamily: fuentes.extra, fontSize: 15, lineHeight: 19, color: colores.negro },
  docente: { fontFamily: fuentes.texto, fontSize: 12, color: colores.tintaSuave },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nota: { fontFamily: fuentes.extra, fontSize: 12, color: '#8A5A00' },
  precio: { fontFamily: fuentes.extra, fontSize: 16, color: colores.negro, marginTop: 2 },
});
