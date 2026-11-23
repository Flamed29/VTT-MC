/**
 * MODULO 1: MODELLO DATI (JSON)
 * Schema di salvataggio e tipi per il layer Foliage & Grass
 */

export interface FoliageInstance {
  id: string;
  x: number;          // Coordinata X in caselle griglia (float, es. 12.35)
  y: number;          // Coordinata Y in caselle griglia (float, es. 8.71)
  scale: number;      // Scala dimensionale casuale (es. 0.6 - 1.5)
  rotation: number;   // Angolo di rotazione in radianti (0 - 2*PI)
  variantId: number;  // ID variante texture (0..7 nel texture atlas)
  phase: number;      // Offset di fase per l'animazione del vento (0 - 2*PI)
  type?: string;      // Chiave testuale variante per compatibilità UI
}

export interface FoliageLayerJSON {
  version: number;
  instances: FoliageInstance[];
  windDirection: [number, number]; // Vettore 2D normalizzato [dx, dy]
  windStrength: number;            // Forza del vento (0.0 = calma, 1.0 = normale, 2.0 = burrasca)
}

export interface FoliageVariantDef {
  id: number;
  key: string;
  name: string;
  icon: string;
  description: string;
  defaultScale: number;
}

export const FOLIAGE_VARIANTS: FoliageVariantDef[] = [
  { id: 0, key: 'grass_tuft_lush', name: 'Erba Rigogliosa', icon: '🌿', description: 'Fasci di fili verdi vivaci con sfumature e radice scura', defaultScale: 1.0 },
  { id: 1, key: 'grass_tuft_dry', name: 'Erba Secca Alta', icon: '🌾', description: 'Fili dorati selvatici per steppe, savane e terreni aridi', defaultScale: 1.1 },
  { id: 2, key: 'grass_flowers', name: 'Prato Fiorito', icon: '🌸', description: 'Fasci d\'erba con margherite, papaveri e fiordalisi', defaultScale: 1.0 },
  { id: 3, key: 'ferns', name: 'Felci di Bosco', icon: '🌿', description: 'Fronde a raggiera con pinnule dettagliate da sottobosco', defaultScale: 1.15 },
  { id: 4, key: 'clover_patch', name: 'Trifogli', icon: '☘️', description: 'Chiazze fitte di trifoglio trilobato', defaultScale: 0.9 },
  { id: 5, key: 'reeds', name: 'Canneto & Giunchi', icon: '🌾', description: 'Canne palustri con pannocchie per rive d\'acqua e paludi', defaultScale: 1.2 },
  { id: 6, key: 'biolum_sprouts', name: 'Germogli Arcani', icon: '🔮', description: 'Viticci fluorescenti con bulbi luminosi per l\'Underdark', defaultScale: 1.1 },
  { id: 7, key: 'autumn_leaves', name: 'Foglie Autunnali', icon: '🍂', description: 'Dispersione di foglie cadute in toni rosso, oro e ambra', defaultScale: 0.85 }
];

export class FoliageModel {
  /**
   * Crea un layer foliage vuoto di default
   */
  public static createDefault(): FoliageLayerJSON {
    return {
      version: 1,
      instances: [],
      windDirection: [1.0, 0.3], // Vento che spira da sinistra verso destra-basso
      windStrength: 0.75
    };
  }

  /**
   * Serializza il layer in stringa JSON compatibile VTT
   */
  public static toJSON(layer: FoliageLayerJSON): string {
    return JSON.stringify(layer, null, 2);
  }

  /**
   * Deserializza e valida una stringa o oggetto JSON
   */
  public static fromJSON(raw: unknown): FoliageLayerJSON {
    if (!raw) return this.createDefault();

    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsed !== 'object' || parsed === null) return this.createDefault();

      const instances: FoliageInstance[] = Array.isArray(parsed.instances)
        ? parsed.instances.map((item: any, idx: number) => ({
            id: typeof item.id === 'string' ? item.id : `fol_${idx}_${Date.now()}`,
            x: Number(item.x) || 0,
            y: Number(item.y) || 0,
            scale: Number(item.scale) || 1.0,
            rotation: Number(item.rotation) || 0,
            variantId: Math.max(0, Math.min(7, Math.floor(Number(item.variantId) || 0))),
            phase: Number(item.phase) || Math.random() * Math.PI * 2
          }))
        : [];

      const windDirection: [number, number] = Array.isArray(parsed.windDirection) && parsed.windDirection.length === 2
        ? [Number(parsed.windDirection[0]) || 1.0, Number(parsed.windDirection[1]) || 0.0]
        : [1.0, 0.3];

      const windStrength = typeof parsed.windStrength === 'number' ? parsed.windStrength : 0.75;

      return {
        version: parsed.version || 1,
        instances,
        windDirection,
        windStrength
      };
    } catch (err) {
      console.warn('Errore parsing FoliageLayerJSON:', err);
      return this.createDefault();
    }
  }
}
