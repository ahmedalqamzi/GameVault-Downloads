/**
 * GameVault theme registry.
 *
 * Presentation-only theming: each theme is a set of semantic CSS variable
 * overrides plus a system font stack and a lightweight original motif.
 * The 18 "inspired" themes are unofficial fan-made homages; they use
 * original names, colors and motifs only — no official logos, art, or fonts.
 */

export type ThemeMode = "dark" | "light";
export type ThemeKind = "base" | "inspired";

/**
 * Original monochrome emblem artwork, drawn on a 24×24 grid and rendered in
 * the theme's accent color. All shapes are original generic iconography —
 * no official logos or trademarked artwork.
 */
export type ThemeEmblemShape =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx?: number; rotate?: number }
  | { kind: "polygon"; points: string }
  | { kind: "path"; d: string; fillRule?: "nonzero" | "evenodd" };

export interface ThemeEmblem {
  viewBox: string;
  shapes: ThemeEmblemShape[];
}

export interface ThemePalette {
  bg0: string;
  bg1: string;
  bg2: string;
  bg3: string;
  line: string;
  lineStrong: string;
  text1: string;
  text2: string;
  text3: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  playing: string;
  backlog: string;
  wishlist: string;
  completed: string;
  dropped: string;
  danger: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  kind: ThemeKind;
  /** Franchise this unofficial homage references (inspired themes only). */
  inspiration?: string;
  description: string;
  mode: ThemeMode;
  palette: ThemePalette;
  /** System font stacks only — no remote or proprietary fonts. */
  fontStack: string;
  /** Display name of the font style, shown in the picker. */
  fontName: string;
  /** Key for the lightweight original CSS/SVG motif. */
  motif: string;
  /** Original emblem artwork rendered in the brand mark and previews. */
  emblem: ThemeEmblem;
  /** Surface treatment personality: corner radius and shadow style. */
  cornerRadius: number;
  surfaceShadow: "none" | "soft" | "glow";
}

const SANS = 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';
const MONO = 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace';

interface ThemePersonality {
  emblem: ThemeEmblemShape[];
  cornerRadius: number;
  surfaceShadow: "none" | "soft" | "glow";
}

const E = (shapes: ThemeEmblemShape[]): ThemeEmblem => ({ viewBox: "0 0 24 24", shapes });

/** Original emblem artwork and surface personality per theme id. */
const PERSONALITY: Record<string, ThemePersonality> = {
  gamevault: {
    emblem: [{ kind: "path", d: "M12 3l7 3v5.2c0 4.3-2.9 7.3-7 8.8-4.1-1.5-7-4.5-7-8.8V6l7-3zM12 8.6a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8z", fillRule: "evenodd" }],
    cornerRadius: 12, surfaceShadow: "soft",
  },
  daybreak: {
    emblem: [{ kind: "path", d: "M5 16a7 7 0 0114 0z" }, { kind: "rect", x: 3, y: 17.5, width: 18, height: 2, rx: 1 }],
    cornerRadius: 12, surfaceShadow: "soft",
  },
  "midnight-ink": {
    emblem: [{ kind: "path", d: "M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z" }, { kind: "circle", cx: 17, cy: 6, r: 1.2 }],
    cornerRadius: 10, surfaceShadow: "glow",
  },
  forest: {
    emblem: [{ kind: "polygon", points: "12,3 18,12 14.5,12 19,19 5,19 9.5,12 6,12" }, { kind: "rect", x: 11, y: 19, width: 2, height: 3 }],
    cornerRadius: 12, surfaceShadow: "soft",
  },
  "harbor-light": {
    emblem: [{ kind: "path", d: "M3 10c1.8-2 3.6-2 5.4 0s3.6 2 5.4 0 3.6-2 5.4 0l-.1 2.2c-1.7 1.6-3.5 1.6-5.3 0-1.8 2-3.6 2-5.4 0s-3.6-2-5.3 0z" }, { kind: "path", d: "M3 16c1.8-2 3.6-2 5.4 0s3.6 2 5.4 0 3.6-2 5.4 0l-.1 2.2c-1.7 1.6-3.5 1.6-5.3 0-1.8 2-3.6 2-5.4 0s-3.6-2-5.3 0z" }],
    cornerRadius: 12, surfaceShadow: "soft",
  },
  "ember-dusk": {
    emblem: [{ kind: "path", d: "M12 3c3 4 6 7 6 11a6 6 0 01-12 0c0-4 3-7 6-11z" }],
    cornerRadius: 14, surfaceShadow: "glow",
  },
  "wild-champion": {
    emblem: [{ kind: "polygon", points: "12,3 17,12 7,12" }, { kind: "polygon", points: "7,13 12,22 2,22" }, { kind: "polygon", points: "17,13 22,22 12,22" }],
    cornerRadius: 8, surfaceShadow: "glow",
  },
  "azeroth-ledger": {
    emblem: [{ kind: "path", d: "M5 3h14v18l-7-4-7 4z" }, { kind: "rect", x: 10, y: 6, width: 4, height: 2, rx: 1 }],
    cornerRadius: 6, surfaceShadow: "soft",
  },
  "summoner-hex": {
    emblem: [{ kind: "path", d: "M12 2.5L20 7.3v9.4L12 21.5 4 16.7V7.3zm0 3.2L6.5 8.8v6.4L12 18.3l5.5-3.1V8.8z", fillRule: "evenodd" }],
    cornerRadius: 8, surfaceShadow: "glow",
  },
  "crystal-fantasia": {
    emblem: [{ kind: "path", d: "M12 2l6 8-6 12L6 10zm0 4l3 4-3 4-3-4z", fillRule: "evenodd" }],
    cornerRadius: 8, surfaceShadow: "glow",
  },
  "plumber-pipe": {
    emblem: [{ kind: "path", d: "M12 4c5 0 9 3.6 9 8H3c0-4.4 4-8 9-8z" }, { kind: "rect", x: 8, y: 13, width: 8, height: 7, rx: 2 }],
    cornerRadius: 16, surfaceShadow: "soft",
  },
  "pokedex-field": {
    emblem: [{ kind: "path", d: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 6.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z", fillRule: "evenodd" }, { kind: "rect", x: 3, y: 11, width: 18, height: 2 }],
    cornerRadius: 16, surfaceShadow: "soft",
  },
  "mansion-incident": {
    emblem: [{ kind: "path", d: "M12 3l10 18H2zm0 5.4L6.6 18h10.8z", fillRule: "evenodd" }, { kind: "rect", x: 11, y: 12, width: 2, height: 3.4 }, { kind: "rect", x: 11, y: 16.6, width: 2, height: 1.8 }],
    cornerRadius: 4, surfaceShadow: "none",
  },
  "slime-quest": {
    emblem: [{ kind: "path", d: "M12 3c4 5 7 8.6 7 12.1A7 7 0 015 15.1C5 11.6 8 8 12 3zM9.5 12.9a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2zM14.5 12.9a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2z", fillRule: "evenodd" }],
    cornerRadius: 18, surfaceShadow: "soft",
  },
  "war-room": {
    emblem: [{ kind: "path", d: "M12 4a8 8 0 100 16 8 8 0 000-16zm0 5a3 3 0 110 6 3 3 0 010-6z", fillRule: "evenodd" }, { kind: "rect", x: 11, y: 1.5, width: 2, height: 3.5 }, { kind: "rect", x: 11, y: 19, width: 2, height: 3.5 }, { kind: "rect", x: 1.5, y: 11, width: 3.5, height: 2 }, { kind: "rect", x: 19, y: 11, width: 3.5, height: 2 }],
    cornerRadius: 4, surfaceShadow: "none",
  },
  "blue-blur": {
    emblem: [{ kind: "path", d: "M14 5a7 7 0 100 14 7 7 0 000-14zm0 4.4a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2z", fillRule: "evenodd" }, { kind: "rect", x: 2, y: 8, width: 7, height: 2, rx: 1 }, { kind: "rect", x: 1, y: 12, width: 6, height: 2, rx: 1 }, { kind: "rect", x: 2, y: 16, width: 7, height: 2, rx: 1 }],
    cornerRadius: 14, surfaceShadow: "glow",
  },
  blockcraft: {
    emblem: [{ kind: "polygon", points: "12,3 20,7.5 12,12 4,7.5" }, { kind: "polygon", points: "4,8.8 12,13.3 12,21 4,16.5" }, { kind: "polygon", points: "20,8.8 20,16.5 12,21 12,13.3" }],
    cornerRadius: 3, surfaceShadow: "none",
  },
  "phantom-style": {
    emblem: [{ kind: "path", d: "M4 7.5C7.5 5.5 16.5 5.5 20 7.5c0 5.5-3.2 9.5-8 9.5S4 13 4 7.5zM7.2 9.3a1.9 1.6 0 113.8 0 1.9 1.6 0 11-3.8 0zM13 9.3a1.9 1.6 0 113.8 0 1.9 1.6 0 11-3.8 0z", fillRule: "evenodd" }],
    cornerRadius: 6, surfaceShadow: "glow",
  },
  "dovah-frost": {
    emblem: [{ kind: "polygon", points: "7,3 9.2,3 6.6,21 4.4,21" }, { kind: "polygon", points: "13.1,3 15.3,3 12.7,21 10.5,21" }, { kind: "polygon", points: "19.2,3 21.4,3 18.8,21 16.6,21" }],
    cornerRadius: 6, surfaceShadow: "soft",
  },
  "spartan-ring": {
    emblem: [{ kind: "path", d: "M12 6c6.6 0 12 2.2 12 5s-5.4 5-12 5-12-2.2-12-5 5.4-5 12-5zm0 3.4c-5 0-8.4 1.2-8.4 1.6S7 12.6 12 12.6s8.4-1.2 8.4-1.6-3.4-1.6-8.4-1.6z", fillRule: "evenodd" }, { kind: "rect", x: 4, y: 18, width: 16, height: 2, rx: 1 }],
    cornerRadius: 8, surfaceShadow: "glow",
  },
  "wasteland-pip": {
    emblem: [{ kind: "path", d: "M5 4h14a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H5a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 015 4zm0 2.4v7.2h14V6.4z", fillRule: "evenodd" }, { kind: "rect", x: 11, y: 16, width: 2, height: 3.4 }, { kind: "rect", x: 8, y: 19.4, width: 8, height: 1.8, rx: 0.9 }],
    cornerRadius: 5, surfaceShadow: "glow",
  },
  "crimson-cathedral": {
    emblem: [{ kind: "path", d: "M17.5 3a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 3.4a3.1 3.1 0 110 6.2 3.1 3.1 0 010-6.2z", fillRule: "evenodd" }, { kind: "polygon", points: "8,8 12,21 4,21" }, { kind: "rect", x: 7.3, y: 5.5, width: 1.4, height: 3 }],
    cornerRadius: 4, surfaceShadow: "glow",
  },
  "ember-bonfire": {
    emblem: [{ kind: "path", d: "M12 3c2.4 3 4.6 5.4 4.6 8.4A4.6 4.6 0 017.4 11.4C7.4 8.4 9.6 6 12 3z" }, { kind: "polygon", points: "5,17.5 19,15.5 19.4,17.4 5.4,19.4" }, { kind: "polygon", points: "5,15.5 19,17.5 18.6,19.4 4.6,17.4" }],
    cornerRadius: 6, surfaceShadow: "glow",
  },
  "machine-garden": {
    emblem: [{ kind: "path", d: "M6 6h12v12H6zm2.4 2.4v7.2h7.2V8.4z", fillRule: "evenodd" }, { kind: "circle", cx: 12, cy: 12, r: 1.8 }],
    cornerRadius: 2, surfaceShadow: "none",
  },
};

function personalityFor(id: string): ThemePersonality {
  return PERSONALITY[id] ?? PERSONALITY["gamevault"]!;
}


function rgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ThemeSpec {
  id: string;
  name: string;
  kind: ThemeKind;
  inspiration?: string;
  description: string;
  mode: ThemeMode;
  bg0: string;
  bg1: string;
  bg2: string;
  bg3: string;
  text1: string;
  text2: string;
  text3: string;
  accent: string;
  accentStrong?: string;
  playing?: string;
  backlog?: string;
  wishlist?: string;
  completed?: string;
  dropped?: string;
  danger?: string;
  fontStack?: string;
  fontName?: string;
  motif: string;
}

function defineTheme(spec: ThemeSpec): ThemeDefinition {
  const dark = spec.mode === "dark";
  const personality = personalityFor(spec.id);
  return {
    id: spec.id,
    name: spec.name,
    kind: spec.kind,
    inspiration: spec.inspiration,
    description: spec.description,
    mode: spec.mode,
    fontStack: spec.fontStack ?? SANS,
    fontName: spec.fontName ?? "System Sans",
    motif: spec.motif,
    emblem: E(personality.emblem),
    cornerRadius: personality.cornerRadius,
    surfaceShadow: personality.surfaceShadow,
    palette: {
      bg0: spec.bg0,
      bg1: spec.bg1,
      bg2: spec.bg2,
      bg3: spec.bg3,
      line: dark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.09)",
      lineStrong: dark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.18)",
      text1: spec.text1,
      text2: spec.text2,
      text3: spec.text3,
      accent: spec.accent,
      accentStrong: spec.accentStrong ?? spec.accent,
      accentSoft: rgba(spec.accent, 0.14),
      playing: spec.playing ?? "#86b98d",
      backlog: spec.backlog ?? "#92a8c4",
      wishlist: spec.wishlist ?? "#c09bd4",
      completed: spec.completed ?? spec.accent,
      dropped: spec.dropped ?? "#b98b7e",
      danger: spec.danger ?? "#d97e7e",
    },
  };
}

const BASE_THEMES: ThemeDefinition[] = [
  defineTheme({
    id: "gamevault",
    name: "GameVault",
    kind: "base",
    description: "The default GameVault look — warm amber on charcoal.",
    mode: "dark",
    bg0: "#131316", bg1: "#1a1a1f", bg2: "#222228", bg3: "#2b2b33",
    text1: "#f2f1ed", text2: "#a8a8a0", text3: "#77776f",
    accent: "#d9a45b", accentStrong: "#e6be7f",
    motif: "vault-shelves",
  }),
  defineTheme({
    id: "daybreak",
    name: "Daybreak",
    kind: "base",
    description: "A clean, bright light theme for daytime browsing.",
    mode: "light",
    bg0: "#f6f4ef", bg1: "#ffffff", bg2: "#ece9e1", bg3: "#e0dcd1",
    text1: "#23231f", text2: "#5c5c54", text3: "#8a8a80",
    accent: "#b07a2a", accentStrong: "#8f611c",
    playing: "#3f7d4e", backlog: "#4a6d94", wishlist: "#7d5595",
    completed: "#b07a2a", dropped: "#a05a48", danger: "#b34040",
    motif: "sunrise-arc",
  }),
  defineTheme({
    id: "midnight-ink",
    name: "Midnight Ink",
    kind: "base",
    description: "Deep blue-black with crisp cyan highlights.",
    mode: "dark",
    bg0: "#0b1017", bg1: "#111824", bg2: "#182230", bg3: "#212d3d",
    text1: "#e8eef5", text2: "#9dadc0", text3: "#6b7b8f",
    accent: "#5ec8d8", accentStrong: "#8adce8",
    motif: "star-grid",
  }),
  defineTheme({
    id: "forest",
    name: "Forest",
    kind: "base",
    description: "Mossy greens and bark tones, calm and low-glare.",
    mode: "dark",
    bg0: "#121713", bg1: "#182018", bg2: "#202a20", bg3: "#2a362a",
    text1: "#edf2ea", text2: "#a3b2a0", text3: "#71806f",
    accent: "#9ec86e", accentStrong: "#bcdc92",
    playing: "#9ec86e", backlog: "#7fa3b8", wishlist: "#b39fd0",
    motif: "pine-ridge",
  }),
  defineTheme({
    id: "harbor-light",
    name: "Harbor Light",
    kind: "base",
    description: "A breezy light theme with sea-blue accents.",
    mode: "light",
    bg0: "#eef3f5", bg1: "#ffffff", bg2: "#e2ebee", bg3: "#d3dfe4",
    text1: "#1e2a30", text2: "#51666f", text3: "#7f939c",
    accent: "#1f7f96", accentStrong: "#156374",
    playing: "#2e7d4f", backlog: "#3a6d9c", wishlist: "#7d5ba6",
    completed: "#1f7f96", dropped: "#a05a48", danger: "#b34040",
    motif: "wave-lines",
  }),
  defineTheme({
    id: "ember-dusk",
    name: "Ember Dusk",
    kind: "base",
    description: "Dusky plum shadows with a warm ember glow.",
    mode: "dark",
    bg0: "#181218", bg1: "#201820", bg2: "#2a1f2a", bg3: "#352835",
    text1: "#f3ecef", text2: "#b0a0ac", text3: "#7d6f79",
    accent: "#e07a5f", accentStrong: "#ef9c85",
    motif: "dusk-bands",
  }),
];

const INSPIRED_THEMES: ThemeDefinition[] = [
  defineTheme({
    id: "wild-champion",
    name: "Wild Champion",
    kind: "inspired",
    inspiration: "The Legend of Zelda",
    description: "Sunlit meadow greens with a courageous gold accent.",
    mode: "dark",
    bg0: "#0f1a12", bg1: "#15251a", bg2: "#1d3222", bg3: "#26402b",
    text1: "#f0f4e8", text2: "#a7b89b", text3: "#72836a",
    accent: "#d8b74a", accentStrong: "#ecd27e",
    playing: "#8cc06a", backlog: "#7fa3b8", wishlist: "#b39fd0",
    motif: "courage-triangles",
  }),
  defineTheme({
    id: "azeroth-ledger",
    name: "Azeroth Ledger",
    kind: "inspired",
    inspiration: "World of Warcraft",
    description: "Old parchment, steel blue and faction-banner gold.",
    mode: "dark",
    bg0: "#141210", bg1: "#1c1814", bg2: "#262019", bg3: "#312921",
    text1: "#efe6d4", text2: "#b3a68d", text3: "#7f7462",
    accent: "#c8a24a", accentStrong: "#e2c179",
    backlog: "#5f83b0", playing: "#8aa86a",
    fontStack: SERIF, fontName: "System Serif",
    motif: "banner-chevron",
  }),
  defineTheme({
    id: "summoner-hex",
    name: "Summoner Hex",
    kind: "inspired",
    inspiration: "League of Legends",
    description: "Arcane teal hextech glow over deep slate.",
    mode: "dark",
    bg0: "#0a1014", bg1: "#0f181e", bg2: "#16222b", bg3: "#1e2e39",
    text1: "#e9f2f2", text2: "#9db4b8", text3: "#6a8085",
    accent: "#3fc1be", accentStrong: "#6fdcd9",
    completed: "#c8a24a",
    motif: "hextech-lattice",
  }),
  defineTheme({
    id: "crystal-fantasia",
    name: "Crystal Fantasia",
    kind: "inspired",
    inspiration: "Final Fantasy",
    description: "Starlit indigo with a pale crystal shimmer.",
    mode: "dark",
    bg0: "#0d0e1c", bg1: "#141529", bg2: "#1c1e38", bg3: "#262849",
    text1: "#eceef8", text2: "#a5a9c8", text3: "#707492",
    accent: "#a8c8f0", accentStrong: "#cde0fa",
    completed: "#c8b06a",
    fontStack: SERIF, fontName: "System Serif",
    motif: "crystal-prism",
  }),
  defineTheme({
    id: "plumber-pipe",
    name: "Plumber Pipe",
    kind: "inspired",
    inspiration: "Super Mario",
    description: "Bright primary toy-box colors on a sky-light backdrop.",
    mode: "light",
    bg0: "#f4f1e8", bg1: "#ffffff", bg2: "#e9e4d6", bg3: "#dcd5c2",
    text1: "#26221c", text2: "#5e574a", text3: "#8b8371",
    accent: "#d43d2a", accentStrong: "#a82d1e",
    playing: "#3f8f4e", backlog: "#3a6d9c", wishlist: "#8a5ba6",
    completed: "#d43d2a", danger: "#b02a2a",
    motif: "pipe-caps",
  }),
  defineTheme({
    id: "pokedex-field",
    name: "Pokedex Field",
    kind: "inspired",
    inspiration: "Pokemon",
    description: "Field-guide red and cream, like a well-worn handbook.",
    mode: "light",
    bg0: "#f6f3ec", bg1: "#ffffff", bg2: "#ece7d9", bg3: "#e0d9c6",
    text1: "#24211d", text2: "#5b564c", text3: "#88816f",
    accent: "#c8402f", accentStrong: "#9e3020",
    playing: "#3f8f4e", backlog: "#3a6d9c", wishlist: "#8a5ba6",
    completed: "#c8402f", danger: "#b02a2a",
    motif: "capture-ring",
  }),
  defineTheme({
    id: "mansion-incident",
    name: "Mansion Incident",
    kind: "inspired",
    inspiration: "Resident Evil",
    description: "Cold emergency green over typewriter-gray gloom.",
    mode: "dark",
    bg0: "#101211", bg1: "#161918", bg2: "#1e2221", bg3: "#272c2b",
    text1: "#e8ece9", text2: "#9fa8a2", text3: "#6c7570",
    accent: "#7fae6e", accentStrong: "#a2cc90",
    danger: "#c05046",
    fontStack: MONO, fontName: "System Mono",
    motif: "biohazard-bars",
  }),
  defineTheme({
    id: "slime-quest",
    name: "Slime Quest",
    kind: "inspired",
    inspiration: "Dragon Quest",
    description: "Cheerful sky blue and heraldic gold, storybook bright.",
    mode: "light",
    bg0: "#eef4f8", bg1: "#ffffff", bg2: "#e0ecf3", bg3: "#cfe1ec",
    text1: "#1f2c38", text2: "#4f6474", text3: "#7d93a3",
    accent: "#2a6fb8", accentStrong: "#1d568f",
    playing: "#3f8f4e", backlog: "#3a6d9c", wishlist: "#8a5ba6",
    completed: "#c8963a", danger: "#b34040",
    fontStack: SERIF, fontName: "System Serif",
    motif: "slime-drop",
  }),
  defineTheme({
    id: "war-room",
    name: "War Room",
    kind: "inspired",
    inspiration: "Call of Duty",
    description: "Desaturated olive-drab tactical console.",
    mode: "dark",
    bg0: "#121310", bg1: "#191a16", bg2: "#22231e", bg3: "#2c2d26",
    text1: "#ecebe2", text2: "#a8a797", text3: "#73725f",
    accent: "#c8b06a", accentStrong: "#e0ca8e",
    playing: "#8aa86a", danger: "#c0584a",
    motif: "hud-crosshair",
  }),
  defineTheme({
    id: "blue-blur",
    name: "Blue Blur",
    kind: "inspired",
    inspiration: "Sonic the Hedgehog",
    description: "Speed-line cobalt with checkered gold accents.",
    mode: "dark",
    bg0: "#0b1230", bg1: "#111a42", bg2: "#1a2454", bg3: "#243068",
    text1: "#eef1fa", text2: "#a3aecf", text3: "#707ba0",
    accent: "#f0b13c", accentStrong: "#f8cb74",
    danger: "#e0483e",
    motif: "checkered-loop",
  }),
  defineTheme({
    id: "blockcraft",
    name: "Blockcraft",
    kind: "inspired",
    inspiration: "Minecraft",
    description: "Chunky grass-and-dirt blocks with voxel edges.",
    mode: "dark",
    bg0: "#141812", bg1: "#1b2118", bg2: "#242c20", bg3: "#2e3829",
    text1: "#eef0e6", text2: "#aab29c", text3: "#78806d",
    accent: "#7fae4e", accentStrong: "#a0cc70",
    backlog: "#8a7a5e",
    motif: "voxel-cubes",
  }),
  defineTheme({
    id: "phantom-style",
    name: "Phantom Style",
    kind: "inspired",
    inspiration: "Persona",
    description: "Slashed red-on-black with bold graphic energy.",
    mode: "dark",
    bg0: "#100d0e", bg1: "#181214", bg2: "#221a1d", bg3: "#2c2226",
    text1: "#f5eef0", text2: "#b0a0a6", text3: "#7c6d72",
    accent: "#e02f3c", accentStrong: "#f2656e",
    fontStack: MONO, fontName: "System Mono",
    motif: "phantom-slash",
  }),
  defineTheme({
    id: "dovah-frost",
    name: "Dovah Frost",
    kind: "inspired",
    inspiration: "The Elder Scrolls V: Skyrim",
    description: "Nordic steel and frost-rimed parchment.",
    mode: "dark",
    bg0: "#10151a", bg1: "#161d24", bg2: "#1e2832", bg3: "#283440",
    text1: "#e9edf0", text2: "#a3b0ba", text3: "#6f7d88",
    accent: "#9ec3d8", accentStrong: "#c2dcea",
    completed: "#c8b06a",
    fontStack: SERIF, fontName: "System Serif",
    motif: "dragon-rune",
  }),
  defineTheme({
    id: "spartan-ring",
    name: "Spartan Ring",
    kind: "inspired",
    inspiration: "Halo",
    description: "Military green visor glow with ring-world teal.",
    mode: "dark",
    bg0: "#0e1410", bg1: "#141c16", bg2: "#1c261e", bg3: "#253227",
    text1: "#eaf0ea", text2: "#a2b0a4", text3: "#6d7b6f",
    accent: "#8fb84e", accentStrong: "#b0d678",
    backlog: "#6a9ab0",
    motif: "ring-horizon",
  }),
  defineTheme({
    id: "wasteland-pip",
    name: "Wasteland Pip",
    kind: "inspired",
    inspiration: "Fallout",
    description: "Retro CRT phosphor green on vault-suit charcoal.",
    mode: "dark",
    bg0: "#0e120e", bg1: "#141a14", bg2: "#1c241c", bg3: "#262f26",
    text1: "#dcefd8", text2: "#98b094", text3: "#647a61",
    accent: "#7fc86a", accentStrong: "#a5e493",
    fontStack: MONO, fontName: "System Mono",
    motif: "crt-scanlines",
  }),
  defineTheme({
    id: "crimson-cathedral",
    name: "Crimson Cathedral",
    kind: "inspired",
    inspiration: "Castlevania",
    description: "Gothic crimson and violet beneath a cathedral moon.",
    mode: "dark",
    bg0: "#120a12", bg1: "#1a0f1c", bg2: "#241526", bg3: "#301c32",
    text1: "#f2e8ee", text2: "#b09cac", text3: "#796576",
    accent: "#c03a58", accentStrong: "#dd6680",
    wishlist: "#9a6ec0", completed: "#c03a58",
    fontStack: SERIF, fontName: "System Serif",
    motif: "cathedral-moon",
  }),
  defineTheme({
    id: "ember-bonfire",
    name: "Ember Bonfire",
    kind: "inspired",
    inspiration: "Dark Souls",
    description: "Ember orange over cold ash, like a resting flame.",
    mode: "dark",
    bg0: "#121010", bg1: "#191616", bg2: "#221e1d", bg3: "#2c2725",
    text1: "#ece5dc", text2: "#aaa094", text3: "#756c62",
    accent: "#e07840", accentStrong: "#f09a68",
    fontStack: SERIF, fontName: "Weathered Serif",
    motif: "bonfire-ember",
  }),
  defineTheme({
    id: "machine-garden",
    name: "Machine Garden",
    kind: "inspired",
    inspiration: "NieR: Automata",
    description: "Ivory and black minimalism with geometric machine forms.",
    mode: "light",
    bg0: "#d6d0c0", bg1: "#e3ddcd", bg2: "#c9c2b0", bg3: "#b8b09c",
    text1: "#2a2723", text2: "#55504a", text3: "#7e786d",
    accent: "#454138", accentStrong: "#2a2723",
    playing: "#5a7250", backlog: "#5f6f80", wishlist: "#7d6a85",
    completed: "#454138", dropped: "#8a6a5e", danger: "#a03838",
    fontStack: `${SERIF}, ${MONO}`, fontName: "Serif + Mono",
    motif: "machine-geometry",
  }),
];

export const THEMES: ThemeDefinition[] = [...BASE_THEMES, ...INSPIRED_THEMES];

export const DEFAULT_THEME_ID = "gamevault";

const BY_ID = new Map(THEMES.map((theme) => [theme.id, theme]));

/** Resolve a theme id, falling back to the default for unknown/empty input. */
export function getTheme(id: string | null | undefined): ThemeDefinition {
  if (!id) return BY_ID.get(DEFAULT_THEME_ID)!;
  return BY_ID.get(id) ?? BY_ID.get(DEFAULT_THEME_ID)!;
}

export function isThemeId(id: string): boolean {
  return BY_ID.has(id);
}
