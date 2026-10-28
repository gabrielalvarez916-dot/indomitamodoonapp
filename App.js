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
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FeedScreen from './src/screens/FeedScreen';
import CursoScreen from './src/screens/CursoScreen';
import MisCursosScreen from './src/screens/MisCursosScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import SerDocenteScreen from './src/screens/SerDocenteScreen';
import NavPrincipal from './src/components/NavPrincipal';
import EncabezadoApp from './src/components/EncabezadoApp';
import { colores, fuentes } from './src/theme';

// Misma estructura que Indómita Love Club: un Tab.Navigator con la barra fija abajo
// (NavPrincipal) y el encabezado negro fijo arriba (EncabezadoApp), dentro de un stack raíz.
// El curso se abre como pantalla del stack raíz: queda por encima de las pestañas.
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Pestañas() {
  return (
    <Tab.Navigator
      initialRouteName="feed"
      tabBar={(props) => <NavPrincipal {...props} />}
      screenOptions={{ header: () => <EncabezadoApp />, sceneStyle: { backgroundColor: colores.crema } }}
    >
      <Tab.Screen name="feed" component={FeedScreen} />
      <Tab.Screen name="miscursos" component={MisCursosScreen} />
      <Tab.Screen name="perfil" component={PerfilScreen} />
      <Tab.Screen name="serdocente" component={SerDocenteScreen} />
    </Tab.Navigator>
  );
}
const temaApp = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colores.crema } };

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
      <StatusBar style="light" />
      {entrar && sesion ? (
        <NavigationContainer theme={temaApp}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colores.negro },
              headerTintColor: colores.crema,
              headerTitleStyle: { fontFamily: fuentes.semi },
              headerShadowVisible: false,
              headerBackTitle: 'Atrás',
            }}
          >
            <Stack.Screen name="Pestañas" component={Pestañas} options={{ headerShown: false }} />
            <Stack.Screen name="Curso" component={CursoScreen} options={{ title: '' }} />
          </Stack.Navigator>
        </NavigationContainer>
      ) : (
        <PantallaEntrada
          tieneSesion={sesionCargada ? !!sesion : null}
          onContinuar={() => setEntrar(true)}
        />
      )}
    </SafeAreaProvider>
  );
}
