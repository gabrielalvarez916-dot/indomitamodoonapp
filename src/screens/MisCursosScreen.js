// MisCursosScreen.js — los cursos a los que la persona ya tiene acceso (inscripciones activas).
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import TarjetaCurso from '../components/TarjetaCurso';
import { obtenerMisCursos } from '../lib/cuenta';
import { colores, fuentes } from '../theme';

export default function MisCursosScreen({ navigation }) {
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    setError(false);
    try {
      setCursos(await obtenerMisCursos());
    } catch (e) {
      console.log('Error cargando mis cursos:', e);
      setError(true);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  // Cada vez que se entra a la pestaña se vuelve a pedir (por si se sumó un curso nuevo)
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  let vacio;
  if (cargando) {
    vacio = <ActivityIndicator style={{ marginTop: 48 }} color={colores.negro} />;
  } else if (error) {
    vacio = (
      <View style={styles.vacio}>
        <Ionicons name="cloud-offline-outline" size={40} color={colores.tintaSuave} />
        <Text style={styles.vacioTitulo}>No pudimos cargar tus cursos</Text>
        <Text style={styles.vacioTexto}>Revisá tu conexión e intentá de nuevo.</Text>
        <Pressable onPress={() => { setCargando(true); cargar(); }} style={styles.boton}>
          <Text style={styles.botonTexto}>Reintentar</Text>
        </Pressable>
      </View>
    );
  } else {
    vacio = (
      <View style={styles.vacio}>
        <Ionicons name="school-outline" size={40} color={colores.tintaSuave} />
        <Text style={styles.vacioTitulo}>Todavía no tenés cursos</Text>
        <Text style={styles.vacioTexto}>Cuando te inscribas o compres un curso, lo vas a encontrar acá.</Text>
        <Pressable onPress={() => navigation.navigate('feed')} style={styles.boton}>
          <Text style={styles.botonTexto}>Ver cursos</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      <FlatList
        data={cursos}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <TarjetaCurso curso={item} onPress={() => navigation.navigate('Curso', { id: item.id })} />}
        ListHeaderComponent={
          <View style={styles.cabecera}>
            <Text style={styles.titulo}>Mis cursos</Text>
            <Text style={styles.subtitulo}>Los cursos a los que ya tenés acceso.</Text>
          </View>
        }
        ListEmptyComponent={vacio}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} tintColor={colores.negro} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.crema },
  cabecera: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  titulo: { fontFamily: fuentes.extra, fontSize: 26, color: colores.negro, letterSpacing: -0.4 },
  subtitulo: { fontFamily: fuentes.medio, fontSize: 14, color: colores.tintaSuave, marginTop: 4 },
  vacio: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 56, gap: 8 },
  vacioTitulo: { fontFamily: fuentes.extra, fontSize: 18, color: colores.negro, textAlign: 'center', marginTop: 6 },
  vacioTexto: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 21, color: colores.tintaSuave, textAlign: 'center' },
  boton: { marginTop: 14, backgroundColor: colores.negro, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 },
  botonTexto: { fontFamily: fuentes.semi, fontSize: 14, color: colores.crema },
});
