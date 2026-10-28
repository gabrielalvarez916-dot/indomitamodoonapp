// PerfilScreen.js — ver y editar el propio perfil (nombre y biografía).
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { Aviso, Boton, Caja, Campo, PantallaForm, estilosForm } from '../components/FormularioBase';
import { guardarPerfil, obtenerPerfil } from '../lib/cuenta';
import { colores, fuentes } from '../theme';

export default function PerfilScreen() {
  const [perfil, setPerfil] = useState(null);
  const [nombre, setNombre] = useState('');
  const [bio, setBio] = useState('');
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // { texto, error }

  const cargar = useCallback(async () => {
    try {
      const p = await obtenerPerfil();
      setPerfil(p);
      setNombre(p?.nombre || '');
      setBio(p?.bio || '');
      setEstado('ok');
    } catch (e) {
      console.log('Error cargando el perfil:', e);
      setEstado('error');
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function guardar() {
    const n = nombre.trim().replace(/\s+/g, ' ');
    if (n.length < 2) return setAviso({ texto: 'Escribí tu nombre (mínimo 2 letras).', error: true });
    setGuardando(true);
    setAviso(null);
    try {
      await guardarPerfil({ nombre: n, bio: bio.trim() });
      setNombre(n);
      setAviso({ texto: 'Listo, guardamos tu perfil.', error: false });
    } catch (e) {
      setAviso({ texto: 'No pudimos guardar: ' + (e?.message || e), error: true });
    } finally {
      setGuardando(false);
    }
  }

  if (estado === 'cargando') return <View style={estilosForm.centro}><ActivityIndicator color={colores.negro} /></View>;
  if (estado === 'error') {
    return (
      <View style={estilosForm.centro}>
        <Text style={styles.errorTexto}>No pudimos cargar tu perfil.</Text>
        <Boton texto="Reintentar" onPress={() => { setEstado('cargando'); cargar(); }} />
      </View>
    );
  }

  const inicial = (nombre || perfil?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <PantallaForm titulo="Mi perfil" subtitulo="Así te ven en Modo On.">
      <Caja>
        <View style={styles.cabecera}>
          <View style={styles.avatar}>
            {perfil?.avatar ? (
              <Image source={{ uri: perfil.avatar }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={styles.avatarInicial}>{inicial}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nombre} numberOfLines={1}>{nombre || 'Sin nombre'}</Text>
            <Text style={styles.email} numberOfLines={1}>{perfil?.email}</Text>
          </View>
        </View>

        <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} maxLength={80} autoComplete="name" />
        <Campo
          etiqueta="Sobre vos"
          value={bio}
          onChangeText={setBio}
          maxLength={300}
          multilinea
          placeholder="Contanos algo sobre vos (opcional)"
          ayuda="Hasta 300 caracteres."
        />
        <Aviso texto={aviso?.texto} error={aviso?.error} />
        <Boton texto="Guardar cambios" onPress={guardar} cargando={guardando} />
      </Caja>
    </PantallaForm>
  );
}

const styles = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colores.lima, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarInicial: { fontFamily: fuentes.extra, fontSize: 26, color: colores.negro },
  nombre: { fontFamily: fuentes.extra, fontSize: 18, color: colores.negro },
  email: { fontFamily: fuentes.medio, fontSize: 13, color: colores.tintaSuave, marginTop: 2 },
  errorTexto: { fontFamily: fuentes.semi, fontSize: 15, color: colores.negro, marginBottom: 16, textAlign: 'center' },
});
