---
name: svg-creator
description: Create high-quality SVG graphics including icons, illustrations, logos, diagrams, infographics, patterns, animations, and abstract art. Use this skill whenever the user asks to create, draw, design, or generate any SVG image, vector graphic, icon, logo, badge, diagram, flowchart, infographic, pattern, or animated graphic. Also trigger when the user says "draw me", "make an SVG", "create a graphic", "design an icon", "vector illustration", or requests any visual output that would be best served as an SVG file. This skill covers both simple single-element graphics and complex multi-layered compositions with animation.
---

# SVG Creator Skill

Estil del joc: pla i de colors vius com la resta de fons i sprites. Usa les tècniques d'il·luminació d'aquí amb moderació
(ombres de color, degradats suaus, gra lleuger), sense canviar l'estil a hiperrealista.

## THE MANDATORY WORKFLOW

Every SVG goes through the feedback loop script. No exceptions. You cannot deliver an SVG you haven't rendered and visually verified.

### The Loop

```
WRITE SVG → RENDER → VIEW PNG → ASSESS → FIX → RENDER → VIEW → ... → DELIVER
```

### Step-by-Step (adaptat a Autoescola Incremental)

> Importada de github.com/upbrew-tech/svg-creator-skill (Apache 2.0, vegeu LICENSE). El seu `scripts/svg_loop.py` no
> s'ha importat (rutes de Linux i instal·lació automàtica amb pip): en aquest projecte el bucle es fa així:

1. Escriu l'SVG (fons a `img/`, sprites a `js/data/` o `img/`). Escenes amb perspectiva: NO calcules cantonades a ull;
   descriu els objectes en metres i genera'ls amb el motor `tools/perspectiva.js` (exemple complet: `tools/dgt.js`).
2. Renderitza: `node tools/captura.js --svg <fitxer.svg>` (o la pàgina del joc amb `--level`, `--hub`, `--items`).
3. Mira la imatge amb Read. Comprova connexions, proporcions, objectes que suren o que no toquen el terra.
4. Corregix i torna al pas 2. Personatges: construïx-los per parts i renderitza després de cada part.
5. Segueix també la skill `dibujo-sprites` (coordenades de la granoteta, estil del joc) i `autoescola-design-system`.

---

## VISUAL QUALITY TECHNIQUES

Apply these while building the SVG. They work for all SVG types.

### Multi-Stop Gradients (4+ Stops)
Two-stop gradients look flat. Use 4-8 stops with hue shifts:
```xml
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1" color-interpolation="linearRGB">
  <stop offset="0%" stop-color="#0f172a"/>
  <stop offset="25%" stop-color="#1e3a5f"/>
  <stop offset="50%" stop-color="#3b82f6"/>
  <stop offset="75%" stop-color="#93c5fd"/>
  <stop offset="90%" stop-color="#fde68a"/>
  <stop offset="100%" stop-color="#f97316"/>
</linearGradient>
```
For spheres: use radial gradient with `fx="0.3" fy="0.3"` (offset toward light source).

### Five-Zone Lighting
Every non-trivial object needs: specular highlight (bright, warm), light area, half-tone (true color), form shadow (cooler hue — blue/purple, NEVER black), reflected light (subtle warm glow on shadow edge, opacity 0.10-0.20).

### Colored Shadows
Shadows use dark blue (#1a1a4e), purple (#2d1b4e), or teal (#0d3b4f). Never pure black or gray.

### Drop Shadow Filter
```xml
<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"
  color-interpolation-filters="linearRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>
  <feOffset in="blur" dx="3" dy="5" result="offset"/>
  <feFlood flood-color="#1e1b4b" flood-opacity="0.30" result="color"/>
  <feComposite in="color" in2="offset" operator="in" result="shadow"/>
  <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
```

### Noise Texture (Breaks Digital Perfection)
```xml
<filter id="grain" color-interpolation-filters="linearRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch"/>
  <feColorMatrix type="saturate" values="0"/>
  <feBlend in="SourceGraphic" mode="soft-light"/>
</filter>
```
Apply at 5-15% opacity on surfaces and backgrounds.

### Critical Defaults
- All `<filter>` elements: `color-interpolation-filters="linearRGB"`
- All gradient elements: `color-interpolation="linearRGB"`
- Animated elements: `transform-box: fill-box; transform-origin: center;`

---

## CATEGORY-SPECIFIC GUIDANCE

### Characters, Figures, Animals
The hardest category. Build incrementally with aggressive feedback:
1. Draw torso → render → verify
2. Add legs → render → verify connection
3. Add arms → render → verify
4. Add head → render → verify
5. Add details → render → final check

Use thick `<line>` with `stroke-linecap="round"` for limbs. Add `<circle>` at every joint drawn AFTER the limbs. This gives the most reliable connected look.

For animated characters: use React/JSX artifacts with forward kinematics (JS computes positions from joint angles — guarantees connected joints).

### Icons (24×24 stroke-based)
Grid-aligned, 2px stroke, `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"`, `stroke="currentColor"`. Stay within 2-22 coordinate range. Usually one-pass works.

### Logos and Badges
Geometric construction, centered. Gradient fills for depth. Max 2-3 colors. Test legibility at small size (render at 64px width).

### Scenes and Landscapes
Layer back-to-front: sky → far elements (desaturated, light) → mid elements → foreground (vivid). Add atmospheric haze (semi-transparent blue-white rect) between layers. Vignette overlay last.

### Data Visualizations
Compute positions from data. Use gradient fills on bars/segments. Subtle grid lines (#f1f5f9). Round caps everywhere.

### Patterns
Small repeating tiles. Use `<pattern>` element with `patternUnits="userSpaceOnUse"`. `patternTransform="rotate(45)"` for diagonal variants.

---

## DOCUMENT STRUCTURE
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"
     role="img" aria-labelledby="svg-title">
  <title id="svg-title">Descriptive Title</title>
  <defs><!-- gradients, filters, clipPaths --></defs>
  <g id="background">...</g>
  <g id="midground">...</g>
  <g id="foreground">...</g>
  <g id="effects">...</g>
</svg>
```

## ADVANCED REFERENCE
Read `references/advanced-techniques.md` for complete recipes: filter chains, feTurbulence guide, feComponentTransfer color grading, material simulation, composition templates, atmospheric effects, animation (CSS + SMIL), and more.
