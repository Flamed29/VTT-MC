/**
 * Core type definitions for VTT TileCraft
 */

export type AssetCategory = 'terrain' | 'liquid' | 'prop' | 'wall' | 'door';

export enum TileType {
  EMPTY = 0,
  STONE_FLOOR = 1,
  FLAGSTONE = 2,
  COBBLESTONE = 3,
  WOOD_PLANKS = 4,
  DIRT = 5,
  GRASS = 6,
  DUNGEON_TILES = 7,
  SAND = 8,
  CAVE_FLOOR = 9
}

export enum LiquidType {
  NONE = 0,
  WATER_SHALLOW = 1,
  WATER_DEEP = 2,
  WATER_CANAL = 3,
  WATER_MURKY = 4,
  LAVA = 5,
  BLOOD_ANCIENT = 6,
  TOXIC_SLIME = 7,
  HONEY_SAP = 8,
  ARCANE_MANA = 9,
  TAR_OIL = 10,
  // Legacy aliases
  ACID_POISON = 7,
  BLOOD_CRIMSON = 6
}

// Backward-compat alias
export { LiquidType as WaterType };

// Edge bitmasks for walls on a tile (North, East, South, West)
export const WALL_NONE  = 0;
export const WALL_NORTH = 1 << 0; // 1
export const WALL_EAST  = 1 << 1; // 2
export const WALL_SOUTH = 1 << 2; // 4
export const WALL_WEST  = 1 << 3; // 8
export const WALL_BLOCK = 1 << 4; // 16: full solid block tile

export enum DoorType {
  NONE = 0,
  STANDARD_DOOR = 1,
  DOUBLE_DOOR = 2,
  SECRET_DOOR = 3,
  BARRED_GATE = 4,
  WINDOW = 5
}

export enum DoorState {
  CLOSED = 0,
  OPEN = 1,
  LOCKED = 2
}

export interface DoorData {
  id: string;
  x: number;          // tile coordinate
  y: number;
  edge: 'N' | 'E' | 'S' | 'W';
  type: DoorType;
  state: DoorState;
}

export interface LightSource {
  id: string;
  x: number;          // world / tile float coordinate
  y: number;
  radius: number;     // in tiles
  intensity: number;  // 0.1 to 1.0
  color: string;      // hex color (e.g. #ff9933)
  flicker: boolean;
}

export interface PlacedProp {
  id: string;
  assetId: string;
  x: number;          // center/origin in grid units (float)
  y: number;
  width: number;      // in grid cells (default 1)
  height: number;     // in grid cells (default 1)
  rotation: number;   // angle in radians (0, PI/2, PI, 3PI/2)
  scale: number;      // 0.5 to 3.0
}

export interface AssetDefinition {
  id: string;
  name: string;
  category: AssetCategory;
  icon?: string;
  imageUrl?: string;        // dataUrl / blob / static path
  imageElement?: HTMLImageElement;
  isCustom?: boolean;
  builtinType?: number;     // for TileType, LiquidType, DoorType
  liquidConfig?: {
    colorDeep: string;
    colorShallow: string;
    foamColor: string;
    causticColor: string;
    isGlowing?: boolean;
    glowColor?: string;
  };
}

export type ToolType = 'pan' | 'terrain' | 'liquid' | 'prop' | 'wall' | 'door' | 'light' | 'erase';
export type BrushMode = 'single' | 'rect' | 'fill';

export interface Camera {
  x: number;       // camera center/offset in world px
  y: number;
  zoom: number;    // 0.2 to 5.0
}

export interface MapMetadata {
  name: string;
  width: number;
  height: number;
  pixelsPerGrid: number;
}

// Universal VTT Specification (.dd2vtt / .uvtt)
export interface UVTTPoint {
  x: number;
  y: number;
}

export interface UVTTPortal {
  position: UVTTPoint;
  bounds: UVTTPoint[];
  rotation: number;
  closed: boolean;
  freemove: boolean;
}

export interface UVTTLight {
  position: UVTTPoint;
  range: number;
  intensity: number;
  color: string;
  shadows: boolean;
}

export interface UniversalVTTFormat {
  format: number;
  resolution: {
    map_origin: UVTTPoint;
    map_size: UVTTPoint;
    pixels_per_grid: number;
  };
  line_of_sight: UVTTPoint[][];
  portals: UVTTPortal[];
  lights: UVTTLight[];
  image: string; // base64 encoded image
}
