// PantallaInicio.js — lugar temporal para cuando hay sesión.
// Acá va a vivir la lista de cursos de la plataforma.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colores, fuentes } from '../theme';

export default function PantallaInicio({ sesion, onSalir }) {
  const insets = useSafeAreaInsets();
  const email = sesion?.user?.email ?? '';

  async function salir() {
    await supabase.auth.signOut();
    onSalir();
  }

  return (
    <View style={[styles.pantalla, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.titulo}>¡Modo On!</Text>
      <View style={styles.barra} />
      <Text style={styles.texto}>Sesión iniciada{email ? ` como\n${email}` : ''}</Text>
      <Text style={styles.nota}>Acá va a ir tu lista de cursos.</Text>
      <Pressable onPress={salir} style={styles.boton}>
        <Text style={styles.botonTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.crema, alignItems: 'center', paddingHorizontal: 28 },
  titulo: { fontFamily: fuentes.extra, fontSize: 36, color: colores.negro },
  barra: { width: 64, height: 5, borderRadius: 99, backgroundColor: colores.lima, marginTop: 14, marginBottom: 20 },
  texto: { fontFamily: fuentes.medio, fontSize: 16, lineHeight: 24, textAlign: 'center', color: colores.negro },
  nota: { fontFamily: fuentes.texto, fontSize: 14, marginTop: 12, color: colores.tintaSuave },
  boton: { marginTop: 'auto', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 999, backgroundColor: colores.negro },
  botonTexto: { fontFamily: fuentes.semi, fontSize: 15, color: colores.crema },
});
