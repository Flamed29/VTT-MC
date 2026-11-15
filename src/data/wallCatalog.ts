export interface WallDefinition {
  id: string;
  name: string;
  desc: string;
  icon: string;
  wallColor: string;
  strokeColor: string;
  highlightColor: string;
  pattern: 'rough_stone' | 'masonry' | 'logs' | 'wood_panels' | 'cave_rock' | 'red_brick' | 'marble' | 'riveted_metal' | 'bone_skull' | 'arcane_crystal';
}

export const WALL_CATALOG: WallDefinition[] = [
  {
    id: 'wall_field_stone',
    name: 'Muro in Pietra di Campo Grezza',
    desc: 'Rocce non squadrate legate da malta consunta (classico dungeon / stalla)',
    icon: '🪨',
    wallColor: '#2b2a29',
    strokeColor: '#171615',
    highlightColor: '#5c5853',
    pattern: 'rough_stone'
  },
  {
    id: 'wall_worked_stone',
    name: 'Muro in Mattoni di Pietra Lavorata',
    desc: 'Blocchi squadrati e regolari da castello o fortezza',
    icon: '🏰',
    wallColor: '#1e293b',
    strokeColor: '#0f172a',
    highlightColor: '#475569',
    pattern: 'masonry'
  },
  {
    id: 'wall_log_cabin',
    name: 'Muro in Legno a Tronchi (Log Cabin)',
    desc: 'Tronchi d\'albero sovrapposti con intagli rustici',
    icon: '🪵',
    wallColor: '#5c2b09',
    strokeColor: '#361803',
    highlightColor: '#854211',
    pattern: 'logs'
  },
  {
    id: 'wall_wood_planks',
    name: 'Muro in Assi di Legno Verticali',
    desc: 'Pannelli in legno trattato per abitazioni villanesi o taverne',
    icon: '🛖',
    wallColor: '#78350f',
    strokeColor: '#451a03',
    highlightColor: '#b45309',
    pattern: 'wood_panels'
  },
  {
    id: 'wall_natural_cave',
    name: 'Muro di Roccia Naturale',
    desc: 'Parete di caverna grezza, irregolare e frammentata',
    icon: '🦇',
    wallColor: '#292524',
    strokeColor: '#1c1917',
    highlightColor: '#57534e',
    pattern: 'cave_rock'
  },
  {
    id: 'wall_clay_brick',
    name: 'Muro in Mattoni di Argilla / Cotto',
    desc: 'Classico muro urbano, rosso o aranciato, parzialmente sbrecciato',
    icon: '🧱',
    wallColor: '#832819',
    strokeColor: '#4f140a',
    highlightColor: '#b03d2a',
    pattern: 'red_brick'
  },
  {
    id: 'wall_elegant_marble',
    name: 'Muro di Marmo Elegante',
    desc: 'Pareti lisce con rifiniture dorate o modanature classiche per palazzi reali',
    icon: '🏛️',
    wallColor: '#e2e8f0',
    strokeColor: '#94a3b8',
    highlightColor: '#eab308',
    pattern: 'marble'
  },
  {
    id: 'wall_industrial_metal',
    name: 'Muro Metallico Industriale',
    desc: 'Lastre di ferro o acciaio rivettate con punti di ruggine e giunzioni',
    icon: '⚙️',
    wallColor: '#334155',
    strokeColor: '#0f172a',
    highlightColor: '#713f12',
    pattern: 'riveted_metal'
  },
  {
    id: 'wall_bone_skull',
    name: 'Muro di Ossa e Teschi',
    desc: 'Muro macabro intessuto con resti scheletrici per necropoli o cripte',
    icon: '💀',
    wallColor: '#d6d3d1',
    strokeColor: '#292524',
    highlightColor: '#a8a29e',
    pattern: 'bone_skull'
  },
  {
    id: 'wall_arcane_crystal',
    name: 'Muro di Cristallo Arcano',
    desc: 'Parete semitrasparente e luminosa per templi celestiali o covi magici',
    icon: '🔮',
    wallColor: '#6366f1',
    strokeColor: '#312e81',
    highlightColor: '#c7d2fe',
    pattern: 'arcane_crystal'
  }
];
