// FondoTopo.js — negro con las rayas (curvas de nivel) que se mueven despacito.
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { TOPO_PATHS } from './topoPaths';
import { colores } from '../theme';

const EXTRA = 40; // margen para que la deriva no deje bordes vacíos

export default function FondoTopo({ width, height }) {
  const deriva = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(deriva, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(deriva, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [deriva]);

  const x = deriva.interpolate({ inputRange: [0, 1], outputRange: [-EXTRA * 0.6, EXTRA * 0.6] });
  const y = deriva.interpolate({ inputRange: [0, 1], outputRange: [EXTRA * 0.5, -EXTRA * 0.5] });
  const giro = deriva.interpolate({ inputRange: [0, 1], outputRange: ['-0.6deg', '0.6deg'] });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colores.negro, overflow: 'hidden' }]} pointerEvents="none">
      <Animated.View
        style={{
          position: 'absolute', left: -EXTRA, top: -EXTRA,
          width: width + EXTRA * 2, height: height + EXTRA * 2,
          transform: [{ translateX: x }, { translateY: y }, { rotate: giro }],
        }}
      >
        <Svg width={width + EXTRA * 2} height={height + EXTRA * 2} viewBox="0 0 900 1000" preserveAspectRatio="xMidYMid slice">
          {TOPO_PATHS.map((d, i) => (
            <Path key={i} d={d} fill="none" stroke={colores.crema} strokeOpacity={0.13} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}
