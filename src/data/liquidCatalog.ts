export interface LiquidDefinition {
  id: number;
  key: string;
  name: string;
  desc: string;
  icon: string;
  deep: string;
  shallow: string;
  foam: string;
  caustic: string;
  isGlowing?: boolean;
  glowColor?: string;
  viscosity?: number; // 1 = water, 2 = honey/sap/blood, 3 = tar/oil
}

export const LIQUID_CATALOG: LiquidDefinition[] = [
  // --- Standard Acque e Lava preesistenti ---
  {
    id: 1,
    key: 'water_shallow',
    name: 'Acqua Trasparente',
    desc: 'Limpida e poco profonda, mostra il fondale',
    icon: '🌊',
    deep: 'rgba(14, 116, 144, 0.65)',
    shallow: 'rgba(34, 211, 238, 0.45)',
    foam: 'rgba(207, 250, 254, 0.65)',
    caustic: 'rgba(255, 255, 255, 0.25)',
    viscosity: 1
  },
  {
    id: 2,
    key: 'water_deep',
    name: 'Acqua Profonda',
    desc: 'Blu oceanico intenso con onde e schiuma',
    icon: '💧',
    deep: 'rgba(12, 74, 110, 0.90)',
    shallow: 'rgba(3, 105, 161, 0.75)',
    foam: 'rgba(186, 230, 253, 0.70)',
    caustic: 'rgba(224, 242, 254, 0.20)',
    viscosity: 1
  },
  {
    id: 3,
    key: 'water_canal',
    name: 'Canale Cittadino',
    desc: 'Acqua architettonica per canali e fontane',
    icon: '⛲',
    deep: 'rgba(15, 76, 92, 0.85)',
    shallow: 'rgba(42, 157, 143, 0.60)',
    foam: 'rgba(230, 255, 250, 0.50)',
    caustic: 'rgba(255, 255, 255, 0.15)',
    viscosity: 1
  },
  {
    id: 4,
    key: 'water_murky',
    name: 'Palude / Torbida',
    desc: 'Acqua stagnante melmosa da acquitrino',
    icon: '🐊',
    deep: 'rgba(40, 54, 24, 0.88)',
    shallow: 'rgba(96, 108, 56, 0.70)',
    foam: 'rgba(221, 229, 182, 0.45)',
    caustic: 'rgba(200, 230, 150, 0.12)',
    viscosity: 1.5
  },
  {
    id: 5,
    key: 'lava_molten',
    name: 'Lava Incandescente',
    desc: 'Fluido vulcanico fuso con bagliore caldo e luce fioca',
    icon: '🌋',
    deep: 'rgba(185, 28, 28, 0.95)',
    shallow: 'rgba(249, 115, 22, 0.85)',
    foam: 'rgba(254, 240, 138, 0.90)',
    caustic: 'rgba(253, 224, 71, 0.55)',
    isGlowing: true,
    glowColor: '#ea580c',
    viscosity: 2
  },

  // --- I 5 NUOVI LIQUIDI RICHIESTI ---
  {
    id: 6,
    key: 'blood_ancient',
    name: 'Sangue Densificato / Antico',
    desc: 'Liquido viscoso, di colore rosso scuro o nerastro per cripte e altari rituali',
    icon: '🩸',
    deep: 'rgba(69, 10, 10, 0.98)',
    shallow: 'rgba(127, 29, 29, 0.85)',
    foam: 'rgba(220, 38, 38, 0.50)',
    caustic: 'rgba(239, 68, 68, 0.20)',
    viscosity: 2.2
  },
  {
    id: 7,
    key: 'toxic_slime',
    name: 'Melma Tossica / Veleno Fluorescente',
    desc: 'Verde brillante acido con bolle di fumi tossici da laboratori e fogne',
    icon: '🧪',
    deep: 'rgba(20, 83, 45, 0.92)',
    shallow: 'rgba(74, 222, 128, 0.85)',
    foam: 'rgba(187, 247, 208, 0.75)',
    caustic: 'rgba(134, 239, 172, 0.45)',
    isGlowing: true,
    glowColor: '#22c55e',
    viscosity: 1.8
  },
  {
    id: 8,
    key: 'honey_sap',
    name: 'Miele Denso / Linfa Alchemica',
    desc: 'Liquido ambrato dorato denso e appiccicoso per alveari mostruosi o linfe giganti',
    icon: '🍯',
    deep: 'rgba(180, 83, 9, 0.92)',
    shallow: 'rgba(245, 158, 11, 0.80)',
    foam: 'rgba(254, 243, 199, 0.65)',
    caustic: 'rgba(251, 191, 36, 0.40)',
    viscosity: 2.5
  },
  {
    id: 9,
    key: 'arcane_mana',
    name: 'Mana Arcano / Siero Magico',
    desc: 'Azzurro elettrico o viola brillante, luminescente per accademie e santuari',
    icon: '💠',
    deep: 'rgba(30, 27, 75, 0.92)',
    shallow: 'rgba(14, 165, 233, 0.85)',
    foam: 'rgba(165, 243, 252, 0.75)',
    caustic: 'rgba(192, 132, 252, 0.50)',
    isGlowing: true,
    glowColor: '#38bdf8',
    viscosity: 1.2
  },
  {
    id: 10,
    key: 'tar_oil',
    name: 'Olio Nero / Catrame Liquido',
    desc: 'Scuro, lucido e altamente infiammabile per trappole industriali o macchinari',
    icon: '🛢️',
    deep: 'rgba(10, 10, 12, 0.98)',
    shallow: 'rgba(38, 38, 48, 0.85)',
    foam: 'rgba(80, 75, 95, 0.40)',
    caustic: 'rgba(120, 110, 150, 0.20)', // rainbow oil sheen
    viscosity: 3
  }
];
