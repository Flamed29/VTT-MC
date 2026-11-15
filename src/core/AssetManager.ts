import {
  AssetCategory,
  AssetDefinition,
  DoorType
} from '../types';
import { TERRAIN_CATALOG } from '../data/terrainCatalog';
import { WALL_CATALOG } from '../data/wallCatalog';
import { PROP_CATALOG } from '../data/propCatalog';
import { LIQUID_CATALOG } from '../data/liquidCatalog';

export class AssetManager {
  private assets: Map<string, AssetDefinition> = new Map();
  private readonly storageKey = 'vtt_custom_assets_v1';

  constructor() {
    this.registerBuiltinAssets();
    this.loadCustomAssetsFromStorage();
  }

  private registerBuiltinAssets(): void {
    // 1. TERRENI (100 Terreni Diversi)
    for (const t of TERRAIN_CATALOG) {
      this.assets.set(`terrain_${t.id}`, {
        id: `terrain_${t.id}`,
        name: t.name,
        category: 'terrain',
        icon: t.icon,
        builtinType: t.id
      });
    }

    // 2. LIQUIDI (10 Liquidi: 5 Classici + 5 Nuovi Richiesti)
    for (const l of LIQUID_CATALOG) {
      this.assets.set(`liquid_${l.id}`, {
        id: `liquid_${l.id}`,
        name: l.name,
        category: 'liquid',
        icon: l.icon,
        builtinType: l.id,
        liquidConfig: {
          colorDeep: l.deep,
          colorShallow: l.shallow,
          foamColor: l.foam,
          causticColor: l.caustic,
          isGlowing: l.isGlowing,
          glowColor: l.glowColor
        }
      });
    }

    // 3. MURI (10 Muri Diversi)
    for (const w of WALL_CATALOG) {
      this.assets.set(w.id, {
        id: w.id,
        name: w.name,
        category: 'wall',
        icon: w.icon
      });
    }

    // 4. OGGETTI / PROPS (100 Oggetti 2D Zenitali Planari)
    for (const p of PROP_CATALOG) {
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(p.svg)}`;
      const img = new Image();
      img.src = dataUrl;

      this.assets.set(p.id, {
        id: p.id,
        name: p.name,
        category: 'prop',
        icon: p.icon,
        imageUrl: dataUrl,
        imageElement: img
      });
    }

    // 5. PORTE & VARCHI
    const doors: { id: string; name: string; type: DoorType; icon: string }[] = [
      { id: 'd_single', name: 'Porta Singola', type: DoorType.STANDARD_DOOR, icon: '🚪' },
      { id: 'd_double', name: 'Porta Doppia', type: DoorType.DOUBLE_DOOR, icon: '🏛️' },
      { id: 'd_secret', name: 'Passaggio Segreto', type: DoorType.SECRET_DOOR, icon: '🕵️' },
      { id: 'd_grate', name: 'Grata di Ferro', type: DoorType.BARRED_GATE, icon: '⛓️' },
      { id: 'd_window', name: 'Finestra / Feritoia', type: DoorType.WINDOW, icon: '🪟' }
    ];

    doors.forEach(d => {
      this.assets.set(d.id, {
        id: d.id,
        name: d.name,
        category: 'door',
        icon: d.icon,
        builtinType: d.type
      });
    });
  }

  // --- Filtering & Retrieval with Subcategory and Search Query ---
  public getAssetsByCategory(
    category: AssetCategory | 'all',
    subcat = 'all',
    searchQuery = ''
  ): AssetDefinition[] {
    let list = Array.from(this.assets.values());

    if (category !== 'all') {
      list = list.filter(a => a.category === category);
    }

    // Subcategory filtering
    if (subcat !== 'all') {
      if (category === 'terrain') {
        const matchingIds = new Set(
          TERRAIN_CATALOG.filter(t => t.subcat === subcat).map(t => `terrain_${t.id}`)
        );
        list = list.filter(a => matchingIds.has(a.id) || a.isCustom);
      } else if (category === 'prop') {
        const matchingIds = new Set(
          PROP_CATALOG.filter(p => p.subcat === subcat).map(p => p.id)
        );
        list = list.filter(a => matchingIds.has(a.id) || a.isCustom);
      }
    }

    // Search query filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a => a.name.toLowerCase().includes(q));
    }

    return list;
  }

  public getAssetById(id: string): AssetDefinition | undefined {
    return this.assets.get(id);
  }

  // --- Custom Asset Import & Persistence ---
  public async addCustomAsset(asset: AssetDefinition): Promise<void> {
    if (!asset.imageElement && asset.imageUrl) {
      const img = new Image();
      img.src = asset.imageUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => { asset.imageElement = img; resolve(); };
        img.onerror = () => reject(new Error("Errore nel caricamento dell'immagine"));
      });
    }

    asset.isCustom = true;
    this.assets.set(asset.id, asset);
    this.persistCustomAssets();
  }

  public removeCustomAsset(id: string): void {
    if (this.assets.has(id)) {
      this.assets.delete(id);
      this.persistCustomAssets();
    }
  }

  private persistCustomAssets(): void {
    const customList = Array.from(this.assets.values()).filter(a => a.isCustom);
    const serialized = customList.map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      icon: a.icon || '🖼️',
      imageUrl: a.imageUrl,
      liquidConfig: a.liquidConfig
    }));
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(serialized));
    } catch (e) {
      console.warn("Impossibile salvare gli asset personalizzati in localStorage:", e);
    }
  }

  private loadCustomAssetsFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed: any[] = JSON.parse(raw);
      parsed.forEach(item => {
        const def: AssetDefinition = {
          id: item.id,
          name: item.name,
          category: item.category,
          icon: item.icon || '🖼️',
          imageUrl: item.imageUrl,
          isCustom: true,
          liquidConfig: item.liquidConfig
        };
        if (def.imageUrl) {
          const img = new Image();
          img.src = def.imageUrl;
          img.onload = () => { def.imageElement = img; };
        }
        this.assets.set(def.id, def);
      });
    } catch (e) {
      console.warn("Errore caricamento asset personalizzati salvati:", e);
    }
  }
}
