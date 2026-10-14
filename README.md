# LITTLE WORLD — Una pequeña vida que crece contigo

Jardín virtual cozy + misiones personales: un diorama 3D estilizado (React Three Fiber)
que evoluciona con tus logros reales. Todo se guarda en tu navegador (IndexedDB + localStorage),
sin cuentas ni backend.

## Ejecutar en local
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/ (comprobado: compila sin errores de TypeScript)
npm run preview    # sirve el build de producción
```

## Publicar en GitHub Pages (gratis)
El proyecto ya está preparado (`base: './'` en `vite.config.ts`, por lo que funciona
aunque el sitio se sirva desde `usuario.github.io/repo/`):

**Opción A — automática (incluida):** el workflow `.github/workflows/deploy.yml`
compila y despliega solo al hacer push a la rama `main`.
1. Sube el repo a GitHub.
2. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Haz push a `main` y en 1-2 minutos tu web estará en la URL de Pages.

**Opción B — manual:**
```bash
npm run build
npx gh-pages -d dist   # publica la carpeta dist/ en la rama gh-pages
```
(activa antes Pages apuntando a la rama `gh-pages` / carpeta `/`)

También sirve cualquier hosting estático: sube el contenido de `dist/` a Netlify,
Vercel o Cloudflare Pages sin configuración extra. No usa variables de entorno ni APIs externas.

## Estructura
```
src/
  state/worldStore.ts      # Zustand: nivel, XP, semillas, misiones, colección, decoración
  data/catalog.ts          # CATALOG (objetos) y BIOMES (biomas)
  lib/storage.ts           # Persistencia IndexedDB + export/import JSON
  components/world/        # Escena 3D (isla, árboles, flores, cámara ortográfica, fallback WebGL)
  components/*.tsx         # Vistas: World, Quests, Collection, Decorate, Discover, Journal, Dashboard
```

## Cómo añadir contenido nuevo
- **Nueva planta/decoración:** añade una entrada a `CATALOG` en `src/data/catalog.ts`
  (nombre, tipo, rareza, coste en semillas, nivel requerido) y su geometría en
  `components/world/Island.tsx` (los modelos están construidos con primitivas de three.js).
- **Nuevo bioma:** añade una entrada a `BIOMES` en `src/data/catalog.ts` con su condición
  de desbloqueo; la vista Discover y el store ya lo muestran automáticamente.

## Notas
- Los datos (misiones, diario, decoraciones, imágenes del diario) viven en IndexedDB local.
  Usa **Exportar JSON** en Ajustes para copias de seguridad completas (las imágenes del
  diario se incluyen codificadas en base64).
- Si el dispositivo no soporta WebGL, se muestra una isla ilustrada SVG y toda la app
  sigue funcionando.
