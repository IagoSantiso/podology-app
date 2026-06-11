# Handoff: Patricia Podología — App de reservas + Panel de gestión

## Overview
Rediseño completo de **Patricia Podología**, una clínica de podología. El producto tiene dos
caras que comparten marca y backend:

1. **App del paciente** (móvil) — reserva de citas, bonos y cuenta personal.
2. **Panel de Patricia** (móvil) — agenda diaria, fichas de pacientes, horario y ajustes.

El objetivo del rediseño fue reorientar una app heredada (tema oscuro/dorado con copy de
barbería) hacia una identidad **clara, clínica y de confianza**, con una marca creada desde cero
porque la clínica no tenía branding previo.

El proyecto original es **Next.js (App Router) + Supabase + Tailwind**. Esta documentación está
pensada para refactorizar ese código aplicando el nuevo diseño y la nueva arquitectura de navegación.

---

## About the Design Files
Los archivos de `prototype/` son **referencias de diseño hechas en HTML/React (vía Babel en el
navegador)** — un prototipo navegable que muestra el aspecto y el comportamiento deseados. **No son
código de producción para copiar tal cual.**

La tarea es **recrear estos diseños en el entorno real del proyecto** (Next.js App Router + React +
Tailwind + Supabase, según el repo `podology-app`), usando sus patrones, componentes y librerías ya
establecidos. El prototipo usa CSS plano con variables; en el repo real esos tokens deben mapearse a
la configuración de Tailwind / variables CSS existentes.

El prototipo simula los datos (no hay fetch real). Toda la lógica de datos, auth y persistencia ya
existe en el repo y debe conservarse; aquí solo cambia la **capa de presentación y la navegación**.

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciado, radios e interacciones son finales.
Recrea la UI de forma fiel usando las librerías del codebase. Donde el prototipo y el repo difieran
(p. ej. nombres de rutas), prevalece la **intención** documentada aquí.

---

## Arquitectura de navegación (menús, submenús y flujo)

El producto se divide en **dos áreas con navegación independiente**. En el prototipo se conmuta con
el selector "Paciente / Patricia" de la barra superior; en producción son **dos zonas de rutas
distintas** (la de paciente es pública; la de admin va protegida por auth + rol).

### A. App del paciente  (rutas públicas, raíz `/`)

Navegación principal: **tab bar inferior de 3 pestañas** presente en las pantallas "tope de flujo".

```
TAB BAR (paciente)
├── Reservar      → /book            (Inicio)
├── Bonos         → /bonos
└── Mi cuenta     → /profile         (requiere sesión; si no, muestra acceso)
```

Flujos y subpantallas (las que NO están en la tab bar son pasos de un flujo, con cabecera + botón atrás):

```
RESERVA (flujo lineal, el camino crítico)
  /book                Inicio · hero + CTA "Pedir cita" + accesos a info y bonos
    └─► /book/select     Elegir cita — 3 pasos en una pantalla:
          1) tratamiento  2) día  3) hora        [botón Continuar se habilita al completar]
        └─► /book/guest    Tus datos (solo invitado: nombre, teléfono, email opcional + consentimiento)
            └─► /book/confirm  Confirmar — resumen de la reserva + aviso de cancelación
                └─► /book/success  Cita confirmada — ticket + "Añadir al calendario" / "Cómo llegar"

ACCESO
  /book/login          Acceso del paciente. **El bloque "Reservar como invitado" es la acción
                       PRINCIPAL** (card destacada arriba con CTA primario). El login de cliente
                       recurrente es secundario (campos discretos abajo, botón "ghost").
                       Decisión de producto: la mayoría reserva rápido sin crear ficha.

MI CUENTA (requiere sesión)
  /profile             Mi cuenta — identidad, próxima cita (reprogramar/cancelar), accesos
    ├─► /profile/history   Historial de visitas (timeline con notas clínicas)
    └─► /bonos             Mis bonos / comprar bonos
```

**Reglas de flujo del paciente**
- Desde el Inicio, "Pedir cita" entra directo al flujo de reserva (camino rápido, sin login).
- El login NO es un muro: es opcional y subordinado a "Reservar como invitado".
- `select → guest` solo ocurre para invitados; un cliente con sesión salta `guest` (ya tiene datos).
- `success` ofrece dos salidas: "Ver mis citas" (`/profile`) o "Volver al inicio" (`/book`).

### B. Panel de Patricia  (rutas protegidas, raíz `/admin`)

Navegación principal: **tab bar inferior de 4 pestañas**.

```
TAB BAR (admin)
├── Agenda     → /admin/dashboard
├── Clientes   → /admin/clients
├── Horario    → /admin/schedule
└── Ajustes    → /admin/settings
```

Flujos y subpantallas:

```
ACCESO
  /admin/login         Acceso profesional (login normal — aquí NO hay opción invitado)

GESTIÓN
  /admin/dashboard     Agenda del día — toggle Día/Semana, stats (citas/atendidas/facturado),
                       "siguiente cita", lista cronológica. FAB (+) para nueva cita.
    └─► /admin/appointments/[id]   Detalle de cita — ficha del paciente, datos de la cita,
                                   nota de sesión, acciones "No se presentó" / "Marcar atendida"
  /admin/clients       Clientes — buscador + lista (visitas, con cuenta/invitado)
    └─► (detalle)        Ficha de paciente — stats + historial de tratamientos
                         (en el prototipo es estado interno; en producción → /admin/clients/[id])

CONFIGURACIÓN
  /admin/schedule      Mi horario — sub-tabs: Semana | Festivos | Vacaciones
  /admin/settings      Ajustes — identidad del negocio + grupos: Servicios y precios /
                       Reservas / Cuenta. Cada fila navega a su detalle o conmuta un toggle.
```

**Reglas de flujo del admin**
- `dashboard`: tap en una cita → detalle; FAB → crear cita (mismo formulario que detalle, vacío).
- En `dashboard` las citas "atendidas" se ven atenuadas con check verde; la "siguiente" se resalta.
- `schedule` y `settings` usan sub-navegación por pestañas internas, no nuevas rutas.

---

## Screens / Views

> Medidas tomadas sobre un viewport de teléfono de **390×844** (el marco del prototipo es 384px de
> ancho interior). Padding lateral estándar de pantalla = **20px**. Todas las tarjetas usan el token
> `--radius` (20px por defecto). Tipos en `px`.

### Paciente

**1 · Inicio (`/book`)**
- Cabecera: wordmark (izq.) + botón circular de cuenta (der., 38×38).
- Hero: eyebrow "TU CITA EN UN MINUTO" (11px/700/0.22em, color primary) · título serif 38px
  ("Cuida tus pies" + "con confianza" en cursiva color primary) · párrafo 15px color `--ink-3`.
- Placeholder de imagen 168px alto, gradiente `primary-soft → accent-soft`, icono de pie centrado.
- CTA primario full-width "Pedir cita" (icono calendario) → `/book/select`.
- 2 tarjetas info (dirección / horario) en grid 1fr 1fr.
- Fila "Bonos con descuento" → `/bonos`.
- Tab bar inferior (Reservar activo).

**2 · Acceso (`/book/login`)** — *pantalla clave de este rediseño*
- Título serif "Reserva tu cita" 28px + sub "Sin registro, en menos de un minuto".
- **CARD DESTACADA (acción principal):** borde `1.5px solid var(--primary)`, sombra teal
  `0 10px 28px rgba(47,125,110,0.16)`. Avatar 46px primary + título "Reservar como invitado"
  (15.5px/800) + sub. Tres bullets con check verde: "Sin crear cuenta ni contraseña",
  "Confirmación al instante por SMS", "Solo tu nombre y teléfono". CTA primario full
  "Reservar ahora" (icono flecha) → `/book/select`.
- Separador "¿Ya tienes cuenta?".
- **Login secundario (discreto):** dos inputs (correo, contraseña) + botón **ghost**
  "Acceder a mi cuenta" → `/profile` + enlace "¿Olvidaste tu contraseña?" en gris.

**3 · Elegir cita (`/book/select`)**
- Cabecera con atrás + "Pedir cita".
- Paso 1: eyebrow "1 · ELIGE TRATAMIENTO" + lista de servicios (filas seleccionables: avatar pie,
  nombre 14.5/700, desc truncada, precio en primary + duración). Selección: borde primary + fondo tint.
- Paso 2: eyebrow "2 · ELIGE DÍA" + fila horizontal scroll de fechas (chips 58px: día semana, número
  20px/800, mes). Domingos deshabilitados.
- Paso 3: eyebrow "3 · ELIGE HORA" + grid 4 col de chips de hora; algunas ocupadas (deshabilitadas, tachadas).
- Footer pegajoso: CTA "Continuar" (deshabilitado hasta completar los 3 pasos; texto cambia a
  "Completa los 3 pasos") → `/book/guest` (invitado) o `/book/confirm`.

**4 · Tus datos (`/book/guest`)**
- Cabecera "Tus datos" + sub. Inputs: nombre, teléfono, correo (opcional). Checkbox de privacidad.
- Footer: CTA "Continuar" → `/book/confirm`.

**5 · Confirmar (`/book/confirm`)**
- Card con cabecera en gradiente `primary → primary-deep` (texto blanco): "TU RESERVA" + nombre del
  servicio serif 25px + fecha/hora con iconos.
- Cuerpo blanco: filas Duración / Profesional / Lugar + Total (precio 21px/800 primary).
- Aviso ámbar (fondo `--warn-soft`) sobre cancelación 24h.
- Footer: CTA "Confirmar cita" → `/book/success`.

**6 · Cita confirmada (`/book/success`)**
- Círculo 92px verde con check. Título serif 30px "¡Cita confirmada!" + sub.
- Card-ticket con el servicio + estado "Confirmada" + botones ghost "Añadir al calendario" / "Cómo llegar".
- Footer: "Ver mis citas" (`/profile`) + enlace "Volver al inicio".

**7 · Bonos (`/bonos`)**
- Título serif "Bonos" + botón cerrar.
- Card "Bono activo" (fondo tint, borde primary-soft): progreso de sesiones (barras) + pill "2 de 5 usadas".
- Lista de bonos a comprar (3): el de "Mejor valor" lleva borde `accent` y pill flotante. Cada uno:
  nombre, sesiones·servicio, pill verde de ahorro, precio 24px/800 + €/sesión, botón comprar.
- Tab bar (Bonos activo).

**8 · Mi cuenta (`/profile`)**
- Avatar 56px + nombre/email + botón logout.
- "Próxima cita": card con columna de fecha primary (mes/día 28px/día semana) + servicio + estado +
  botones "Reprogramar" (ghost) / "Cancelar" (danger).
- Accesos: Historial de visitas → `/profile/history`, Mis bonos → `/bonos`, Datos y notificaciones.
- CTA secundario "Pedir otra cita". Tab bar (Mi cuenta activo).

**9 · Historial (`/profile/history`)**
- 2 stats (visitas totales / años). Timeline vertical con nodos; cada entrada: servicio + precio +
  fecha + bloque de nota clínica (fondo tint, icono nota).

### Admin

**10 · Acceso profesional (`/admin/login`)** — login estándar (sin opción invitado), CTA "Entrar al panel".

**11 · Agenda del día (`/admin/dashboard`)**
- Cabecera: "Martes / 9 de junio" (serif 27px, sin wrap) + iconos campana(con punto rojo)/buscar.
- Toggle interno Día | Semana.
- 3 stats: Citas / Atendidas (verde) / Facturado (primary).
- **Vista Día:** banner "SIGUIENTE · 10:30" (card tint borde primary-soft) + lista cronológica:
  cada cita = hora (col izq) + card con borde-izq de color (verde=atendida, primary=siguiente,
  primary-soft=resto), avatar, nombre, servicio, chevron/check. Atenuada si atendida.
- **Vista Semana:** gráfico de barras por día (barra del día actual en primary) + lista de días con resumen.
- FAB (+) flotante 56px primary (abajo-derecha, sobre la tab bar) → crear cita.
- Tab bar (Agenda activo).

**12 · Detalle de cita (`/admin/appointments/[id]`)**
- Cabecera atrás + "Detalle de cita" + botón editar.
- Card paciente: avatar 52 + nombre/teléfono + botones "Llamar"/"Mensaje" (secondary).
- Card cita: "CITA DE HOY" + estado + filas Tratamiento/Hora/Precio.
- Textarea "Nota de la sesión".
- Footer: "No se presentó" (danger) + "Marcar atendida" (primary) → vuelve a `/admin/dashboard`.

**13 · Clientes (`/admin/clients`)**
- Título "Clientes" + buscador. Contador de pacientes + orden A–Z.
- Lista: avatar + nombre/teléfono + "N visitas" + pill "Con cuenta"/"Invitado". Tap → ficha.
- Tab bar (Clientes activo).
- **Ficha de paciente:** avatar 68 centrado + nombre/email + botones "Llamar"/"Nueva cita" +
  3 stats (visitas/atendidas/recientes) + lista de historial con estado y precio.

**14 · Mi horario (`/admin/schedule`)**
- Título "Mi horario" + sub-tabs Semana | Festivos | Vacaciones.
- **Semana:** una card por día con toggle activo/cerrado + rango horario + descanso. Footer "Guardar cambios".
- **Festivos:** lista de fechas cerradas (icono x rojo) + "Añadir festivo" (ghost).
- **Vacaciones:** card de ausencia programada + "Programar ausencia" (ghost).
- Tab bar (Horario activo).

**15 · Ajustes (`/admin/settings`)**
- Card identidad: BrandMark + "Patricia Podología" + dirección + editar.
- Grupos de ajustes (card con filas separadas por hr): "Servicios y precios", "Reservas" (con
  toggles), "Cuenta". Filas con avatar de icono + label + sub + chevron o toggle.
- "Cerrar sesión" (danger). Tab bar (Ajustes activo).

---

## Interactions & Behavior
- **Navegación:** cada botón/fila relevante navega de verdad en el prototipo. En producción usar el
  router de Next (`<Link>` / `router.push`).
- **Entrada de pantalla:** `@keyframes screenIn` — `translateY(9px) → 0` en 0.34s, ease
  `cubic-bezier(.2,.7,.3,1)`. (Importante: la animación NO usa opacity, para que las capturas y el
  SSR/print no muestren contenido en blanco.)
- **Botones:** `:active` → `translateY(1px) scale(.995)`. Primario con sombra teal; hover oscurece.
- **Selección (servicio/fecha/hora):** estado seleccionado = borde primary + fondo/relleno primary.
  Slots ocupados: `disabled`, opacidad .4, `text-decoration: line-through`.
- **CTA condicional (select):** deshabilitado hasta `servicio && hora && día válido`.
- **Toggles (horario/ajustes):** pista 44×26, thumb 20px que desliza; on = primary, off = gris.
- **Inputs:** focus → borde primary + fondo blanco + anillo `0 0 0 4px var(--primary-tint)`.
- **Estados a implementar en real:** loading (skeletons de citas), error (slot ya tomado al
  confirmar), validación de teléfono/email en `guest`, vacío (días sin citas → nota centrada).

## State Management
Estado mínimo del flujo de reserva (en el prototipo vive en el componente raíz; en producción
puede ser context, search params o store):
- `flow = { service, day, slot }` — selección del paciente; persiste de `select → confirm`.
- `mode` (client | admin) y `screen` — solo del shell del prototipo; en producción lo sustituye el router.
- Admin: estado local de toggles de horario, sub-tab activa, paciente seleccionado.
- Datos reales (servicios, citas, bonos, clientes, disponibilidad) vienen de Supabase — ver
  `prototype/app/data.jsx` para la **forma de los datos** esperada por la UI.

## Design Tokens

**Color (paleta por defecto "Cuidado teal")**
```
--primary       #2f7d6e     --ok        #2f8a5b   (--ok-soft   #e3f2e9)
--primary-deep  #1f3a36     --info      #2f7d6e   (--info-soft #e3efec)
--primary-soft  #e3efec     --warn      #c2872f   (--warn-soft #f8efdd)
--primary-tint  #f0f6f4     --danger    #c0524a   (--danger-soft #f7e6e4)
--accent        #c98a5e
--accent-soft   #f6ece2
--ink #1c2826 · --ink-2 #4a5b58 · --ink-3 #7c8b88
--line #e4ebe9 · --line-2 #eef3f1 · --bg #f4f7f6 · --card #ffffff · --field #f5f8f7
```
Hay 3 paletas alternativas (Azul clínico, Sage cálido, Malva suave) definidas en
`prototype/app/config.jsx` — la marca aún no está fijada, sirven para decidir.

**Tipografía**
- Display (serif): **Newsreader** (400/500/600 + cursiva). Títulos, números de fecha, hero.
- Sans: **Hanken Grotesk** (400/500/600/700/800). Todo lo demás.
- Eyebrow: 11px / 700 / `0.22em` / mayúsculas / color primary.
- Pares alternativos en `config.jsx` (Fraunces+Mulish, etc.).

**Radio:** `--radius 20px` · `--radius-lg 26px` · `--radius-sm 13px` (3 ajustes: Suave/Medio/Marcado).
**Sombras:** `--shadow-sm`, `--shadow`, `--shadow-lg` (ver `styles.css`).
**Espaciado:** múltiplos de ~4px; padding de pantalla 20px; gap de listas 9–13px.

## Capturas de pantalla
Las **capturas de las 15 pantallas** están en `screens/` (PNG de alta resolución, en marco de
dispositivo, con la paleta por defecto **Cuidado teal** + tipografía **Newsreader / Hanken Grotesk**):

```
screens/
  01-cliente-inicio.png            09-cliente-historial.png
  02-cliente-acceso.png            10-admin-acceso.png
  03-cliente-elegir-cita.png       11-admin-agenda.png
  04-cliente-tus-datos.png         12-admin-detalle-cita.png
  05-cliente-confirmar.png         13-admin-clientes.png
  06-cliente-cita-confirmada.png   14-admin-horario.png
  07-cliente-bonos.png             15-admin-ajustes.png
  08-cliente-mi-cuenta.png
```

## Marca / Assets
- **Wordmark "Patricia Podología":** "Patricia" en serif cursiva + "PODOLOGÍA" en sans
  mayúsculas espaciadas (0.35em). Ver componente `Logo` en `prototype/app/ui.jsx`.
- **BrandMark (símbolo):** cuadrado redondeado primary con un **arco** (el puente natural del pie)
  en blanco. SVG inline en `ui.jsx` (`BrandMark`). No requiere assets externos.
- **Iconos:** set propio de línea (stroke 1.7), en `prototype/app/icons.jsx`. Reemplazables por la
  librería de iconos del codebase (p. ej. lucide-react) manteniendo el grosor fino.
- **Fotografía:** hay un placeholder en Inicio para foto real de la clínica/Patricia (pendiente de
  aportar). Reservar espacio 168px alto, esquinas `--radius`.
- **Datos:** servicios/precios/clientes del prototipo son de ejemplo — sustituir por los reales.

## Files (en `prototype/`)
- `Patricia Podología.html` — punto de entrada (carga React + Babel + los módulos).
- `app/styles.css` — **sistema de diseño completo** (tokens + componentes). La fuente de la verdad visual.
- `app/config.jsx` — paletas y pares tipográficos alternativos.
- `app/data.jsx` — datos mock + **forma de los datos** que consume la UI.
- `app/icons.jsx` — set de iconos.
- `app/ui.jsx` — primitivos: `Logo`, `BrandMark`, `PhoneFrame`, `Btn`, `StatusPill`, `Avatar`, `ScreenHeader`.
- `app/client-screens-1/2/3.jsx` — pantallas de paciente.
- `app/admin-screens-1/2/3.jsx` — pantallas de admin.
- `app/app.jsx` — shell del prototipo (conmutador, rail, router, tweaks). **No portar tal cual** —
  su rol lo cumple el routing real de Next; sirve como mapa de la navegación.

> El prototipo incluye un panel **Tweaks** (abajo-derecha) para probar paleta, tipografía y radios en
> vivo: úsalo para fijar la dirección visual final antes de implementar.
