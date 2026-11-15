export interface PropDefinition {
  id: string;
  name: string;
  subcat: 'furniture' | 'magic_light' | 'containers' | 'military' | 'nature' | 'dungeon';
  icon: string;
  svg: string;
}

// Helper to generate clean top-down SVGs with crisp plan-view shapes
function topDownSvg(content: string, w = 64, h = 64): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${content}</svg>`;
}

export const PROP_CATALOG: PropDefinition[] = [
  // ==========================================
  // --- 1–25: Arredamento e Casa ---
  // ==========================================
  {
    id: 'prop_tavern_table',
    name: 'Tavolo da taverna in legno massiccio',
    subcat: 'furniture',
    icon: '🪵',
    svg: topDownSvg(`
      <rect x="4" y="8" width="56" height="48" rx="3" fill="#78350f" stroke="#451a03" stroke-width="3"/>
      <line x1="8" y1="20" x2="56" y2="20" stroke="#92400e" stroke-width="2"/>
      <line x1="8" y1="32" x2="56" y2="32" stroke="#92400e" stroke-width="2"/>
      <line x1="8" y1="44" x2="56" y2="44" stroke="#92400e" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_wooden_chair',
    name: 'Sedia in legno spagliata',
    subcat: 'furniture',
    icon: '🪑',
    svg: topDownSvg(`
      <rect x="14" y="16" width="36" height="36" rx="4" fill="#a16207" stroke="#451a03" stroke-width="2.5"/>
      <line x1="14" y1="18" x2="50" y2="18" stroke="#451a03" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="34" r="8" fill="#ca8a04"/>
    `)
  },
  {
    id: 'prop_long_bench',
    name: 'Panca in legno lunga',
    subcat: 'furniture',
    icon: '🪵',
    svg: topDownSvg(`
      <rect x="4" y="20" width="56" height="24" rx="3" fill="#854d0e" stroke="#451a03" stroke-width="2.5"/>
      <line x1="6" y1="32" x2="58" y2="32" stroke="#a16207" stroke-width="1.5"/>
    `)
  },
  {
    id: 'prop_single_bed',
    name: 'Letto singolo con coperta a quadri',
    subcat: 'furniture',
    icon: '🛏️',
    svg: topDownSvg(`
      <rect x="10" y="4" width="44" height="56" rx="3" fill="#451a03" stroke="#291102" stroke-width="2"/>
      <rect x="13" y="7" width="38" height="15" rx="3" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
      <rect x="13" y="24" width="38" height="33" rx="2" fill="#1e3a8a"/>
      <line x1="26" y1="24" x2="26" y2="57" stroke="#dc2626" stroke-width="1.5"/>
      <line x1="38" y1="24" x2="38" y2="57" stroke="#dc2626" stroke-width="1.5"/>
      <line x1="13" y1="40" x2="51" y2="40" stroke="#dc2626" stroke-width="1.5"/>
    `)
  },
  {
    id: 'prop_canopy_bed',
    name: 'Letto matrimoniale a baldacchino',
    subcat: 'furniture',
    icon: '👑',
    svg: topDownSvg(`
      <rect x="6" y="6" width="52" height="52" rx="4" fill="#581c87" stroke="#3b0764" stroke-width="3"/>
      <rect x="10" y="10" width="44" height="44" fill="#831843"/>
      <rect x="14" y="12" width="16" height="12" rx="2" fill="#f8fafc"/>
      <rect x="34" y="12" width="16" height="12" rx="2" fill="#f8fafc"/>
      <circle cx="8" cy="8" r="4" fill="#ca8a04"/>
      <circle cx="56" cy="8" r="4" fill="#ca8a04"/>
      <circle cx="8" cy="56" r="4" fill="#ca8a04"/>
      <circle cx="56" cy="56" r="4" fill="#ca8a04"/>
    `)
  },
  {
    id: 'prop_wardrobe',
    name: 'Armadio in legno a due ante',
    subcat: 'furniture',
    icon: '🚪',
    svg: topDownSvg(`
      <rect x="6" y="14" width="52" height="36" rx="3" fill="#5c2b09" stroke="#361803" stroke-width="3"/>
      <line x1="32" y1="15" x2="32" y2="49" stroke="#361803" stroke-width="2"/>
      <circle cx="28" cy="32" r="2" fill="#ca8a04"/>
      <circle cx="36" cy="32" r="2" fill="#ca8a04"/>
    `)
  },
  {
    id: 'prop_dresser',
    name: 'Cassettiera con maniglie in ferro',
    subcat: 'furniture',
    icon: '🗄️',
    svg: topDownSvg(`
      <rect x="8" y="16" width="48" height="32" rx="3" fill="#78350f" stroke="#451a03" stroke-width="2.5"/>
      <rect x="12" y="20" width="40" height="24" fill="#92400e"/>
      <line x1="20" y1="32" x2="28" y2="32" stroke="#000" stroke-width="2"/>
      <line x1="36" y1="32" x2="44" y2="32" stroke="#000" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_reinforced_chest',
    name: 'Tronco / Cassa d\'epoca rinforzata',
    subcat: 'furniture',
    icon: '🧰',
    svg: topDownSvg(`
      <rect x="8" y="16" width="48" height="32" rx="3" fill="#854d0e" stroke="#291504" stroke-width="3"/>
      <rect x="8" y="28" width="48" height="6" fill="#475569"/>
      <rect x="29" y="26" width="6" height="10" rx="1.5" fill="#ca8a04"/>
      <line x1="16" y1="16" x2="16" y2="48" stroke="#475569" stroke-width="3"/>
      <line x1="48" y1="16" x2="48" y2="48" stroke="#475569" stroke-width="3"/>
    `)
  },
  {
    id: 'prop_bookcase',
    name: 'Libreria alta ricca di volumi',
    subcat: 'furniture',
    icon: '📚',
    svg: topDownSvg(`
      <rect x="4" y="14" width="56" height="36" rx="2" fill="#451a03" stroke="#291102" stroke-width="2.5"/>
      <line x1="6" y1="26" x2="58" y2="26" stroke="#78350f" stroke-width="2"/>
      <line x1="6" y1="38" x2="58" y2="38" stroke="#78350f" stroke-width="2"/>
      <rect x="8" y="16" width="6" height="8" fill="#dc2626"/>
      <rect x="16" y="16" width="5" height="8" fill="#2563eb"/>
      <rect x="23" y="16" width="7" height="8" fill="#16a34a"/>
      <rect x="32" y="16" width="6" height="8" fill="#d97706"/>
      <rect x="40" y="16" width="8" height="8" fill="#7c3aed"/>
    `)
  },
  {
    id: 'prop_study_desk',
    name: 'Scrivania da studio con calamaio e pergamena',
    subcat: 'furniture',
    icon: '📜',
    svg: topDownSvg(`
      <rect x="6" y="12" width="52" height="40" rx="3" fill="#92400e" stroke="#451a03" stroke-width="3"/>
      <rect x="18" y="18" width="22" height="28" rx="2" fill="#fef3c7" stroke="#d97706" stroke-width="1"/>
      <circle cx="48" cy="22" r="3.5" fill="#0f172a"/>
      <line x1="48" y1="22" x2="44" y2="34" stroke="#ffffff" stroke-width="1.5"/>
    `)
  },
  {
    id: 'prop_stone_throne',
    name: 'Trono in pietra intagliata',
    subcat: 'furniture',
    icon: '🪑',
    svg: topDownSvg(`
      <rect x="10" y="8" width="44" height="48" rx="4" fill="#334155" stroke="#0f172a" stroke-width="3"/>
      <rect x="10" y="8" width="44" height="14" fill="#1e293b"/>
      <circle cx="32" cy="15" r="4" fill="#dc2626"/>
      <rect x="16" y="24" width="32" height="28" fill="#be123c"/>
    `)
  },
  {
    id: 'prop_cupboard',
    name: 'Credenza da cucina con piatti e tazze',
    subcat: 'furniture',
    icon: '🍽️',
    svg: topDownSvg(`
      <rect x="6" y="16" width="52" height="32" rx="3" fill="#78350f" stroke="#451a03" stroke-width="2.5"/>
      <circle cx="16" cy="32" r="5" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="28" cy="32" r="5" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="40" cy="32" r="4" fill="#ca8a04"/>
      <circle cx="48" cy="32" r="3" fill="#e2e8f0"/>
    `)
  },
  {
    id: 'prop_showcase',
    name: 'Vetrina espositiva da collezionista',
    subcat: 'furniture',
    icon: '💎',
    svg: topDownSvg(`
      <rect x="8" y="14" width="48" height="36" rx="3" fill="#1e293b" stroke="#ca8a04" stroke-width="3"/>
      <rect x="12" y="18" width="40" height="28" fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" stroke-width="1"/>
      <polygon points="32,24 37,34 27,34" fill="#a855f7"/>
      <circle cx="20" cy="32" r="3" fill="#eab308"/>
      <circle cx="44" cy="32" r="3" fill="#ef4444"/>
    `)
  },
  {
    id: 'prop_folding_screen',
    name: 'Paravento decorativo in legno e tessuto',
    subcat: 'furniture',
    icon: '🏮',
    svg: topDownSvg(`
      <line x1="8" y1="24" x2="24" y2="40" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>
      <line x1="24" y1="40" x2="40" y2="24" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>
      <line x1="40" y1="24" x2="56" y2="40" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>
    `)
  },
  {
    id: 'prop_round_rug',
    name: 'Tappeto rotondo ricamato',
    subcat: 'furniture',
    icon: '🧶',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="28" fill="#991b1b" stroke="#ca8a04" stroke-width="3"/>
      <circle cx="32" cy="32" r="20" fill="#b91c1c" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="3,3"/>
      <circle cx="32" cy="32" r="10" fill="#ca8a04"/>
    `)
  },
  {
    id: 'prop_bearskin_rug',
    name: 'Tappeto in pelle d\'orso',
    subcat: 'furniture',
    icon: '🐻',
    svg: topDownSvg(`
      <!-- Bear pelt outline -->
      <path d="M32 6 C38 6 42 12 40 16 C48 18 56 14 58 24 C54 28 46 28 48 36 C56 42 58 54 52 58 C46 56 42 46 38 48 C36 54 28 54 26 48 C22 46 18 56 12 58 C6 54 8 42 16 36 C18 28 10 28 6 24 C8 14 16 18 24 16 C22 12 26 6 32 6 Z" fill="#3e2723" stroke="#1b0000" stroke-width="2"/>
      <circle cx="30" cy="11" r="1.5" fill="#000"/>
      <circle cx="34" cy="11" r="1.5" fill="#000"/>
    `)
  },
  {
    id: 'prop_rocking_cradle',
    name: 'Culla in legno dondolante',
    subcat: 'furniture',
    icon: '🍼',
    svg: topDownSvg(`
      <rect x="14" y="10" width="36" height="44" rx="10" fill="#92400e" stroke="#451a03" stroke-width="2.5"/>
      <rect x="18" y="14" width="28" height="36" rx="6" fill="#fef08a"/>
      <circle cx="32" cy="22" r="5" fill="#f8fafc"/>
    `)
  },
  {
    id: 'prop_wall_mirror',
    name: 'Specchio da parete con cornice dorata',
    subcat: 'furniture',
    icon: '🪞',
    svg: topDownSvg(`
      <rect x="12" y="24" width="40" height="16" rx="4" fill="#38bdf8" stroke="#eab308" stroke-width="3"/>
      <line x1="16" y1="36" x2="36" y2="28" stroke="#ffffff" stroke-width="1.5"/>
    `)
  },
  {
    id: 'prop_oil_painting',
    name: 'Quadro con ritratto a olio',
    subcat: 'furniture',
    icon: '🖼️',
    svg: topDownSvg(`
      <rect x="10" y="22" width="44" height="20" rx="2" fill="#78350f" stroke="#ca8a04" stroke-width="2.5"/>
      <rect x="14" y="25" width="36" height="14" fill="#065f46"/>
      <circle cx="32" cy="32" r="4" fill="#fbcfe8"/>
    `)
  },
  {
    id: 'prop_candelabra',
    name: 'Candelabro da terra a 5 bracci',
    subcat: 'furniture',
    icon: '🕯️',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="16" fill="#ca8a04" stroke="#713f12" stroke-width="2"/>
      <circle cx="32" cy="32" r="4" fill="#ea580c"/>
      <circle cx="20" cy="32" r="3" fill="#ea580c"/>
      <circle cx="44" cy="32" r="3" fill="#ea580c"/>
      <circle cx="32" cy="20" r="3" fill="#ea580c"/>
      <circle cx="32" cy="44" r="3" fill="#ea580c"/>
    `)
  },
  {
    id: 'prop_coat_rack',
    name: 'Appendiabiti da terra con mantelli',
    subcat: 'furniture',
    icon: '🧥',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="8" fill="#451a03" stroke="#1c0a00" stroke-width="2"/>
      <ellipse cx="26" cy="32" rx="6" ry="12" fill="#1e3a8a"/>
      <ellipse cx="38" cy="32" rx="6" ry="12" fill="#991b1b"/>
    `)
  },
  {
    id: 'prop_leather_trunk',
    name: 'Baule da viaggio in pelle',
    subcat: 'furniture',
    icon: '🧳',
    svg: topDownSvg(`
      <rect x="10" y="18" width="44" height="28" rx="4" fill="#573a27" stroke="#2b170c" stroke-width="2.5"/>
      <line x1="20" y1="18" x2="20" y2="46" stroke="#ca8a04" stroke-width="2"/>
      <line x1="44" y1="18" x2="44" y2="46" stroke="#ca8a04" stroke-width="2"/>
      <rect x="29" y="30" width="6" height="4" fill="#ca8a04"/>
    `)
  },
  {
    id: 'prop_washbasin',
    name: 'Lavabo in ceramica con brocca',
    subcat: 'furniture',
    icon: '🪣',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="22" fill="#e2e8f0" stroke="#64748b" stroke-width="3"/>
      <circle cx="32" cy="32" r="16" fill="#38bdf8"/>
      <circle cx="40" cy="24" r="5" fill="#ca8a04"/>
    `)
  },
  {
    id: 'prop_stone_fireplace',
    name: 'Camino in pietra con ceppi accesi',
    subcat: 'furniture',
    icon: '🔥',
    svg: topDownSvg(`
      <rect x="6" y="10" width="52" height="44" rx="4" fill="#334155" stroke="#0f172a" stroke-width="3"/>
      <rect x="14" y="16" width="36" height="32" fill="#1e1b18"/>
      <line x1="20" y1="28" x2="44" y2="36" stroke="#451a03" stroke-width="4"/>
      <line x1="44" y1="28" x2="20" y2="36" stroke="#451a03" stroke-width="4"/>
      <circle cx="32" cy="32" r="9" fill="#ea580c"/>
      <circle cx="32" cy="32" r="5" fill="#facc15"/>
    `)
  },
  {
    id: 'prop_globe',
    name: 'Mappamondo su piedistallo',
    subcat: 'furniture',
    icon: '🌍',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="20" fill="#0284c7" stroke="#ca8a04" stroke-width="3"/>
      <circle cx="28" cy="28" r="6" fill="#16a34a"/>
      <circle cx="36" cy="36" r="5" fill="#16a34a"/>
      <circle cx="32" cy="32" r="3" fill="#ca8a04"/>
    `)
  },

  // ==========================================
  // --- 26–40: Illuminazione e Decorazione Magica ---
  // ==========================================
  {
    id: 'prop_wall_torch',
    name: 'Torcia a parete in ferro',
    subcat: 'magic_light',
    icon: '🔥',
    svg: topDownSvg(`
      <line x1="32" y1="48" x2="32" y2="28" stroke="#1f2937" stroke-width="5" stroke-linecap="round"/>
      <circle cx="32" cy="20" r="10" fill="#ea580c"/>
      <circle cx="32" cy="20" r="5" fill="#fef08a"/>
    `)
  },
  {
    id: 'prop_oil_lantern',
    name: 'Lanterna a olio da tavolo',
    subcat: 'magic_light',
    icon: '🏮',
    svg: topDownSvg(`
      <rect x="20" y="20" width="24" height="24" rx="4" fill="#334155" stroke="#ca8a04" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="7" fill="#fbbf24"/>
    `)
  },
  {
    id: 'prop_bronze_brazier',
    name: 'Braciere in bronzo fumante',
    subcat: 'magic_light',
    icon: '🔥',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="24" fill="#78350f" stroke="#b45309" stroke-width="3"/>
      <circle cx="32" cy="32" r="16" fill="#ea580c"/>
      <circle cx="32" cy="32" r="8" fill="#facc15"/>
    `)
  },
  {
    id: 'prop_single_candle',
    name: 'Candela singola consumata su piattino',
    subcat: 'magic_light',
    icon: '🕯️',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="18" fill="#ca8a04" stroke="#713f12" stroke-width="2"/>
      <circle cx="32" cy="32" r="8" fill="#f8fafc"/>
      <circle cx="32" cy="32" r="3" fill="#ea580c"/>
    `)
  },
  {
    id: 'prop_crystal_orb',
    name: 'Sfera di cristallo luminosa su supporto',
    subcat: 'magic_light',
    icon: '🔮',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="22" fill="#ca8a04" stroke="#854d0e" stroke-width="3"/>
      <circle cx="32" cy="32" r="16" fill="#38bdf8"/>
      <circle cx="28" cy="28" r="5" fill="#ffffff"/>
    `)
  },
  {
    id: 'prop_magic_books_pile',
    name: 'Pila di libri di magia aperti',
    subcat: 'magic_light',
    icon: '📖',
    svg: topDownSvg(`
      <rect x="8" y="16" width="48" height="32" rx="2" fill="#6d28d9" stroke="#312e81" stroke-width="2"/>
      <polygon points="12,20 32,24 32,44 12,40" fill="#fef3c7"/>
      <polygon points="52,20 32,24 32,44 52,40" fill="#fef3c7"/>
      <circle cx="32" cy="32" r="3" fill="#a855f7"/>
    `)
  },
  {
    id: 'prop_ritual_circle',
    name: 'Cerchio rituale disegnato con gesso rosso',
    subcat: 'magic_light',
    icon: '⭕',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="28" fill="none" stroke="#dc2626" stroke-width="2"/>
      <polygon points="32,6 56,48 8,48" fill="none" stroke="#dc2626" stroke-width="1.5"/>
      <polygon points="32,58 56,16 8,16" fill="none" stroke="#dc2626" stroke-width="1.5"/>
      <circle cx="32" cy="32" r="6" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    `)
  },
  {
    id: 'prop_large_hourglass',
    name: 'Clessidra grande con sabbia dorata',
    subcat: 'magic_light',
    icon: '⏳',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="22" fill="#78350f" stroke="#451a03" stroke-width="3"/>
      <ellipse cx="32" cy="32" rx="14" ry="8" fill="#ca8a04"/>
      <circle cx="32" cy="32" r="3" fill="#fef08a"/>
    `)
  },
  {
    id: 'prop_metal_pentacle',
    name: 'Pentacolo in metallo inciso da parete',
    subcat: 'magic_light',
    icon: '⭐',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="26" fill="#1e1b4b" stroke="#ca8a04" stroke-width="3"/>
      <polygon points="32,8 39,26 58,26 43,38 48,56 32,45 16,56 21,38 6,26 25,26" fill="none" stroke="#ca8a04" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_magic_staff',
    name: 'Bastone magico poggiato a muro',
    subcat: 'magic_light',
    icon: '🪄',
    svg: topDownSvg(`
      <line x1="12" y1="52" x2="48" y2="16" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
      <circle cx="50" cy="14" r="8" fill="#06b6d4" stroke="#e0f2fe" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_alchemy_bottles',
    name: 'Boccette d\'alchimia ordinate su scaffale',
    subcat: 'magic_light',
    icon: '🧪',
    svg: topDownSvg(`
      <rect x="6" y="24" width="52" height="16" fill="#451a03"/>
      <circle cx="16" cy="32" r="6" fill="#ef4444"/>
      <circle cx="32" cy="32" r="6" fill="#22c55e"/>
      <circle cx="48" cy="32" r="6" fill="#3b82f6"/>
    `)
  },
  {
    id: 'prop_smoking_alembic',
    name: 'Alambicco di vetro fumante',
    subcat: 'magic_light',
    icon: '⚗️',
    svg: topDownSvg(`
      <circle cx="28" cy="32" r="14" fill="#a855f7" stroke="#e9d5ff" stroke-width="2"/>
      <line x1="28" y1="32" x2="48" y2="24" stroke="#e9d5ff" stroke-width="3"/>
      <circle cx="48" cy="24" r="5" fill="#38bdf8"/>
    `)
  },
  {
    id: 'prop_runic_skull',
    name: 'Teschio umano incise con rune',
    subcat: 'magic_light',
    icon: '💀',
    svg: topDownSvg(`
      <circle cx="32" cy="30" r="18" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
      <circle cx="25" cy="32" r="4" fill="#0f172a"/>
      <circle cx="39" cy="32" r="4" fill="#0f172a"/>
      <line x1="32" y1="18" x2="32" y2="26" stroke="#38bdf8" stroke-width="1.5"/>
    `)
  },
  {
    id: 'prop_blood_altar',
    name: 'Altare in pietra con incisioni di sangue',
    subcat: 'magic_light',
    icon: '🩸',
    svg: topDownSvg(`
      <rect x="6" y="14" width="52" height="36" rx="4" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
      <line x1="12" y1="32" x2="52" y2="32" stroke="#991b1b" stroke-width="3"/>
      <circle cx="32" cy="32" r="8" fill="#7f1d1d"/>
    `)
  },
  {
    id: 'prop_obsidian_mirror',
    name: 'Specchio divinatorio d\'ossidiana',
    subcat: 'magic_light',
    icon: '🪞',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="24" fill="#09090b" stroke="#6366f1" stroke-width="3"/>
      <circle cx="32" cy="32" r="18" fill="#030712"/>
      <circle cx="28" cy="28" r="3" fill="#818cf8"/>
    `)
  },

  // ==========================================
  // --- 41–55: Contenitori e Merci ---
  // ==========================================
  {
    id: 'prop_wine_barrel',
    name: 'Botte di vino in legno',
    subcat: 'containers',
    icon: '🍷',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="26" fill="#78350f" stroke="#451a03" stroke-width="3"/>
      <circle cx="32" cy="32" r="20" fill="none" stroke="#27272a" stroke-width="3"/>
      <circle cx="32" cy="32" r="12" fill="#92400e"/>
      <circle cx="32" cy="32" r="3" fill="#451a03"/>
    `)
  },
  {
    id: 'prop_mead_cask',
    name: 'Botte piccola di idromele',
    subcat: 'containers',
    icon: '🍺',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="18" fill="#92400e" stroke="#451a03" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="13" fill="none" stroke="#52525b" stroke-width="2"/>
      <circle cx="32" cy="32" r="2.5" fill="#291504"/>
    `)
  },
  {
    id: 'prop_grain_sack',
    name: 'Sacco di grano bucato',
    subcat: 'containers',
    icon: '🌾',
    svg: topDownSvg(`
      <ellipse cx="32" cy="32" rx="22" ry="16" fill="#d97706" stroke="#78350f" stroke-width="2"/>
      <circle cx="48" cy="34" r="3" fill="#fef08a"/>
    `)
  },
  {
    id: 'prop_potato_sack',
    name: 'Sacco di patate legato con corda',
    subcat: 'containers',
    icon: '🥔',
    svg: topDownSvg(`
      <ellipse cx="32" cy="32" rx="20" ry="18" fill="#785c41" stroke="#402d1d" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="5" fill="#ca8a04"/>
    `)
  },
  {
    id: 'prop_apple_crate',
    name: 'Cassa in legno aperta piena di mele',
    subcat: 'containers',
    icon: '🍎',
    svg: topDownSvg(`
      <rect x="10" y="10" width="44" height="44" fill="#78350f" stroke="#451a03" stroke-width="3"/>
      <circle cx="20" cy="20" r="4.5" fill="#dc2626"/>
      <circle cx="32" cy="20" r="4.5" fill="#dc2626"/>
      <circle cx="44" cy="20" r="4.5" fill="#dc2626"/>
      <circle cx="26" cy="32" r="4.5" fill="#dc2626"/>
      <circle cx="38" cy="32" r="4.5" fill="#dc2626"/>
      <circle cx="32" cy="44" r="4.5" fill="#dc2626"/>
    `)
  },
  {
    id: 'prop_sealed_crate',
    name: 'Cassa sigillata con marchio di trasporto',
    subcat: 'containers',
    icon: '📦',
    svg: topDownSvg(`
      <rect x="8" y="8" width="48" height="48" fill="#854d0e" stroke="#451a03" stroke-width="3"/>
      <line x1="8" y1="8" x2="56" y2="56" stroke="#451a03" stroke-width="3"/>
      <line x1="56" y1="8" x2="8" y2="56" stroke="#451a03" stroke-width="3"/>
      <circle cx="32" cy="32" r="8" fill="#991b1b"/>
    `)
  },
  {
    id: 'prop_amphora_large',
    name: 'Vaso in terracotta grande (Anfora)',
    subcat: 'containers',
    icon: '🏺',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="22" fill="#c2410c" stroke="#7c2d12" stroke-width="3"/>
      <circle cx="32" cy="32" r="10" fill="#ea580c"/>
      <circle cx="12" cy="32" r="4" fill="#7c2d12"/>
      <circle cx="52" cy="32" r="4" fill="#7c2d12"/>
    `)
  },
  {
    id: 'prop_overflowing_treasure',
    name: 'Baule del tesoro strabordante di monete',
    subcat: 'containers',
    icon: '💰',
    svg: topDownSvg(`
      <rect x="8" y="14" width="48" height="36" rx="3" fill="#78350f" stroke="#ca8a04" stroke-width="3"/>
      <circle cx="20" cy="26" r="3.5" fill="#eab308"/>
      <circle cx="28" cy="24" r="3.5" fill="#facc15"/>
      <circle cx="36" cy="26" r="3.5" fill="#eab308"/>
      <circle cx="44" cy="24" r="3.5" fill="#facc15"/>
      <circle cx="32" cy="34" r="4" fill="#eab308"/>
      <circle cx="24" cy="38" r="3.5" fill="#facc15"/>
      <circle cx="40" cy="38" r="3.5" fill="#eab308"/>
    `)
  },
  {
    id: 'prop_blacksmith_toolbox',
    name: 'Cassetta di attrezzi da fabbro',
    subcat: 'containers',
    icon: '🧰',
    svg: topDownSvg(`
      <rect x="10" y="18" width="44" height="28" fill="#334155" stroke="#0f172a" stroke-width="2.5"/>
      <rect x="14" y="24" width="36" height="16" fill="#1e293b"/>
      <line x1="20" y1="28" x2="40" y2="36" stroke="#94a3b8" stroke-width="2.5"/>
      <circle cx="24" cy="32" r="3" fill="#ca8a04"/>
    `)
  },
  {
    id: 'prop_cloth_rolls',
    name: 'Rotoli di stoffa e setati arrotolati',
    subcat: 'containers',
    icon: '🧵',
    svg: topDownSvg(`
      <rect x="8" y="14" width="48" height="10" rx="3" fill="#2563eb" stroke="#1d4ed8" stroke-width="1.5"/>
      <rect x="8" y="27" width="48" height="10" rx="3" fill="#dc2626" stroke="#b91c1c" stroke-width="1.5"/>
      <rect x="8" y="40" width="48" height="10" rx="3" fill="#16a34a" stroke="#15803d" stroke-width="1.5"/>
    `)
  },
  {
    id: 'prop_wicker_bread_basket',
    name: 'Cesta di vimini con pane',
    subcat: 'containers',
    icon: '🥖',
    svg: topDownSvg(`
      <ellipse cx="32" cy="32" rx="22" ry="18" fill="#a16207" stroke="#713f12" stroke-width="2"/>
      <ellipse cx="26" cy="32" rx="6" ry="10" fill="#fef08a"/>
      <ellipse cx="38" cy="32" rx="6" ry="10" fill="#fef08a"/>
    `)
  },
  {
    id: 'prop_wine_rack',
    name: 'Rastrelliera per bottiglie di vino',
    subcat: 'containers',
    icon: '🍾',
    svg: topDownSvg(`
      <rect x="6" y="16" width="52" height="32" fill="#451a03" stroke="#291102" stroke-width="2.5"/>
      <circle cx="16" cy="24" r="3.5" fill="#065f46"/>
      <circle cx="32" cy="24" r="3.5" fill="#065f46"/>
      <circle cx="48" cy="24" r="3.5" fill="#065f46"/>
      <circle cx="16" cy="40" r="3.5" fill="#831843"/>
      <circle cx="32" cy="40" r="3.5" fill="#831843"/>
      <circle cx="48" cy="40" r="3.5" fill="#831843"/>
    `)
  },
  {
    id: 'prop_gold_coin_sack',
    name: 'Sacco di monete d\'oro chiuso',
    subcat: 'containers',
    icon: '🪙',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="18" fill="#b45309" stroke="#78350f" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="6" fill="#eab308"/>
    `)
  },
  {
    id: 'prop_herb_crate',
    name: 'Cassetta di erbe medicinali essiccate',
    subcat: 'containers',
    icon: '🌿',
    svg: topDownSvg(`
      <rect x="8" y="12" width="48" height="40" fill="#5c3818" stroke="#361f0a" stroke-width="2.5"/>
      <rect x="12" y="16" width="18" height="14" fill="#14532d"/>
      <rect x="34" y="16" width="18" height="14" fill="#65a30d"/>
      <rect x="12" y="34" width="18" height="14" fill="#a16207"/>
      <rect x="34" y="34" width="18" height="14" fill="#4c1d95"/>
    `)
  },
  {
    id: 'prop_rope_coils',
    name: 'Gomitoli di corda arrotolati',
    subcat: 'containers',
    icon: '🪢',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="22" fill="#ca8a04" stroke="#713f12" stroke-width="3"/>
      <circle cx="32" cy="32" r="15" fill="none" stroke="#854d0e" stroke-width="3"/>
      <circle cx="32" cy="32" r="8" fill="#451a03"/>
    `)
  },

  // ==========================================
  // --- 56–70: Armi, Armature e Militare ---
  // ==========================================
  {
    id: 'prop_sword_rack',
    name: 'Rastrelliera con spade lunghe',
    subcat: 'military',
    icon: '⚔️',
    svg: topDownSvg(`
      <rect x="8" y="24" width="48" height="16" fill="#451a03" stroke="#291102" stroke-width="2"/>
      <line x1="16" y1="12" x2="16" y2="52" stroke="#cbd5e1" stroke-width="2.5"/>
      <line x1="32" y1="12" x2="32" y2="52" stroke="#cbd5e1" stroke-width="2.5"/>
      <line x1="48" y1="12" x2="48" y2="52" stroke="#cbd5e1" stroke-width="2.5"/>
    `)
  },
  {
    id: 'prop_spear_rack',
    name: 'Rastrelliera con lance e alabarde',
    subcat: 'military',
    icon: '🔱',
    svg: topDownSvg(`
      <rect x="6" y="26" width="52" height="12" fill="#361f0a"/>
      <line x1="14" y1="6" x2="14" y2="58" stroke="#a16207" stroke-width="2"/>
      <polygon points="14,4 11,10 17,10" fill="#94a3b8"/>
      <line x1="32" y1="6" x2="32" y2="58" stroke="#a16207" stroke-width="2"/>
      <polygon points="32,4 29,10 35,10" fill="#94a3b8"/>
      <line x1="50" y1="6" x2="50" y2="58" stroke="#a16207" stroke-width="2"/>
      <polygon points="50,4 47,10 53,10" fill="#94a3b8"/>
    `)
  },
  {
    id: 'prop_training_dummy',
    name: 'Manichino da addestramento in paglia',
    subcat: 'military',
    icon: '🤺',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="12" fill="#ca8a04" stroke="#713f12" stroke-width="2.5"/>
      <line x1="10" y1="32" x2="54" y2="32" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
    `)
  },
  {
    id: 'prop_archery_target',
    name: 'Bersaglio da tiro con l\'arco bucato da frecce',
    subcat: 'military',
    icon: '🎯',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="24" fill="#ffffff" stroke="#000000" stroke-width="2"/>
      <circle cx="32" cy="32" r="18" fill="#3b82f6"/>
      <circle cx="32" cy="32" r="12" fill="#ef4444"/>
      <circle cx="32" cy="32" r="6" fill="#eab308"/>
      <circle cx="28" cy="30" r="1.5" fill="#000000"/>
    `)
  },
  {
    id: 'prop_kite_shield',
    name: 'Scudo a goccia appeso a parete',
    subcat: 'military',
    icon: '🛡️',
    svg: topDownSvg(`
      <path d="M16 12 L48 12 L48 34 Q48 52 32 58 Q16 52 16 34 Z" fill="#1e40af" stroke="#ca8a04" stroke-width="3"/>
      <line x1="32" y1="12" x2="32" y2="58" stroke="#ca8a04" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_knight_armor_stand',
    name: 'Armatura completa da cavaliere su supporto',
    subcat: 'military',
    icon: '⚔️',
    svg: topDownSvg(`
      <circle cx="32" cy="24" r="10" fill="#94a3b8" stroke="#475569" stroke-width="2.5"/>
      <rect x="20" y="32" width="24" height="20" rx="4" fill="#64748b" stroke="#334155" stroke-width="2.5"/>
      <circle cx="16" cy="36" r="5" fill="#94a3b8"/>
      <circle cx="48" cy="36" r="5" fill="#94a3b8"/>
    `)
  },
  {
    id: 'prop_war_chest',
    name: 'Forziere da campo armato',
    subcat: 'military',
    icon: '🧰',
    svg: topDownSvg(`
      <rect x="8" y="16" width="48" height="32" rx="3" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
      <rect x="8" y="16" width="48" height="32" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="8,6"/>
      <circle cx="32" cy="32" r="4" fill="#ca8a04"/>
    `)
  },
  {
    id: 'prop_war_map_table',
    name: 'Mappa tattica da guerra stesa su tavolo',
    subcat: 'military',
    icon: '🗺️',
    svg: topDownSvg(`
      <rect x="6" y="10" width="52" height="44" rx="3" fill="#78350f" stroke="#451a03" stroke-width="3"/>
      <rect x="12" y="16" width="40" height="32" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/>
      <circle cx="24" cy="28" r="3" fill="#dc2626"/>
      <circle cx="40" cy="36" r="3" fill="#2563eb"/>
      <line x1="24" y1="28" x2="40" y2="36" stroke="#991b1b" stroke-width="1.5" stroke-dasharray="2,2"/>
    `)
  },
  {
    id: 'prop_ballista',
    name: 'Balista difensiva su ruote',
    subcat: 'military',
    icon: '🏹',
    svg: topDownSvg(`
      <rect x="28" y="8" width="8" height="48" rx="2" fill="#78350f" stroke="#451a03" stroke-width="2"/>
      <line x1="6" y1="22" x2="58" y2="22" stroke="#451a03" stroke-width="4"/>
      <circle cx="12" cy="46" r="4" fill="#27272a"/>
      <circle cx="52" cy="46" r="4" fill="#27272a"/>
      <polygon points="32,6 28,16 36,16" fill="#64748b"/>
    `)
  },
  {
    id: 'prop_cannon',
    name: 'Cannone da fortezza su fusto in legno',
    subcat: 'military',
    icon: '💣',
    svg: topDownSvg(`
      <rect x="26" y="8" width="12" height="44" rx="4" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
      <circle cx="32" cy="14" r="5" fill="#020617"/>
      <circle cx="16" cy="38" r="5" fill="#78350f" stroke="#451a03" stroke-width="2"/>
      <circle cx="48" cy="38" r="5" fill="#78350f" stroke="#451a03" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_cannonballs_pile',
    name: 'Pila di palle di cannone',
    subcat: 'military',
    icon: '⚫',
    svg: topDownSvg(`
      <circle cx="24" cy="24" r="6" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="40" cy="24" r="6" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="24" cy="40" r="6" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="40" cy="40" r="6" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="32" cy="32" r="7" fill="#334155" stroke="#0f172a" stroke-width="1.5"/>
    `)
  },
  {
    id: 'prop_gunpowder_barrel',
    name: 'Barile di polvere da sparo con stoppino',
    subcat: 'military',
    icon: '🧨',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="24" fill="#b91c1c" stroke="#7f1d1d" stroke-width="3"/>
      <circle cx="32" cy="32" r="16" fill="#ef4444"/>
      <circle cx="32" cy="32" r="4" fill="#fef08a"/>
    `)
  },
  {
    id: 'prop_faction_banner',
    name: 'Stendardo / Bandiera di fazione su asta',
    subcat: 'military',
    icon: '🚩',
    svg: topDownSvg(`
      <circle cx="32" cy="16" r="4" fill="#ca8a04"/>
      <polygon points="32,16 58,28 32,40" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/>
    `)
  },
  {
    id: 'prop_bow_rack',
    name: 'Rastrelliera con archi e faretre',
    subcat: 'military',
    icon: '🏹',
    svg: topDownSvg(`
      <rect x="8" y="24" width="48" height="16" fill="#451a03"/>
      <path d="M12 10 Q24 20 12 30" fill="none" stroke="#d97706" stroke-width="2.5"/>
      <path d="M52 10 Q40 20 52 30" fill="none" stroke="#d97706" stroke-width="2.5"/>
    `)
  },
  {
    id: 'prop_heavy_anvil',
    name: 'Incudine da fabbro pesante',
    subcat: 'military',
    icon: '🔨',
    svg: topDownSvg(`
      <rect x="18" y="22" width="28" height="20" fill="#334155" stroke="#0f172a" stroke-width="2"/>
      <polygon points="12,32 18,22 18,42" fill="#475569"/>
      <polygon points="52,32 46,22 46,42" fill="#475569"/>
    `)
  },

  // ==========================================
  // --- 71–85: Natura e Esterni ---
  // ==========================================
  {
    id: 'prop_oak_tree',
    name: 'Albero di quercia secolare',
    subcat: 'nature',
    icon: '🌳',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="28" fill="#15803d" stroke="#052e16" stroke-width="3"/>
      <circle cx="24" cy="24" r="14" fill="#16a34a"/>
      <circle cx="40" cy="26" r="12" fill="#16a34a"/>
      <circle cx="32" cy="40" r="14" fill="#16a34a"/>
      <circle cx="32" cy="32" r="5" fill="#451a03"/>
    `)
  },
  {
    id: 'prop_snowy_pine',
    name: 'Albero pino innevato',
    subcat: 'nature',
    icon: '🌲',
    svg: topDownSvg(`
      <polygon points="32,6 56,54 8,54" fill="#065f46" stroke="#022c22" stroke-width="2"/>
      <polygon points="32,6 48,34 16,34" fill="#f1f5f9"/>
      <circle cx="32" cy="32" r="4" fill="#f8fafc"/>
    `)
  },
  {
    id: 'prop_tree_stump_axe',
    name: 'Ceppo d\'albero tagliato con scure conficcata',
    subcat: 'nature',
    icon: '🪓',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="22" fill="#78350f" stroke="#451a03" stroke-width="3"/>
      <circle cx="32" cy="32" r="16" fill="#a16207"/>
      <circle cx="32" cy="32" r="8" fill="#ca8a04"/>
      <line x1="22" y1="32" x2="42" y2="32" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    `)
  },
  {
    id: 'prop_berry_bush',
    name: 'Arbusto denso di bacche',
    subcat: 'nature',
    icon: '🫐',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="22" fill="#166534" stroke="#14532d" stroke-width="2"/>
      <circle cx="24" cy="24" r="3.5" fill="#ef4444"/>
      <circle cx="38" cy="22" r="3.5" fill="#ef4444"/>
      <circle cx="34" cy="38" r="3.5" fill="#ef4444"/>
      <circle cx="20" cy="36" r="3.5" fill="#ef4444"/>
    `)
  },
  {
    id: 'prop_mossy_boulder',
    name: 'Masso d\'arenaria mossy (coperto di muschio)',
    subcat: 'nature',
    icon: '🪨',
    svg: topDownSvg(`
      <polygon points="12,32 22,12 44,14 54,28 48,50 24,52" fill="#78716c" stroke="#44403c" stroke-width="3"/>
      <circle cx="26" cy="22" r="8" fill="#15803d"/>
      <circle cx="38" cy="36" r="7" fill="#15803d"/>
    `)
  },
  {
    id: 'prop_firewood_pile',
    name: 'Pila di legna da ardere',
    subcat: 'nature',
    icon: '🪵',
    svg: topDownSvg(`
      <rect x="10" y="14" width="44" height="8" rx="3" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
      <rect x="10" y="24" width="44" height="8" rx="3" fill="#92400e" stroke="#451a03" stroke-width="1.5"/>
      <rect x="10" y="34" width="44" height="8" rx="3" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
      <rect x="10" y="44" width="44" height="8" rx="3" fill="#92400e" stroke="#451a03" stroke-width="1.5"/>
    `)
  },
  {
    id: 'prop_stone_well',
    name: 'Pozzo in pietra con carrucola e secchio',
    subcat: 'nature',
    icon: '🪵',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="26" fill="#475569" stroke="#1e293b" stroke-width="3"/>
      <circle cx="32" cy="32" r="18" fill="#0284c7"/>
      <line x1="8" y1="32" x2="56" y2="32" stroke="#78350f" stroke-width="3"/>
      <circle cx="32" cy="32" r="4" fill="#92400e"/>
    `)
  },
  {
    id: 'prop_broken_cart',
    name: 'Carretto in legno rotto ribaltato',
    subcat: 'nature',
    icon: '🛒',
    svg: topDownSvg(`
      <rect x="12" y="18" width="40" height="28" rx="2" fill="#78350f" stroke="#451a03" stroke-width="2"/>
      <circle cx="10" cy="32" r="8" fill="#451a03"/>
      <line x1="48" y1="18" x2="56" y2="12" stroke="#451a03" stroke-width="3"/>
      <line x1="48" y1="46" x2="56" y2="52" stroke="#451a03" stroke-width="3"/>
    `)
  },
  {
    id: 'prop_ruined_fence',
    name: 'Steccato in legno rovinato',
    subcat: 'nature',
    icon: '🪵',
    svg: topDownSvg(`
      <line x1="6" y1="32" x2="58" y2="32" stroke="#78350f" stroke-width="4"/>
      <rect x="14" y="24" width="4" height="16" fill="#451a03"/>
      <rect x="42" y="24" width="4" height="16" fill="#451a03"/>
    `)
  },
  {
    id: 'prop_wooden_signpost',
    name: 'Cartello stradale con indicazioni in legno',
    subcat: 'nature',
    icon: '🪧',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="5" fill="#451a03"/>
      <polygon points="32,32 54,26 54,38" fill="#92400e" stroke="#451a03" stroke-width="1.5"/>
      <polygon points="32,32 10,26 10,38" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
    `)
  },
  {
    id: 'prop_canvas_tent',
    name: 'Tenda da campeggio in tela chiara',
    subcat: 'nature',
    icon: '⛺',
    svg: topDownSvg(`
      <polygon points="32,6 58,54 6,54" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
      <line x1="32" y1="6" x2="32" y2="54" stroke="#b45309" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_sleeping_bag',
    name: 'Sacco a pelo srotolato',
    subcat: 'nature',
    icon: '🛏️',
    svg: topDownSvg(`
      <rect x="18" y="10" width="28" height="44" rx="8" fill="#047857" stroke="#064e3b" stroke-width="2"/>
      <circle cx="32" cy="18" r="6" fill="#fef08a"/>
    `)
  },
  {
    id: 'prop_campfire_pot',
    name: 'Falò da campo con treppiede e paiolo',
    subcat: 'nature',
    icon: '🍲',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="22" fill="#78716c" stroke="#44403c" stroke-width="2"/>
      <circle cx="32" cy="32" r="14" fill="#ea580c"/>
      <circle cx="32" cy="32" r="8" fill="#18181b" stroke="#71717a" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_scarecrow',
    name: 'Spaventapasseri in paglia ed abiti logori',
    subcat: 'nature',
    icon: '🌾',
    svg: topDownSvg(`
      <line x1="8" y1="32" x2="56" y2="32" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="8" fill="#eab308" stroke="#713f12" stroke-width="2"/>
      <circle cx="32" cy="32" r="14" fill="none" stroke="#78350f" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_stone_grave',
    name: 'Tomba in pietra con croce inclinata',
    subcat: 'nature',
    icon: '🪦',
    svg: topDownSvg(`
      <rect x="18" y="14" width="28" height="40" rx="3" fill="#64748b" stroke="#334155" stroke-width="2"/>
      <line x1="32" y1="20" x2="32" y2="38" stroke="#1e293b" stroke-width="2.5"/>
      <line x1="24" y1="26" x2="40" y2="26" stroke="#1e293b" stroke-width="2.5"/>
    `)
  },

  // ==========================================
  // --- 86–100: Dungeon, Cripte e Macabro ---
  // ==========================================
  {
    id: 'prop_skeleton_ground',
    name: 'Scheletro umano steso a terra',
    subcat: 'dungeon',
    icon: '💀',
    svg: topDownSvg(`
      <circle cx="32" cy="14" r="5" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="32" y1="19" x2="32" y2="38" stroke="#f8fafc" stroke-width="2.5"/>
      <line x1="20" y1="26" x2="44" y2="26" stroke="#f8fafc" stroke-width="2"/>
      <line x1="32" y1="38" x2="24" y2="54" stroke="#f8fafc" stroke-width="2"/>
      <line x1="32" y1="38" x2="40" y2="54" stroke="#f8fafc" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_hanging_cage',
    name: 'Gabbia in ferro sospesa da catena',
    subcat: 'dungeon',
    icon: '⛓️',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="24" fill="rgba(0,0,0,0.5)" stroke="#64748b" stroke-width="3"/>
      <circle cx="32" cy="32" r="14" fill="none" stroke="#64748b" stroke-width="2"/>
      <line x1="8" y1="32" x2="56" y2="32" stroke="#64748b" stroke-width="2"/>
      <line x1="32" y1="8" x2="32" y2="56" stroke="#64748b" stroke-width="2"/>
      <circle cx="32" cy="32" r="4" fill="#cbd5e1"/>
    `)
  },
  {
    id: 'prop_portcullis',
    name: 'Saracinesca in ferro arrugginito',
    subcat: 'dungeon',
    icon: '⛓️',
    svg: topDownSvg(`
      <rect x="6" y="26" width="52" height="12" fill="#713f12" stroke="#451a03" stroke-width="2"/>
      <line x1="12" y1="26" x2="12" y2="38" stroke="#d4d4d8" stroke-width="2.5"/>
      <line x1="22" y1="26" x2="22" y2="38" stroke="#d4d4d8" stroke-width="2.5"/>
      <line x1="32" y1="26" x2="32" y2="38" stroke="#d4d4d8" stroke-width="2.5"/>
      <line x1="42" y1="26" x2="42" y2="38" stroke="#d4d4d8" stroke-width="2.5"/>
      <line x1="52" y1="26" x2="52" y2="38" stroke="#d4d4d8" stroke-width="2.5"/>
    `)
  },
  {
    id: 'prop_gargoyle',
    name: 'Gargoyle in pietra decorativo',
    subcat: 'dungeon',
    icon: '🗿',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="16" fill="#475569" stroke="#1e293b" stroke-width="2.5"/>
      <polygon points="20,20 8,14 16,28" fill="#334155"/>
      <polygon points="44,20 56,14 48,28" fill="#334155"/>
      <circle cx="26" cy="30" r="2" fill="#ef4444"/>
      <circle cx="38" cy="30" r="2" fill="#ef4444"/>
    `)
  },
  {
    id: 'prop_closed_sarcophagus',
    name: 'Sarcofago in pietra chiuso',
    subcat: 'dungeon',
    icon: '⚰️',
    svg: topDownSvg(`
      <rect x="12" y="6" width="40" height="52" rx="6" fill="#334155" stroke="#0f172a" stroke-width="3"/>
      <rect x="18" y="12" width="28" height="40" rx="3" fill="#475569"/>
      <circle cx="32" cy="22" r="6" fill="#94a3b8"/>
    `)
  },
  {
    id: 'prop_open_sarcophagus',
    name: 'Sarcofago di re aperto e vuoto',
    subcat: 'dungeon',
    icon: '⚰️',
    svg: topDownSvg(`
      <rect x="12" y="6" width="40" height="52" rx="6" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
      <rect x="18" y="12" width="28" height="40" fill="#090a0f"/>
    `)
  },
  {
    id: 'prop_torture_rack',
    name: 'Tavolo di tortura con cinghie in cuoio',
    subcat: 'dungeon',
    icon: '🪵',
    svg: topDownSvg(`
      <rect x="10" y="8" width="44" height="48" rx="3" fill="#5c2b09" stroke="#361803" stroke-width="2.5"/>
      <rect x="14" y="14" width="36" height="6" fill="#78350f"/>
      <rect x="14" y="44" width="36" height="6" fill="#78350f"/>
      <line x1="16" y1="20" x2="16" y2="44" stroke="#262626" stroke-width="2"/>
      <line x1="48" y1="20" x2="48" y2="44" stroke="#262626" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_iron_maiden',
    name: 'Vergine di ferro (Iron Maiden)',
    subcat: 'dungeon',
    icon: '⛓️',
    svg: topDownSvg(`
      <ellipse cx="32" cy="32" rx="18" ry="24" fill="#334155" stroke="#0f172a" stroke-width="3"/>
      <circle cx="26" cy="28" r="2" fill="#ef4444"/>
      <circle cx="38" cy="28" r="2" fill="#ef4444"/>
    `)
  },
  {
    id: 'prop_execution_block',
    name: 'Ceppo da decapitazione con mannaia',
    subcat: 'dungeon',
    icon: '🪓',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="20" fill="#78350f" stroke="#451a03" stroke-width="3"/>
      <circle cx="32" cy="32" r="14" fill="#991b1b"/>
      <rect x="22" y="30" width="20" height="4" fill="#cbd5e1" stroke="#000" stroke-width="1"/>
    `)
  },
  {
    id: 'prop_wall_chains',
    name: 'Catene e manette fisse a muro',
    subcat: 'dungeon',
    icon: '⛓️',
    svg: topDownSvg(`
      <rect x="6" y="28" width="8" height="8" fill="#18181b"/>
      <circle cx="20" cy="32" r="4" fill="none" stroke="#71717a" stroke-width="2"/>
      <circle cx="30" cy="32" r="4" fill="none" stroke="#71717a" stroke-width="2"/>
      <circle cx="42" cy="32" r="5" fill="none" stroke="#a1a1aa" stroke-width="2.5"/>
    `)
  },
  {
    id: 'prop_bone_pile',
    name: 'Pila di ossa umane sparse',
    subcat: 'dungeon',
    icon: '🦴',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="18" fill="rgba(0,0,0,0.3)"/>
      <line x1="16" y1="24" x2="48" y2="40" stroke="#f1f5f9" stroke-width="3" stroke-linecap="round"/>
      <line x1="44" y1="20" x2="20" y2="44" stroke="#f1f5f9" stroke-width="3" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="5" fill="#f8fafc"/>
    `)
  },
  {
    id: 'prop_webbed_chest',
    name: 'Baule con ragnatele spesse',
    subcat: 'dungeon',
    icon: '🕸️',
    svg: topDownSvg(`
      <rect x="10" y="16" width="44" height="32" rx="3" fill="#451a03" stroke="#1c0a00" stroke-width="2.5"/>
      <line x1="10" y1="16" x2="36" y2="48" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.7"/>
      <line x1="54" y1="16" x2="24" y2="48" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.7"/>
    `)
  },
  {
    id: 'prop_bronze_urn',
    name: 'Urna cineraria in bronzo',
    subcat: 'dungeon',
    icon: '🏺',
    svg: topDownSvg(`
      <circle cx="32" cy="32" r="16" fill="#b45309" stroke="#78350f" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="8" fill="#ca8a04"/>
    `)
  },
  {
    id: 'prop_wood_coffin',
    name: 'Bara di legno chiusa',
    subcat: 'dungeon',
    icon: '⚰️',
    svg: topDownSvg(`
      <polygon points="22,8 42,8 48,24 40,56 24,56 16,24" fill="#5c2b09" stroke="#361803" stroke-width="2.5"/>
      <line x1="32" y1="18" x2="32" y2="34" stroke="#ca8a04" stroke-width="2"/>
      <line x1="26" y1="24" x2="38" y2="24" stroke="#ca8a04" stroke-width="2"/>
    `)
  },
  {
    id: 'prop_iron_trapdoor',
    name: 'Botola in ferro fuso nel pavimento',
    subcat: 'dungeon',
    icon: '🕳️',
    svg: topDownSvg(`
      <rect x="8" y="8" width="48" height="48" rx="3" fill="#18181b" stroke="#3f3f46" stroke-width="3"/>
      <circle cx="32" cy="32" r="8" fill="none" stroke="#71717a" stroke-width="3"/>
    `)
  }
];
