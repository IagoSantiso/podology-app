// ─────────────────────────────────────────────────────────────
// CONFIG — palettes & font pairings for tweaks
// ─────────────────────────────────────────────────────────────

const PALETTES = {
  'Cuidado teal': { primary: '#2f7d6e', deep: '#1f3a36', soft: '#e3efec', tint: '#f0f6f4', accent: '#c98a5e', accentSoft: '#f6ece2' },
  'Azul clínico': { primary: '#2563a8', deep: '#13294b', soft: '#e2ecf6', tint: '#eef4fb', accent: '#3c9e8f', accentSoft: '#e3f1ee' },
  'Sage cálido':  { primary: '#5f7d5a', deep: '#2c3a29', soft: '#e8efe4', tint: '#f2f6ef', accent: '#c08457', accentSoft: '#f4e9df' },
  'Malva suave':  { primary: '#7b5ea7', deep: '#2c2440', soft: '#ece6f4', tint: '#f5f1fa', accent: '#c98a9e', accentSoft: '#f6e9ee' },
};

const FONTS = {
  'Newsreader + Hanken': { display: "'Newsreader', Georgia, serif", sans: "'Hanken Grotesk', system-ui, sans-serif" },
  'Fraunces + Mulish':   { display: "'Fraunces', Georgia, serif", sans: "'Mulish', system-ui, sans-serif" },
  'Solo Hanken':         { display: "'Hanken Grotesk', system-ui, sans-serif", sans: "'Hanken Grotesk', system-ui, sans-serif" },
  'Solo Mulish':         { display: "'Mulish', system-ui, sans-serif", sans: "'Mulish', system-ui, sans-serif" },
};

window.PALETTES = PALETTES;
window.FONTS = FONTS;
