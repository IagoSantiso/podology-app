# Handoff — Rediseño del panel de admin (Barbería Iglesias)

**Stack destino:** Next.js 14 (App Router) + Tailwind CSS + Supabase
**Para implementar por:** Claude Code (o desarrollador humano)
**Fecha del handoff:** 15 de mayo de 2026
**Fidelidad:** **Alta (hifi)** — colores, tipografías, espaciados e interacciones son finales

---

## 1 · Resumen

Rediseño visual de las 3 páginas del panel del barbero en una app de reservas existente:

- `/admin/dashboard` — agenda del día con CTA "Voy a llegar tarde"
- `/admin/schedule` — disponibilidad semanal + vacaciones + festivos
- `/admin/settings` — configuración (3 esenciales destacados + avanzado plegable)

Estética: barbería clásica con toque moderno. Fondo negro, acentos dorados, tipografía editorial (Playfair Display cursiva) para fechas y números, DM Sans para UI. Mobile-first — el barbero lo usa desde el móvil entre cortes.

---

## 2 · Sobre los archivos de este bundle

> **Léeme antes de empezar.**

Este bundle contiene **dos carpetas con dos propósitos distintos**:

### `preview/` — Maqueta HTML interactiva (referencia visual)
Es un prototipo construido en HTML/React/Babel servido desde un único `index.html`. **No es código para copiar**. Sirve para:
- Validar el look & feel pixel a pixel
- Ver los 3 estados extra del dashboard (día tranquilo, día vacío, modal de retraso)
- Manipular tweaks en vivo (acento dorado, densidad)

Para abrirlo: `open preview/index.html` en un navegador (o servir la carpeta con cualquier static server). No requiere build.

### `implementation/` — Código real para el repo de Next.js
Son `.tsx` y SQL **listos para pegar** en el proyecto del usuario:

```
implementation/
├── src/app/admin/dashboard/page.tsx    → reemplaza el existente
├── src/app/admin/schedule/page.tsx     → reemplaza el existente
├── src/app/admin/settings/page.tsx     → reemplaza el existente
└── supabase/_migration-vacations.sql   → ejecutar en SQL Editor (opcional, ver §10)
```

**Cómo encajan los dos:** la maqueta de `preview/` y el código de `implementation/` representan la misma UI. Si hay alguna divergencia visual menor, el código `.tsx` manda (porque usa los tokens reales de Tailwind del proyecto, mientras que la maqueta los reproduce con estilos inline).

---

## 3 · Qué NO se toca

Las páginas reescritas mantienen intactos:

- Todos los **tipos**: `Service`, `Appointment`, `AvailabilityRow`, `Holiday`, `Config`
- Todas las **rutas API** (`/api/admin/appointments`, `/api/admin/availability`, `/api/admin/holidays`, `/api/admin/config`, `/api/delay-notify`, `/api/services`, etc.)
- **Modales** existentes (crear cita, completar, retraso) — solo cambia su JSX
- **Polling** de 60s para detectar citas nuevas
- **Permisos de notificación** del navegador
- `src/components/admin/AdminNav.tsx` (el bottom-nav)
- `src/app/globals.css` (los tokens CSS ya estaban bien)
- `src/app/layout.tsx` (Playfair + DM Sans ya cargados como Google Fonts)

---

## 4 · Inconsistencias del código existente — corregidas en este rediseño

| # | Problema | Solución |
|---|---|---|
| 1 | **Bug en "Voy a llegar tarde".** El handler hacía `dayApts.find(a => a.status === 'confirmed')` y cogía la PRIMERA cita confirmada del día. A las 18:00 seguía siendo la de las 9:00, ya pasada. | Reemplazado por `nextConfirmed`: filtra por `start_time >= now` cuando es hoy. Patch dentro de `dashboard/page.tsx`. |
| 2 | **Settings ≠ brief.** Tu brief pedía 3 campos; el código tenía 9+ secciones. | 3 destacados arriba (teléfono, margen alarma, mensaje retraso) + resto plegado bajo "Configuración avanzada". Nada se borra. |
| 3 | **Vacaciones sin UI.** `blocked_slots` existía en schema sin interfaz; `holidays` sólo permite días sueltos. | Tabla nueva `vacations` para rangos (start_date, end_date, reason). Migración SQL incluida. |
| 4 | **Timeline forzada.** El brief pedía lista; el código mostraba slots de 30 min de 8:00 a 21:00. | Lista como vista por defecto + toggle (icono lista/grid) arriba a la derecha para volver a la timeline. Nada se pierde. |
| 5 | **`'sinEmail@barberia.local'`** como fallback al crear citas. | NO se corrige en este rediseño (es lógica). Recomendación: permitir `client_email NULL` en schema. |

---

## 5 · Design tokens (ya en `globals.css`)

```css
--gold:        #d4a853;   /* acentos, "siguiente", CTAs primarios */
--gold-dark:   #b8922e;   /* hover */
--cream:       #f5f0e8;   /* texto principal */
--bg:          #0a0a0a;   /* fondo página */
--bg-card:     #111111;   /* tarjetas */
--bg-input:    #1a1a1a;   /* inputs */
--border:      #2a2a2a;   /* divisores */
--muted:       #666666;   /* texto secundario */
```

**Colores semánticos usados (Tailwind directo, no en tokens):**

| Estado | Texto | Background | Border |
|---|---|---|---|
| Retraso/urgente | `text-orange-300/400` | `bg-orange-500/10` | `border-orange-500/30..40` |
| Completado | `text-green-400` | `bg-green-700/10` | `border-green-700/30` |
| Cancelado | `text-red-400` | `bg-red-900/10` | `border-red-900/30` |
| CTA Voy tarde | `text-white` | `bg-orange-600` | — |

**Tipografía:**

| Variable | Familia | Uso |
|---|---|---|
| `font-display` | Playfair Display 400/600/700 (incl. italic) | Títulos, números (horas, fechas, totales), cursivas decorativas |
| `font-sans` | DM Sans 400/500/600 | Todo el resto |

**Escala tipográfica habitual en el rediseño:**

- Título de página: `font-display italic text-[32px]` (Jueves **15**)
- Subtítulo: `font-display italic text-[14px] text-muted`
- Hora de cita: `font-display font-semibold text-[22px] tabular-nums`
- Etiquetas de sección: `text-[10px] font-semibold tracking-[0.18em] uppercase text-gold`
- Cuerpo: `text-sm` o `text-[13px]`
- Microcopy: `text-[11px]` o `text-[12px] text-muted`

**Tracking de small caps:** las etiquetas tipo `AGENDA`, `ESENCIALES`, `SEMANA TIPO` usan siempre `tracking-[0.18em]` o `tracking-[0.22em]`. Es la firma visual del rediseño — respetar.

**Radios y bordes:**

- Tarjetas de cita / configuración: `rounded-xl` (12px)
- Tarjetas pequeñas / inputs: `rounded-lg` u 8 (8px)
- Chips, pills, badges: `rounded-md` o `rounded` (4–6px)
- Bordes: siempre `1px solid var(--border)`, suavizado a `border/50` para subdivisiones
- Hairlines (separadores horizontales/verticales): `1px` de `border` con `opacity 0.5`

---

## 6 · Pantalla 1 — Dashboard (`/admin/dashboard`)

### Propósito
Vista del día actual con todas las citas, capacidad de avisar al cliente que llegas tarde, marcar completada, cancelar, o crear nueva cita.

### Layout (mobile-first, max-width 2xl/672px)

```
┌─────────────────────────────────┐
│ ✂  Iglesias · AGENDA            │  brand bar (alt. 42px)
├─────────────────────────────────┤
│ JUE · 15 MAY        [ ☰ ] [ ▦ ] │  título + toggle vista
│ Jueves 15                       │
│   de mayo                       │
├─────────────────────────────────┤
│  ‹ 11 may – 17 may 2026 ›       │  semana navegable
│ [L][M][X][J][V][S][D]           │  chips día (3 citas)
├─────────────────────────────────┤
│ ⚠ Próxima cita en 15 minutos    │  banner naranja si <60min
│   Diego Castro · 10:30h         │
├─────────────────────────────────┤
│ [⏰ Voy a llegar tarde · avisar │  CTA naranja prominente
│      a Pablo               ]    │
├─────────────────────────────────┤
│ HOY  7 citas  ───────────────   │  section label
│                                 │
│ 09:00 │ Andrés Vázquez       ✓ │  cards apiladas
│ 30min │ Corte · 14€             │
│                                 │
│ 11:00 │ Pablo Méndez SIGUIENTE │  ← anillo dorado
│ 45min │ Corte + Barba · 18€    │
│       └ +34 611 008 743         │  expandido (acciones)
│         [Completar][Retraso][✕] │
│ …                               │
├─────────────────────────────────┤
│ ─── fin del día ───             │
│                              [+] │  FAB nueva cita
├─────────────────────────────────┤
│ [Agenda Clientes Horario …]     │  AdminNav (existente)
└─────────────────────────────────┘
```

### Componentes clave

#### A. Brand bar (top, 42px alt.)
- Píctograma de tijera 13×13px en cápsula 26×26px con borde dorado `border-gold/35`
- Texto `Iglesias` en Playfair italic 14px / `cream`
- Sufijo en small caps doradas: `AGENDA` / `HORARIO` / `AJUSTES` según página

#### B. Título de página
- Pre-label en small caps doradas: `HOY · 15 MAY` (o `JUE · 15 MAY` si no es hoy)
- Día en Playfair italic 32px, número del día en `text-gold`
- Sufijo `de mayo` en Playfair italic 18px / `text-muted`

#### C. Toggle vista (top-right)
- Caja con `border` y `bg-bg-card`, padding 2px, contiene 2 botones 30×28px
- Botón activo: `bg-gold text-bg`. Inactivo: `text-muted`
- Iconos: `ListIcon` (3 líneas) y `GridIcon` (4 cuadrados), ambos 15×15px

#### D. Strip de semana
- Cabecera con `‹ 11 may – 17 may 2026 ›` centrado, small caps 10px
- 7 botones flex (cada uno `flex-1`), gap 6px
- Cada chip muestra:
  - Día abreviado en small caps 9px (`LUN`, `MAR`, ...)
  - Número del día en Playfair semibold 17px
  - Conteo: `3 citas` u `—` en 8px bold
- Estados:
  - Día seleccionado: `bg-gold text-bg` (texto invertido)
  - Hoy (no seleccionado): `border-gold/35 text-cream`
  - Otros: `border-border text-muted`

#### E. Banner de urgencia (cita < 60min)
- Solo aparece si `isToday(selectedDate)` Y la siguiente cita confirmada está a menos de 60min
- `bg-orange-500/[0.08]`, `border-orange-500/30`, padding `px-3.5 py-2.5`
- Icono `AlertIcon` 16px naranja a la izquierda
- Línea 1: `Próxima cita en {N} minutos` en 12.5px semibold naranja claro
- Línea 2: `{nombre} · {hora}h` en 11px naranja medio

#### F. CTA "Voy a llegar tarde"
- Solo aparece si hoy tiene una próxima cita confirmada (`nextConfirmed`)
- Width 100% del contenedor, padding `px-4 py-3.5`, `rounded-xl`
- `bg-orange-600 hover:bg-orange-700 text-white`
- Sombra: `shadow-[0_6px_18px_rgba(224,131,68,0.18)]`
- Contenido (flex, gap 2.5, center):
  - Icono `ClockIcon` 16px
  - `Voy a llegar tarde` en sans semibold 14px
  - Sufijo en Playfair italic 12px opacity 80: `· avisar a {primerNombre}`
- Al pulsarlo abre el modal de delay apuntando a `nextConfirmed.id` (no a la primera del día — bug arreglado)

#### G. Tarjeta de cita (`AppointmentCard`)
Es el componente central. Estructura horizontal:

```
[ Hora  ] | [ Nombre + servicio + precio          ] [ Badge ]
[ 30min ] | [ +34 ... · cuando expandido          ]
            [ [Completar] [Retraso] [✕] · expandido]
```

- Container: `bg-bg-card rounded-xl border` con borde:
  - `border-gold/40 shadow-[0_0_0_1px_rgba(212,168,83,0.2)]` si es la siguiente
  - `border-border` si no
- Columna izquierda (hora):
  - Hora `HH:MM` en Playfair semibold 22px tabular-nums
    - `text-gold` si es siguiente
    - `text-orange-400` si está retrasada
    - `text-cream` resto
  - Duración `{N} min` en 9px tracking-wider muted
- Divisor vertical: `w-px self-stretch bg-gold/35` (o `border` según estado)
- Columna principal:
  - Nombre del cliente en sans semibold 14px cream (con `line-through` si cancelada)
  - Línea de meta en 11.5px muted: `Corte · 14€` (precio en Playfair italic 12px gold)
- Badge de estado a la derecha (ver tabla)
- Opacidad 60% si la cita está completada o ya pasó (`end_time < now`)

**Estados del badge (esquina superior derecha de cada card):**

| Estado | Texto | Estilo |
|---|---|---|
| Confirmed (siguiente) | `siguiente` | `text-gold bg-gold/15 border-gold/35` |
| Confirmed (otra) | `—` | `text-muted border-border` |
| Delayed | `+15'` (con valor) | `text-orange-400 bg-orange-500/10 border-orange-500/30` |
| Completed | `✓` | `text-green-400 bg-green-700/10 border-green-700/30` |
| Cancelled | `X` | `text-red-400 bg-red-900/10 border-red-900/30` |

Badge: padding `px-2 py-1`, `rounded`, `text-[9.5px] uppercase font-bold tracking-wider border`.

**Acciones expandidas** (cuando el usuario tap-ea la card):
- Banda inferior con border-top suave y `bg-white/[0.012]`
- Izquierda: icono `PhoneIcon` + número del cliente en 11px tabular-nums
- Derecha: 3 chips de acción (solo si `status === 'confirmed'`):
  - `Completar` — verde, abre modal de completar con notas
  - `Retraso` — naranja, abre modal de delay
  - `✕` — rojo, llama `patchApt(id, { status: 'cancelled' })`

#### H. Vista timeline (toggle alternativo)
- Filas de 56px de altura mínima, una por hora
- Columna izquierda: número de hora (`09`) en Playfair 14px muted, ancho 44px, alineado derecha
- Columna derecha: borde-left `border/50`, padding-left 10px
  - Si una cita empieza ahí: tarjeta compacta con nombre, servicio y rango horario
  - Si una cita continúa: barra vertical `border-l-2 border-gold/30 h-[38px]`
  - Si está vacío: link `+ añadir` en font-display italic muted

#### I. FAB "Nueva cita"
- Fijo bottom-right, `bottom-24 right-4` (sobre el AdminNav)
- 52×52px circular, `bg-gold text-bg`
- Sombra: `shadow-[0_8px_24px_rgba(212,168,83,0.35),0_0_0_4px_rgba(212,168,83,0.08)]`
- Icono `PlusIcon` 14×14px stroke 2.6

### Interacciones / estados
- Tap a una card: expande/colapsa esa card (cierra otras)
- Tap a "Completar" → abre modal con `<textarea>` para notas
- Tap a "Retraso" → abre modal con chips de minutos (10/15/20/30/45) + preview del WhatsApp
- Tap a `[✕]` → llamada inmediata a PATCH (sin confirmación — quizás añadir uno luego)
- Tap a FAB → abre modal de creación
- Tap a chip del día → cambia `selectedDate`
- Tap a `‹ ›` semana → mueve `weekStart` ± 1 semana
- Toggle lista/grid → cambia `view` (no persiste entre páginas)

### Modales

**Modal shell:** bottom-sheet en mobile (`items-end`), centrado en sm+. `bg-bg-card`, `rounded-t-2xl`, padding `px-5 pt-5 pb-7`. Backdrop `bg-black/65 backdrop-blur-sm`. Mango (handle) 36×4 `bg-border` arriba en mobile.

**Modal de retraso:**
- Título: `Avisar retraso` (Playfair italic 22px)
- Subtítulo: `WhatsApp a {nombre}`
- Chips de minutos (10/15/20/30/45) — chip seleccionado: `border-gold bg-gold/10 text-gold`
- Preview del mensaje en caja `bg-bg-input border-border/60 rounded-md p-2.5 text-[11.5px]` con label `VISTA PREVIA`
- Botones: `[Cancelar]` (ghost border) + `[Enviar aviso]` (`bg-orange-600 text-white`)

**Modal de crear cita:** form vertical con campos Nombre, Tel/Email (grid 2col), Servicio/Hora (grid 2col). Inputs `bg-bg-input border-border rounded-md` con focus `border-gold`. Botón primario `bg-gold text-bg`.

**Modal de completar:** título + textarea de notas (rows 3) + botones [Cancelar] [✓ Completar] (verde).

---

## 7 · Pantalla 2 — Schedule (`/admin/schedule`)

### Propósito
Configurar horario semanal recurrente, vacaciones (rangos de días), y festivos puntuales.

### Layout

Brand bar + título idéntico al dashboard, luego **3 tabs**: `Semana`, `Vacaciones`, `Festivos`.

Tabs en small caps 12px tracking-[0.12em], padding `pt-2 pb-2.5`. Tab activa: `text-gold` + underline 2px `bg-gold` posicionado en `-bottom-px`. Inactivas: `text-muted`.

### Tab "Semana"

Para cada día Lun→Dom una tarjeta:

```
┌──────────────────────────────────────────┐
│ (•) Lunes                          11  h │
│     [09:00] a [20:00]                    │
└──────────────────────────────────────────┘
```

- Switch (Toggle) izquierda — `bg-gold` cuando ON, círculo interno `bg-bg`
- Nombre del día en Playfair semibold 16px — `text-cream` si activo, `text-muted` si no
- Cuando activo: 2 inputs `type="time"` separados por un `a` en Playfair italic
- Cuando inactivo: `cerrado` en font-display italic muted
- Columna derecha: total de horas del día — Playfair semibold 18px gold tabular-nums + `h` 11px muted
- Cuando inactivo, toda la tarjeta a `opacity-55`

Botón **Guardar horario** width 100% `bg-gold text-bg rounded-lg py-3.5`. Tras guardar muestra `✓ Guardado` 2s.

**Total semanal** debajo: tarjeta con label small caps "Total semanal" + número Playfair 36px gold + "horas" en italic + conteo de días abiertos a la derecha.

### Tab "Vacaciones"

Lista de rangos existentes:

```
┌──────────────────────────────────────────┐
│ ▌ 10–23 agosto                    🗑      │
│   Vacaciones de verano · 14 días         │
└──────────────────────────────────────────┘
```

- Barra vertical dorada 4px a la izquierda
- Rango formateado: si mismo mes `10–23 agosto`, si diferente `10 ago – 5 sep`
- Línea inferior: motivo + número de días en gold
- Icono trash a la derecha

Si lista vacía: caja dashed con `Sin vacaciones programadas` en Playfair italic.

**Form añadir rango:** tarjeta `bg-bg-card border-border/50 rounded-xl p-3.5`:
- Label small caps "Añadir rango"
- Grid 2 cols: `Desde` + `Hasta` (inputs `type="date"`)
- Campo `Motivo (opcional)` text input
- Botón "+ Añadir vacaciones" outline gold

### Tab "Festivos"

**Sección Nacionales** (10 festivos de España precargados para el año actual + siguiente):

Filas con `border-b border-border/50`, padding `py-2.5`:
- Fecha en Playfair semibold 14px (gold si ON, muted si OFF), ancho 56px
- Nombre del festivo (cream si ON, muted si OFF)
- Toggle a la derecha (tamaño 16)

**Sección Locales** debajo:
- Lista de festivos custom guardados (si los hay)
- Form al final: fecha + nombre + botón outline gold

### Endpoints usados
- `GET/PUT /api/admin/availability`
- `GET/POST/DELETE /api/admin/holidays`
- `GET/POST/DELETE /api/admin/vacations` ← **NUEVO**, ver §10

---

## 8 · Pantalla 3 — Settings (`/admin/settings`)

### Propósito
Configuración del barbero. **3 ajustes esenciales destacados** (teléfono, margen alarma, mensaje de retraso) + **avanzado plegable** con todo lo demás (logo, dirección, recordatorios, push, contraseña).

### Estructura

Brand bar + título "Ajustes" (Playfair italic 32px) + subtítulo `Lo esencial primero`. En esquina superior derecha: link `Cerrar sesión` 11px underline.

#### Sección "Esenciales"

Section label `ESENCIALES · los 3 que más cambias` (label gold + accent italic muted + hairline).

3 tarjetas grandes (`CardCard`):

**1. Tu teléfono**
- Cabecera con icono en cápsula dorada 24×24 (`bg-gold/15 text-gold`) + label `TU TELÉFONO`
- Input grande (`px-4 py-3.5 bg-bg-input border-border rounded-lg text-sm font-medium`)
- Microcopy: "Recibirás un SMS la noche anterior si tienes citas el día siguiente." en Playfair italic 11px

**2. Margen de alarma**
- Icono `BellIcon` en cápsula dorada
- Microcopy explicativa 12px
- 5 botones chips (30/45/60/90/120) — flex-1 cada uno, con número en Playfair 16px + "min" en 9px
- Chip seleccionado: `bg-gold/15 border-gold text-gold`

**3. Mensaje de retraso**
- Icono `Scissors` dorado
- Microcopy 12px
- Textarea grande `rows={4}` con la plantilla
- Debajo: 3 pills monospace doradas con `{nombre}` `{minutos}` `{hora_nueva}`

**Botón "Guardar cambios"** dorado al pie de los 3.

#### Sección "Configuración avanzada" (plegable)

Botón colapsable: small caps muted `CONFIGURACIÓN AVANZADA` + chevron rotativo. Al abrir se expande con 5 sub-secciones (cada una con `Section` label + tarjeta `bg-bg-card`):

1. **Negocio** — logo (upload), nombre, dirección
2. **Datos personales** — email del propietario
3. **Recordatorios al cliente** — 3 chip-groups (reagendar / 1er recordatorio / 2º recordatorio)
4. **Notificaciones push** — estado verde si granted, botón Activar si default
5. **Cambiar contraseña** — 2 campos password + botón ghost

### Endpoint usado
- `GET/PUT /api/admin/config` (sin cambios)
- `POST /api/admin/upload-logo`
- `DELETE /api/admin/auth` (logout)

---

## 9 · State management

Todo el state es local con `useState` y `useEffect` — **no hay store global**. Mantengo el patrón existente.

**Dashboard:**
- `selectedDate: Date` + `weekStart: Date`
- `dayApts: Appointment[]` + `weekApts: Appointment[]`
- `services: Service[]` + `availability: AvailabilityRow[]`
- `view: 'list' | 'timeline'` (nuevo)
- `openAptId: string | null` (nuevo — qué card está expandida)
- 3 estados de modal: `createModal`, `delayModal`, `completeModal`
- `notifPermission` + `lastCheckedRef` para polling

**Schedule:**
- `tab: 'week' | 'vac' | 'fest'` (nuevo)
- `availability`, `holidays`, `vacations` (nuevo)
- Forms locales: `newVac`, `newHol`

**Settings:**
- `config: Config` (sin cambios)
- `openAdv: boolean` (nuevo)
- Forms de contraseña/logo

---

## 10 · Migración de base de datos (opcional)

Si quieres activar **Vacaciones**, ejecuta `supabase/_migration-vacations.sql` en el SQL Editor de Supabase. Crea la tabla `vacations(id, start_date, end_date, reason, created_at)` con RLS abierto a lectura pública (escritura via service_role desde tus rutas API).

Luego añade `src/app/api/admin/vacations/route.ts` con handlers `GET / POST / DELETE` siguiendo el mismo patrón que `holidays/route.ts`. La UI ya hace los fetches a esos endpoints — si todavía no existen, falla en silencio y la tab muestra estado vacío.

Finalmente, extiende `src/lib/slots.ts` para descartar fechas dentro de cualquier rango de `vacations` al computar slots libres.

**Si no quieres vacaciones todavía:** no ejecutes el SQL. La tab "Vacaciones" simplemente aparecerá siempre vacía y el form no guardará. No rompe nada.

---

## 11 · Assets

**Iconos:** todos son inline SVG copiados dentro de cada `.tsx` (Scissors, Phone, Bell, Clock, Alert, List, Grid, Plus, Caret, Trash). Stroke `currentColor` para que hereden el color del padre. Tamaños habituales: 13–22px.

Si prefieres centralizarlos, muévelos a `src/components/admin/icons.tsx` y haz `import { Scissors } from '@/components/admin/icons'`.

**Tipografías:** Google Fonts ya cargadas en `src/app/layout.tsx`:
- `Playfair_Display` con weights 400/600/700 (incluye italic)
- `DM_Sans` con weights 400/500/600

No hay imágenes ni assets binarios.

---

## 12 · Cómo probar

1. Copia los 3 `.tsx` de `implementation/src/app/admin/*` sobre los existentes.
2. (Opcional) ejecuta el SQL de vacaciones y añade la ruta API correspondiente.
3. `npm run dev` y navega a `/admin/dashboard`.
4. Verifica:
   - El CTA "Voy a llegar tarde" apunta al cliente correcto (la siguiente cita futura, no la primera del día)
   - El toggle lista/timeline cambia la vista sin recargar
   - Las cards se expanden al tap mostrando acciones
   - El banner naranja sólo aparece cuando hay una cita en < 60min
   - El total de horas en Schedule cambia al togglear días
   - Los 3 esenciales de Settings persisten al refrescar

Compara visualmente con `preview/index.html` abierto en un navegador (vista mobile, ~402px).

---

## 13 · Archivos de este bundle

```
design_handoff_admin_panel/
├── README.md                          ← este archivo
├── preview/
│   ├── index.html                     ← maqueta interactiva (abrir en navegador)
│   ├── app.jsx                        ← composición de las 3 pantallas + tweaks
│   ├── shared.jsx                     ← AdminNav + Switch + iconos + helpers
│   ├── mock-data.jsx                  ← datos ficticios que respetan los tipos reales
│   ├── screen-dashboard.jsx           ← maqueta dashboard
│   ├── screen-schedule.jsx            ← maqueta schedule
│   ├── screen-settings.jsx            ← maqueta settings
│   ├── design-canvas.jsx              ← scaffold de la maqueta (3 frames lado a lado)
│   ├── ios-frame.jsx                  ← bezel de iPhone
│   └── tweaks-panel.jsx               ← panel para ajustar accent/densidad en vivo
└── implementation/
    ├── src/app/admin/
    │   ├── dashboard/page.tsx         ← reemplaza el existente
    │   ├── schedule/page.tsx          ← reemplaza el existente
    │   └── settings/page.tsx          ← reemplaza el existente
    └── supabase/
        └── _migration-vacations.sql   ← opcional (ver §10)
```

---

## 14 · Decisiones de diseño (para contexto)

- **Por qué Playfair en cursiva para fechas y números.** Una barbería clásica española vive de la tipografía: rótulos, espejos pintados a mano, etiquetas de productos. La cursiva italic da ese aire editorial sin caer en clichés de "bigote + brocha".
- **Por qué small caps doradas con tracking ancho.** Reemplaza los típicos títulos `Section Header` con un patrón que recuerda a labels grabados en bronce. Aparecen en TODAS las secciones — es la firma visual.
- **Por qué naranja (no rojo) para el CTA de retraso.** Rojo significa cancelar / error. Naranja es atención / urgencia. Distinguir importa: el barbero no quiere confundir "voy tarde" con "cancelo la cita".
- **Por qué lista por defecto.** El brief lo pedía, pero también porque en mobile un slot vacío de 30 min ocupa el mismo espacio que uno lleno — desperdicia scroll. La lista densifica visualmente las citas reales.
- **Por qué destacar la "siguiente" en oro.** El barbero abre la app entre cortes para ver "qué viene ahora". Esa información tiene que ser identificable en < 1 segundo desde una distancia de medio metro con las manos ocupadas.
- **Por qué 3 esenciales en Settings.** El brief mencionaba 3 campos. Los otros 6 son ajustes "configura una vez y olvida". Separarlos visualmente respeta la ergonomía: lo que tocas a menudo arriba; lo que tocas casi nunca, escondido pero accesible.
