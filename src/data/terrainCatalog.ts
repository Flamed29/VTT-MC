export interface TerrainDefinition {
  id: number;
  key: string;
  name: string;
  subcat: 'natural' | 'snow_ice' | 'cave' | 'urban' | 'fantasy_alien';
  icon: string;
  baseColor: string;
  detailColor: string;
  accentColor?: string;
  pattern: 'plain' | 'noise' | 'stripes' | 'brick' | 'cobble' | 'hex' | 'crystal' | 'cracked' | 'wood' | 'tile' | 'veined' | 'circular';
}

export const TERRAIN_CATALOG: TerrainDefinition[] = [
  // --- 1–25: Terreni Naturali e Terrestri ---
  { id: 1, key: 'grass_lush', name: 'Erba verde rigogliosa', subcat: 'natural', icon: '🌱', baseColor: '#1e4620', detailColor: '#2d6a31', pattern: 'noise' },
  { id: 2, key: 'grass_dry', name: 'Erba secca dorata', subcat: 'natural', icon: '🌾', baseColor: '#856427', detailColor: '#a17c34', pattern: 'noise' },
  { id: 3, key: 'grass_burnt', name: 'Erba bruciata / fuligginosa', subcat: 'natural', icon: '🔥', baseColor: '#2b231c', detailColor: '#171310', pattern: 'noise' },
  { id: 4, key: 'grass_tall', name: 'Erba alta di campo', subcat: 'natural', icon: '🌿', baseColor: '#2d5a27', detailColor: '#3c7934', pattern: 'stripes' },
  { id: 5, key: 'moss_dense', name: 'Muschio denso di bosco', subcat: 'natural', icon: '🌲', baseColor: '#133e1d', detailColor: '#1d5c2b', pattern: 'noise' },
  { id: 6, key: 'forest_leaves', name: 'Terreno boschivo con foglie secche', subcat: 'natural', icon: '🍂', baseColor: '#4a2e18', detailColor: '#7a3e1d', pattern: 'cobble' },
  { id: 7, key: 'dirt_brown', name: 'Terra battuta marrone', subcat: 'natural', icon: '🟤', baseColor: '#5c3d28', detailColor: '#452b1b', pattern: 'plain' },
  { id: 8, key: 'clay_dried', name: 'Terra d\'argilla fango essiccato', subcat: 'natural', icon: '🧱', baseColor: '#8a4f32', detailColor: '#633721', pattern: 'cracked' },
  { id: 9, key: 'dirt_farm', name: 'Terra scura da orto / coltivata', subcat: 'natural', icon: '🪴', baseColor: '#2b1d14', detailColor: '#1a110b', pattern: 'stripes' },
  { id: 10, key: 'heathland', name: 'Terra di brughiera viola / marrone', subcat: 'natural', icon: '🪻', baseColor: '#422838', detailColor: '#5a364d', pattern: 'noise' },
  { id: 11, key: 'taiga_needles', name: 'Terreno di taiga (aghi di pino)', subcat: 'natural', icon: '🌲', baseColor: '#3b2f21', detailColor: '#54422e', pattern: 'stripes' },
  { id: 12, key: 'sand_beach', name: 'Sabbia chiara da spiaggia', subcat: 'natural', icon: '🏖️', baseColor: '#e0c58e', detailColor: '#cbb07a', pattern: 'noise' },
  { id: 13, key: 'sand_desert', name: 'Sabbia fine da deserto', subcat: 'natural', icon: '🏜️', baseColor: '#d4a359', detailColor: '#be8e45', pattern: 'plain' },
  { id: 14, key: 'sand_red_canyon', name: 'Sabbia rossa marziana / canyon', subcat: 'natural', icon: '🧗', baseColor: '#9c3d25', detailColor: '#b84c31', pattern: 'noise' },
  { id: 15, key: 'sand_volcanic', name: 'Sabbia scura vulcanica', subcat: 'natural', icon: '🌋', baseColor: '#262628', detailColor: '#181819', pattern: 'noise' },
  { id: 16, key: 'sand_dunes', name: 'Dune di sabbia con increspature', subcat: 'natural', icon: '〰️', baseColor: '#cf9e57', detailColor: '#b8863f', pattern: 'stripes' },
  { id: 17, key: 'river_pebbles', name: 'Ciottoli di fiume levigati', subcat: 'natural', icon: '🌊', baseColor: '#575f68', detailColor: '#3f464e', pattern: 'cobble' },
  { id: 18, key: 'mountain_gravel', name: 'Ghiaia di montagna', subcat: 'natural', icon: '⛰️', baseColor: '#60646c', detailColor: '#494d54', pattern: 'noise' },
  { id: 19, key: 'basalt_rock', name: 'Roccia basaltica scura', subcat: 'natural', icon: '🪨', baseColor: '#222326', detailColor: '#141416', pattern: 'cracked' },
  { id: 20, key: 'limestone', name: 'Roccia calcarea chiara', subcat: 'natural', icon: '🏛️', baseColor: '#cac7be', detailColor: '#aba79c', pattern: 'plain' },
  { id: 21, key: 'granite_grey', name: 'Roccia granitica grigia', subcat: 'natural', icon: '🏔️', baseColor: '#4a4e54', detailColor: '#36393e', pattern: 'noise' },
  { id: 22, key: 'clay_rock_red', name: 'Roccia argillosa rossa', subcat: 'natural', icon: '🟥', baseColor: '#8a3424', detailColor: '#692619', pattern: 'cracked' },
  { id: 23, key: 'tundra_frozen', name: 'Terreno di tundra semi-congelato', subcat: 'natural', icon: '❄️', baseColor: '#475249', detailColor: '#353e37', pattern: 'noise' },
  { id: 24, key: 'salt_flat', name: 'Terra salina bianca incrostata', subcat: 'natural', icon: '🧂', baseColor: '#e3e4e6', detailColor: '#c5c7cb', pattern: 'cracked' },
  { id: 25, key: 'root_ground', name: 'Terreno con radici affioranti', subcat: 'natural', icon: '🪵', baseColor: '#402a1b', detailColor: '#633f28', pattern: 'stripes' },

  // --- 26–35: Terreni Neve e Ghiaccio ---
  { id: 26, key: 'snow_fresh', name: 'Neve fresca e soffice', subcat: 'snow_ice', icon: '🌨️', baseColor: '#f1f5f9', detailColor: '#e2e8f0', pattern: 'plain' },
  { id: 27, key: 'snow_compact', name: 'Neve compatta / pressata', subcat: 'snow_ice', icon: '❄️', baseColor: '#dbeafe', detailColor: '#bfdbfe', pattern: 'noise' },
  { id: 28, key: 'snow_slush', name: 'Neve fangosa / sciolta', subcat: 'snow_ice', icon: '💧', baseColor: '#786b5e', detailColor: '#b8c4ce', pattern: 'noise' },
  { id: 29, key: 'ice_solid', name: 'Ghiaccio solido trasparente', subcat: 'snow_ice', icon: '🧊', baseColor: '#93c5fd', detailColor: '#60a5fa', pattern: 'plain' },
  { id: 30, key: 'ice_glacier_deep', name: 'Ghiaccio blu profondo Glacier', subcat: 'snow_ice', icon: '🔷', baseColor: '#1d4ed8', detailColor: '#3b82f6', pattern: 'veined' },
  { id: 31, key: 'ice_cracked', name: 'Ghiaccio incrinato / spaccato', subcat: 'snow_ice', icon: '⚡', baseColor: '#bfdbfe', detailColor: '#3b82f6', pattern: 'cracked' },
  { id: 32, key: 'snow_tracks', name: 'Neve con impronte di zampe / scarponi', subcat: 'snow_ice', icon: '🐾', baseColor: '#e2e8f0', detailColor: '#94a3b8', pattern: 'noise' },
  { id: 33, key: 'permafrost_moss', name: 'Permafrost congelato con muschio', subcat: 'snow_ice', icon: '🥶', baseColor: '#374151', detailColor: '#4b7d5e', pattern: 'noise' },
  { id: 34, key: 'frost_slippery', name: 'Lastrone di brina scivolosa', subcat: 'snow_ice', icon: '⛸️', baseColor: '#c7d2fe', detailColor: '#e0e7ff', pattern: 'stripes' },
  { id: 35, key: 'snow_blood', name: 'Neve intrisa di sangue', subcat: 'snow_ice', icon: '🩸', baseColor: '#f1f5f9', detailColor: '#991b1b', pattern: 'noise' },

  // --- 36–50: Terreni Sotterranei e Caverne ---
  { id: 36, key: 'cave_rock_raw', name: 'Pavimento di pietra di caverna grezza', subcat: 'cave', icon: '🦇', baseColor: '#2b2927', detailColor: '#1c1b1a', pattern: 'noise' },
  { id: 37, key: 'stalagmite_field', name: 'Stalagmiti spezzate / rasate', subcat: 'cave', icon: '🔺', baseColor: '#383531', detailColor: '#524e47', pattern: 'circular' },
  { id: 38, key: 'cave_dust', name: 'Polvere di grotta e detriti', subcat: 'cave', icon: '🌫️', baseColor: '#3a3835', detailColor: '#242321', pattern: 'noise' },
  { id: 39, key: 'fallen_stalactites', name: 'Terreno di stalattiti staccate', subcat: 'cave', icon: '🔻', baseColor: '#45413c', detailColor: '#635d56', pattern: 'cracked' },
  { id: 40, key: 'wet_dungeon_dirt', name: 'Terra umida di sotterraneo', subcat: 'cave', icon: '💧', baseColor: '#241a13', detailColor: '#140e0a', pattern: 'noise' },
  { id: 41, key: 'spore_ground', name: 'Terreno corrotto da spore / funghi', subcat: 'cave', icon: '🍄', baseColor: '#3b253b', detailColor: '#693867', pattern: 'noise' },
  { id: 42, key: 'biolum_mushrooms', name: 'Prato di funghi bioluminescenti', subcat: 'cave', icon: '✨', baseColor: '#0f2420', detailColor: '#10b981', pattern: 'circular' },
  { id: 43, key: 'crystal_floor', name: 'Terreno di cristalli grezzi affioranti', subcat: 'cave', icon: '💎', baseColor: '#2e104d', detailColor: '#a855f7', pattern: 'crystal' },
  { id: 44, key: 'pumice_stone', name: 'Roccia vulcanica porosa (pomice)', subcat: 'cave', icon: '🕳️', baseColor: '#3a3430', detailColor: '#201c1a', pattern: 'noise' },
  { id: 45, key: 'earthquake_fissure', name: 'Roccia fessurata da terremoto', subcat: 'cave', icon: '💔', baseColor: '#332f2c', detailColor: '#121110', pattern: 'cracked' },
  { id: 46, key: 'sponge_cave', name: 'Terreno spugnoso di grotta', subcat: 'cave', icon: '🧽', baseColor: '#423d2f', detailColor: '#2b271d', pattern: 'circular' },
  { id: 47, key: 'salt_cave_floor', name: 'Pavimento di sale di grotta', subcat: 'cave', icon: '🧂', baseColor: '#cbd5e1', detailColor: '#94a3b8', pattern: 'crystal' },
  { id: 48, key: 'black_marble_raw', name: 'Caverna di marmo nero grezzo', subcat: 'cave', icon: '⬛', baseColor: '#111317', detailColor: '#2c3340', pattern: 'veined' },
  { id: 49, key: 'mine_gravel', name: 'Fondo di miniera con pietrisco', subcat: 'cave', icon: '⛏️', baseColor: '#423e3b', detailColor: '#292624', pattern: 'noise' },
  { id: 50, key: 'guano_dust', name: 'Terreno di guano e polvere', subcat: 'cave', icon: '🍂', baseColor: '#362f27', detailColor: '#1f1a14', pattern: 'plain' },

  // --- 51–75: Terreni Urbani, Pavimentazioni e Architettura ---
  { id: 51, key: 'urban_cobblestone', name: 'Ciottolato urbano classico (Cobblestone)', subcat: 'urban', icon: '🪨', baseColor: '#4f5358', detailColor: '#2d3034', pattern: 'cobble' },
  { id: 52, key: 'sanpietrini', name: 'Sanpietrini squadrati', subcat: 'urban', icon: '◽', baseColor: '#3c3f43', detailColor: '#202224', pattern: 'tile' },
  { id: 53, key: 'flagstone_rect', name: 'Lastricato di pietra rettangolare', subcat: 'urban', icon: '🏛️', baseColor: '#5c636c', detailColor: '#3a3e44', pattern: 'brick' },
  { id: 54, key: 'brick_red', name: 'Pavimento in mattoni rossi', subcat: 'urban', icon: '🧱', baseColor: '#8a3324', detailColor: '#5e2015', pattern: 'brick' },
  { id: 55, key: 'brick_herringbone', name: 'Pavimento in mattoni spina di pesce', subcat: 'urban', icon: '📐', baseColor: '#964332', detailColor: '#69291d', pattern: 'stripes' },
  { id: 56, key: 'marble_white_veined', name: 'Marmo bianco venato', subcat: 'urban', icon: '🏛️', baseColor: '#f8fafc', detailColor: '#94a3b8', pattern: 'veined' },
  { id: 57, key: 'marble_black_gloss', name: 'Marmo nero lucido', subcat: 'urban', icon: '🪞', baseColor: '#090a0f', detailColor: '#2b303c', pattern: 'veined' },
  { id: 58, key: 'granite_worked', name: 'Pavimento in granito lavorato', subcat: 'urban', icon: '🏢', baseColor: '#474c53', detailColor: '#2f3238', pattern: 'tile' },
  { id: 59, key: 'terracotta_tiles', name: 'Piastrelle in terracotta mediterranea', subcat: 'urban', icon: '🏺', baseColor: '#c25e36', detailColor: '#8f3d1b', pattern: 'tile' },
  { id: 60, key: 'ceramic_tiles_dec', name: 'Piastrelle ceramiche decorate', subcat: 'urban', icon: '🔷', baseColor: '#0284c7', detailColor: '#f8fafc', pattern: 'tile' },
  { id: 61, key: 'parquet_oak', name: 'Parquet in legno di quercia', subcat: 'urban', icon: '🪵', baseColor: '#a16207', detailColor: '#713f12', pattern: 'wood' },
  { id: 62, key: 'tavern_wood_planks', name: 'Assi di legno grezzo da taverna', subcat: 'urban', icon: '🍺', baseColor: '#78350f', detailColor: '#451a03', pattern: 'wood' },
  { id: 63, key: 'wood_rotten', name: 'Assi di legno marcio / scuro', subcat: 'urban', icon: '🪵', baseColor: '#362419', detailColor: '#1c130d', pattern: 'wood' },
  { id: 64, key: 'runic_stone_floor', name: 'Pavimento in pietra runica incisa', subcat: 'urban', icon: '🪨', baseColor: '#334155', detailColor: '#38bdf8', pattern: 'crystal' },
  { id: 65, key: 'roman_mosaic', name: 'Mosaico romano / bizantino danneggiato', subcat: 'urban', icon: '🏺', baseColor: '#b45309', detailColor: '#1d4ed8', pattern: 'tile' },
  { id: 66, key: 'rusty_iron_plates', name: 'Piastre di ferro arrugginito', subcat: 'urban', icon: '⚙️', baseColor: '#7c3a21', detailColor: '#44403c', pattern: 'tile' },
  { id: 67, key: 'drain_metal_grate', name: 'Grigliata metallica di scolo', subcat: 'urban', icon: '⛓️', baseColor: '#262626', detailColor: '#0a0a0a', pattern: 'stripes' },
  { id: 68, key: 'asphalt_cracked', name: 'Asfalto crepato (Sci-Fi / Moderno)', subcat: 'urban', icon: '🛣️', baseColor: '#27272a', detailColor: '#18181b', pattern: 'cracked' },
  { id: 69, key: 'raw_concrete', name: 'Cemento armato grezzo', subcat: 'urban', icon: '🏗️', baseColor: '#52525b', detailColor: '#3f3f46', pattern: 'plain' },
  { id: 70, key: 'linoleum_industrial', name: 'Pavimento industriale in linoleum', subcat: 'urban', icon: '🏭', baseColor: '#0e7490', detailColor: '#164e63', pattern: 'tile' },
  { id: 71, key: 'brass_polished', name: 'Lastre di ottone lucidato', subcat: 'urban', icon: '🎷', baseColor: '#ca8a04', detailColor: '#eab308', pattern: 'tile' },
  { id: 72, key: 'stone_worn_carpets', name: 'Pavimento di pietra ricoperto da tappeti consunti', subcat: 'urban', icon: '🧶', baseColor: '#334155', detailColor: '#831843', pattern: 'tile' },
  { id: 73, key: 'rubble_construction', name: 'Terreno di cantiere con calcinacci', subcat: 'urban', icon: '🚧', baseColor: '#78716c', detailColor: '#d6d3d1', pattern: 'noise' },
  { id: 74, key: 'chipped_ruins', name: 'Pietre sbrecciate di rovina antica', subcat: 'urban', icon: '🏛️', baseColor: '#64748b', detailColor: '#334155', pattern: 'cobble' },
  { id: 75, key: 'desert_carved_stone', name: 'Pietra del deserto intagliata a mano', subcat: 'urban', icon: '🏺', baseColor: '#b45309', detailColor: '#78350f', pattern: 'brick' },

  // --- 76–100: Terreni Alien, Magici e Fantastici ---
  { id: 76, key: 'magic_purple_sparkle', name: 'Terreno magico viola scintillante', subcat: 'fantasy_alien', icon: '🔮', baseColor: '#4c1d95', detailColor: '#c084fc', pattern: 'crystal' },
  { id: 77, key: 'alien_blue_grass', name: 'Erba blu aliena (Pandora style)', subcat: 'fantasy_alien', icon: '🌌', baseColor: '#0c4a6e', detailColor: '#38bdf8', pattern: 'stripes' },
  { id: 78, key: 'flesh_pulsing', name: 'Carne / materia biologica pulsante', subcat: 'fantasy_alien', icon: '🧠', baseColor: '#831843', detailColor: '#db2777', pattern: 'veined' },
  { id: 79, key: 'star_sand_silver', name: 'Sabbia stellare lucente d\'argento', subcat: 'fantasy_alien', icon: '⭐', baseColor: '#94a3b8', detailColor: '#f1f5f9', pattern: 'noise' },
  { id: 80, key: 'obsidian_smooth', name: 'Vetro vulcanico (Ossidiana) spianato', subcat: 'fantasy_alien', icon: '🖤', baseColor: '#050505', detailColor: '#3f3f46', pattern: 'plain' },
  { id: 81, key: 'spectral_fog_ground', name: 'Terreno corrotto da nebbia spettrale', subcat: 'fantasy_alien', icon: '👻', baseColor: '#064e3b', detailColor: '#34d399', pattern: 'noise' },
  { id: 82, key: 'underdark_shadow', name: 'Terra d\'ombra dell\'Underdark', subcat: 'fantasy_alien', icon: '🕷️', baseColor: '#18181b', detailColor: '#3b0764', pattern: 'noise' },
  { id: 83, key: 'tentacle_roots', name: 'Terreno affastellato da tentacoli vegetali', subcat: 'fantasy_alien', icon: '🐙', baseColor: '#14532d', detailColor: '#701a75', pattern: 'veined' },
  { id: 84, key: 'floating_runes_floor', name: 'Pavimento di rune fluttuanti', subcat: 'fantasy_alien', icon: '✨', baseColor: '#1e1b4b', detailColor: '#6366f1', pattern: 'crystal' },
  { id: 85, key: 'solar_gold_stone', name: 'Pietra solare dorata e luminosa', subcat: 'fantasy_alien', icon: '☀️', baseColor: '#eab308', detailColor: '#fef08a', pattern: 'tile' },
  { id: 86, key: 'ethereal_ground', name: 'Terreno etereo semitrasparente', subcat: 'fantasy_alien', icon: '🌫️', baseColor: '#155e75', detailColor: '#67e8f9', pattern: 'plain' },
  { id: 87, key: 'pure_mana_ground', name: 'Terra intrisa di mana puro (azzurro)', subcat: 'fantasy_alien', icon: '💠', baseColor: '#0284c7', detailColor: '#38bdf8', pattern: 'crystal' },
  { id: 88, key: 'obsidian_gold_veined', name: 'Roccia d\'ossidiana venata d\'oro', subcat: 'fantasy_alien', icon: '🔱', baseColor: '#0f172a', detailColor: '#eab308', pattern: 'veined' },
  { id: 89, key: 'alien_honeycomb', name: 'Terreno a nido d\'ape alieno', subcat: 'fantasy_alien', icon: '🐝', baseColor: '#78350f', detailColor: '#f59e0b', pattern: 'hex' },
  { id: 90, key: 'hell_ash_crust', name: 'Crosta di cenere infernale', subcat: 'fantasy_alien', icon: '🔥', baseColor: '#1c1917', detailColor: '#dc2626', pattern: 'cracked' },
  { id: 91, key: 'astral_silver', name: 'Terreno astrale argentato', subcat: 'fantasy_alien', icon: '🪐', baseColor: '#64748b', detailColor: '#e2e8f0', pattern: 'crystal' },
  { id: 92, key: 'mirror_magic_floor', name: 'Pavimento di specchio magico', subcat: 'fantasy_alien', icon: '🪞', baseColor: '#0f172a', detailColor: '#e2e8f0', pattern: 'plain' },
  { id: 93, key: 'dried_coral', name: 'Terreno di corallo prosciugato', subcat: 'fantasy_alien', icon: '🪸', baseColor: '#be123c', detailColor: '#fda4af', pattern: 'circular' },
  { id: 94, key: 'carved_jade', name: 'Piastrelle di giada intagliata', subcat: 'fantasy_alien', icon: '📿', baseColor: '#065f46', detailColor: '#34d399', pattern: 'tile' },
  { id: 95, key: 'chitin_swarm', name: 'Terra infestata da insetti / chitinosa', subcat: 'fantasy_alien', icon: '🪲', baseColor: '#451a03', detailColor: '#a16207', pattern: 'hex' },
  { id: 96, key: 'quicksand', name: 'Terreno di sabbie mobili', subcat: 'fantasy_alien', icon: '🌀', baseColor: '#a16207', detailColor: '#ca8a04', pattern: 'circular' },
  { id: 97, key: 'crushed_bones', name: 'Pavimento di ossa polverizzate', subcat: 'fantasy_alien', icon: '🦴', baseColor: '#e2e8f0', detailColor: '#94a3b8', pattern: 'noise' },
  { id: 98, key: 'arcane_frost', name: 'Terreno congelato dalla magia arcana', subcat: 'fantasy_alien', icon: '🥶', baseColor: '#1e3a8a', detailColor: '#a5b4fc', pattern: 'crystal' },
  { id: 99, key: 'purple_crystal_sand', name: 'Sabbia viola cristallizzata', subcat: 'fantasy_alien', icon: '🔮', baseColor: '#581c87', detailColor: '#e9d5ff', pattern: 'noise' },
  { id: 100, key: 'alien_runic_metal', name: 'Piastre di metallo runico alieno', subcat: 'fantasy_alien', icon: '🛸', baseColor: '#1e293b', detailColor: '#06b6d4', pattern: 'tile' }
];
