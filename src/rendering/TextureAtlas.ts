import { TERRAIN_CATALOG, TerrainDefinition } from '../data/terrainCatalog';
import { WALL_CATALOG, WallDefinition } from '../data/wallCatalog';
import { DoorType } from '../types';

export interface TextureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class TextureAtlas {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public readonly tileSize = 64; // 64x64 px per tile

  private terrainRegions: Map<number, TextureRegion> = new Map();
  private wallRegions: Map<string, TextureRegion> = new Map();
  private doorRegions: Map<DoorType, TextureRegion> = new Map();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d')!;

    this.generateAtlas();
  }

  private generateAtlas(): void {
    const ctx = this.ctx;
    const s = this.tileSize;

    let col = 0;
    let row = 0;

    const nextRegion = (): TextureRegion => {
      const region: TextureRegion = { x: col * s, y: row * s, width: s, height: s };
      col++;
      if (col * s >= this.canvas.width) {
        col = 0;
        row++;
      }
      return region;
    };

    // 1. Generate All 100 Terrains from TERRAIN_CATALOG
    for (const t of TERRAIN_CATALOG) {
      const r = nextRegion();
      this.terrainRegions.set(t.id, r);
      ctx.save();
      ctx.translate(r.x, r.y);
      this.renderProceduralTerrain(ctx, t, s);
      ctx.restore();
    }

    // 2. Generate All 10 Wall Styles from WALL_CATALOG (both Block and Edge)
    for (const w of WALL_CATALOG) {
      // Solid Block Wall
      const rBlock = nextRegion();
      this.wallRegions.set(`block_${w.id}`, rBlock);
      ctx.save();
      ctx.translate(rBlock.x, rBlock.y);
      this.renderBlockWall(ctx, w, s);
      ctx.restore();

      // Horizontal Wall Edge
      const rEdgeH = nextRegion();
      this.wallRegions.set(`edge_h_${w.id}`, rEdgeH);
      ctx.save();
      ctx.translate(rEdgeH.x, rEdgeH.y);
      this.renderWallEdge(ctx, w, s, true);
      ctx.restore();

      // Vertical Wall Edge
      const rEdgeV = nextRegion();
      this.wallRegions.set(`edge_v_${w.id}`, rEdgeV);
      ctx.save();
      ctx.translate(rEdgeV.x, rEdgeV.y);
      this.renderWallEdge(ctx, w, s, false);
      ctx.restore();
    }

    // Default wall fallback aliases
    const defW = WALL_CATALOG[1]; // Mattoni di pietra lavorata
    this.wallRegions.set('block', this.wallRegions.get(`block_${defW.id}`)!);
    this.wallRegions.set('edge_h', this.wallRegions.get(`edge_h_${defW.id}`)!);
    this.wallRegions.set('edge_v', this.wallRegions.get(`edge_v_${defW.id}`)!);

    // 3. Generate Doors
    const doors = [
      DoorType.STANDARD_DOOR,
      DoorType.DOUBLE_DOOR,
      DoorType.SECRET_DOOR,
      DoorType.BARRED_GATE,
      DoorType.WINDOW
    ];

    for (const dtype of doors) {
      const r = nextRegion();
      this.doorRegions.set(dtype, r);
      ctx.save();
      ctx.translate(r.x, r.y);
      this.renderDoor(ctx, dtype, s);
      ctx.restore();
    }
  }

  // --- Algorithmic Procedural Terrain Rendering ---
  private renderProceduralTerrain(ctx: CanvasRenderingContext2D, t: TerrainDefinition, s: number): void {
    // 1. Base color fill
    ctx.fillStyle = t.baseColor;
    ctx.fillRect(0, 0, s, s);

    ctx.strokeStyle = t.detailColor;
    ctx.fillStyle = t.detailColor;

    // 2. Pattern Variations
    switch (t.pattern) {
      case 'brick': {
        const rows = 4;
        const rh = s / rows;
        for (let r = 0; r < rows; r++) {
          ctx.strokeRect(0, r * rh, s, rh);
          const shift = (r % 2 === 1) ? s * 0.25 : 0;
          ctx.beginPath();
          ctx.moveTo((s * 0.5 + shift) % s, r * rh);
          ctx.lineTo((s * 0.5 + shift) % s, (r + 1) * rh);
          ctx.stroke();
        }
        break;
      }

      case 'cobble': {
        const cs = s / 4;
        for (let y = 0; y < 4; y++) {
          for (let x = 0; x < 4; x++) {
            const ox = (y % 2 === 1) ? cs * 0.5 : 0;
            ctx.beginPath();
            ctx.roundRect((x * cs + ox) % s, y * cs, cs - 1.5, cs - 1.5, 3);
            ctx.stroke();
          }
        }
        break;
      }

      case 'tile': {
        ctx.lineWidth = 1.5;
        ctx.strokeRect(1, 1, s - 2, s - 2);
        ctx.strokeRect(s * 0.5, 1, 1, s - 2);
        ctx.strokeRect(1, s * 0.5, s - 2, 1);
        break;
      }

      case 'wood': {
        const planks = 4;
        const ph = s / planks;
        for (let i = 0; i < planks; i++) {
          ctx.fillStyle = i % 2 === 0 ? t.baseColor : t.detailColor;
          ctx.fillRect(0, i * ph, s, ph - 1);
          ctx.fillStyle = '#291504';
          ctx.fillRect(4, i * ph + ph * 0.5 - 1, 3, 2);
          ctx.fillRect(s - 7, i * ph + ph * 0.5 - 1, 3, 2);
        }
        break;
      }

      case 'stripes': {
        ctx.lineWidth = 2;
        for (let i = 4; i < s; i += 8) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(s, i);
          ctx.stroke();
        }
        break;
      }

      case 'cracked': {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s * 0.2, 0); ctx.lineTo(s * 0.45, s * 0.4); ctx.lineTo(s * 0.3, s);
        ctx.moveTo(s * 0.45, s * 0.4); ctx.lineTo(s, s * 0.6);
        ctx.stroke();
        break;
      }

      case 'hex': {
        ctx.lineWidth = 1.5;
        const r = s * 0.28;
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3;
          const px = s * 0.5 + Math.cos(angle) * r;
          const py = s * 0.5 + Math.sin(angle) * r;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      }

      case 'crystal': {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s * 0.5, 6);
        ctx.lineTo(s - 6, s * 0.5);
        ctx.lineTo(s * 0.5, s - 6);
        ctx.lineTo(6, s * 0.5);
        ctx.closePath();
        ctx.stroke();
        break;
      }

      case 'veined': {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.3);
        ctx.bezierCurveTo(s * 0.4, s * 0.1, s * 0.6, s * 0.8, s, s * 0.6);
        ctx.stroke();
        break;
      }

      case 'circular': {
        ctx.beginPath();
        ctx.arc(s * 0.35, s * 0.35, s * 0.18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s * 0.7, s * 0.7, s * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'noise':
      default: {
        for (let i = 0; i < 20; i++) {
          const rx = (i * 19) % (s - 4) + 2;
          const ry = (i * 29) % (s - 4) + 2;
          ctx.fillRect(rx, ry, 2.5, 2.5);
        }
        break;
      }
    }

    // Border bevel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, s - 1, s - 1);
  }

  // --- Procedural Walls (Top-Down Pure 2D) ---
  private renderBlockWall(ctx: CanvasRenderingContext2D, w: WallDefinition, s: number): void {
    // Base fill
    ctx.fillStyle = w.wallColor;
    ctx.fillRect(0, 0, s, s);

    // Pattern-specific detail
    switch (w.pattern) {
      case 'masonry': {
        // Regular stone blocks
        ctx.strokeStyle = w.strokeColor;
        ctx.lineWidth = 1.5;
        const rows = 3, rh = s / rows;
        for (let r = 0; r < rows; r++) {
          const shift = (r % 2 === 1) ? s * 0.33 : 0;
          ctx.strokeRect(0, r * rh, s, rh);
          ctx.beginPath();
          ctx.moveTo((s * 0.5 + shift) % s, r * rh);
          ctx.lineTo((s * 0.5 + shift) % s, (r + 1) * rh);
          ctx.stroke();
        }
        break;
      }
      case 'rough_stone': {
        // Irregular stones
        ctx.strokeStyle = w.strokeColor;
        ctx.lineWidth = 1.5;
        const stones = [
          [0, 0, s * 0.55, s * 0.5], [s * 0.55, 0, s * 0.45, s * 0.45],
          [0, s * 0.5, s * 0.4, s * 0.5], [s * 0.4, s * 0.45, s * 0.6, s * 0.55]
        ];
        for (const [rx, ry, rw, rh] of stones) {
          ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);
        }
        break;
      }
      case 'logs': {
        // Horizontal log stacking
        ctx.strokeStyle = w.strokeColor;
        ctx.lineWidth = 2;
        const logCount = 4;
        const lh = s / logCount;
        for (let i = 0; i < logCount; i++) {
          ctx.fillStyle = i % 2 === 0 ? w.wallColor : w.highlightColor;
          ctx.fillRect(0, i * lh, s, lh - 1);
          // Bark texture lines
          ctx.strokeRect(2, i * lh + 1, s - 4, lh - 3);
          // End grain dots
          ctx.fillStyle = w.strokeColor;
          ctx.beginPath();
          ctx.arc(s - 6, i * lh + lh * 0.5, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'wood_panels': {
        // Vertical planks
        ctx.lineWidth = 1.5;
        const planks = 4;
        const pw = s / planks;
        for (let i = 0; i < planks; i++) {
          ctx.fillStyle = i % 2 === 0 ? w.wallColor : w.highlightColor;
          ctx.fillRect(i * pw, 0, pw - 1, s);
          ctx.strokeStyle = w.strokeColor;
          ctx.strokeRect(i * pw, 0, pw - 1, s);
          // Nail
          ctx.fillStyle = w.strokeColor;
          ctx.fillRect(i * pw + pw * 0.4, 6, 3, 3);
          ctx.fillRect(i * pw + pw * 0.4, s - 9, 3, 3);
        }
        break;
      }
      case 'red_brick': {
        // Classic red brick pattern
        ctx.strokeStyle = w.strokeColor;
        ctx.lineWidth = 1;
        const bRows = 4, bh = s / bRows;
        for (let r = 0; r < bRows; r++) {
          const offset = (r % 2 === 1) ? s * 0.25 : 0;
          ctx.strokeRect(0, r * bh, s, bh);
          ctx.beginPath();
          ctx.moveTo((s * 0.5 + offset) % s, r * bh);
          ctx.lineTo((s * 0.5 + offset) % s, (r + 1) * bh);
          ctx.stroke();
        }
        // Slight highlight on top of each brick
        ctx.fillStyle = w.highlightColor + '44';
        for (let r = 0; r < bRows; r++) {
          ctx.fillRect(0, r * bh, s, 2);
        }
        break;
      }
      case 'marble': {
        // Smooth marble with vein
        ctx.fillStyle = w.highlightColor;
        ctx.fillRect(4, 4, s - 8, s - 8);
        ctx.strokeStyle = w.highlightColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.3);
        ctx.bezierCurveTo(s * 0.4, s * 0.1, s * 0.6, s * 0.9, s, s * 0.6);
        ctx.stroke();
        ctx.strokeStyle = w.strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, s - 4, s - 4);
        break;
      }
      case 'riveted_metal': {
        // Metal plate with rivets at corners
        ctx.fillStyle = w.highlightColor;
        ctx.fillRect(4, 4, s - 8, s - 8);
        ctx.strokeStyle = w.strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, s - 4, s - 4);
        // Rivets
        ctx.fillStyle = w.highlightColor;
        const rp = [[6, 6], [s - 6, 6], [6, s - 6], [s - 6, s - 6]];
        for (const [rx, ry] of rp) {
          ctx.beginPath();
          ctx.arc(rx, ry, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        // Rust spot
        ctx.fillStyle = w.strokeColor + 'aa';
        ctx.fillRect(s * 0.3, s * 0.4, 8, 6);
        break;
      }
      case 'bone_skull': {
        // Bone white blocks with skull accent
        ctx.strokeStyle = w.strokeColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(2, 2, s - 4, s - 4);
        // Horizontal bone rows
        for (let r = 0; r < 3; r++) {
          ctx.strokeRect(4, 4 + r * (s - 8) * 0.33, s - 8, (s - 8) * 0.33 - 1);
        }
        // Mini skull in center
        ctx.fillStyle = w.strokeColor;
        ctx.beginPath();
        ctx.arc(s * 0.5, s * 0.45, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = w.wallColor;
        ctx.fillRect(s * 0.42, s * 0.5, 4, 5); // jaw
        ctx.fillRect(s * 0.52, s * 0.5, 4, 5);
        break;
      }
      case 'arcane_crystal': {
        // Translucent glowing crystal
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = w.highlightColor;
        ctx.fillRect(4, 4, s - 8, s - 8);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = w.highlightColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, s - 4, s - 4);
        // Inner diamond glow
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s * 0.5, 8);
        ctx.lineTo(s - 8, s * 0.5);
        ctx.lineTo(s * 0.5, s - 8);
        ctx.lineTo(8, s * 0.5);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'cave_rock':
      default: {
        // Generic rough cave: frame + inner irregular
        ctx.strokeStyle = w.strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, s - 4, s - 4);
        ctx.fillStyle = w.highlightColor;
        ctx.fillRect(4, 4, s - 8, s - 8);
        // Chips
        ctx.strokeStyle = w.strokeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s * 0.2, s * 0.4); ctx.lineTo(s * 0.4, s * 0.3);
        ctx.moveTo(s * 0.6, s * 0.6); ctx.lineTo(s * 0.8, s * 0.5);
        ctx.stroke();
        break;
      }
    }

    // Outer dark frame
    ctx.strokeStyle = w.strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, s - 2, s - 2);
  }

  private renderWallEdge(ctx: CanvasRenderingContext2D, w: WallDefinition, s: number, horizontal: boolean): void {
    ctx.clearRect(0, 0, s, s);
    const thick = Math.max(10, s * 0.15);

    // Base fill
    ctx.fillStyle = w.wallColor;
    if (horizontal) {
      ctx.fillRect(0, 0, s, thick);
    } else {
      ctx.fillRect(0, 0, thick, s);
    }

    // Pattern overlay
    ctx.save();
    ctx.strokeStyle = w.strokeColor;
    ctx.fillStyle = w.highlightColor;

    switch (w.pattern) {
      case 'masonry':
      case 'rough_stone':
      case 'red_brick': {
        // Draw brick/stone segments along the wall length
        ctx.lineWidth = 1;
        const segCount = 4;
        const segLen = s / segCount;
        if (horizontal) {
          for (let i = 0; i < segCount; i++) {
            ctx.strokeRect(i * segLen + 1, 1, segLen - 2, thick - 2);
          }
        } else {
          for (let i = 0; i < segCount; i++) {
            ctx.strokeRect(1, i * segLen + 1, thick - 2, segLen - 2);
          }
        }
        break;
      }
      case 'logs':
      case 'wood_panels': {
        // Draw wood grain lines
        ctx.lineWidth = 1;
        const grainCount = 3;
        if (horizontal) {
          for (let i = 1; i <= grainCount; i++) {
            const gy = (thick / (grainCount + 1)) * i;
            ctx.beginPath();
            ctx.moveTo(0, gy); ctx.lineTo(s, gy);
            ctx.stroke();
          }
        } else {
          for (let i = 1; i <= grainCount; i++) {
            const gx = (thick / (grainCount + 1)) * i;
            ctx.beginPath();
            ctx.moveTo(gx, 0); ctx.lineTo(gx, s);
            ctx.stroke();
          }
        }
        break;
      }
      case 'riveted_metal': {
        // Draw rivets along the wall
        ctx.fillStyle = w.highlightColor;
        const rivetStep = 12;
        if (horizontal) {
          for (let i = rivetStep; i < s; i += rivetStep) {
            ctx.beginPath();
            ctx.arc(i, thick * 0.5, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          for (let i = rivetStep; i < s; i += rivetStep) {
            ctx.beginPath();
            ctx.arc(thick * 0.5, i, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      case 'marble': {
        // Vein line
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = w.highlightColor;
        if (horizontal) {
          ctx.beginPath();
          ctx.moveTo(0, thick * 0.4);
          ctx.bezierCurveTo(s * 0.3, thick * 0.1, s * 0.6, thick * 0.9, s, thick * 0.5);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(thick * 0.4, 0);
          ctx.bezierCurveTo(thick * 0.1, s * 0.3, thick * 0.9, s * 0.6, thick * 0.5, s);
          ctx.stroke();
        }
        break;
      }
      case 'bone_skull': {
        // Dot pattern for bones
        ctx.fillStyle = w.strokeColor;
        const boneStep = 10;
        if (horizontal) {
          for (let i = boneStep; i < s; i += boneStep) {
            ctx.fillRect(i - 1, thick * 0.3, 2, thick * 0.4);
          }
        } else {
          for (let i = boneStep; i < s; i += boneStep) {
            ctx.fillRect(thick * 0.3, i - 1, thick * 0.4, 2);
          }
        }
        break;
      }
      case 'arcane_crystal': {
        // Glowing inner stripe
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = w.highlightColor;
        if (horizontal) {
          ctx.fillRect(0, thick * 0.25, s, thick * 0.5);
        } else {
          ctx.fillRect(thick * 0.25, 0, thick * 0.5, s);
        }
        ctx.globalAlpha = 1.0;
        break;
      }
      case 'cave_rock':
      default: {
        // Irregular dots / chips
        ctx.fillStyle = w.strokeColor;
        const pts = horizontal
          ? [[s * 0.2, thick * 0.5], [s * 0.5, thick * 0.3], [s * 0.8, thick * 0.6]]
          : [[thick * 0.5, s * 0.2], [thick * 0.3, s * 0.5], [thick * 0.6, s * 0.8]];
        for (const [px, py] of pts) {
          ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
        }
        break;
      }
    }
    ctx.restore();

    // Highlight edge bevel
    ctx.strokeStyle = w.highlightColor;
    ctx.lineWidth = 1.5;
    if (horizontal) {
      ctx.beginPath();
      ctx.moveTo(0, 1); ctx.lineTo(s, 1);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(1, 0); ctx.lineTo(1, s);
      ctx.stroke();
    }

    // Dark outer border
    ctx.strokeStyle = w.strokeColor;
    ctx.lineWidth = 1;
    if (horizontal) {
      ctx.strokeRect(0, 0, s, thick);
    } else {
      ctx.strokeRect(0, 0, thick, s);
    }
  }

  private renderDoor(ctx: CanvasRenderingContext2D, type: DoorType, s: number): void {
    ctx.clearRect(0, 0, s, s);
    const w = s;
    const h = 12;
    const cy = (s - h) / 2;

    switch (type) {
      case DoorType.STANDARD_DOOR: {
        // Wooden door with grain lines and handle
        ctx.fillStyle = '#92400e';
        ctx.fillRect(4, cy, w - 8, h);
        // Wood grain
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          const lx = 4 + (w - 8) * (i / 4);
          ctx.beginPath();
          ctx.moveTo(lx, cy + 1);
          ctx.lineTo(lx, cy + h - 1);
          ctx.stroke();
        }
        // Door frame
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, cy, w - 8, h);
        // Handle
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(w * 0.5, cy + h * 0.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case DoorType.DOUBLE_DOOR: {
        // Double wooden door with center split
        ctx.fillStyle = '#78350f';
        ctx.fillRect(2, cy, w - 4, h);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, cy, w - 4, h);
        // Center line
        ctx.beginPath();
        ctx.moveTo(w * 0.5, cy);
        ctx.lineTo(w * 0.5, cy + h);
        ctx.stroke();
        // Left handle
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(w * 0.35, cy + h * 0.5, 2, 0, Math.PI * 2);
        ctx.fill();
        // Right handle
        ctx.beginPath();
        ctx.arc(w * 0.65, cy + h * 0.5, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case DoorType.SECRET_DOOR: {
        // Secret door — blends with wall, dashed border
        ctx.fillStyle = '#374151';
        ctx.fillRect(4, cy, w - 8, h);
        // Stone texture dots
        ctx.fillStyle = '#4b5563';
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(6 + i * 8, cy + 2, 5, h - 4);
        }
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(4, cy, w - 8, h);
        ctx.setLineDash([]);
        // 'S' label
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', w * 0.5, cy + h * 0.5);
        break;
      }

      case DoorType.BARRED_GATE: {
        // Iron gate with vertical bars
        ctx.fillStyle = '#18181b';
        ctx.fillRect(4, cy - 2, w - 8, h + 4);
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 2.5;
        // Horizontal rails
        ctx.beginPath();
        ctx.moveTo(4, cy + 1); ctx.lineTo(w - 4, cy + 1);
        ctx.moveTo(4, cy + h - 1); ctx.lineTo(w - 4, cy + h - 1);
        ctx.stroke();
        // Vertical bars
        ctx.lineWidth = 2;
        for (let i = 6; i < w - 4; i += 7) {
          ctx.beginPath();
          ctx.moveTo(i, cy - 2);
          ctx.lineTo(i, cy + h + 2);
          ctx.stroke();
        }
        // Frame
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, cy - 2, w - 8, h + 4);
        break;
      }

      case DoorType.WINDOW: {
        // Window with cross pane and translucent glass
        const gx = 6, gy = cy + 1, gw = w - 12, gh = h - 2;
        // Frame
        ctx.fillStyle = '#92400e';
        ctx.fillRect(gx - 2, gy - 2, gw + 4, gh + 4);
        // Glass
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.fillRect(gx, gy, gw, gh);
        // Cross panes
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx + gw * 0.5, gy); ctx.lineTo(gx + gw * 0.5, gy + gh);
        ctx.moveTo(gx, gy + gh * 0.5); ctx.lineTo(gx + gw, gy + gh * 0.5);
        ctx.stroke();
        // Glint
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(gx, gy, gw, gh);
        break;
      }
    }
  }

  // --- Getters ---
  public getTerrainRegion(terrainId: number): TextureRegion | undefined {
    return this.terrainRegions.get(terrainId) || this.terrainRegions.get(1);
  }

  public getWallRegion(key: string): TextureRegion | undefined {
    return this.wallRegions.get(key) || this.wallRegions.get('block');
  }

  public getDoorRegion(type: DoorType): TextureRegion | undefined {
    return this.doorRegions.get(type);
  }
}
