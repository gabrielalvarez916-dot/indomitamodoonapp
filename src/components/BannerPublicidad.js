// BannerPublicidad.js — banner de arriba del feed (espacio publicitario).
// Mismo formato que Indómita Love Club: ancho completo, proporción 4:1, carrusel
// con autoplay (10 s por defecto o `duracion_segundos` de cada banner) y puntitos.
// Destino excluyente: un curso dentro de la app, o un link externo.
// Si todavía no hay banners cargados, muestra el banner propio de Modo On.

import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import LogoModoOn from './LogoModoOn';
import { colores, fuentes } from '../theme';

const DURACION_DEFAULT_MS = 10000;

export default function BannerPublicidad({ banners, onAbrirCurso }) {
  const { width } = useWindowDimensions();
  const alto = width / 4; // 4:1
  const [indice, setIndice] = useState(0);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (banners.length <= 1) return undefined;
    const ms = banners[indice]?.duracion_segundos ? banners[indice].duracion_segundos * 1000 : DURACION_DEFAULT_MS;
    timerRef.current = setTimeout(() => {
      const sig = (indice + 1) % banners.length;
      scrollRef.current?.scrollTo({ x: sig * width, animated: true });
      setIndice(sig);
    }, ms);
    return () => clearTimeout(timerRef.current);
  }, [banners, indice, width]);

  function alTocar(b) {
    if (b.curso_id) onAbrirCurso?.(b.curso_id);
    else if (b.link_destino) Linking.openURL(b.link_destino).catch(() => {});
  }

  if (banners.length === 0) {
    return (
      <View style={[styles.propio, { height: alto }]}>
        <LogoModoOn size={Math.max(alto * 0.3, 22)} conMarca={false} />
        <Text style={[styles.lema, { fontSize: Math.max(alto * 0.1, 9) }]}>MORE SKILLS. MORE POSSIBILITIES.</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndice(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {banners.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => alTocar(b)}
            disabled={!b.curso_id && !b.link_destino}
            style={{ width, height: alto }}
            accessibilityRole="imagebutton"
            accessibilityLabel="Publicidad"
          >
            <Image source={{ uri: b.imagen_url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" recyclingKey={b.id} />
          </Pressable>
        ))}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.puntos}>
          {banners.map((b, i) => (
            <Pressable
              key={b.id}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              onPress={() => {
                setIndice(i);
                scrollRef.current?.scrollTo({ x: i * width, animated: true });
              }}
            >
              <View style={[styles.punto, i === indice && styles.puntoActivo]} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { backgroundColor: colores.blanco, borderBottomWidth: 1, borderBottomColor: colores.borde },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.borde },
  puntoActivo: { width: 18, backgroundColor: colores.negro },
  propio: { backgroundColor: colores.negro, alignItems: 'center', justifyContent: 'center', gap: 6 },
  lema: { fontFamily: fuentes.medio, color: colores.crema, opacity: 0.8, letterSpacing: 2.5 },
});
