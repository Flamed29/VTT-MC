import { FoliageInstance, FoliageType } from '../types';

export class FoliageRenderer {
  /**
   * Renders a single foliage tuft at (0, 0) in local transformed canvas space.
   */
  public renderTuft(
    ctx: CanvasRenderingContext2D,
    type: FoliageType,
    timeSec: number,
    windPhase: number,
    scale: number,
    animate = true
  ): void {
    const wind = animate ? Math.sin(timeSec * 2.8 + windPhase) * 0.12 : 0;

    switch (type) {
      case 'grass_tuft_lush':
        this.renderLushGrassTuft(ctx, wind, scale);
        break;
      case 'grass_tuft_dry':
        this.renderDryGrassTuft(ctx, wind, scale);
        break;
      case 'grass_flowers':
        this.renderFlowerGrassTuft(ctx, wind, scale, windPhase);
        break;
      case 'ferns':
        this.renderFernTuft(ctx, wind, scale);
        break;
      case 'clover_patch':
        this.renderCloverPatch(ctx, wind, scale);
        break;
      case 'reeds':
        this.renderReedsTuft(ctx, wind, scale);
        break;
      case 'biolum_sprouts':
        this.renderBiolumSprouts(ctx, wind, scale, timeSec);
        break;
      case 'autumn_leaves':
        this.renderAutumnLeaves(ctx, scale, windPhase);
        break;
      default:
        this.renderLushGrassTuft(ctx, wind, scale);
        break;
    }
  }

  /**
   * Top-down 2D zenithal view of a lush green grass tuft (fascio d'erba).
   * Generates blades radiating outwards with dark roots and bright tips.
   */
  private renderLushGrassTuft(ctx: CanvasRenderingContext2D, wind: number, s: number): void {
    const baseRadius = 14 * s;
    const bladeCount = 10;

    // Dark root center dot
    ctx.fillStyle = '#0f3817';
    ctx.beginPath();
    ctx.arc(0, 0, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    // Blades angles (radiating around 360 degrees with natural irregularities)
    for (let i = 0; i < bladeCount; i++) {
      const angle = (i / bladeCount) * Math.PI * 2 + (i % 3) * 0.15;
      const length = baseRadius * (0.7 + (i % 4) * 0.18);
      const bladeWind = wind * (1 + (i % 2) * 0.5);

      // Shadow blade (dark underneath)
      this.drawGrassBlade(ctx, angle + bladeWind, length, 2.8 * s, '#14532d', '#15803d');

      // Highlight / upper blade
      this.drawGrassBlade(ctx, angle + 0.08 + bladeWind * 1.2, length * 0.88, 1.8 * s, '#16a34a', '#86efac');
    }
  }

  /**
   * Dry golden wild grass tuft (erba alta dorata).
   */
  private renderDryGrassTuft(ctx: CanvasRenderingContext2D, wind: number, s: number): void {
    const baseRadius = 16 * s;
    const bladeCount = 9;

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < bladeCount; i++) {
      const angle = (i / bladeCount) * Math.PI * 2 + (i % 2) * 0.22;
      const length = baseRadius * (0.75 + (i % 3) * 0.15);
      const bladeWind = wind * (1.2 + (i % 3) * 0.3);

      this.drawGrassBlade(ctx, angle + bladeWind, length, 2.4 * s, '#78350f', '#b45309');
      this.drawGrassBlade(ctx, angle + 0.06 + bladeWind * 1.1, length * 0.9, 1.6 * s, '#d97706', '#fef08a');
    }
  }

  /**
   * Grass tuft with wildflowers (margherite, papaveri, fiordalisi).
   */
  private renderFlowerGrassTuft(ctx: CanvasRenderingContext2D, wind: number, s: number, seed: number): void {
    // Render lush grass base
    this.renderLushGrassTuft(ctx, wind, s * 0.95);

    // Flower blossoms at blade tips
    const flowerColors = [
      { petal: '#ffffff', center: '#eab308' }, // Daisy
      { petal: '#ef4444', center: '#18181b' }, // Poppy
      { petal: '#38bdf8', center: '#facc15' }, // Cornflower
      { petal: '#ec4899', center: '#fef08a' }  // Wild pink
    ];

    const numFlowers = 3 + Math.floor((seed * 7) % 3);
    for (let f = 0; f < numFlowers; f++) {
      const flowerAngle = ((f * 2.1) + seed) % (Math.PI * 2);
      const flowerDist = (9 + (f % 3) * 3) * s;
      const fx = Math.cos(flowerAngle + wind) * flowerDist;
      const fy = Math.sin(flowerAngle + wind) * flowerDist;

      const col = flowerColors[(Math.floor(seed * 3) + f) % flowerColors.length];

      // Petals (4-5 tiny circles)
      ctx.fillStyle = col.petal;
      const petR = 1.8 * s;
      for (let p = 0; p < 5; p++) {
        const pa = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(pa) * (petR * 0.8), fy + Math.sin(pa) * (petR * 0.8), petR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center
      ctx.fillStyle = col.center;
      ctx.beginPath();
      ctx.arc(fx, fy, 1.2 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Woodland fern tuft with fronds radiating outwards.
   */
  private renderFernTuft(ctx: CanvasRenderingContext2D, wind: number, s: number): void {
    const frondCount = 6;
    const len = 17 * s;

    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(0, 0, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2 + (i % 2) * 0.1;
      const fWind = wind * (0.8 + (i % 2) * 0.4);

      ctx.save();
      ctx.rotate(angle + fWind);

      // Central stem
      ctx.strokeStyle = '#065f46';
      ctx.lineWidth = 1.8 * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.4, 3 * s, len, 0);
      ctx.stroke();

      // Side leaves (pinnules)
      ctx.fillStyle = '#10b981';
      const steps = 5;
      for (let j = 1; j <= steps; j++) {
        const px = (j / steps) * (len * 0.9);
        const pSize = (1 - (j / steps) * 0.4) * 4 * s;

        // Left leaf
        ctx.beginPath();
        ctx.ellipse(px, -pSize * 0.8, pSize * 0.9, pSize * 0.4, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // Right leaf
        ctx.beginPath();
        ctx.ellipse(px, pSize * 0.8, pSize * 0.9, pSize * 0.4, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Clover patch with 3-lobed leaves.
   */
  private renderCloverPatch(ctx: CanvasRenderingContext2D, wind: number, s: number): void {
    const clovers = 6;
    for (let c = 0; c < clovers; c++) {
      const ca = (c / clovers) * Math.PI * 2 + (c % 2) * 0.3;
      const cd = (4 + (c % 3) * 3) * s;
      const cx = Math.cos(ca) * cd;
      const cy = Math.sin(ca) * cd;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ca + wind * 0.5);

      // 3 lobes
      ctx.fillStyle = '#15803d';
      const lobeR = 2.4 * s;
      for (let l = 0; l < 3; l++) {
        const la = (l / 3) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(la) * lobeR, Math.sin(la) * lobeR, lobeR * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle center pale chevron
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(0, 0, 1.2 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Water reeds / cattails for river banks and wetlands.
   */
  private renderReedsTuft(ctx: CanvasRenderingContext2D, wind: number, s: number): void {
    const reedCount = 7;
    const len = 18 * s;

    for (let i = 0; i < reedCount; i++) {
      const angle = (i / reedCount) * Math.PI * 2;
      const rWind = wind * (1.3 + (i % 2) * 0.4);

      ctx.save();
      ctx.rotate(angle + rWind);

      // Long reed blade
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len * (0.8 + (i % 3) * 0.15), 0);
      ctx.stroke();

      // Cattail head on some reeds
      if (i % 2 === 0) {
        ctx.fillStyle = '#713f12';
        ctx.beginPath();
        ctx.roundRect(len * 0.6, -1.8 * s, 5 * s, 3.6 * s, 2 * s);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Bioluminescent magical sprouts (Underdark / Fantasy glowing herbs).
   */
  private renderBiolumSprouts(
    ctx: CanvasRenderingContext2D,
    wind: number,
    s: number,
    timeSec: number
  ): void {
    const sproutCount = 7;
    const pulse = Math.sin(timeSec * 3) * 0.2 + 0.8;

    // Glowing ambient halo
    const glowGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 18 * s);
    glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    glowGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 18 * s, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < sproutCount; i++) {
      const angle = (i / sproutCount) * Math.PI * 2 + (i % 2) * 0.2;
      const len = 15 * s * (0.8 + (i % 3) * 0.2);
      const bWind = wind * (1.1 + (i % 2) * 0.3);

      ctx.save();
      ctx.rotate(angle + bWind);

      // Curved luminous stem
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.5, 4 * s, len, 0);
      ctx.stroke();

      // Glowing tip bulb
      ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#c084fc';
      ctx.beginPath();
      ctx.arc(len, 0, 2.5 * s * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(len, 0, 1.2 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Fallen autumn leaves scatter.
   */
  private renderAutumnLeaves(ctx: CanvasRenderingContext2D, s: number, seed: number): void {
    const leafColors = ['#b91c1c', '#c2410c', '#d97706', '#eab308', '#78350f'];
    const leafCount = 8;

    for (let i = 0; i < leafCount; i++) {
      const angle = ((i * 1.7) + seed) % (Math.PI * 2);
      const dist = (3 + (i % 4) * 3) * s;
      const lx = Math.cos(angle) * dist;
      const ly = Math.sin(angle) * dist;
      const rot = (seed * 5 + i * 2.3) % (Math.PI * 2);

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);

      ctx.fillStyle = leafColors[(i + Math.floor(seed * 3)) % leafColors.length];
      // Leaf oval shape with pointed tip
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.2 * s, 1.8 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      // Little leaf stem
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-3 * s, 0);
      ctx.lineTo(3.2 * s, 0);
      ctx.stroke();

      ctx.restore();
    }
  }

  /**
   * Helper: draws a single smooth, curved, tapered grass blade radiating from root (0, 0).
   */
  private drawGrassBlade(
    ctx: CanvasRenderingContext2D,
    angle: number,
    length: number,
    baseWidth: number,
    baseColor: string,
    tipColor: string
  ): void {
    ctx.save();
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, length, 0);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.7, tipColor);
    grad.addColorStop(1, tipColor);

    ctx.fillStyle = grad;
    ctx.beginPath();
    // Tapered triangle with slight curve
    ctx.moveTo(0, -baseWidth * 0.5);
    ctx.quadraticCurveTo(length * 0.5, baseWidth * 0.4, length, 0);
    ctx.quadraticCurveTo(length * 0.5, -baseWidth * 0.2, 0, baseWidth * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
