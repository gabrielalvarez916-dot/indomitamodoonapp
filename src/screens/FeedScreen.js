// FeedScreen.js — donde cae cada usuario al entrar.
// Arriba (fijo en todas las pestañas): encabezado negro con logo y "Salir". Acá: banner publicitario (4:1), buscador (curso o docente),
// filtro por tipo de curso y la lista de cursos estilo Udemy.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BannerPublicidad from '../components/BannerPublicidad';
import BuscadorCursos from '../components/BuscadorCursos';
import FiltroCategorias from '../components/FiltroCategorias';
import TarjetaCurso from '../components/TarjetaCurso';
import { obtenerBanners, obtenerCategorias, obtenerCursosFeed } from '../lib/cursosApi';
import { normalizar } from '../lib/formato';
import { colores, fuentes } from '../theme';

export default function FeedScreen({ navigation }) {
  const [cursos, setCursos] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaId, setCategoriaId] = useState(null);

  const cargar = useCallback(async () => {
    setError(false);
    try {
      const [c, b, cat] = await Promise.all([
        obtenerCursosFeed(),
        obtenerBanners().catch(() => []), // si fallan los banners, el feed sigue andando
        obtenerCategorias().catch(() => []),
      ]);
      setCursos(c);
      setBanners(b);
      setCategorias(cat);
    } catch (e) {
      console.log('Error cargando el feed:', e);
      setError(true);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Buscador (por nombre del curso o del docente, sin importar tildes) + filtro por categoría
  const visibles = useMemo(() => {
    const q = normalizar(busqueda);
    return cursos.filter((c) => {
      if (categoriaId && c.categoria_id !== categoriaId) return false;
      if (!q) return true;
      return normalizar(c.titulo).includes(q) || normalizar(c.docente_nombre).includes(q);
    });
  }, [cursos, busqueda, categoriaId]);

  const abrirCurso = (id) => navigation.navigate('Curso', { id });
  const hayFiltros = !!busqueda || !!categoriaId;

  const encabezado = (
    <View>
      <BannerPublicidad banners={banners} onAbrirCurso={abrirCurso} />
      <View style={styles.bloqueBusqueda}>
        <View style={{ paddingHorizontal: 16 }}>
          <BuscadorCursos valor={busqueda} onCambiar={setBusqueda} />
        </View>
        <FiltroCategorias categorias={categorias} seleccionada={categoriaId} onSeleccionar={setCategoriaId} />
      </View>
      {!cargando && !error && cursos.length > 0 && (
        <Text style={styles.contador}>
          {visibles.length === 1 ? '1 curso' : `${visibles.length} cursos`}
          {hayFiltros ? ' encontrados' : ''}
        </Text>
      )}
    </View>
  );

  let vacio = null;
  if (cargando) {
    vacio = <ActivityIndicator style={{ marginTop: 48 }} color={colores.negro} />;
  } else if (error) {
    vacio = (
      <View style={styles.vacio}>
        <Ionicons name="cloud-offline-outline" size={40} color={colores.tintaSuave} />
        <Text style={styles.vacioTitulo}>No pudimos cargar los cursos</Text>
        <Text style={styles.vacioTexto}>Revisá tu conexión e intentá de nuevo.</Text>
        <Pressable onPress={() => { setCargando(true); cargar(); }} style={styles.botonReintentar}>
          <Text style={styles.botonReintentarTexto}>Reintentar</Text>
        </Pressable>
      </View>
    );
  } else if (cursos.length === 0) {
    vacio = (
      <View style={styles.vacio}>
        <Ionicons name="school-outline" size={40} color={colores.tintaSuave} />
        <Text style={styles.vacioTitulo}>Muy pronto, nuevos cursos</Text>
        <Text style={styles.vacioTexto}>Todavía no hay cursos publicados. Volvé en unos días.</Text>
      </View>
    );
  } else {
    vacio = (
      <View style={styles.vacio}>
        <Ionicons name="search-outline" size={40} color={colores.tintaSuave} />
        <Text style={styles.vacioTitulo}>Sin resultados</Text>
        <Text style={styles.vacioTexto}>No encontramos cursos con esa búsqueda o filtro.</Text>
        <Pressable onPress={() => { setBusqueda(''); setCategoriaId(null); }} style={styles.botonReintentar}>
          <Text style={styles.botonReintentarTexto}>Quitar filtros</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      <FlatList
        data={visibles}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <TarjetaCurso curso={item} onPress={() => abrirCurso(item.id)} />}
        ListHeaderComponent={encabezado}
        ListEmptyComponent={vacio}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} tintColor={colores.negro} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.crema },
  bloqueBusqueda: { paddingTop: 16, gap: 12 },
  contador: { fontFamily: fuentes.semi, fontSize: 13, color: colores.tintaSuave, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12 },
  vacio: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 56, gap: 8 },
  vacioTitulo: { fontFamily: fuentes.extra, fontSize: 18, color: colores.negro, textAlign: 'center', marginTop: 6 },
  vacioTexto: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 21, color: colores.tintaSuave, textAlign: 'center' },
  botonReintentar: { marginTop: 14, backgroundColor: colores.negro, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 },
  botonReintentarTexto: { fontFamily: fuentes.semi, fontSize: 14, color: colores.crema },
});
