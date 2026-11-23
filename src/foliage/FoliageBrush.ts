/**
 * MODULO 2: STRUMENTO PENNELLO & CANCELLAZIONE (Brush & Eraser)
 * Pennello con campionamento Poisson-Disk (distribuzione a rumore blu) e gomma spaziale ad alte prestazioni
 */

import { FoliageInstance } from './FoliageModel';
import { FoliageSpatialIndex } from './FoliageSpatialIndex';

export interface FoliageBrushConfig {
  radius: number;        // Raggio del pennello in caselle (es. 0.5 - 6.0)
  density: number;       // Numero di tentativi di campionamento per stroke (es. 5 - 35)
  minDistance: number;   // Distanza minima di esclusione Poisson-Disk (es. 0.2 - 0.8 caselle)
  scaleMin: number;      // Scala minima (es. 0.7)
  scaleMax: number;      // Scala massima (es. 1.3)
  variantId: number;     // ID variante texture (0 - 7)
}

export class FoliageBrush {
  public config: FoliageBrushConfig = {
    radius: 1.5,
    density: 28,          // more instances = denser grass field
    minDistance: 0.12,    // blades can be very close together
    scaleMin: 0.75,
    scaleMax: 1.30,
    variantId: 0
  };

  private spatialIndex: FoliageSpatialIndex;

  constructor(spatialIndex: FoliageSpatialIndex) {
    this.spatialIndex = spatialIndex;
  }

  /**
   * Genera nuovi ciuffi d'erba sotto il pennello usando campionamento Poisson-Disk.
   * I candidati che violano la distanza minima dai ciuffi esistenti vengono scartati.
   */
  public paint(
    centerGridX: number,
    centerGridY: number,
    boundsCheck: (x: number, y: number) => boolean,
    isInitialClick = false
  ): FoliageInstance[] {
    const r = this.config.radius;
    const candidatesCount = Math.max(1, Math.round(this.config.density * (isInitialClick ? 1.0 : 0.45)));
    const addedInstances: FoliageInstance[] = [];

    for (let i = 0; i < candidatesCount; i++) {
      // Distribuzione di probabilità ad area uniforme nel cerchio
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * r;
      const px = centerGridX + Math.cos(angle) * dist;
      const py = centerGridY + Math.sin(angle) * dist;

      // 1. Controllo confini mappa
      if (!boundsCheck(Math.floor(px), Math.floor(py))) {
        continue;
      }

      // 2. Controllo Poisson-Disk: se c'è già un ciuffo più vicino di minDistance, scarta
      if (this.spatialIndex.hasNeighborWithin(px, py, this.config.minDistance)) {
        continue;
      }

      // 3. Generazione istanza con scala e rotazione randomiche
      const scaleRange = this.config.scaleMax - this.config.scaleMin;
      const scale = this.config.scaleMin + Math.random() * scaleRange;
      const rotation = Math.random() * Math.PI * 2;
      const phase = Math.random() * Math.PI * 2;

      const instance: FoliageInstance = {
        id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        x: px,
        y: py,
        scale,
        rotation,
        variantId: this.config.variantId,
        phase
      };

      // Inserisce nell'indice spaziale per i controlli successivi dello stesso stroke
      this.spatialIndex.insert(instance);
      addedInstances.push(instance);
    }

    return addedInstances;
  }

  /**
   * Cancellazione rapida: rimuove tutti i ciuffi entro il raggio della gomma
   */
  public erase(centerGridX: number, centerGridY: number, radius: number): FoliageInstance[] {
    return this.spatialIndex.removeInRadius(centerGridX, centerGridY, radius);
  }
}
