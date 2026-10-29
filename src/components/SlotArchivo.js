// SlotArchivo.js — un casillero para subir el video o el PDF de una clase desde el celular.
// Muestra el estado (cargado / falta), la barra de progreso y los botones Elegir / Reemplazar / Ver.
import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { BotonChico } from './FormularioBase';
import { borrarRemoto, subirPdf, subirVideo, verArchivo } from '../lib/archivos';
import { actualizarClase, fijarDescargable, guardarContenido } from '../lib/docente';
import { colores, fuentes } from '../theme';

const MAX_VIDEO = 10 * 1024 * 1024 * 1024; // 10 GB
const MAX_PDF = 100 * 1024 * 1024; // 100 MB
const TIPOS_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];

function mb(n) { return n >= 1024 * 1024 * 1024 ? (n / 1024 / 1024 / 1024).toFixed(0) + ' GB' : Math.round(n / 1024 / 1024) + ' MB'; }

export default function SlotArchivo({ tipo, clase, editable, bloqueado, onSubiendo, onCambio }) {
  const esVideo = tipo === 'video';
  const col = esVideo ? 'video_uid' : 'archivo_path';
  const actual = clase.contenido?.[col];
  const [pct, setPct] = useState(null); // null = no se está subiendo nada
  const [error, setError] = useState('');

  function como(ref) { return esVideo ? { video_uids: [ref], archivos: [] } : { video_uids: [], archivos: [ref] }; }

  async function elegir() {
    if (bloqueado) return Alert.alert('Esperá un momento', 'Hay otra subida en curso. Esperá a que termine.');
    setError('');
    let asset;
    try {
      if (esVideo) {
        const r = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          allowsEditing: false,
          videoExportPreset: ImagePicker.VideoExportPreset.Passthrough,
        });
        if (r.canceled) return;
        asset = r.assets[0];
        if (asset.mimeType && !TIPOS_VIDEO.includes(asset.mimeType)) return setError('El video tiene que ser MP4, MOV o WebM.');
      } else {
        const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
        if (r.canceled) return;
        asset = r.assets[0];
        if (asset.mimeType && asset.mimeType !== 'application/pdf') return setError('El material tiene que ser un archivo PDF.');
      }
    } catch (e) {
      return setError('No pudimos abrir el selector: ' + (e?.message || e));
    }

    let tamano = asset.fileSize ?? asset.size;
    if (!tamano) {
      try { tamano = (await FileSystem.getInfoAsync(asset.uri)).size; } catch (e) { /* sin dato */ }
    }
    if (!tamano) return setError('No pudimos leer el tamaño del archivo.');
    if (tamano > (esVideo ? MAX_VIDEO : MAX_PDF)) return setError('El archivo pesa más de ' + mb(esVideo ? MAX_VIDEO : MAX_PDF) + '.');

    setPct(0);
    onSubiendo(true);
    try {
      const args = { claseId: clase.id, uri: asset.uri, tamano, onProgreso: setPct };
      const ref = esVideo ? await subirVideo(args) : await subirPdf(args);
      try {
        await guardarContenido(clase.id, !!clase.contenido, { [col]: ref });
      } catch (e) {
        borrarRemoto(como(ref));
        throw e;
      }
      const seg = esVideo ? Math.round((asset.duration || 0) / 1000) : 0;
      if (seg) await actualizarClase(clase.id, { duracion_seg: seg }).catch(() => {});
      if (actual) borrarRemoto(como(actual));
      await onCambio();
    } catch (e) {
      setError(e?.message || 'No se pudo subir el archivo.');
    } finally {
      setPct(null);
      onSubiendo(false);
    }
  }

  async function ver() {
    try { await verArchivo(clase.id, tipo); } catch (e) { setError(e?.message || 'No se pudo abrir el archivo.'); }
  }

  const subiendo = pct !== null;
  return (
    <View style={styles.slot}>
      <Text style={styles.titulo}>{esVideo ? 'Video' : 'PDF'}</Text>
      {subiendo ? (
        <>
          <Text style={styles.estado}>Subiendo… {pct}%{esVideo ? ' · no cierres la app' : ''}</Text>
          <View style={styles.barra}><View style={[styles.barraRelleno, { width: pct + '%' }]} /></View>
        </>
      ) : (
        <Text style={[styles.estado, actual ? styles.ok : styles.falta]}>
          {actual ? `✓ ${esVideo ? 'Video' : 'PDF'} cargado` : `Falta cargar el ${esVideo ? 'video' : 'PDF'}`}
        </Text>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {editable && !subiendo && (
        <View style={styles.fila}>
          <BotonChico texto={actual ? 'Reemplazar' : 'Elegir archivo'} lima={!actual} onPress={elegir} />
          {!!actual && <BotonChico texto="Ver" suave onPress={ver} />}
        </View>
      )}
      {!editable && !!actual && !subiendo && (
        <View style={styles.fila}><BotonChico texto="Ver" suave onPress={ver} /></View>
      )}
      {!esVideo && !!actual && editable && (
        <View style={styles.filaSwitch}>
          <Switch
            value={clase.contenido?.descargable !== false}
            onValueChange={async (v) => { try { await fijarDescargable(clase.id, v); await onCambio(); } catch (e) { setError(e?.message || 'No se pudo guardar.'); } }}
            trackColor={{ false: '#cfcabb', true: colores.negro }}
            thumbColor={colores.blanco}
          />
          <Text style={styles.textoSwitch}>Los alumnos pueden descargarlo</Text>
        </View>
      )}
      <Text style={styles.ayuda}>
        {esVideo ? 'MP4, MOV o WebM · hasta 10 GB. Se retoma solo si se corta la conexión.' : 'PDF · hasta 100 MB.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { borderWidth: 1, borderColor: colores.borde, borderRadius: 14, padding: 12, gap: 8, backgroundColor: colores.crema },
  titulo: { fontFamily: fuentes.extra, fontSize: 12, letterSpacing: 0.4, color: colores.negro },
  estado: { fontFamily: fuentes.semi, fontSize: 13, color: colores.negro },
  ok: { color: '#37500A' },
  falta: { color: '#8a1f12' },
  error: { fontFamily: fuentes.semi, fontSize: 12, color: '#8a1f12' },
  fila: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filaSwitch: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textoSwitch: { flex: 1, fontFamily: fuentes.medio, fontSize: 12, color: colores.negro },
  barra: { height: 8, borderRadius: 999, backgroundColor: colores.borde, overflow: 'hidden' },
  barraRelleno: { height: 8, backgroundColor: colores.negro },
  ayuda: { fontFamily: fuentes.medio, fontSize: 11, color: colores.tintaSuave },
});
