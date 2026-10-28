# Indómita Modo On — App

App móvil (Expo / React Native) de la plataforma de cursos.

## Login animado
1. Entrada: negro con rayas en movimiento, el logo aparece y el interruptor se prende.
2. El logo se apaga, queda todo negro con las rayas.
3. El negro sube y deja ver el crema con el inicio de sesión.
4. El logo aparece arriba, sobre la franja negra.

Si ya hay sesión guardada, después del paso 1 pasa directo a la app.

## Pendiente antes de probar el login
- Pegar el **Client ID web de Google** en `src/lib/googleAuth.js` (`WEB_CLIENT_ID`).
- Agregar `google-services.json` (Firebase) en la raíz para Android y registrar el SHA-1 del build.
- El login nativo de Google **no funciona en Expo Go**: hay que usar un development build (`eas build --profile development`).

## Correr
```
npm install
npx expo start --dev-client
```
