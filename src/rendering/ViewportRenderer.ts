import { TileMap } from '../core/TileMap';
import { TextureAtlas } from './TextureAtlas';
import { LiquidRenderer } from './LiquidRenderer';
import { AssetManager } from '../core/AssetManager';
import {
  Camera,
  TileType,
  LiquidType,
  WALL_NORTH,
  WALL_EAST,
  WALL_SOUTH,
  WALL_WEST,
  WALL_BLOCK,
  DoorType,
  DoorState,
  PlacedProp
} from '../types';

export interface RenderOptions {
  showGrid: boolean;
  gridThickness?: number;
  animateWater: boolean;
  showLighting: boolean;
  hoverTile?: { x: number; y: number };
  hoverEdge?: 'N' | 'E' | 'S' | 'W';
  hoverWorld?: { x: number; y: number };
  selectionRect?: { x1: number; y1: number; x2: number; y2: number };
  activeTool: string;
  activePropId?: string;
  propRotation?: number;
  propWidth?: number;
  propHeight?: number;
}

export class ViewportRenderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public atlas: TextureAtlas;
  public liquidRenderer: LiquidRenderer;
  public assetManager: AssetManager;

  public camera: Camera = { x: 0, y: 0, zoom: 1.0 };
  private frameCount = 0;
  private fpsTimer = 0;
  private fps = 60;

  public onFpsUpdate?: (fps: number) => void;

  constructor(canvas: HTMLCanvasElement, assetManager?: AssetManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.atlas = new TextureAtlas();
    this.liquidRenderer = new LiquidRenderer();
    this.assetManager = assetManager || new AssetManager();

    this.resizeCanvasToContainer();
    window.addEventListener('resize', () => this.resizeCanvasToContainer());
  }

  // Alias for backward compat
  public get waterRenderer(): LiquidRenderer {
    return this.liquidRenderer;
  }

  public resizeCanvasToContainer(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.imageSmoothingEnabled = false;
  }

  public centerOnMap(tileMap: TileMap): void {
    const s = tileMap.pixelsPerGrid;
    const mapW = tileMap.width * s;
    const mapH = tileMap.height * s;
    const dpr = window.devicePixelRatio || 1;
    const viewW = this.canvas.width / dpr;
    const viewH = this.canvas.height / dpr;

    this.camera.zoom = Math.min((viewW - 80) / mapW, (viewH - 80) / mapH, 1.2);
    if (this.camera.zoom < 0.2) this.camera.zoom = 0.2;
    this.camera.x = (viewW - mapW * this.camera.zoom) / 2;
    this.camera.y = (viewH - mapH * this.camera.zoom) / 2;
  }

  /**
   * Main Render Pass with Viewport Culling & Multi-Layer Compositing
   */
  public render(tileMap: TileMap, options: RenderOptions, timestamp: number): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const timeSec = timestamp * 0.001;

    // Track FPS
    this.frameCount++;
    if (timestamp - this.fpsTimer >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = timestamp;
      if (this.onFpsUpdate) this.onFpsUpdate(this.fps);
    }

    const viewW = this.canvas.width / dpr;
    const viewH = this.canvas.height / dpr;
    const tileSize = tileMap.pixelsPerGrid;
    const zoom = this.camera.zoom;

    // Clear Screen (Void space)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#090b0e';
    ctx.fillRect(0, 0, viewW, viewH);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(this.camera.x, this.camera.y);
    ctx.scale(zoom, zoom);

    // Compute Viewport Culling bounds
    const minVisibleX = -this.camera.x / (zoom * tileSize);
    const minVisibleY = -this.camera.y / (zoom * tileSize);
    const maxVisibleX = (viewW - this.camera.x) / (zoom * tileSize);
    const maxVisibleY = (viewH - this.camera.y) / (zoom * tileSize);

    const startCol = Math.max(0, Math.floor(minVisibleX));
    const endCol   = Math.min(tileMap.width, Math.ceil(maxVisibleX));
    const startRow = Math.max(0, Math.floor(minVisibleY));
    const endRow   = Math.min(tileMap.height, Math.ceil(maxVisibleY));

    const mapWorldW = tileMap.width * tileSize;
    const mapWorldH = tileMap.height * tileSize;

    // Draw Map Frame & Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#151820';
    ctx.fillRect(0, 0, mapWorldW, mapWorldH);
    ctx.shadowBlur = 0;

    // 1. LAYER: TERRAIN
    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        const terrain = tileMap.getTerrain(x, y);
        if (terrain !== TileType.EMPTY) {
          const region = this.atlas.getTerrainRegion(terrain);
          if (region) {
            ctx.drawImage(
              this.atlas.canvas,
              region.x, region.y, region.width, region.height,
              x * tileSize, y * tileSize, tileSize, tileSize
            );
          }
        }
      }
    }

    // 2. LAYER: LIQUIDS (Water, Lava, Acid, Blood)
    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (tileMap.getLiquid(x, y) !== LiquidType.NONE) {
          this.liquidRenderer.renderLiquidTile(
            ctx,
            tileMap,
            x,
            y,
            tileSize,
            timeSec,
            options.animateWater
          );
        }
      }
    }

    // 3. LAYER: WALLS
    this.renderWalls(ctx, tileMap, startCol, endCol, startRow, endRow, tileSize);

    // 4. LAYER: DOORS
    this.renderDoors(ctx, tileMap, tileSize);

    // 5. LAYER: PROPS / OGGETTI
    this.renderProps(ctx, tileMap, tileSize);

    // 6. LAYER: DYNAMIC LIGHTS & GLOWING LIQUIDS
    if (options.showLighting) {
      this.renderLighting(ctx, tileMap, tileSize, timeSec);
    }

    // 7. LAYER: GRID OVERLAY
    if (options.showGrid) {
      this.renderGrid(ctx, tileMap, tileSize, startCol, endCol, startRow, endRow, options.gridThickness ?? 1);
    }

    // 8. LAYER: SELECTION & HOVER OVERLAY
    this.renderHoverAndSelection(ctx, tileMap, options, tileSize);

    ctx.restore();
  }

  // --- Props Layer ---
  private renderProps(ctx: CanvasRenderingContext2D, tileMap: TileMap, s: number): void {
    for (const prop of tileMap.props) {
      const asset = this.assetManager.getAssetById(prop.assetId);
      if (!asset) continue;

      const px = prop.x * s;
      const py = prop.y * s;
      const pw = prop.width * s * prop.scale;
      const ph = prop.height * s * prop.scale;

      ctx.save();
      ctx.translate(px, py);
      if (prop.rotation !== 0) {
        ctx.rotate(prop.rotation);
      }

      // Pure top-down 2D view (no perspective / drop shadows)
      if (asset.imageElement && asset.imageElement.complete) {
        ctx.drawImage(asset.imageElement, -pw * 0.5, -ph * 0.5, pw, ph);
      } else {
        // Fallback badge with icon
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.fillRect(-pw * 0.5, -ph * 0.5, pw, ph);
        ctx.strokeRect(-pw * 0.5, -ph * 0.5, pw, ph);
        ctx.font = `${Math.floor(s * 0.4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(asset.icon || '📦', 0, 0);
      }

      ctx.restore();
    }
  }

  // --- Walls Layer ---
  private renderWalls(
    ctx: CanvasRenderingContext2D,
    tileMap: TileMap,
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number,
    s: number
  ): void {
    const wallThick = Math.max(4, s * 0.12);

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        const mask = tileMap.getWall(x, y);
        if (mask === 0) continue;

        const dx = x * s;
        const dy = y * s;

        // Get the wall style stored for this specific cell
        const wallId = tileMap.getWallId(x, y);

        if (mask & WALL_BLOCK) {
          const rBlock = this.atlas.getWallRegion(`block_${wallId}`) || this.atlas.getWallRegion('block');
          if (rBlock) {
            ctx.drawImage(
              this.atlas.canvas,
              rBlock.x, rBlock.y, rBlock.width, rBlock.height,
              dx, dy, s, s
            );
          }
          continue;
        }

        // Edge walls — draw each edge using the per-cell atlas texture
        const rH = this.atlas.getWallRegion(`edge_h_${wallId}`) || this.atlas.getWallRegion('edge_h');
        const rV = this.atlas.getWallRegion(`edge_v_${wallId}`) || this.atlas.getWallRegion('edge_v');

        if (mask & WALL_NORTH) {
          if (rH) {
            ctx.drawImage(
              this.atlas.canvas,
              rH.x, rH.y, rH.width, rH.height,
              dx, dy - wallThick * 0.5, s, wallThick
            );
          }
        }
        if (mask & WALL_SOUTH) {
          if (rH) {
            ctx.drawImage(
              this.atlas.canvas,
              rH.x, rH.y, rH.width, rH.height,
              dx, dy + s - wallThick * 0.5, s, wallThick
            );
          }
        }
        if (mask & WALL_WEST) {
          if (rV) {
            ctx.drawImage(
              this.atlas.canvas,
              rV.x, rV.y, rV.width, rV.height,
              dx - wallThick * 0.5, dy, wallThick, s
            );
          }
        }
        if (mask & WALL_EAST) {
          if (rV) {
            ctx.drawImage(
              this.atlas.canvas,
              rV.x, rV.y, rV.width, rV.height,
              dx + s - wallThick * 0.5, dy, wallThick, s
            );
          }
        }
      }
    }
  }

  // --- Doors Layer ---
  private renderDoors(ctx: CanvasRenderingContext2D, tileMap: TileMap, s: number): void {
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

      if (door.state === DoorState.OPEN) {
        // Open door: green translucent arc showing door swing
        ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.rotate(-Math.PI * 0.25);
        ctx.fillRect(-s * 0.4, -6, s * 0.4, 12);
        ctx.strokeRect(-s * 0.4, -6, s * 0.4, 12);
      } else {
        // Closed door: draw from atlas texture
        const atlasRegion = this.atlas.getDoorRegion(door.type);
        if (atlasRegion) {
          // Draw the pre-rendered door texture centered on the edge
          ctx.drawImage(
            this.atlas.canvas,
            atlasRegion.x, atlasRegion.y, atlasRegion.width, atlasRegion.height,
            -s * 0.5, -s * 0.5, s, s
          );
        } else {
          // Fallback
          ctx.fillStyle = '#b45309';
          ctx.fillRect(-s * 0.4, -6, s * 0.8, 12);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.strokeRect(-s * 0.4, -6, s * 0.8, 12);
        }
      }

      ctx.restore();
    }
  }

  // --- Dynamic Lighting & Lava Glow ---
  private renderLighting(
    ctx: CanvasRenderingContext2D,
    tileMap: TileMap,
    s: number,
    timeSec: number
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Point lights
    for (const light of tileMap.lights) {
      const lx = light.x * s;
      const ly = light.y * s;
      let radiusPx = light.radius * s;

      if (light.flicker) {
        const flicker = Math.sin(timeSec * 8 + light.x * 3) * 0.05 + Math.cos(timeSec * 14) * 0.03;
        radiusPx *= (1.0 + flicker);
      }

      const grad = ctx.createRadialGradient(lx, ly, 2, lx, ly, radiusPx);
      grad.addColorStop(0, light.color);
      grad.addColorStop(0.3, light.color + 'aa');
      grad.addColorStop(0.7, light.color + '33');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, radiusPx, 0, Math.PI * 2);
      ctx.fill();

      // Flame center dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderGrid(
    ctx: CanvasRenderingContext2D,
    tileMap: TileMap,
    s: number,
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number,
    thickness = 1
  ): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = thickness;
    ctx.beginPath();

    for (let x = startCol; x <= endCol; x++) {
      ctx.moveTo(x * s, startRow * s);
      ctx.lineTo(x * s, endRow * s);
    }
    for (let y = startRow; y <= endRow; y++) {
      ctx.moveTo(startCol * s, y * s);
      ctx.lineTo(endCol * s, y * s);
    }
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = Math.max(2, thickness * 1.5);
    ctx.strokeRect(0, 0, tileMap.width * s, tileMap.height * s);
  }

  private renderHoverAndSelection(
    ctx: CanvasRenderingContext2D,
    tileMap: TileMap,
    options: RenderOptions,
    s: number
  ): void {
    // Prop Placement Ghosting Preview
    if (options.activeTool === 'prop' && options.activePropId && options.hoverWorld) {
      const asset = this.assetManager.getAssetById(options.activePropId);
      if (asset) {
        const pw = (options.propWidth ?? 1) * s;
        const ph = (options.propHeight ?? 1) * s;
        const rot = options.propRotation || 0;

        // Snapped grid placement
        const snapX = Math.round((options.hoverWorld.x / s) * 2) / 2 * s;
        const snapY = Math.round((options.hoverWorld.y / s) * 2) / 2 * s;

        ctx.save();
        ctx.translate(snapX, snapY);
        if (rot !== 0) ctx.rotate(rot);

        // Visual bounding box of tile footprint
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.fillRect(-pw * 0.5, -ph * 0.5, pw, ph);

        ctx.globalAlpha = 0.75;
        if (asset.imageElement && asset.imageElement.complete) {
          ctx.drawImage(asset.imageElement, -pw * 0.5, -ph * 0.5, pw, ph);
        } else {
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(-pw * 0.5, -ph * 0.5, pw, ph);
        }
        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(-pw * 0.5, -ph * 0.5, pw, ph);
        ctx.restore();
        return;
      }
    }

    // Selection Rect
    if (options.selectionRect) {
      const r = options.selectionRect;
      const rx = Math.min(r.x1, r.x2) * s;
      const ry = Math.min(r.y1, r.y2) * s;
      const rw = (Math.abs(r.x2 - r.x1) + 1) * s;
      const rh = (Math.abs(r.y2 - r.y1) + 1) * s;

      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
      return;
    }

    // Single Cell / Edge Hover
    if (options.hoverTile && tileMap.isInBounds(options.hoverTile.x, options.hoverTile.y)) {
      const hx = options.hoverTile.x * s;
      const hy = options.hoverTile.y * s;

      if (options.activeTool === 'wall' || options.activeTool === 'door') {
        const edge = options.hoverEdge || 'N';
        ctx.fillStyle = '#f59e0b';
        const thick = 6;
        if (edge === 'N') ctx.fillRect(hx, hy - thick * 0.5, s, thick);
        if (edge === 'S') ctx.fillRect(hx, hy + s - thick * 0.5, s, thick);
        if (edge === 'W') ctx.fillRect(hx - thick * 0.5, hy, thick, s);
        if (edge === 'E') ctx.fillRect(hx + s - thick * 0.5, hy, thick, s);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.fillRect(hx, hy, s, s);
        ctx.strokeRect(hx, hy, s, s);
      }
    }
  }

  // --- Coordinate conversions ---
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.camera.x) / this.camera.zoom,
      y: (screenY - this.camera.y) / this.camera.zoom
    };
  }

  public worldToTile(worldX: number, worldY: number, tileSize: number): { x: number; y: number } {
    return {
      x: Math.floor(worldX / tileSize),
      y: Math.floor(worldY / tileSize)
    };
  }

  public getNearestTileEdge(
    worldX: number,
    worldY: number,
    tileSize: number
  ): { tileX: number; tileY: number; edge: 'N' | 'E' | 'S' | 'W' } {
    const tileX = Math.floor(worldX / tileSize);
    const tileY = Math.floor(worldY / tileSize);
    const relX = (worldX - tileX * tileSize) / tileSize;
    const relY = (worldY - tileY * tileSize) / tileSize;

    const distN = relY;
    const distS = 1 - relY;
    const distW = relX;
    const distE = 1 - relX;

    const minDist = Math.min(distN, distS, distW, distE);
    let edge: 'N' | 'E' | 'S' | 'W' = 'N';
    if (minDist === distS) edge = 'S';
    else if (minDist === distW) edge = 'W';
    else if (minDist === distE) edge = 'E';

    return { tileX, tileY, edge };
  }
}
