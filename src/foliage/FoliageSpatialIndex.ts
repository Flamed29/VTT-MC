/**
 * MODULO 2: INDICE SPAZIALE (RBush)
 * Ottimizzazione delle query spaziali O(log N) e cancellazione istantanea per decine di migliaia di ciuffi d'erba
 */

import RBush from 'rbush';
import { FoliageInstance } from './FoliageModel';

export interface RBushFoliageEntry {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  instance: FoliageInstance;
}

export class FoliageSpatialIndex {
  private tree: RBush<RBushFoliageEntry>;
  private entryMap: Map<string, RBushFoliageEntry> = new Map();

  constructor(maxEntries = 16) {
    this.tree = new RBush<RBushFoliageEntry>(maxEntries);
  }

  /**
   * Crea un bounding box puntuale per un'istanza di foliage
   */
  private makeEntry(instance: FoliageInstance): RBushFoliageEntry {
    const pad = 0.5 * instance.scale; // leggera tolleranza di collisione
    return {
      minX: instance.x - pad,
      minY: instance.y - pad,
      maxX: instance.x + pad,
      maxY: instance.y + pad,
      instance
    };
  }

  /**
   * Inserimento O(log N) di un singolo ciuffo
   */
  public insert(instance: FoliageInstance): void {
    const entry = this.makeEntry(instance);
    this.tree.insert(entry);
    this.entryMap.set(instance.id, entry);
  }

  /**
   * Caricamento in blocco O(N log N) — ideale all'avvio o dopo Undo/Redo
   */
  public load(instances: FoliageInstance[]): void {
    this.clear();
    const entries: RBushFoliageEntry[] = [];
    for (const inst of instances) {
      const entry = this.makeEntry(inst);
      entries.push(entry);
      this.entryMap.set(inst.id, entry);
    }
    this.tree.load(entries);
  }

  /**
   * Cerca tutti i ciuffi entro un raggio euclideo da (cx, cy)
   */
  public searchRadius(cx: number, cy: number, radius: number): FoliageInstance[] {
    const bbox = {
      minX: cx - radius,
      minY: cy - radius,
      maxX: cx + radius,
      maxY: cy + radius
    };

    const candidates = this.tree.search(bbox);
    const result: FoliageInstance[] = [];
    const rSq = radius * radius;

    for (const entry of candidates) {
      const dx = entry.instance.x - cx;
      const dy = entry.instance.y - cy;
      if (dx * dx + dy * dy <= rSq) {
        result.push(entry.instance);
      }
    }

    return result;
  }

  /**
   * Verifica se esiste un ciuffo ad una distanza inferiore a minDistance da (cx, cy)
   * Utilizzato dal campionamento Poisson-Disk per evitare sovrapposizioni innaturali
   */
  public hasNeighborWithin(cx: number, cy: number, minDistance: number): boolean {
    const bbox = {
      minX: cx - minDistance,
      minY: cy - minDistance,
      maxX: cx + minDistance,
      maxY: cy + minDistance
    };

    const candidates = this.tree.search(bbox);
    const minDistSq = minDistance * minDistance;

    for (const entry of candidates) {
      const dx = entry.instance.x - cx;
      const dy = entry.instance.y - cy;
      if (dx * dx + dy * dy < minDistSq) {
        return true;
      }
    }

    return false;
  }

  /**
   * Rimuove istantaneamente tutti i ciuffi entro il raggio indicato (Gomma veloce)
   * Restituisce l'array delle istanze rimosse per aggiornare lo stato / undo
   */
  public removeInRadius(cx: number, cy: number, radius: number): FoliageInstance[] {
    const bbox = {
      minX: cx - radius,
      minY: cy - radius,
      maxX: cx + radius,
      maxY: cy + radius
    };

    const candidates = this.tree.search(bbox);
    const removed: FoliageInstance[] = [];
    const rSq = radius * radius;

    for (const entry of candidates) {
      const dx = entry.instance.x - cx;
      const dy = entry.instance.y - cy;
      if (dx * dx + dy * dy <= rSq) {
        this.tree.remove(entry);
        this.entryMap.delete(entry.instance.id);
        removed.push(entry.instance);
      }
    }

    return removed;
  }

  /**
   * Svuota completamente l'albero
   */
  public clear(): void {
    this.tree.clear();
    this.entryMap.clear();
  }

  /**
   * Numero totale di elementi indicizzati
   */
  public size(): number {
    return this.entryMap.size;
  }

  /**
   * Restituisce tutte le istanze indicizzate
   */
  public all(): FoliageInstance[] {
    return Array.from(this.entryMap.values()).map(e => e.instance);
  }
}
