// PantallaEntrada.js — Indómita Modo On
// Secuencia:
//  1) Todo negro con las rayas moviéndose; el logo entra (fundido + rebote),
//     el interruptor se prende y aparece el lema.
//  2) El logo se apaga y queda solo el negro con las rayas.
//  3) Ese negro sube y deja ver el crema con el inicio de sesión.
//  4) El logo aparece arriba, sobre la franja negra, y el formulario sube suave.
// Si ya hay sesión guardada, después del paso 1 se sigue directo a la app.

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FondoTopo from '../components/FondoTopo';
import LogoModoOn from '../components/LogoModoOn';
import OndaInferior from '../components/OndaInferior';
import IconoGoogle from '../components/IconoGoogle';
import { ingresarConGoogle } from '../lib/googleAuth';
import { colores, fuentes } from '../theme';

const ONDA = 64; // alto de la onda inferior (px)

export default function PantallaEntrada({ tieneSesion, onContinuar }) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const bandaH = Math.round(Math.min(Math.max(H * 0.34, 250), 320)) + insets.top;
  const panelH = H + ONDA;
  const subida = bandaH - panelH; // translateY final (negativo)

  // --- valores animados ---
  const logoOp = useRef(new Animated.Value(0)).current;
  const logoEsc = useRef(new Animated.Value(0.82)).current;
  const interruptor = useRef(new Animated.Value(0)).current;
  const tagOp = useRef(new Animated.Value(0)).current;
  const respiro = useRef(new Animated.Value(1)).current;
  const salidaLogo = useRef(new Animated.Value(0)).current; // 0→1: el logo grande se va
  const rise = useRef(new Animated.Value(0)).current; // 0→1: el negro sube
  const logoBandaOp = useRef(new Animated.Value(0)).current;
  const logoBandaEsc = useRef(new Animated.Value(0.9)).current;
  const items = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const pulsoBoton = useRef(new Animated.Value(1)).current;

  const [splashHecho, setSplashHecho] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const respiroAnim = useRef(null);

  // Paso 1 y 2: entrada del logo, interruptor, lema y salida
  useEffect(() => {
    const secuencia = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOp, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(logoEsc, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      ]),
      Animated.delay(250),
      // se prende el interruptor
      Animated.spring(interruptor, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.timing(tagOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(900),
    ]);

    // "respiración" suave mientras está el logo en pantalla
    respiroAnim.current = Animated.loop(
      Animated.sequence([
        Animated.timing(respiro, { toValue: 1.035, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(respiro, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    respiroAnim.current.start();

    secuencia.start(() => {
      respiroAnim.current?.stop();
      Animated.timing(salidaLogo, { toValue: 1, duration: 450, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
        setTimeout(() => setSplashHecho(true), 250); // queda un instante todo negro con las rayas
      });
    });
    return () => respiroAnim.current?.stop();
  }, []);

  // Paso 3 y 4: o seguimos a la app, o subimos el negro y mostramos el login
  useEffect(() => {
    if (!splashHecho || tieneSesion === null) return;
    if (tieneSesion) {
      onContinuar();
      return;
    }
    Animated.timing(rise, { toValue: 1, duration: 950, easing: Easing.bezier(0.65, 0, 0.25, 1), useNativeDriver: true }).start(() => {
      Animated.parallel([
        Animated.timing(logoBandaOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(logoBandaEsc, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      ]).start();
      Animated.stagger(
        110,
        items.map((v) => Animated.timing(v, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }))
      ).start();
    });
  }, [splashHecho, tieneSesion]);

  async function alTocarGoogle() {
    if (cargando) return;
    setError('');
    setCargando(true);
    Animated.sequence([
      Animated.timing(pulsoBoton, { toValue: 0.97, duration: 90, useNativeDriver: true }),
      Animated.spring(pulsoBoton, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    const r = await ingresarConGoogle();
    if (!r.ok) {
      setCargando(false);
      if (r.mensaje) setError(r.mensaje);
    }
    // si salió bien, App detecta la sesión y cambia de pantalla
  }

  const panelY = rise.interpolate({ inputRange: [0, 1], outputRange: [0, subida] });
  const logoGrandeEsc = salidaLogo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const logoGrandeOp = salidaLogo.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const aparecer = (v) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  });

  const tamLogoGrande = Math.min(W * 0.14, 64);
  const tamLogoBanda = Math.min(W * 0.095, 42);

  return (
    <View style={styles.pantalla}>
      {/* ---------- Crema: inicio de sesión (queda debajo del negro) ---------- */}
      <View style={[styles.formulario, { top: bandaH + 28, paddingBottom: insets.bottom + 24 }]}>
        <Animated.Text style={[styles.eyebrow, aparecer(items[0])]}>
          Indómita <Text style={styles.eyebrowFuerte}>Modo On</Text>
        </Animated.Text>
        <Animated.Text style={[styles.bienvenida, aparecer(items[1])]}>Bienvenid@{'\n'}a Modo On</Animated.Text>
        <Animated.View style={[styles.barra, aparecer(items[1])]} />
        <Animated.Text style={[styles.sub, aparecer(items[2])]}>
          Ingresá con tu cuenta de Google y prendé el modo aprender.
        </Animated.Text>

        <Animated.View style={[{ width: '100%' }, aparecer(items[3])]}>
          <Animated.View style={{ transform: [{ scale: pulsoBoton }] }}>
            <Pressable
              onPress={alTocarGoogle}
              disabled={cargando}
              style={({ pressed }) => [styles.boton, (pressed || cargando) && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel="Ingresar con Google"
            >
              <View style={styles.botonIcono}>
                <IconoGoogle size={18} />
              </View>
              <Text style={styles.botonTexto}>{cargando ? 'Ingresando…' : 'Ingresar con Google'}</Text>
            </Pressable>
          </Animated.View>
          {!!error && <Text style={styles.error}>{error}</Text>}
        </Animated.View>

        <Animated.Text style={[styles.legal, aparecer(items[4])]}>
          Al ingresar aceptás los términos de uso de la plataforma.
        </Animated.Text>
      </View>

      {/* ---------- Negro con rayas: arranca a pantalla completa y sube ---------- */}
      <Animated.View style={[styles.panel, { height: panelH, transform: [{ translateY: panelY }] }]} pointerEvents="none">
        <FondoTopo width={W} height={panelH} />
        <OndaInferior width={W} alto={ONDA} />
      </Animated.View>

      {/* Logo grande de la entrada (centrado en la pantalla) */}
      <Animated.View
        pointerEvents="none"
        style={[styles.logoCentro, { opacity: Animated.multiply(logoOp, logoGrandeOp), transform: [{ scale: Animated.multiply(Animated.multiply(logoEsc, respiro), logoGrandeEsc) }] }]}
      >
        <LogoModoOn size={tamLogoGrande} progreso={interruptor} conTag opacidadTag={tagOp} />
      </Animated.View>

      {/* Logo chico que aparece arriba, sobre la franja negra */}
      <Animated.View
        pointerEvents="none"
        style={[styles.logoBanda, { top: insets.top, height: bandaH - insets.top - ONDA, opacity: logoBandaOp, transform: [{ scale: logoBandaEsc }] }]}
      >
        <LogoModoOn size={tamLogoBanda} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.crema, overflow: 'hidden' },
  panel: { position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: colores.negro },
  logoCentro: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  logoBanda: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },

  formulario: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 28, alignItems: 'center' },
  eyebrow: { marginBottom: 14, fontFamily: fuentes.medio, fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: colores.tintaSuave },
  eyebrowFuerte: { fontFamily: fuentes.extra, color: colores.negro },
  bienvenida: { fontFamily: fuentes.extra, fontSize: 34, lineHeight: 38, letterSpacing: -0.7, textAlign: 'center', color: colores.negro },
  barra: { width: 64, height: 5, borderRadius: 99, backgroundColor: colores.lima, marginTop: 14, marginBottom: 16 },
  sub: { fontFamily: fuentes.texto, fontSize: 15, lineHeight: 24, textAlign: 'center', color: colores.tintaSuave, maxWidth: 320, marginBottom: 26 },

  boton: {
    minHeight: 58, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999,
    backgroundColor: colores.lima, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  botonIcono: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  botonTexto: { fontFamily: fuentes.semi, fontSize: 16, color: colores.negro },
  error: { marginTop: 16, textAlign: 'center', fontFamily: fuentes.medio, fontSize: 14, color: colores.error },
  legal: { marginTop: 22, textAlign: 'center', fontFamily: fuentes.texto, fontSize: 12, lineHeight: 18, color: colores.tintaSuave },
});
