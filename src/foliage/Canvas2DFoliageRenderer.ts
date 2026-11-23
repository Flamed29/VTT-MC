/**
 * Canvas 2D Foliage Renderer — Single-Blade Grass Physics
 *
 * Each FoliageInstance IS exactly one grass blade/stem.
 * The brush (Poisson-Disk) plants many blades close together → together they form the grass.
 *
 * Each blade:
 *  - Base is anchored exactly at the planted (x, y) world position — never moves.
 *  - Tip bends in the wind direction using an Euler-Bernoulli cantilever model.
 *  - Has a slight random resting lean (rotation field on the instance).
 *  - Drawn as a tapered quadratic bezier: wide at root, pointed at tip.
 *  - Colour gradient from dark root → bright tip (8 colour palettes for variants).
 *
 * Wind coherence: blades at different map positions have a spatial phase offset
 * so the wind wave visibly rolls through the grass field.
 */

import { FoliageInstance } from './FoliageModel';

// ─── Colour tables per variantId ──────────────────────────────────────────────

interface BladeColours {
  baseR: number; baseG: number; baseB: number;
  tipR:  number; tipG:  number; tipB:  number;
}

const VARIANT_COLOURS: BladeColours[] = [
  // 0 — Lush Green
  { baseR: 10,  baseG: 45,  baseB: 15,  tipR: 100, tipG: 220, tipB: 70  },
  // 1 — Dry Golden
  { baseR: 70,  baseG: 30,  baseB: 5,   tipR: 250, tipG: 215, tipB: 90  },
  // 2 — Flower Meadow (brighter green)
  { baseR: 15,  baseG: 65,  baseB: 20,  tipR: 140, tipG: 240, tipB: 100 },
  // 3 — Ferns (deep forest green)
  { baseR: 8,   baseG: 48,  baseB: 18,  tipR: 50,  tipG: 170, tipB: 60  },
  // 4 — Clover (vivid)
  { baseR: 12,  baseG: 85,  baseB: 25,  tipR: 90,  tipG: 240, tipB: 90  },
  // 5 — Reeds / Rushes (olive)
  { baseR: 55,  baseG: 90,  baseB: 10,  tipR: 145, tipG: 185, tipB: 45  },
  // 6 — Arcane Bioluminescent
  { baseR: 10,  baseG: 45,  baseB: 110, tipR: 90,  tipG: 220, tipB: 255 },
  // 7 — Autumn (warm tones)
  { baseR: 110, baseG: 28,  baseB: 5,   tipR: 240, tipG: 175, tipB: 20  },
];

function lerpColour(c: BladeColours, t: number, shift: number): string {
  const r = Math.round(c.baseR + (c.tipR - c.baseR) * t);
  const g = Math.round(Math.min(255, Math.max(0, c.baseG + (c.tipG - c.baseG) * t + shift)));
  const b = Math.round(c.baseB + (c.tipB - c.baseB) * t);
  return `rgb(${r},${g},${b})`;
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export class Canvas2DFoliageRenderer {
  /**
   * Draw all foliage instances — one blade per instance — onto the camera-transformed ctx.
   *
   * @param ctx          Already camera-transformed 2D context (translate + scale applied)
   * @param instances    All FoliageInstance objects to render
   * @param pxPerGrid    Pixels per grid tile
   * @param timeSec      Animation clock in seconds
   * @param windDir      [dx, dy] wind direction (will be normalised internally)
   * @param windStrength 0 = calm, 1 = normal breeze, 2 = strong wind
   * @param cameraX      Camera X offset for frustum culling
   * @param cameraY      Camera Y offset for frustum culling
   * @param zoom         Camera zoom for frustum culling
   * @param viewW        Viewport CSS width
   * @param viewH        Viewport CSS height
   */
  public render(
    ctx: CanvasRenderingContext2D,
    instances: FoliageInstance[],
    pxPerGrid: number,
    timeSec: number,
    windDir: [number, number],
    windStrength: number,
    cameraX: number,
    cameraY: number,
    zoom: number,
    viewW: number,
    viewH: number
  ): void {
    if (instances.length === 0) return;

    // Normalise wind direction vector
    const wLen = Math.sqrt(windDir[0] ** 2 + windDir[1] ** 2);
    const windDx = wLen > 0.001 ? windDir[0] / wLen : 1;
    const windDy = wLen > 0.001 ? windDir[1] / wLen : 0;

    // Frustum culling bounds in world-pixel space
    const cullMargin = pxPerGrid * 2;
    const camLeft   = -cameraX / zoom - cullMargin;
    const camTop    = -cameraY / zoom - cullMargin;
    const camRight  = (viewW  - cameraX) / zoom + cullMargin;
    const camBottom = (viewH  - cameraY) / zoom + cullMargin;

    ctx.save();
    ctx.lineCap = 'round';

    for (const inst of instances) {
      const worldX = inst.x * pxPerGrid;
      const worldY = inst.y * pxPerGrid;

      // Skip blades outside the visible viewport
      if (worldX < camLeft || worldX > camRight || worldY < camTop || worldY > camBottom) continue;

      this.renderBlade(ctx, inst, worldX, worldY, pxPerGrid, timeSec, windDx, windDy, windStrength);
    }

    ctx.restore();
  }

  // ─── Single blade renderer ──────────────────────────────────────────────────

  private renderBlade(
    ctx: CanvasRenderingContext2D,
    inst: FoliageInstance,
    bx: number,         // base world-pixel X (anchored)
    by: number,         // base world-pixel Y (anchored)
    pxPerGrid: number,
    timeSec: number,
    windDx: number,
    windDy: number,
    windStrength: number
  ): void {
    // ── Blade geometry (derived from instance fields) ─────────────────────
    // Length: scale controls how tall the blade is.
    // 0.35 tiles at scale=1 → roughly 35px at pxPerGrid=100.
    const bladeLen  = inst.scale * 0.35 * pxPerGrid;

    // Base width is 15% of length, tapers to 0 at tip
    const baseWidth = bladeLen * 0.15;

    // Resting lean angle (instance.rotation is a random angle in [0, 2π])
    // We remap it so the blade leans in a random direction from vertical
    const restAngle = inst.rotation; // radians, any direction

    // Colour variation: use a small green shift derived from the phase
    const greenShift = Math.round((inst.phase % 1.0) * 40) - 20;
    const colours = VARIANT_COLOURS[Math.max(0, Math.min(7, inst.variantId))];

    // ── Wind physics: Euler-Bernoulli cantilever ───────────────────────────
    // Spatial phase: blades at different positions are out of phase →
    // the wind wave rolls across the field visually.
    const spatialPhase = inst.x * 0.38 + inst.y * 0.19;
    const totalPhase   = inst.phase + spatialPhase;

    // Wind intensity: remapped to [0, 1] so the blade ONLY bends toward the wind,
    // never backward. Primary slow swell + fast gust ripple modulate the intensity.
    // sin() → [-1,+1], * 0.5 + 0.5 → [0, 1]
    const primarySwell = Math.sin(timeSec * 2.6 + totalPhase) * 0.5 + 0.5;   // 0..1
    const gustRipple   = Math.sin(timeSec * 6.1 + totalPhase * 1.73) * 0.18; // ±0.18
    const windIntensity = Math.max(0, Math.min(1, primarySwell + gustRipple)) * windStrength;

    // Tip displacement: always in the wind direction, intensity varies with the wave
    const maxBend = bladeLen * 0.65;
    const bendX   = windDx * windIntensity * maxBend;
    const bendY   = windDy * windIntensity * maxBend;

    // Resting tip position (without wind)
    const restTipX = Math.cos(restAngle) * bladeLen;
    const restTipY = Math.sin(restAngle) * bladeLen;

    // Final tip position (rest + wind displacement)
    const tipX = restTipX + bendX;
    const tipY = restTipY + bendY;

    // Bezier control point: Euler-Bernoulli curve stays close to base at mid-height,
    // only the top third curves significantly — just like a real flexible stem.
    // cp = 60% along the resting direction + 8% of the bend (barely moves mid-stem)
    const cpX = restTipX * 0.60 + bendX * 0.08;
    const cpY = restTipY * 0.60 + bendY * 0.08;

    // ── Draw the blade as a filled tapered bezier shape ───────────────────
    // We build the shape from two bezier edges meeting at the pointed tip.
    // Perpendicular to the resting direction gives the width at the base.
    const perpAngle = restAngle + Math.PI * 0.5;
    const halfW     = baseWidth * 0.5;
    const perpX     = Math.cos(perpAngle) * halfW;
    const perpY     = Math.sin(perpAngle) * halfW;

    // Gradient: dark root → bright tip
    const grad = ctx.createLinearGradient(bx, by, bx + tipX, by + tipY);
    grad.addColorStop(0.0, lerpColour(colours, 0.0, greenShift));
    grad.addColorStop(0.5, lerpColour(colours, 0.5, greenShift));
    grad.addColorStop(1.0, lerpColour(colours, 1.0, greenShift));

    // Blade shape: left-edge bezier → tip → right-edge bezier → back to base
    ctx.beginPath();
    ctx.moveTo(bx - perpX, by - perpY);                               // base left
    ctx.quadraticCurveTo(bx + cpX, by + cpY, bx + tipX, by + tipY); // left edge → tip
    ctx.quadraticCurveTo(bx + cpX, by + cpY, bx + perpX, by + perpY); // tip → right edge
    ctx.closePath();

    ctx.globalAlpha = 0.82;
    ctx.fillStyle   = grad;
    ctx.fill();

    // Centre-line highlight for the "rib" of the blade
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + cpX, by + cpY, bx + tipX, by + tipY);
    ctx.strokeStyle = lerpColour(colours, 0.90, greenShift + 25);
    ctx.lineWidth   = Math.max(0.4, baseWidth * 0.18);
    ctx.globalAlpha = 0.35;
    ctx.stroke();

    ctx.globalAlpha = 1.0;
  }
}
