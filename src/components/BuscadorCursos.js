import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores, fuentes } from '../theme';

export default function BuscadorCursos({ valor, onCambiar }) {
  return (
    <View style={styles.caja}>
      <Ionicons name="search" size={20} color={colores.tintaSuave} />
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        placeholder="Buscar por curso o docente"
        placeholderTextColor="#8C8C82"
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Buscar cursos"
      />
      {!!valor && (
        <Pressable onPress={() => onCambiar('')} hitSlop={10} accessibilityLabel="Borrar búsqueda">
          <Ionicons name="close-circle" size={20} color={colores.tintaSuave} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colores.blanco,
    borderRadius: 999, borderWidth: 1, borderColor: colores.borde, paddingHorizontal: 16, height: 50,
  },
  input: { flex: 1, fontFamily: fuentes.medio, fontSize: 15, color: colores.negro, paddingVertical: 0 },
});
