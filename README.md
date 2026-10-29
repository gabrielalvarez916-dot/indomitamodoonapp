# Indómita Modo On — App

App móvil (Expo / React Native) de la plataforma de cursos.

## Login animado
1. Entrada: negro con rayas en movimiento, el logo aparece y el interruptor se prende.
2. El logo se apaga, queda todo negro con las rayas.
3. El negro sube y deja ver el crema con el inicio de sesión.
4. El logo aparece arriba, sobre la franja negra.

Si ya hay sesión guardada, después del paso 1 pasa directo a la app.

## Feed y cursos
- **Feed** (`src/screens/FeedScreen.js`): banner publicitario 4:1 (tabla `banners`), buscador por curso o docente, filtro por categoría y tarjetas estilo Udemy.
- **Curso** (`src/screens/CursoScreen.js`): portada y datos, lo que aprenderás, qué incluye, contenido, requisitos, descripción, docente, valoraciones y "los estudiantes también compraron".
- Datos: funciones SQL `cursos_feed()` y `cursos_tambien_compraron()` (solo lectura, solo cursos publicados). Ver `src/lib/cursosApi.js`.
- Banners (imagen o video, como Love Club): se cargan en la tabla `banners` de Supabase (`imagen_url` —sirve para imagen o video—, `tipo` = `imagen`/`video`, y `curso_id` **o** `link_destino`). Sin banners se muestra el banner propio de Modo On.
- Pendiente: pago/inscripción y reproductor de clases (el botón de compra hoy avisa "Próximamente").

## Ser docente y editor de cursos
- **Ser docente** (`src/screens/SerDocenteScreen.js`): sin solicitud pide solo el nombre público (la bio es opcional) y pasa directo a crear el curso. Con solicitud muestra el estado, la lista de cursos (Editar / Ver), "Crear un curso" y los datos del docente.
- **Editor** (`src/screens/EditarCursoScreen.js`): datos, portada, "qué se aprende", requisitos, precio por escalones, módulos y clases (video y PDF subidos, no links), lista de lo que falta y envío a revisión. Igual que la web: solo se edita en borrador; la base exige el curso completo.
- **Subidas** (`src/lib/archivos.js`): portada → Supabase Storage (`portadas`); PDF → Cloudflare R2; video → Cloudflare Stream (tus, en trozos de 5 MB, reintenta y retoma si se corta). Las claves de Cloudflare viven en la función `archivos` de Supabase.
- Librerías nativas nuevas: `expo-image-picker`, `expo-document-picker`, `expo-file-system`. **Hay que generar de nuevo la app instalable** (no alcanza con recargar el JavaScript).

## Pendiente antes de probar el login
- Pegar el **Client ID web de Google** en `src/lib/googleAuth.js` (`WEB_CLIENT_ID`).
- Agregar `google-services.json` (Firebase) en la raíz para Android y registrar el SHA-1 del build.
- El login nativo de Google **no funciona en Expo Go**: hay que usar un development build (`eas build --profile development`).

## Correr
```
npm install
npx expo start --dev-client
```
