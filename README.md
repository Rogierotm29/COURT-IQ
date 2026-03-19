# 🏀 Court IQ v2 — NBA Dashboard + Pick'em Social

## Qué hay nuevo en v2
- **Logos reales** de ESPN CDN (no emojis)
- **Todos los jugadores** de la NBA (~450) con búsqueda, filtros y paginación
- **Pick'em Social** — crea grupos, invita amigos con código, haz picks, clasificación en vivo
- **Auto-score** — los picks se califican automáticamente cuando termina un partido

## Setup completo (15 minutos)

### Paso 1: Crear proyecto en Supabase (gratis)
1. Ve a [supabase.com](https://supabase.com) → **Start your project** → Login con GitHub
2. **New Project** → Nombre: `court-iq` → Elige una contraseña → Región: cualquiera → **Create**
3. Espera ~1 minuto a que se cree
4. Ve a **SQL Editor** (menú izquierdo) → **New Query**
5. Copia TODO el contenido de `supabase-schema.sql` y pégalo ahí
6. Click **Run** ✅
7. Ve a **Settings** → **API** → Copia estos 2 valores:
   - `Project URL` (ej: `https://xxxxx.supabase.co`)
   - `anon/public key` (empieza con `eyJ...`)

### Paso 2: Subir a GitHub
```bash
cd court-iq-v2
git init
git add .
git commit -m "Court IQ v2"
git branch -M main
git remote add origin https://github.com/TU_USER/court-iq.git
git push -u origin main
```

### Paso 3: Deploy en Vercel
1. Ve a [vercel.com](https://vercel.com) → Login con GitHub
2. **Add New Project** → Importa `court-iq`
3. Antes de hacer deploy, agrega las **Environment Variables**:
   - `SUPABASE_URL` → pega tu Project URL de Supabase
   - `SUPABASE_ANON_KEY` → pega tu anon key de Supabase
4. Click **Deploy**
5. ¡Listo! Tu app estará en `https://court-iq.vercel.app`

### Paso 4: Verificar
- Abre tu URL de Vercel
- Los partidos y standings deberían cargar en vivo
- Ve al tab **Pick'em** → Crea tu perfil → Crea un grupo → Comparte el código con amigos

## Cómo funciona el Pick'em

### Para el que crea el grupo:
1. Tab Pick'em → Crear Grupo → Le pones nombre
2. Te da un **código de 6 letras** (ej: `ABC123`)
3. Compartes ese código con tus amigos por WhatsApp/Telegram

### Para los que se unen:
1. Tab Pick'em → Crear perfil (nombre)
2. Click "🔗 Unirse" → Pegan el código → Entrar
3. Ya están en el grupo

### Picks:
- Cada día ven los partidos programados
- Eligen al ganador de cada partido
- Cuando termina el partido, se califica automáticamente
- **10 puntos** por acierto
- La clasificación se actualiza en tiempo real

## APIs (todo automático)

| Endpoint | Datos | Cache | Fuente |
|----------|-------|-------|--------|
| `/api/scoreboard` | Partidos del día | 30s | ESPN |
| `/api/standings` | Clasificaciones | 2min | ESPN |
| `/api/players` | Stats de TODOS los jugadores | 10min | NBA.com → ESPN |
| `/api/pickem?action=...` | Pick'em CRUD | — | Supabase |

## Costo total: $0

| Servicio | Tier gratis |
|----------|-------------|
| **Vercel** | 100GB bandwidth, serverless ilimitado |
| **Supabase** | 500MB database, 50K usuarios, API ilimitada |
| **ESPN/NBA APIs** | Públicas, sin límite práctico |

## Desarrollo local
```bash
npm install

# Necesitas crear .env.local con:
# SUPABASE_URL=https://tu-proyecto.supabase.co
# SUPABASE_ANON_KEY=eyJ...

npx vercel dev
```
