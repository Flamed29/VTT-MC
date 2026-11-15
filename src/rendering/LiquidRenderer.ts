import { LIQUID_CATALOG, LiquidDefinition } from '../data/liquidCatalog';
import { TileMap } from '../core/TileMap';

export interface LiquidPalette {
  deep: string;
  shallow: string;
  foam: string;
  caustic: string;
  isGlowing?: boolean;
  glowColor?: string;
  viscosity?: number;
}

export class LiquidRenderer {
  private palettes: Map<number, LiquidPalette> = new Map();

  constructor() {
    for (const l of LIQUID_CATALOG) {
      this.palettes.set(l.id, {
        deep: l.deep,
        shallow: l.shallow,
        foam: l.foam,
        caustic: l.caustic,
        isGlowing: l.isGlowing,
        glowColor: l.glowColor,
        viscosity: l.viscosity || 1.0
      });
    }
  }

  public renderLiquidTile(
    ctx: CanvasRenderingContext2D,
    tileMap: TileMap,
    x: number,
    y: number,
    tileSize: number,
    timeSec: number,
    animateFx: boolean
  ): void {
    const liquidId = tileMap.getLiquid(x, y);
    if (liquidId === 0) return;

    const palette = this.palettes.get(liquidId) || this.palettes.get(1)!;
    const dx = x * tileSize;
    const dy = y * tileSize;

    // 1. Base Liquid Layer
    ctx.fillStyle = palette.deep;
    ctx.fillRect(dx, dy, tileSize, tileSize);

    // 2. Animated Caustics & Flow (adapted by viscosity)
    if (animateFx) {
      const visc = palette.viscosity || 1.0;
      const speed = 2.0 / visc;
      const wavePhase1 = Math.sin(timeSec * speed + x * 0.9 + y * 0.7);
      const wavePhase2 = Math.cos(timeSec * (speed * 0.7) - x * 0.6 + y * 1.1);
      const waveMix = (wavePhase1 + wavePhase2) * 0.5;

      // Surface reflection / caustic
      ctx.fillStyle = palette.caustic;
      const rippleRadius = tileSize * (0.24 + waveMix * 0.08);

      ctx.beginPath();
      ctx.ellipse(
        dx + tileSize * 0.5 + wavePhase2 * (4 / visc),
        dy + tileSize * 0.5 + wavePhase1 * (3 / visc),
        Math.max(2, rippleRadius),
        Math.max(2, rippleRadius * 0.6),
        timeSec * (0.3 / visc),
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Specialized effects per liquid:
      if (liquidId === 7) {
        // Melma Tossica: Rising bubbles
        const bubblePhase = (timeSec * 3 + x * 7 + y * 11) % Math.PI;
        ctx.fillStyle = '#bbf7d0';
        ctx.beginPath();
        ctx.arc(
          dx + tileSize * 0.35 + wavePhase1 * 5,
          dy + tileSize * 0.45 + wavePhase2 * 4,
          Math.sin(bubblePhase) * 4.5 + 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else if (liquidId === 9) {
        // Mana Arcano: Electric energy swirl
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dx + tileSize * 0.5, dy + tileSize * 0.5, tileSize * 0.3 + waveMix * 4, 0, Math.PI * 1.5);
        ctx.stroke();
      } else if (liquidId === 10) {
        // Olio Nero: Rainbow oil slick sheen
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(dx + 4, dy + tileSize * 0.4 + wavePhase1 * 3);
        ctx.lineTo(dx + tileSize - 4, dy + tileSize * 0.6 + wavePhase2 * 3);
        ctx.stroke();
      } else {
        // Surface current streaks
        ctx.strokeStyle = palette.shallow;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const streakY = dy + ((timeSec * (18 / visc) + x * 15 + y * 25) % tileSize);
        ctx.moveTo(dx + 4, streakY);
        ctx.bezierCurveTo(
          dx + tileSize * 0.3, streakY + wavePhase1 * 3,
          dx + tileSize * 0.7, streakY - wavePhase2 * 3,
          dx + tileSize - 4, streakY
        );
        ctx.stroke();
      }
    }

    // 3. Shoreline Foam (Borders against land)
    const isLand = (nx: number, ny: number): boolean => {
      if (!tileMap.isInBounds(nx, ny)) return true;
      return tileMap.getLiquid(nx, ny) === 0;
    };

    const hasNorthLand = isLand(x, y - 1);
    const hasSouthLand = isLand(x, y + 1);
    const hasWestLand  = isLand(x - 1, y);
    const hasEastLand  = isLand(x + 1, y);

    const foamOffset = animateFx ? Math.sin(timeSec * 3.5 + x + y) * 1.5 : 0;
    ctx.fillStyle = palette.foam;

    const foamThick = 4 + foamOffset;

    if (hasNorthLand) ctx.fillRect(dx, dy, tileSize, foamThick);
    if (hasSouthLand) ctx.fillRect(dx, dy + tileSize - foamThick, tileSize, foamThick);
    if (hasWestLand)  ctx.fillRect(dx, dy, foamThick, tileSize);
    if (hasEastLand)  ctx.fillRect(dx + tileSize - foamThick, dy, foamThick, tileSize);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    if (hasNorthLand) ctx.fillRect(dx, dy, tileSize, 2);
    if (hasWestLand)  ctx.fillRect(dx, dy, 2, tileSize);
  }

  public renderWaterTile(
    ctx: CanvasRenderingContext2D,
    tileMap: TileMap,
    x: number,
    y: number,
    tileSize: number,
    timeSec: number,
    animateFx: boolean
  ): void {
    this.renderLiquidTile(ctx, tileMap, x, y, tileSize, timeSec, animateFx);
  }
}
