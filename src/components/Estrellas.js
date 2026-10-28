import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '../theme';

// valor 0–5, con medias estrellas
export default function Estrellas({ valor = 0, size = 14 }) {
  const v = Number(valor) || 0;
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const nombre = v >= n - 0.25 ? 'star' : v >= n - 0.75 ? 'star-half' : 'star-outline';
        return <Ionicons key={n} name={nombre} size={size} color={colores.estrella} />;
      })}
    </View>
  );
}
