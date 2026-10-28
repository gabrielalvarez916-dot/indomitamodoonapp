// EncabezadoApp.js — barra negra de arriba, fija en todas las pestañas: logo + "Salir".
// (En Love Club es el encabezado con el nombre de la app y "Cerrar sesión".)
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoModoOn from './LogoModoOn';
import { cerrarSesion } from '../lib/googleAuth';
import { colores, fuentes } from '../theme';

export default function EncabezadoApp() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <LogoModoOn size={22} conMarca={false} />
      <Pressable onPress={cerrarSesion} hitSlop={12} style={styles.salir} accessibilityRole="button" accessibilityLabel="Cerrar sesión">
        <Ionicons name="log-out-outline" size={20} color={colores.crema} />
        <Text style={styles.salirTexto}>Salir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colores.negro,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  salir: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  salirTexto: { fontFamily: fuentes.semi, fontSize: 13, color: colores.crema },
});
