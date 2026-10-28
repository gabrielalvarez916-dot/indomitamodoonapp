// FormularioBase.js — piezas compartidas por Perfil y Ser docente: contenedor con teclado,
// título de pantalla, campo de texto, aviso y botón.
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colores, fuentes } from '../theme';

export function PantallaForm({ titulo, subtitulo, children }) {
  return (
    <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text style={styles.titulo}>{titulo}</Text>
        {!!subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Caja({ children, style }) {
  return <View style={[styles.caja, style]}>{children}</View>;
}

export function Campo({ etiqueta, ayuda, multilinea, ...props }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        {...props}
        multiline={!!multilinea}
        placeholderTextColor={colores.tintaSuave}
        style={[styles.input, multilinea && styles.inputMultilinea]}
        textAlignVertical={multilinea ? 'top' : 'center'}
      />
      {!!ayuda && <Text style={styles.ayuda}>{ayuda}</Text>}
    </View>
  );
}

export function Aviso({ texto, error }) {
  if (!texto) return null;
  return (
    <View style={[styles.aviso, error ? styles.avisoMal : styles.avisoOk]}>
      <Text style={[styles.avisoTexto, { color: error ? '#8a1f12' : '#37500A' }]}>{texto}</Text>
    </View>
  );
}

export function Boton({ texto, onPress, cargando, lima }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando}
      style={({ pressed }) => [styles.boton, lima && styles.botonLima, (pressed || cargando) && { opacity: 0.7 }]}
      accessibilityRole="button"
    >
      {cargando ? (
        <ActivityIndicator color={lima ? colores.negro : colores.crema} />
      ) : (
        <Text style={[styles.botonTexto, lima && { color: colores.negro }]}>{texto}</Text>
      )}
    </Pressable>
  );
}

export const estilosForm = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colores.crema },
});

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.crema },
  scroll: { padding: 20, paddingBottom: 40 },
  titulo: { fontFamily: fuentes.extra, fontSize: 26, color: colores.negro, letterSpacing: -0.4 },
  subtitulo: { fontFamily: fuentes.medio, fontSize: 14, color: colores.tintaSuave, marginTop: 4, marginBottom: 18, lineHeight: 20 },
  caja: { backgroundColor: colores.blanco, borderRadius: 18, borderWidth: 1, borderColor: colores.borde, padding: 18, gap: 16, marginTop: 14 },
  campo: { gap: 6 },
  etiqueta: { fontFamily: fuentes.extra, fontSize: 12, letterSpacing: 0.4, color: colores.negro },
  input: {
    borderWidth: 1.5, borderColor: colores.borde, borderRadius: 12, backgroundColor: colores.blanco,
    paddingHorizontal: 14, paddingVertical: 12, fontFamily: fuentes.medio, fontSize: 15, color: colores.negro,
  },
  inputMultilinea: { minHeight: 110 },
  ayuda: { fontFamily: fuentes.medio, fontSize: 12, color: colores.tintaSuave },
  aviso: { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  avisoOk: { backgroundColor: '#E9F7B8' },
  avisoMal: { backgroundColor: '#F8D7D2' },
  avisoTexto: { fontFamily: fuentes.semi, fontSize: 13, lineHeight: 18 },
  boton: { backgroundColor: colores.negro, borderRadius: 999, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  botonLima: { backgroundColor: colores.lima },
  botonTexto: { fontFamily: fuentes.semi, fontSize: 15, color: colores.crema },
});
