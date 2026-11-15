import {
  TileType,
  LiquidType,
  WALL_NONE,
  WALL_NORTH,
  WALL_EAST,
  WALL_SOUTH,
  WALL_WEST,
  WALL_BLOCK,
  DoorData,
  LightSource,
  PlacedProp
} from '../types';
import { WALL_CATALOG } from '../data/wallCatalog';

interface HistorySnapshot {
  terrain: Uint16Array;
  liquid: Uint8Array;
  walls: Uint8Array;
  wallTypes: Uint8Array;
  doors: DoorData[];
  lights: LightSource[];
  props: PlacedProp[];
}

export class TileMap {
  public width: number;
  public height: number;
  public pixelsPerGrid: number;

  // Compact binary memory layout (TypedArrays)
  public terrain: Uint16Array;
  public liquid: Uint8Array;
  public walls: Uint8Array;
  /** Per-cell wall type index into WALL_CATALOG (0-based). 0 = default. */
  public wallTypes: Uint8Array;

  public doors: Map<string, DoorData> = new Map();
  public lights: LightSource[] = [];
  public props: PlacedProp[] = [];
  public activeWallId = 'wall_worked_stone';

  // Undo / Redo stacks
  private undoStack: HistorySnapshot[] = [];
  private redoStack: HistorySnapshot[] = [];
  private readonly maxHistory = 30;

  constructor(width = 30, height = 25, pixelsPerGrid = 100) {
    this.width = width;
    this.height = height;
    this.pixelsPerGrid = pixelsPerGrid;

    const size = width * height;
    this.terrain = new Uint16Array(size);
    this.liquid = new Uint8Array(size);
    this.walls = new Uint8Array(size);
    this.wallTypes = new Uint8Array(size); // 0 = wall_field_stone (index 0 in WALL_CATALOG)

    this.initDefaultGround();
  }

  // Alias for backward compat
  public get water(): Uint8Array {
    return this.liquid;
  }

  private initDefaultGround(): void {
    for (let i = 0; i < this.terrain.length; i++) {
      this.terrain[i] = TileType.STONE_FLOOR;
    }
  }

  public getIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  public isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  // --- Terrain Accessors ---
  public getTerrain(x: number, y: number): TileType {
    if (!this.isInBounds(x, y)) return TileType.EMPTY;
    return this.terrain[this.getIndex(x, y)];
  }

  public setTerrain(x: number, y: number, type: TileType): void {
    if (!this.isInBounds(x, y)) return;
    this.terrain[this.getIndex(x, y)] = type;
  }

  // --- Liquid Accessors ---
  public getLiquid(x: number, y: number): LiquidType {
    if (!this.isInBounds(x, y)) return LiquidType.NONE;
    return this.liquid[this.getIndex(x, y)];
  }

  public setLiquid(x: number, y: number, type: LiquidType): void {
    if (!this.isInBounds(x, y)) return;
    this.liquid[this.getIndex(x, y)] = type;
  }

  // Backward compatibility alias for water
  public getWater(x: number, y: number): LiquidType {
    return this.getLiquid(x, y);
  }

  public setWater(x: number, y: number, type: LiquidType): void {
    this.setLiquid(x, y, type);
  }

  // --- Wall Accessors ---
  public getWall(x: number, y: number): number {
    if (!this.isInBounds(x, y)) return WALL_NONE;
    return this.walls[this.getIndex(x, y)];
  }

  public setWall(x: number, y: number, mask: number): void {
    if (!this.isInBounds(x, y)) return;
    this.walls[this.getIndex(x, y)] = mask;
  }

  /** Returns the wall catalog ID string for a given cell. */
  public getWallId(x: number, y: number): string {
    if (!this.isInBounds(x, y)) return this.activeWallId;
    const idx = this.wallTypes[this.getIndex(x, y)];
    return WALL_CATALOG[idx]?.id ?? this.activeWallId;
  }

  /** Stores the currently-active wall type index for a cell. */
  public setWallTypeFromActiveId(x: number, y: number): void {
    if (!this.isInBounds(x, y)) return;
    const catIdx = WALL_CATALOG.findIndex(w => w.id === this.activeWallId);
    this.wallTypes[this.getIndex(x, y)] = catIdx >= 0 ? catIdx : 0;
  }

  public toggleWallEdge(x: number, y: number, edge: 'N' | 'E' | 'S' | 'W'): void {
    if (!this.isInBounds(x, y)) return;
    const idx = this.getIndex(x, y);

    let flag = 0;
    if (edge === 'N') flag = WALL_NORTH;
    else if (edge === 'E') flag = WALL_EAST;
    else if (edge === 'S') flag = WALL_SOUTH;
    else if (edge === 'W') flag = WALL_WEST;

    // If we're adding a wall (flag not set yet), stamp the current wall type
    const wasEmpty = (this.walls[idx] & flag) === 0;
    this.walls[idx] ^= flag;
    if (wasEmpty) {
      this.setWallTypeFromActiveId(x, y);
    }

    // Synchronize neighbor wall edge
    if (edge === 'N' && y > 0) this.walls[this.getIndex(x, y - 1)] ^= WALL_SOUTH;
    if (edge === 'S' && y < this.height - 1) this.walls[this.getIndex(x, y + 1)] ^= WALL_NORTH;
    if (edge === 'W' && x > 0) this.walls[this.getIndex(x - 1, y)] ^= WALL_EAST;
    if (edge === 'E' && x < this.width - 1) this.walls[this.getIndex(x + 1, y)] ^= WALL_WEST;
  }

  public setSolidBlockWall(x: number, y: number, solid: boolean): void {
    if (!this.isInBounds(x, y)) return;
    const idx = this.getIndex(x, y);
    if (solid) {
      this.walls[idx] = WALL_BLOCK | WALL_NORTH | WALL_EAST | WALL_SOUTH | WALL_WEST;
      this.setWallTypeFromActiveId(x, y);
    } else {
      this.walls[idx] = WALL_NONE;
    }
  }

  // --- Doors ---
  public getDoorKey(x: number, y: number, edge: 'N' | 'E' | 'S' | 'W'): string {
    return `${x},${y},${edge}`;
  }

  public addDoor(door: DoorData): void {
    const key = this.getDoorKey(door.x, door.y, door.edge);
    this.doors.set(key, door);
    const idx = this.getIndex(door.x, door.y);
    let flag = WALL_NORTH;
    if (door.edge === 'E') flag = WALL_EAST;
    if (door.edge === 'S') flag = WALL_SOUTH;
    if (door.edge === 'W') flag = WALL_WEST;
    this.walls[idx] |= flag;
  }

  public removeDoor(x: number, y: number, edge: 'N' | 'E' | 'S' | 'W'): void {
    const key = this.getDoorKey(x, y, edge);
    this.doors.delete(key);
  }

  // --- Props / Oggetti ---
  public addProp(prop: PlacedProp): void {
    this.props.push(prop);
  }

  public getPropAt(gridX: number, gridY: number): PlacedProp | undefined {
    for (let i = this.props.length - 1; i >= 0; i--) {
      const p = this.props[i];
      const hw = (p.width * p.scale) * 0.5;
      const hh = (p.height * p.scale) * 0.5;
      if (
        gridX >= p.x - hw &&
        gridX <= p.x + hw &&
        gridY >= p.y - hh &&
        gridY <= p.y + hh
      ) {
        return p;
      }
    }
    return undefined;
  }

  public removePropAt(gridX: number, gridY: number): PlacedProp | null {
    for (let i = this.props.length - 1; i >= 0; i--) {
      const p = this.props[i];
      const hw = (p.width * p.scale) * 0.5;
      const hh = (p.height * p.scale) * 0.5;
      if (
        gridX >= p.x - hw &&
        gridX <= p.x + hw &&
        gridY >= p.y - hh &&
        gridY <= p.y + hh
      ) {
        return this.props.splice(i, 1)[0];
      }
    }
    return null;
  }

  // --- Lights ---
  public addLight(light: LightSource): void {
    this.lights.push(light);
  }

  public removeLightAt(x: number, y: number, threshold = 0.8): LightSource | null {
    const idx = this.lights.findIndex(l => Math.hypot(l.x - x, l.y - y) <= threshold);
    if (idx !== -1) {
      return this.lights.splice(idx, 1)[0];
    }
    return null;
  }

  // --- Flood Fill Algorithm ---
  public floodFillTerrain(startX: number, startY: number, newTile: TileType): void {
    if (!this.isInBounds(startX, startY)) return;
    const targetTile = this.getTerrain(startX, startY);
    if (targetTile === newTile) return;

    this.saveState();
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(this.width * this.height);
    visited[this.getIndex(startX, startY)] = 1;

    while (queue.length > 0) {
      const [cx, cy] = queue.pop()!;
      this.setTerrain(cx, cy, newTile);

      const neighbors: [number, number][] = [
        [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (this.isInBounds(nx, ny)) {
          const nIdx = this.getIndex(nx, ny);
          if (!visited[nIdx] && this.terrain[nIdx] === targetTile) {
            visited[nIdx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  public floodFillLiquid(startX: number, startY: number, newLiquid: LiquidType): void {
    if (!this.isInBounds(startX, startY)) return;
    const targetLiquid = this.getLiquid(startX, startY);
    if (targetLiquid === newLiquid) return;

    this.saveState();
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(this.width * this.height);
    visited[this.getIndex(startX, startY)] = 1;

    while (queue.length > 0) {
      const [cx, cy] = queue.pop()!;
      this.setLiquid(cx, cy, newLiquid);

      const neighbors: [number, number][] = [
        [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (this.isInBounds(nx, ny)) {
          const nIdx = this.getIndex(nx, ny);
          if (!visited[nIdx] && this.liquid[nIdx] === targetLiquid) {
            visited[nIdx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  public floodFillWater(startX: number, startY: number, newWater: LiquidType): void {
    this.floodFillLiquid(startX, startY, newWater);
  }

  // --- Resize Map ---
  public resize(newW: number, newH: number): void {
    this.saveState();
    const newTerrain = new Uint16Array(newW * newH);
    const newLiquid = new Uint8Array(newW * newH);
    const newWalls = new Uint8Array(newW * newH);
    const newWallTypes = new Uint8Array(newW * newH);

    newTerrain.fill(TileType.STONE_FLOOR);

    const minW = Math.min(this.width, newW);
    const minH = Math.min(this.height, newH);

    for (let y = 0; y < minH; y++) {
      for (let x = 0; x < minW; x++) {
        const oldIdx = y * this.width + x;
        const newIdx = y * newW + x;
        newTerrain[newIdx] = this.terrain[oldIdx];
        newLiquid[newIdx] = this.liquid[oldIdx];
        newWalls[newIdx] = this.walls[oldIdx];
        newWallTypes[newIdx] = this.wallTypes[oldIdx];
      }
    }

    this.width = newW;
    this.height = newH;
    this.terrain = newTerrain;
    this.liquid = newLiquid;
    this.walls = newWalls;
    this.wallTypes = newWallTypes;

    // Prune out-of-bounds doors, lights, props
    for (const [key, door] of Array.from(this.doors.entries())) {
      if (door.x >= newW || door.y >= newH) {
        this.doors.delete(key);
      }
    }
    this.lights = this.lights.filter(l => l.x < newW && l.y < newH);
    this.props = this.props.filter(p => p.x < newW && p.y < newH);
  }

  // --- Memory Footprint Calculation ---
  public getMemoryUsageBytes(): number {
    const terrainBytes = this.terrain.byteLength;
    const liquidBytes = this.liquid.byteLength;
    const wallsBytes = this.walls.byteLength;
    const doorsEstimate = this.doors.size * 64;
    const lightsEstimate = this.lights.length * 64;
    const propsEstimate = this.props.length * 64;
    return terrainBytes + liquidBytes + wallsBytes + doorsEstimate + lightsEstimate + propsEstimate;
  }

  public getFormattedMemoryUsage(): string {
    const bytes = this.getMemoryUsageBytes();
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // --- Undo / Redo ---
  public saveState(): void {
    if (this.undoStack.length >= this.maxHistory) {
      this.undoStack.shift();
    }
    this.undoStack.push({
      terrain: new Uint16Array(this.terrain),
      liquid: new Uint8Array(this.liquid),
      walls: new Uint8Array(this.walls),
      wallTypes: new Uint8Array(this.wallTypes),
      doors: Array.from(this.doors.values()).map(d => ({ ...d })),
      lights: this.lights.map(l => ({ ...l })),
      props: this.props.map(p => ({ ...p }))
    });
    this.redoStack = [];
  }

  public undo(): boolean {
    if (this.undoStack.length === 0) return false;
    const current: HistorySnapshot = {
      terrain: new Uint16Array(this.terrain),
      liquid: new Uint8Array(this.liquid),
      walls: new Uint8Array(this.walls),
      wallTypes: new Uint8Array(this.wallTypes),
      doors: Array.from(this.doors.values()).map(d => ({ ...d })),
      lights: this.lights.map(l => ({ ...l })),
      props: this.props.map(p => ({ ...p }))
    };
    this.redoStack.push(current);

    const prev = this.undoStack.pop()!;
    this.terrain.set(prev.terrain);
    this.liquid.set(prev.liquid);
    this.walls.set(prev.walls);
    this.wallTypes.set(prev.wallTypes);
    this.doors.clear();
    for (const d of prev.doors) {
      this.doors.set(this.getDoorKey(d.x, d.y, d.edge), d);
    }
    this.lights = prev.lights;
    this.props = prev.props;
    return true;
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) return false;
    const current: HistorySnapshot = {
      terrain: new Uint16Array(this.terrain),
      liquid: new Uint8Array(this.liquid),
      walls: new Uint8Array(this.walls),
      wallTypes: new Uint8Array(this.wallTypes),
      doors: Array.from(this.doors.values()).map(d => ({ ...d })),
      lights: this.lights.map(l => ({ ...l })),
      props: this.props.map(p => ({ ...p }))
    };
    this.undoStack.push(current);

    const next = this.redoStack.pop()!;
    this.terrain.set(next.terrain);
    this.liquid.set(next.liquid);
    this.walls.set(next.walls);
    this.wallTypes.set(next.wallTypes);
    this.doors.clear();
    for (const d of next.doors) {
      this.doors.set(this.getDoorKey(d.x, d.y, d.edge), d);
    }
    this.lights = next.lights;
    this.props = next.props;
    return true;
  }

  public clear(fillTile = TileType.STONE_FLOOR): void {
    this.saveState();
    this.terrain.fill(fillTile);
    this.liquid.fill(LiquidType.NONE);
    this.walls.fill(WALL_NONE);
    this.wallTypes.fill(0);
    this.doors.clear();
    this.lights = [];
    this.props = [];
  }
}
