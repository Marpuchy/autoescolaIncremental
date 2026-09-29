// ===== ESCENARIS =====

// Caps especials amb foto: es mostren amb les proporcions originals (vegeu .boss-photo a style.css)
const bossPhoto = (src, alt) => `<img class="boss-photo" src="${src}" alt="${alt}" draggable="false">`;

// Pixel: el gatet, cap especial dels Carreronets de Sogorb
const PIXEL_BOSS = {
  name: "Pixel",
  icon: bossPhoto("img/pixel.jpeg", "Pixel"),
  desc: "Koshka",
};

// Marc: cap especial de la Vall d'Alba
const MARC_BOSS = {
  name: "Marc",
  icon: bossPhoto("img/marc.jpeg", "Marc"),
  desc: "mierda loco cebolla coño",
};

// img: imatge de fons de l'escenari (es pot substituir per un .png/.jpg amb el mateix nom de camp)
// boss (opcional): cap especial de l'escenari en lloc de l'Examinador de Trànsit
const SCENES = [
  { name: "Afores d'Eslida",                bg: "#3a4a3f", img: "img/escenari-1.svg" },
  { name: "Polígon industrial",             bg: "#4a4450", img: "img/escenari-2.svg" },
  { name: "Afores de Castelló",             bg: "#6b5a3a", img: "img/escenari-3.svg" },
  { name: "Avinguda València (Violència)",  bg: "#3a2440", img: "img/escenari-4.svg" },
  { name: "La Vall d'Uixó",                 bg: "#5a6b52", img: "img/escenari-5.svg" },
  { name: "Carreronets de Sogorb",          bg: "#6b5f53", img: "img/escenari-6.svg", boss: PIXEL_BOSS },
  { name: "La Vall d'Alba",                 bg: "#6b7a4a", img: "img/escenari-7.svg", boss: MARC_BOSS },
  { name: "València Centre",                bg: "#4a5a6b", img: "img/escenari-8.svg" },
];
const DEFAULT_SCENE_BG = "#3a4250";

// Es precarreguen les fotos dels caps perquè ja estiguen llestes quan apareguen
for (const src of ["img/pixel.jpeg", "img/marc.jpeg"]) new Image().src = src;
