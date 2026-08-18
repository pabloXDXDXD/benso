# BENSO — Guía de marca y tokens de diseño

Guía visual de la web pública de BENSO: colores, tipografía y reglas de estilo para mantener la marca consistente. Todos los valores son los reales que usa la web.

---

## 1. Tokens de diseño

### Color — Superficies

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#ffffff` | Fondo general de la web |
| `--surface` | `#ffffff` | Tarjetas y contenedores |
| `--card-border` | `rgba(0, 65, 157, 0.2)` | Borde azul sutil de tarjetas |

### Color — Texto

| Token | Valor | Uso |
|---|---|---|
| `--text-primary` | `#333333` | Texto principal |
| `--text-secondary` | `#6b6b6b` | Descripciones y textos secundarios |
| `--text-muted` | `#666666` | Texto tenue, placeholders |

### Color — Marca

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `#00419d` | **El azul de la marca**: logo, botones, títulos, enlaces |
| `--secondary` | `#002c6a` | Azul oscuro: textos importantes, secciones serias, sombras |
| `--accent` | `#0056d0` | Azul vibrante: promociones, destacados |

### Color — Semántico

| Token | Valor | Uso |
|---|---|---|
| `--whatsapp` | `#25D366` | Botones y enlaces de WhatsApp |
| `--whatsapp-hover` | `#1ebe5d` | Estado hover de WhatsApp |
| `--border` | `#dddddd` | Bordes de formularios e inputs |

### Tipografía

| Token | Valor | Uso |
|---|---|---|
| `--font-heading` | **Cocogoose** | Títulos — la personalidad de la marca |
| `--font-main` | **TT Commons** | Todo lo demás: textos, botones, UI |

### Escala tipográfica

| Token | Valor | Uso |
|---|---|---|
| Hero (portada) | 40px | Titular de la primera pantalla |
| Títulos de sección | ~29px | "Nuestros servicios", "Productos destacados" |
| Títulos de tarjeta | 16–24px | Servicios, productos, talleres |
| Cuerpo | 16px | Texto normal |
| Texto pequeño / etiquetas | 12–14px | Precios, fechas, badges |

### Espaciado y layout

| Token | Valor | Uso |
|---|---|---|
| Ancho máximo | 1200px | Contenido centrado, nunca más ancho |
| Escala base | 4px | 4 / 8 / 12 / 16 / 24 / 32 / 48 |
| Alto del menú | 104px | Cabecera fija |
| Alto del banner | 40px | Aviso promocional superior |

### Radio de esquinas

| Token | Valor | Uso |
|---|---|---|
| `--radius` | 16px | Tarjetas y contenedores |
| Píldora | 9999px | Etiquetas tipo `#popular`, badges |

### Elevación (sombras)

| Token | Valor | Uso |
|---|---|---|
| Tarjeta | `0 4px 20px rgba(0,44,106,0.12)` | Sombras suaves azuladas |
| Vidrio | `0 8px 32px rgba(0,44,106,0.12)` | Elementos elevados |

### Foco y movimiento

| Token | Valor | Uso |
|---|---|---|
| Foco | `3px solid #0056d0` | Anillo visible al navegar con teclado |
| Transición | 0.3s ease | Cambios suaves de color y sombra |
| Movimiento | Scroll suave + aparición de secciones | Animaciones elegantes, nunca bruscas |

---

## 2. Reglas de uso — lo esencial

### La idea general
Blanco + azul de la marca + tarjetas redondeadas con bordes azules sutiles. Limpio, profesional, confiable. Nada de ruido.

### Colores — cómo se usan
- **Azul principal `#00419d`** → para lo que debe destacar: botones, títulos, enlaces.
- **Azul oscuro `#002c6a`** → para textos importantes y momentos formales.
- **Azul vibrante `#0056d0`** → con moderación, para promociones.
- **Fondo siempre blanco**, tarjetas blancas con borde azul al 20%.
- **Verde solo para WhatsApp** — no se usa para otra cosa.

### Tipografía
- Títulos en **Cocogoose** (redondeada, con carácter).
- Textos en **TT Commons** (limpia y legible).
- Jerarquía clara: portada grande → títulos de sección → títulos de tarjeta → cuerpo → etiquetas.

### Componentes principales
- **Botones:** azul principal para la acción más importante ("Agendar cita"), verde para WhatsApp, contorno azul para acciones secundarias.
- **Tarjetas:** blancas, radio 16px, borde azul sutil, sombra suave azulada.
- **Etiquetas:** píldoras redondeadas (ej. `#popular`, "Incluye certificado").
- **Texturas:** grano sutil + degradado en la portada y en el bloque final de contacto.

---

## 3. Lo que NO se hace

- ❌ No usar colores que no sean la paleta (ni rojos, ni naranjas, ni verdes que no sean WhatsApp).
- ❌ No usar fondos oscuros en la web pública — el fondo es blanco.
- ❌ No usar esquinas cuadradas ni sombras duras — todo es suave y redondeado.
- ❌ No usar Cocogoose en textos largos — solo títulos.
- ❌ No hacer animaciones bruscas — todo se mueve suave.

---

## 4. Responsive

- La web se adapta: móvil (menú hamburguesa, todo en una columna) y escritorio (grillas y menú completo).
- El punto de corte principal está en **768px**.
- En móvil las tarjetas ocupan casi todo el ancho; en escritorio se agrupan en grillas.

---

*Documento de guía de marca — basado en los tokens reales de `globals.css` de la web de BENSO.*