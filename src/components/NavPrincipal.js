// NavPrincipal.js — Indómita Modo On (mobile)
// Barra de pestañas FIJA abajo, con ícono + etiqueta chica debajo. Mismo formato que la de
// Indómita Love Club: el activo se marca con color + una píldora detrás del ícono (acá lima),
// no con subrayado. Se conecta al Tab.Navigator de React Navigation como `tabBar`.
//   Cursos → Mis cursos → Perfil → Ser docente

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colores, fuentes } from '../theme';

const TABS = {
  feed: { etiqueta: 'Cursos', icono: 'albums', iconoInactivo: 'albums-outline' },
  miscursos: { etiqueta: 'Mis cursos', icono: 'school', iconoInactivo: 'school-outline' },
  perfil: { etiqueta: 'Perfil', icono: 'person', iconoInactivo: 'person-outline' },
  serdocente: { etiqueta: 'Ser docente', icono: 'easel', iconoInactivo: 'easel-outline' },
};

export default function NavPrincipal({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.nav, { paddingBottom: insets.bottom || 8 }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const activo = state.index === index;

        const onPress = () => {
          const evento = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!activo && !evento.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={tab.etiqueta}
          >
            <View style={[styles.iconoPildora, activo && styles.iconoPildoraActiva]}>
              <Ionicons name={activo ? tab.icono : tab.iconoInactivo} size={20} color={activo ? colores.negro : colores.tintaSuave} />
            </View>
            <Text style={[styles.etiqueta, activo && styles.etiquetaActiva]} numberOfLines={1}>
              {tab.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    backgroundColor: colores.blanco,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconoPildora: { width: 44, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconoPildoraActiva: { backgroundColor: colores.lima },
  etiqueta: { fontSize: 11, fontFamily: fuentes.semi, color: colores.tintaSuave },
  etiquetaActiva: { color: colores.negro, fontFamily: fuentes.extra },
});
