import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import { supabase } from './src/lib/supabase';
import PantallaEntrada from './src/screens/PantallaEntrada';
import PantallaInicio from './src/screens/PantallaInicio';
import { colores } from './src/theme';

export default function App() {
  const [fuentesListas] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_800ExtraBold,
  });
  const [sesion, setSesion] = useState(null); // objeto de sesión o null
  const [sesionCargada, setSesionCargada] = useState(false);
  const [entrar, setEntrar] = useState(false); // true = pasar de la entrada a la app

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data?.session ?? null);
      setSesionCargada(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      setSesion(s ?? null);
      if (evento === 'SIGNED_IN' && s) setEntrar(true); // login nuevo
      if (evento === 'SIGNED_OUT') setEntrar(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Mientras cargan las fuentes: negro liso (igual que el splash nativo, sin saltos)
  if (!fuentesListas) return <View style={{ flex: 1, backgroundColor: colores.negro }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style={entrar && sesion ? 'dark' : 'light'} />
      {entrar && sesion ? (
        <PantallaInicio sesion={sesion} onSalir={() => setEntrar(false)} />
      ) : (
        <PantallaEntrada
          tieneSesion={sesionCargada ? !!sesion : null}
          onContinuar={() => setEntrar(true)}
        />
      )}
    </SafeAreaProvider>
  );
}
