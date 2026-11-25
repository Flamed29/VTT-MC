/**
 * TouchHandler — Supporto touch ibrido per tablet Android
 * Branch: android-port
 *
 * Aggiunge pinch zoom e pan touch IN PARALLELO agli event listener mouse esistenti.
 * Non modifica nessun file del codice originale.
 */

export class TouchHandler {
  private canvas: HTMLCanvasElement;
  private lastTouchDist: number | null = null;
  private lastTouchCenter: { x: number; y: number } | null = null;
  private onZoom: (delta: number, cx: number, cy: number) => void;
  private onPan: (dx: number, dy: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    onZoom: (delta: number, cx: number, cy: number) => void,
    onPan: (dx: number, dy: number) => void
  ) {
    this.canvas = canvas;
    this.onZoom = onZoom;
    this.onPan = onPan;
    this.attach();
  }

  private attach(): void {
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
  }

  private getDistance(t1: Touch, t2: Touch): number {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getCenter(t1: Touch, t2: Touch): { x: number; y: number } {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 2) {
      e.preventDefault();
      this.lastTouchDist = this.getDistance(e.touches[0], e.touches[1]);
      this.lastTouchCenter = this.getCenter(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      this.lastTouchCenter = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (e.touches.length === 2) {
      // Pinch zoom — due dita
      e.preventDefault();
      const dist = this.getDistance(e.touches[0], e.touches[1]);
      const center = this.getCenter(e.touches[0], e.touches[1]);

      if (this.lastTouchDist !== null) {
        const delta = dist - this.lastTouchDist;
        // Converti delta pinch in delta zoom equivalente alla rotella
        this.onZoom(delta * 0.5, center.x, center.y);
      }

      this.lastTouchDist = dist;
      this.lastTouchCenter = center;

    } else if (e.touches.length === 1 && this.lastTouchCenter) {
      // Pan — un dito
      e.preventDefault();
      const dx = e.touches[0].clientX - this.lastTouchCenter.x;
      const dy = e.touches[0].clientY - this.lastTouchCenter.y;
      this.onPan(dx, dy);
      this.lastTouchCenter = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    if (e.touches.length < 2) {
      this.lastTouchDist = null;
    }
    if (e.touches.length === 0) {
      this.lastTouchCenter = null;
    }
  }

  public detach(): void {
    this.canvas.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }
}
