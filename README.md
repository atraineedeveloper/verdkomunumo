# ★ Verdkomunumo

Red social para la comunidad esperantista. Construida con SvelteKit, Supabase y desplegada en Vercel.

## Stack

- **Framework**: SvelteKit 2 + Svelte 5 (runes)
- **Base de datos**: Supabase (PostgreSQL + Auth + Realtime)
- **Estilos**: CSS custom properties, 4 temas (green, dark, vivid, minimal)
- **Iconos**: Lucide Svelte + flag-icons
- **Deploy**: Vercel (adapter-vercel)
- **i18n**: 9 idiomas — eo, es, en, pt, ja, fr, de, ko, zh

## Funcionalidades

- Feed cronológico estilo timeline
- Categorías: General, Aprendizaje, Entretenimiento, Noticias, Tecnología, Viajes, Ayuda, Videojuegos
- Publicaciones con imágenes (hasta 4)
- Comentarios y me gusta
- Mensajes privados
- Notificaciones
- Perfiles con nivel de Esperanto (komencanto / progresanto / flua)
- Búsqueda de posts y usuarios
- Panel de administración
- Selector de idioma con banderas reales (flag-icons, funciona en Windows)
- Modo demo (sin Supabase) para desarrollo local

## Desarrollo local

```bash
npm install
npm run dev
```

El modo demo se activa con `PUBLIC_DEMO_MODE=true` en `.env`. No requiere Supabase.

```env
PUBLIC_DEMO_MODE=true
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

## Variables de entorno (producción)

```env
PUBLIC_DEMO_MODE=false
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxxx
```

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción
npm run preview    # previsualizar build
npm run check      # TypeScript + Svelte check
```

## Estructura

```
src/
├── lib/
│   ├── components/
│   │   ├── layout/       # Navbar, Sidebar, MobileNav
│   │   ├── PostComposer  # Editor de publicaciones
│   │   └── PostMedia     # Grid de imágenes
│   ├── i18n/             # Traducciones (9 idiomas)
│   ├── stores/           # theme, auth, notifications
│   ├── icons.ts          # Mapeo de iconos y colores por categoría
│   ├── mock.ts           # Datos de demo
│   └── types.ts          # Tipos TypeScript
└── routes/
    ├── (app)/            # Rutas autenticadas
    │   ├── feed/
    │   ├── category/[slug]/
    │   ├── post/[id]/
    │   ├── profile/[username]/
    │   ├── messages/
    │   ├── notifications/
    │   └── search/
    ├── admin/
    └── (auth)/           # login, register
```
