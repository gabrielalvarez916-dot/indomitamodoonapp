// LogoModoOn.js — "MODO" + interruptor + "N".
// `progreso` es un Animated.Value 0→1: 0 = apagado (perilla a la izquierda),
// 1 = encendido (verde con perilla a la derecha, como en el logo).
import { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colores, fuentes } from '../theme';

export default function LogoModoOn({ size = 48, progreso, conMarca = true, conTag = false, opacidadTag }) {
  const fijo = useRef(new Animated.Value(1)).current;
  const p = progreso || fijo;

  const w = size * 1.9;
  const h = size * 0.92;
  const knob = size * 0.74;
  const pad = size * 0.09;

  const knobX = p.interpolate({ inputRange: [0, 1], outputRange: [0, w - knob - pad * 2] });
  const halo = p.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

  return (
    <View style={styles.centro}>
      {conMarca && (
        <Text style={[styles.marca, { fontSize: Math.max(size * 0.2, 10), marginBottom: size * 0.3 }]}>INDÓMITA</Text>
      )}
      <View style={styles.fila}>
        <Text style={[styles.letras, { fontSize: size, lineHeight: size * 1.15 }]}>MODO</Text>

        <View style={{ width: w, height: h, marginHorizontal: size * 0.06 }}>
          {/* halo de luz */}
          <Animated.View
            pointerEvents="none"
            style={[styles.halo, {
              left: -size * 0.35, right: -size * 0.35, top: -size * 0.35, bottom: -size * 0.35,
              borderRadius: size, opacity: halo,
            }]}
          />
          {/* base apagada */}
          <View style={[StyleSheet.absoluteFill, { borderRadius: 999, backgroundColor: colores.apagado }]} />
          {/* capa verde que se enciende */}
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.encendido, { borderRadius: 999, opacity: p }]}
          />
          {/* perilla */}
          <Animated.View
            style={{
              position: 'absolute', left: pad, top: (h - knob) / 2,
              width: knob, height: knob, borderRadius: knob / 2, backgroundColor: '#fff',
              transform: [{ translateX: knobX }],
            }}
          />
        </View>

        <Text style={[styles.letras, { fontSize: size, lineHeight: size * 1.15 }]}>N</Text>
      </View>
      {conTag && (
        <Animated.Text style={[styles.tag, { fontSize: Math.max(size * 0.17, 9), marginTop: size * 0.5, opacity: opacidadTag ?? 1 }]}>
          More skills. More possibilities.
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  letras: { fontFamily: fuentes.extra, color: colores.crema, letterSpacing: -1, includeFontPadding: false },
  marca: { fontFamily: fuentes.medio, color: colores.crema, letterSpacing: 8, paddingLeft: 8 },
  tag: { fontFamily: fuentes.medio, color: colores.crema, opacity: 0.85, letterSpacing: 3, textTransform: 'uppercase' },
  halo: { position: 'absolute', backgroundColor: colores.lima },
  encendido: {
    backgroundColor: colores.lima,
    shadowColor: colores.lima, shadowOpacity: 0.8, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
