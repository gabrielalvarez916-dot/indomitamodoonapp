// OndaInferior.js — borde ondulado crema que "corta" el negro por abajo
// (misma curva que el clip-path wave-bottom de la web).
import Svg, { Path } from 'react-native-svg';
import { colores } from '../theme';

export default function OndaInferior({ width, alto }) {
  const Y = (v) => Math.min(alto, Math.max(0, ((v - 0.66) / 0.4) * alto));
  const X = (v) => v * width;
  const d =
    `M${width},${alto} L${width},${Y(0.8)} ` +
    `C${X(0.86)},${Y(0.7)} ${X(0.74)},${Y(0.74)} ${X(0.6)},${Y(0.86)} ` +
    `C${X(0.46)},${Y(0.98)} ${X(0.3)},${Y(1.04)} ${X(0.16)},${Y(0.94)} ` +
    `C${X(0.09)},${Y(0.89)} ${X(0.04)},${Y(0.86)} 0,${Y(0.86)} ` +
    `L0,${alto} Z`;
  return (
    <Svg width={width} height={alto} style={{ position: 'absolute', left: 0, bottom: 0 }}>
      <Path d={d} fill={colores.crema} />
    </Svg>
  );
}
