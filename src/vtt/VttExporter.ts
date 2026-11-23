import { TileMap } from '../core/TileMap';
import { TextureAtlas } from '../rendering/TextureAtlas';
import { LiquidRenderer } from '../rendering/LiquidRenderer';
import { FoliageRenderer } from '../rendering/FoliageRenderer';
import { AssetManager } from '../core/AssetManager';
import {
  UniversalVTTFormat,
  UVTTPoint,
  UVTTPortal,
  UVTTLight,
  WALL_NORTH,
  WALL_EAST,
  WALL_SOUTH,
  WALL_WEST,
  WALL_BLOCK,
  DoorState,
  DoorType,
  TileType,
  LiquidType,
  FoliageType
} from '../types';

export class VttExporter {
  /**
   * Renders the complete map image into an offscreen canvas and returns Base64 string.
   */
  public static async renderMapImageBase64(
    tileMap: TileMap,
    atlas: TextureAtlas,
    liquidRenderer: LiquidRenderer,
    assetManager?: AssetManager,
    format: 'image/webp' | 'image/png' = 'image/png'
  ): Promise<string> {
    const s = tileMap.pixelsPerGrid;
    const width = tileMap.width * s;
    const height = tileMap.height * s;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 1. Terrain Layer
    for (let y = 0; y < tileMap.height; y++) {
      for (let x = 0; x < tileMap.width; x++) {
        const terrain = tileMap.getTerrain(x, y);
        if (terrain !== TileType.EMPTY) {
          const region = atlas.getTerrainRegion(terrain);
          if (region) {
            ctx.drawImage(
              atlas.canvas,
              region.x, region.y, region.width, region.height,
              x * s, y * s, s, s
            );
          }
        }
      }
    }

    // 2. Liquids Layer (Water, Lava, Acid, etc.)
    for (let y = 0; y < tileMap.height; y++) {
      for (let x = 0; x < tileMap.width; x++) {
        if (tileMap.getLiquid(x, y) !== LiquidType.NONE) {
          liquidRenderer.renderLiquidTile(ctx, tileMap, x, y, s, 1.5, true);
        }
      }
    }

    // 3. Walls Layer
    const rBlock = atlas.getWallRegion(`block_${tileMap.activeWallId}`) || atlas.getWallRegion('block');
    const wallThick = Math.max(4, s * 0.12);

    for (let y = 0; y < tileMap.height; y++) {
      for (let x = 0; x < tileMap.width; x++) {
        const mask = tileMap.getWall(x, y);
        if (mask === 0) continue;
        const dx = x * s;
        const dy = y * s;

        if ((mask & WALL_BLOCK) && rBlock) {
          ctx.drawImage(
            atlas.canvas,
            rBlock.x, rBlock.y, rBlock.width, rBlock.height,
            dx, dy, s, s
          );
          continue;
        }

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;

        if (mask & WALL_NORTH) {
          ctx.fillRect(dx, dy - wallThick * 0.5, s, wallThick);
          ctx.strokeRect(dx, dy - wallThick * 0.5, s, wallThick);
        }
        if (mask & WALL_SOUTH) {
          ctx.fillRect(dx, dy + s - wallThick * 0.5, s, wallThick);
          ctx.strokeRect(dx, dy + s - wallThick * 0.5, s, wallThick);
        }
        if (mask & WALL_WEST) {
          ctx.fillRect(dx - wallThick * 0.5, dy, wallThick, s);
          ctx.strokeRect(dx - wallThick * 0.5, dy, wallThick, s);
        }
        if (mask & WALL_EAST) {
          ctx.fillRect(dx + s - wallThick * 0.5, dy, wallThick, s);
          ctx.strokeRect(dx + s - wallThick * 0.5, dy, wallThick, s);
        }
      }
    }

    // 4. Doors Layer
    for (const door of tileMap.doors.values()) {
      const dx = door.x * s;
      const dy = door.y * s;
      const isHorizontal = door.edge === 'N' || door.edge === 'S';

      let cx = dx + s * 0.5;
      let cy = dy + s * 0.5;
      if (door.edge === 'N') cy = dy;
      if (door.edge === 'S') cy = dy + s;
      if (door.edge === 'W') cx = dx;
      if (door.edge === 'E') cx = dx + s;

      ctx.save();
      ctx.translate(cx, cy);
      if (!isHorizontal) ctx.rotate(Math.PI * 0.5);

      let fillColor = '#b45309';
      if (door.type === DoorType.SECRET_DOOR) fillColor = '#64748b';
      if (door.type === DoorType.BARRED_GATE) fillColor = '#475569';
      if (door.type === DoorType.WINDOW) fillColor = '#0284c7';

      const drawW = s * 0.8;
      const drawH = 10;

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.fillRect(-drawW * 0.5, -drawH * 0.5, drawW, drawH);
      ctx.strokeRect(-drawW * 0.5, -drawH * 0.5, drawW, drawH);

      ctx.restore();
    }

    // 4.5. Foliage Overlay Layer
    const foliageRenderer = new FoliageRenderer();
    const variantKeys: FoliageType[] = [
      'grass_tuft_lush', 'grass_tuft_dry', 'grass_flowers', 'ferns',
      'clover_patch', 'reeds', 'biolum_sprouts', 'autumn_leaves'
    ];
    for (const tuft of tileMap.foliage) {
      const px = tuft.x * s;
      const py = tuft.y * s;
      ctx.save();
      ctx.translate(px, py);
      if (tuft.rotation !== 0) ctx.rotate(tuft.rotation);
      const typeKey = (tuft.type as FoliageType) || variantKeys[tuft.variantId] || 'grass_tuft_lush';
      foliageRenderer.renderTuft(ctx, typeKey, 0, tuft.phase || 0, tuft.scale * (s / 100), false);
      ctx.restore();
    }

    // 5. Props Layer
    if (assetManager) {
      for (const prop of tileMap.props) {
        const asset = assetManager.getAssetById(prop.assetId);
        if (!asset) continue;

        const px = prop.x * s;
        const py = prop.y * s;
        const pw = prop.width * s * prop.scale;
        const ph = prop.height * s * prop.scale;

        ctx.save();
        ctx.translate(px, py);
        if (prop.rotation !== 0) ctx.rotate(prop.rotation);

        // Pure top-down 2D view (no perspective shadows)
        if (asset.imageElement && asset.imageElement.complete) {
          ctx.drawImage(asset.imageElement, -pw * 0.5, -ph * 0.5, pw, ph);
        }

        ctx.restore();
      }
    }

    const dataUrl = canvas.toDataURL(format, 0.92);
    const base64Clean = dataUrl.split(',')[1] || dataUrl;
    return base64Clean;
  }

  /**
   * Greedy Line Merge for walls: Merges collinear unit-wall segments into
   * unified line-of-sight vectors for peak VTT performance.
   */
  public static extractOptimizedWalls(tileMap: TileMap): UVTTPoint[][] {
    interface Segment {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }

    const horizontalSegs: Segment[] = [];
    const verticalSegs: Segment[] = [];

    for (let y = 0; y < tileMap.height; y++) {
      for (let x = 0; x < tileMap.width; x++) {
        const mask = tileMap.getWall(x, y);
        if (mask === 0) continue;

        if ((mask & WALL_NORTH) && !tileMap.doors.has(tileMap.getDoorKey(x, y, 'N'))) {
          horizontalSegs.push({ x1: x, y1: y, x2: x + 1, y2: y });
        }
        if ((mask & WALL_SOUTH) && !tileMap.doors.has(tileMap.getDoorKey(x, y, 'S'))) {
          horizontalSegs.push({ x1: x, y1: y + 1, x2: x + 1, y2: y + 1 });
        }
        if ((mask & WALL_WEST) && !tileMap.doors.has(tileMap.getDoorKey(x, y, 'W'))) {
          verticalSegs.push({ x1: x, y1: y, x2: x, y2: y + 1 });
        }
        if ((mask & WALL_EAST) && !tileMap.doors.has(tileMap.getDoorKey(x, y, 'E'))) {
          verticalSegs.push({ x1: x + 1, y1: y, x2: x + 1, y2: y + 1 });
        }
      }
    }

    const dedup = (segs: Segment[]): Segment[] => {
      const map = new Map<string, Segment>();
      for (const s of segs) {
        const key = `${s.x1},${s.y1}->${s.x2},${s.y2}`;
        const keyRev = `${s.x2},${s.y2}->${s.x1},${s.y1}`;
        if (!map.has(key) && !map.has(keyRev)) {
          map.set(key, s);
        }
      }
      return Array.from(map.values());
    };

    const uniqueH = dedup(horizontalSegs);
    const uniqueV = dedup(verticalSegs);

    uniqueH.sort((a, b) => (a.y1 === b.y1 ? a.x1 - b.x1 : a.y1 - b.y1));
    const mergedH: Segment[] = [];
    for (const seg of uniqueH) {
      const last = mergedH[mergedH.length - 1];
      if (last && last.y1 === seg.y1 && last.x2 === seg.x1) {
        last.x2 = seg.x2;
      } else {
        mergedH.push({ ...seg });
      }
    }

    uniqueV.sort((a, b) => (a.x1 === b.x1 ? a.y1 - b.y1 : a.x1 - b.x1));
    const mergedV: Segment[] = [];
    for (const seg of uniqueV) {
      const last = mergedV[mergedV.length - 1];
      if (last && last.x1 === seg.x1 && last.y2 === seg.y1) {
        last.y2 = seg.y2;
      } else {
        mergedV.push({ ...seg });
      }
    }

    const result: UVTTPoint[][] = [];
    for (const s of [...mergedH, ...mergedV]) {
      result.push([
        { x: s.x1, y: s.y1 },
        { x: s.x2, y: s.y2 }
      ]);
    }

    return result;
  }

  public static extractPortals(tileMap: TileMap): UVTTPortal[] {
    const portals: UVTTPortal[] = [];

    for (const door of tileMap.doors.values()) {
      let x1 = door.x;
      let y1 = door.y;
      let x2 = door.x + 1;
      let y2 = door.y;
      let rot = 0;

      if (door.edge === 'N') {
        x1 = door.x;     y1 = door.y;
        x2 = door.x + 1; y2 = door.y;
        rot = 0;
      } else if (door.edge === 'S') {
        x1 = door.x;     y1 = door.y + 1;
        x2 = door.x + 1; y2 = door.y + 1;
        rot = 0;
      } else if (door.edge === 'W') {
        x1 = door.x; y1 = door.y;
        x2 = door.x; y2 = door.y + 1;
        rot = Math.PI * 0.5;
      } else if (door.edge === 'E') {
        x1 = door.x + 1; y1 = door.y;
        x2 = door.x + 1; y2 = door.y + 1;
        rot = Math.PI * 0.5;
      }

      const posX = (x1 + x2) * 0.5;
      const posY = (y1 + y2) * 0.5;

      portals.push({
        position: { x: posX, y: posY },
        bounds: [
          { x: x1, y: y1 },
          { x: x2, y: y2 }
        ],
        rotation: rot,
        closed: door.state !== DoorState.OPEN,
        freemove: false
      });
    }

    return portals;
  }

  public static extractLights(tileMap: TileMap): UVTTLight[] {
    return tileMap.lights.map(light => {
      let cleanHex = light.color.replace('#', '');
      if (cleanHex.length === 6) {
        cleanHex = 'ff' + cleanHex;
      }

      return {
        position: { x: light.x, y: light.y },
        range: light.radius,
        intensity: light.intensity,
        color: cleanHex,
        shadows: true
      };
    });
  }

  public static async exportUniversalVTT(
    tileMap: TileMap,
    atlas: TextureAtlas,
    liquidRenderer: LiquidRenderer,
    assetManager?: AssetManager
  ): Promise<UniversalVTTFormat> {
    const imageBase64 = await this.renderMapImageBase64(tileMap, atlas, liquidRenderer, assetManager, 'image/png');
    const walls = this.extractOptimizedWalls(tileMap);
    const portals = this.extractPortals(tileMap);
    const lights = this.extractLights(tileMap);

    return {
      format: 0.2,
      resolution: {
        map_origin: { x: 0, y: 0 },
        map_size: { x: tileMap.width, y: tileMap.height },
        pixels_per_grid: tileMap.pixelsPerGrid
      },
      line_of_sight: walls,
      portals: portals,
      lights: lights,
      image: imageBase64
    };
  }

  public static triggerDownload(filename: string, content: string, mimeType = 'application/json'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
