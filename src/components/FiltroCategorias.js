// Filtro por tipo de curso (categoría): "Todos" + una pastilla por categoría visible.
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colores, fuentes } from '../theme';

export default function FiltroCategorias({ categorias, seleccionada, onSeleccionar }) {
  if (!categorias.length) return null;
  const items = [{ id: null, nombre: 'Todos' }, ...categorias];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
      {items.map((c) => {
        const activa = seleccionada === c.id;
        return (
          <Pressable
            key={c.id ?? 'todos'}
            onPress={() => onSeleccionar(c.id)}
            style={[styles.pill, activa && styles.pillActiva]}
            accessibilityRole="button"
            accessibilityState={{ selected: activa }}
          >
            <Text style={[styles.texto, activa && styles.textoActivo]}>{c.nombre}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fila: { paddingHorizontal: 16, gap: 8 },
  pill: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde },
  pillActiva: { backgroundColor: colores.negro, borderColor: colores.negro },
  texto: { fontFamily: fuentes.semi, fontSize: 13, color: colores.negro },
  textoActivo: { color: colores.lima },
});
