/**
 * MapStorage: Gestione dello Storico e Contenitore Mappe VTT
 * Salva, carica, elenca, esporta, importa e genera miniature per le mappe salvate.
 */

import { TileMap } from './TileMap';
import { SavedMapEntry, TileMapJSON, TileType, LiquidType } from '../types';
import { TextureAtlas } from '../rendering/TextureAtlas';

const STORAGE_KEY = 'vtt_map_library_v1';

export class MapStorage {
  /**
   * Recupera tutte le mappe salvate nello storico ordinandole dalla più recente
   */
  public static getAllMaps(): SavedMapEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw) as SavedMapEntry[];
      return Array.isArray(list) ? list.sort((a, b) => b.updatedAt - a.updatedAt) : [];
    } catch (err) {
      console.error('Errore nel recupero dello storico mappe:', err);
      return [];
    }
  }

  /**
   * Recupera una mappa singola per ID
   */
  public static getMapById(id: string): SavedMapEntry | null {
    const list = this.getAllMaps();
    return list.find(m => m.id === id) || null;
  }

  /**
   * Salva una nuova mappa o sovrascrive una mappa esistente nello storico
   */
  public static saveMap(entry: SavedMapEntry): void {
    const list = this.getAllMaps();
    const existingIdx = list.findIndex(m => m.id === entry.id);

    if (existingIdx >= 0) {
      list[existingIdx] = entry;
    } else {
      list.unshift(entry);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('LocalStorage pieno o errore di scrittura, provo a rimuovere miniature pesanti:', err);
      // Fallback: se lo storage è pieno, riduciamo le thumbnail
      for (const m of list) {
        if (m.id !== entry.id) {
          m.thumbnailUrl = undefined;
        }
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('Impossibile salvare mappa nello storico:', e);
      }
    }
  }

  /**
   * Elimina una mappa dallo storico
   */
  public static deleteMap(id: string): boolean {
    const list = this.getAllMaps().filter(m => m.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (err) {
      console.error('Errore durante l\'eliminazione della mappa:', err);
      return false;
    }
  }

  /**
   * Duplica una mappa esistente
   */
  public static duplicateMap(id: string): SavedMapEntry | null {
    const original = this.getMapById(id);
    if (!original) return null;

    const copy: SavedMapEntry = {
      ...original,
      id: `map_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${original.name} (Copia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: JSON.parse(JSON.stringify(original.data))
    };

    this.saveMap(copy);
    return copy;
  }

  /**
   * Genera una miniatura (thumbnail) leggera e veloce (220×140 px circa)
   */
  public static generateThumbnail(tileMap: TileMap, atlas: TextureAtlas): string {
    try {
      const maxDim = 240;
      const aspect = tileMap.width / tileMap.height;
      let tw = maxDim;
      let th = Math.round(maxDim / aspect);
      if (th > 180) {
        th = 180;
        tw = Math.round(180 * aspect);
      }

      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d')!;

      const cellW = tw / tileMap.width;
      const cellH = th / tileMap.height;

      // Disegna terreno veloce
      for (let y = 0; y < tileMap.height; y++) {
        for (let x = 0; x < tileMap.width; x++) {
          const t = tileMap.getTerrain(x, y);
          const region = atlas.getTerrainRegion(t);
          if (region) {
            ctx.drawImage(
              atlas.canvas,
              region.x, region.y, region.width, region.height,
              x * cellW, y * cellH, cellW, cellH
            );
          } else {
            ctx.fillStyle = '#222';
            ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
          }

          // Liquidi
          const l = tileMap.getLiquid(x, y);
          if (l !== LiquidType.NONE) {
            ctx.fillStyle = l === LiquidType.LAVA ? '#ea580c' : '#0284c7';
            ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
          }

          // Muri
          if (tileMap.getWall(x, y) > 0) {
            ctx.fillStyle = '#475569';
            ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
          }

          // Nebbia di Guerra
          if (tileMap.getFog(x, y)) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
          }
        }
      }

      return canvas.toDataURL('image/jpeg', 0.65);
    } catch (err) {
      console.warn('Errore generazione miniatura:', err);
      return '';
    }
  }

  /**
   * Esporta una mappa in formato file .json scaricabile
   */
  public static triggerDownloadJSON(filename: string, json: TileMapJSON): void {
    const str = JSON.stringify(json, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
