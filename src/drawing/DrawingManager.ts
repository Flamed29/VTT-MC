/**
 * DrawingManager — Gestione del layer di disegno libero sopra la mappa VTT.
 *
 * Il layer è completamente separato da tile, prop e altri elementi:
 * funge da "foglio trasparente" su cui il Master può annotare durante la sessione.
 *
 * Caratteristiche:
 * - 6 strumenti: freehand, linea, rettangolo, cerchio, triangolo, rettangolo geometrico
 * - Snap opzionale: centro tile, angolo tile, libero
 * - Tratti persistenti o temporanei (scompaiono al mouseup)
 * - Undo/Redo indipendente dal sistema principale
 * - Serializzabile in JSON per salvataggio mappa
 */

import {
  DrawingStroke,
  DrawingPoint,
  DrawingShapeType,
  DrawingSnapMode,
  DrawingLayer
} from '../types';

function uid(): string {
  return `draw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export interface DrawingSettings {
  shape: DrawingShapeType;
  color: string;
  lineWidth: number;    // in px (unscaled)
  opacity: number;
  filled: boolean;
  fillColor: string;
  snapMode: DrawingSnapMode;
  persistent: boolean;
}

export class DrawingManager {
  /** Tutti i tratti salvati (persistenti) */
  public strokes: DrawingStroke[] = [];

  /** Tratto corrente in costruzione (non ancora finalizzato) */
  public activeStroke: DrawingStroke | null = null;

  /** Impostazioni correnti dello strumento */
  public settings: DrawingSettings = {
    shape: 'freehand',
    color: '#ff4444',
    lineWidth: 3,
    opacity: 1.0,
    filled: false,
    fillColor: 'rgba(255,68,68,0.2)',
    snapMode: 'free',
    persistent: true
  };

  private undoStack: DrawingStroke[][] = [];
  private redoStack: DrawingStroke[][] = [];

  // --- Snap ---

  /**
   * Applica lo snap al punto world in base alla modalità corrente.
   * tileSize: pixelsPerGrid della mappa
   */
  public snap(wx: number, wy: number, tileSize: number): DrawingPoint {
    switch (this.settings.snapMode) {
      case 'tile_center': {
        const tx = Math.floor(wx / tileSize);
        const ty = Math.floor(wy / tileSize);
        return { x: (tx + 0.5) * tileSize, y: (ty + 0.5) * tileSize };
      }
      case 'tile_corner': {
        const tx = Math.round(wx / tileSize);
        const ty = Math.round(wy / tileSize);
        return { x: tx * tileSize, y: ty * tileSize };
      }
      default:
        return { x: wx, y: wy };
    }
  }

  // --- Inizio / Continua / Fine tratto ---

  public beginStroke(wx: number, wy: number, tileSize: number): void {
    const pt = this.snap(wx, wy, tileSize);
    this.activeStroke = {
      id: uid(),
      shape: this.settings.shape,
      points: [pt],
      color: this.settings.color,
      lineWidth: this.settings.lineWidth,
      opacity: this.settings.opacity,
      filled: this.settings.filled,
      fillColor: this.settings.fillColor,
      persistent: this.settings.persistent
    };
  }

  public continueStroke(wx: number, wy: number, tileSize: number): void {
    if (!this.activeStroke) return;
    const pt = this.snap(wx, wy, tileSize);

    if (this.activeStroke.shape === 'freehand') {
      // Per il freehand aggiungiamo ogni punto (con de-duplicazione per distanza minima)
      const last = this.activeStroke.points[this.activeStroke.points.length - 1];
      const dx = pt.x - last.x;
      const dy = pt.y - last.y;
      if (dx * dx + dy * dy > 4) {
        this.activeStroke.points.push(pt);
      }
    } else {
      // Per le forme geometriche il secondo punto è il punto finale (anchor + current)
      if (this.activeStroke.points.length === 1) {
        this.activeStroke.points.push(pt);
      } else {
        this.activeStroke.points[1] = pt;
      }
    }
  }

  public endStroke(): DrawingStroke | null {
    if (!this.activeStroke) return null;
    const stroke = this.activeStroke;
    this.activeStroke = null;

    if (stroke.persistent) {
      // Salva undo snapshot
      this.undoStack.push([...this.strokes]);
      this.redoStack = [];
      this.strokes.push(stroke);
    }
    return stroke;
  }

  public cancelStroke(): void {
    this.activeStroke = null;
  }

  // --- Gomma ---

  /**
   * Rimuove i tratti che intersecano un cerchio di raggio r in coordinate world.
   * Ritorna true se qualcosa è stato rimosso.
   */
  public eraseAt(wx: number, wy: number, radius: number): boolean {
    const before = this.strokes.length;
    this.strokes = this.strokes.filter(stroke => {
      return !this.strokeIntersectsCircle(stroke, wx, wy, radius);
    });
    if (this.strokes.length !== before) {
      this.undoStack.push([...this.strokes]);
      this.redoStack = [];
      return true;
    }
    return false;
  }

  private strokeIntersectsCircle(stroke: DrawingStroke, cx: number, cy: number, r: number): boolean {
    for (const pt of stroke.points) {
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      if (dx * dx + dy * dy <= r * r) return true;
    }
    return false;
  }

  // --- Cancella tutto ---
  public clearAll(): void {
    if (this.strokes.length === 0) return;
    this.undoStack.push([...this.strokes]);
    this.redoStack = [];
    this.strokes = [];
  }

  // --- Undo / Redo ---
  public undo(): boolean {
    if (this.undoStack.length === 0) return false;
    this.redoStack.push([...this.strokes]);
    this.strokes = this.undoStack.pop()!;
    return true;
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) return false;
    this.undoStack.push([...this.strokes]);
    this.strokes = this.redoStack.pop()!;
    return true;
  }

  // --- Serializzazione ---
  public toJSON(): DrawingLayer {
    return { strokes: this.strokes.map(s => ({ ...s, points: [...s.points] })) };
  }

  public fromJSON(data: DrawingLayer): void {
    this.strokes = data.strokes || [];
    this.undoStack = [];
    this.redoStack = [];
    this.activeStroke = null;
  }

  // --- Rendering ---

  /**
   * Disegna tutti i tratti salvati + l'eventuale tratto attivo (anteprima).
   * Deve essere chiamato DENTRO il contesto della camera (già trasformato).
   */
  public render(ctx: CanvasRenderingContext2D): void {
    for (const stroke of this.strokes) {
      this.renderStroke(ctx, stroke);
    }
    if (this.activeStroke) {
      this.renderStroke(ctx, this.activeStroke);
    }
  }

  public renderStroke(ctx: CanvasRenderingContext2D, stroke: DrawingStroke): void {
    if (stroke.points.length === 0) return;

    ctx.save();
    ctx.globalAlpha = stroke.opacity;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (stroke.shape) {
      case 'freehand':
        this.renderFreehand(ctx, stroke);
        break;
      case 'line':
        this.renderLine(ctx, stroke);
        break;
      case 'rect':
      case 'rectangle':
        this.renderRect(ctx, stroke);
        break;
      case 'circle':
        this.renderCircle(ctx, stroke);
        break;
      case 'triangle':
        this.renderTriangle(ctx, stroke);
        break;
    }

    ctx.restore();
  }

  private renderFreehand(ctx: CanvasRenderingContext2D, stroke: DrawingStroke): void {
    if (stroke.points.length < 2) {
      // Singolo punto → pallino
      const p = stroke.points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, stroke.lineWidth * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length - 1; i++) {
      // Smooth spline con midpoints
      const mx = (stroke.points[i].x + stroke.points[i + 1].x) * 0.5;
      const my = (stroke.points[i].y + stroke.points[i + 1].y) * 0.5;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, mx, my);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  private renderLine(ctx: CanvasRenderingContext2D, stroke: DrawingStroke): void {
    if (stroke.points.length < 2) return;
    const [a, b] = stroke.points;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  private renderRect(ctx: CanvasRenderingContext2D, stroke: DrawingStroke): void {
    if (stroke.points.length < 2) return;
    const [a, b] = stroke.points;
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);
    if (stroke.filled) {
      ctx.fillStyle = stroke.fillColor;
      ctx.fillRect(x, y, w, h);
    }
    ctx.strokeRect(x, y, w, h);
  }

  private renderCircle(ctx: CanvasRenderingContext2D, stroke: DrawingStroke): void {
    if (stroke.points.length < 2) return;
    const [a, b] = stroke.points;
    const cx = a.x;
    const cy = a.y;
    const r = Math.hypot(b.x - a.x, b.y - a.y);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (stroke.filled) {
      ctx.fillStyle = stroke.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  }

  private renderTriangle(ctx: CanvasRenderingContext2D, stroke: DrawingStroke): void {
    if (stroke.points.length < 2) return;
    const [a, b] = stroke.points;
    // Triangolo: vertice superiore al centro orizzontale dei due punti,
    // base in basso tra i due punti (a = click iniziale, b = mouse corrente)
    const cx = (a.x + b.x) * 0.5;

    ctx.beginPath();
    ctx.moveTo(cx, b.y);     // apice (centro orizzontale, y del punto finale)
    ctx.lineTo(a.x, a.y);   // vertice sinistra (punto iniziale)
    ctx.lineTo(b.x, a.y);   // vertice destra
    ctx.closePath();

    if (stroke.filled) {
      ctx.fillStyle = stroke.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  }
}
