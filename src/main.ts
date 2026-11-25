import './style.css';
import { TileMap } from './core/TileMap';
import { AssetManager } from './core/AssetManager';
import { ViewportRenderer } from './rendering/ViewportRenderer';
import { VttExporter } from './vtt/VttExporter';
import {
  TileType,
  LiquidType,
  WALL_NORTH,
  WALL_EAST,
  WALL_SOUTH,
  WALL_WEST,
  DoorType,
  DoorState,
  ToolType,
  BrushMode,
  AssetCategory,
  AssetDefinition,
  FoliageType,
  SavedMapEntry,
  TileMapJSON
} from './types';

import { FoliageBrush } from './foliage/FoliageBrush';
import { TouchHandler } from './touch/TouchHandler';
import { FOLIAGE_VARIANTS, FoliageModel } from './foliage/FoliageModel';
import { MapStorage } from './core/MapStorage';
import { DrawingManager } from './drawing/DrawingManager';

class EditorApp {
  public tileMap: TileMap;
  public assetManager: AssetManager;
  public renderer: ViewportRenderer;

  public activeTool: ToolType = 'terrain';
  public brushMode: BrushMode = 'single';
  public activeCategoryFilter: AssetCategory | 'all' = 'all';
  public activeSubcat = 'all';
  public searchQuery = '';

  // Map Library & Saved Map state
  public currentMapName = 'Dungeon Iniziale';
  public currentMapId: string | null = null;

  // Fog of War (Nebbia di Guerra) state
  public showFog = true;
  public fogMode: 'hide' | 'reveal' = 'hide';

  // Selected Assets
  public selectedTerrain: TileType = TileType.STONE_FLOOR;
  public selectedLiquid: LiquidType = LiquidType.WATER_SHALLOW;
  public selectedDoorType: DoorType = DoorType.STANDARD_DOOR;
  public selectedDoorState: DoorState = DoorState.CLOSED;
  public selectedPropAssetId = 'p_wood_table';
  public propRotation = 0; // in radians
  public propWidth = 1;    // default 1 quadratino
  public propHeight = 1;   // default 1 quadratino

  // Brush (landscape-style painting) settings
  public brushRadius = 2;        // in tiles (like UE brush size)
  public brushHardness = 0.6;    // 0.0 = fully soft, 1.0 = hard edge
  public brushOpacity = 0.85;    // 0.0 to 1.0 (scatter probability at falloff)

  public lightSettings = {
    radius: 4.5,
    intensity: 0.8,
    color: '#ff9933',
    flicker: true
  };

  // Foliage Overlay Brush Settings (Unreal Engine Foliage style)
  public selectedFoliageVariantId = 0;
  public selectedFoliageType: FoliageType = 'grass_tuft_lush';
  public foliageBrushRadius = 1.8;  // in tiles
  public foliageDensity = 16;       // candidates per stroke
  public foliageMinDistance = 0.28; // Poisson-disk exclusion radius (in tiles)
  public foliageScale = 1.0;        // base size
  public foliageScaleJitter = 0.3;  // size variation ±30%
  public foliageBrush: FoliageBrush;

  // Eraser Filters (Selective removal)
  public eraseFilters = {
    foliage: true, // Erba & fasci d'erba sovrapposti
    props: true,
    lights: true,
    liquid: true,
    walls: true,
    doors: true,
    terrain: false, // don't wipe floor by default
    drawing: true   // disegni overlay
  };

  // Drawing Overlay System
  public drawingManager: DrawingManager = new DrawingManager();

  // Interaction State
  private isMouseDown = false;
  private isPanning = false;
  private panStart = { x: 0, y: 0 };
  private dragStartTile = { x: 0, y: 0 };
  private hoverTile: { x: number; y: number } | undefined;
  private hoverEdge: 'N' | 'E' | 'S' | 'W' | undefined;
  private hoverWorld: { x: number; y: number } | undefined;

  // View Options
  public showGrid = true;
  public gridThickness = 1.0;
  public animateWater = true;
  public showLighting = true;

  // Presentation Mode
  public isPresentationOpen = false;
  public presentationRenderer: ViewportRenderer | null = null;
  private isPresPanning = false;
  private presPanStart = { x: 0, y: 0 };
  private presHintTimeout: number | null = null;

  // Dual Screen / External Pop-out Window
  public externalWindow: Window | null = null;
  public externalRenderer: ViewportRenderer | null = null;

  // Modal State
  private pendingAssetFile: string | null = null;

  constructor() {
    this.tileMap = new TileMap(30, 25, 100);
    this.foliageBrush = new FoliageBrush(this.tileMap.foliageIndex);
    this.assetManager = new AssetManager();
    const canvas = document.getElementById('viewport-canvas') as HTMLCanvasElement;
    this.renderer = new ViewportRenderer(canvas, this.assetManager);

    this.renderer.onFpsUpdate = (fps) => {
      const el = document.getElementById('stat-fps');
      if (el) el.textContent = `${fps} FPS`;
    };

    this.initUI();
    this.initCanvasEvents();
    this.initKeyboardShortcuts();
    this.initModalEvents();
    this.initPresentationEvents();
    this.initMapLibraryEvents();
    this.initDrawingToolsWindow();
    this.updatePaletteUI();
    this.updateStatusTelemetry();

    setTimeout(() => {
      this.renderer.centerOnMap(this.tileMap);
    }, 50);

    this.loadDungeonPreset();
    this.startLoop();
  }

  private startLoop(): void {
    const loop = (timestamp: number) => {
      this.renderer.render(
        this.tileMap,
        {
          showGrid: this.showGrid,
          gridThickness: this.gridThickness,
          animateWater: this.animateWater,
          showLighting: this.showLighting,
          hoverTile: this.hoverTile,
          hoverEdge: this.hoverEdge,
          hoverWorld: this.hoverWorld,
          selectionRect:
            this.isMouseDown && this.brushMode === 'rect' && this.hoverTile
              ? {
                  x1: this.dragStartTile.x,
                  y1: this.dragStartTile.y,
                  x2: this.hoverTile.x,
                  y2: this.hoverTile.y
                }
              : undefined,
          activeTool: this.activeTool,
          activePropId: this.selectedPropAssetId,
          propRotation: this.propRotation,
          propWidth: this.propWidth,
          propHeight: this.propHeight,
          // Brush tool params for preview rendering
          brushMode: this.brushMode,
          brushRadius: this.brushRadius,
          brushHardness: this.brushHardness,
          brushOpacity: this.brushOpacity,
          // Foliage brush preview options
          foliageBrushRadius: this.foliageBrushRadius,
          foliageType: this.selectedFoliageType,
          // Fog of War options
          showFog: this.showFog,
          isPlayerView: false,
          fogMode: this.fogMode,
          // Drawing overlay
          drawingManager: this.drawingManager
        },
        timestamp
      );

      // Render Presentation View if open (pure map, no tools/brushes/UI, player fog view)
      if (this.isPresentationOpen && this.presentationRenderer) {
        this.presentationRenderer.render(
          this.tileMap,
          {
            showGrid: this.showGrid,
            gridThickness: this.gridThickness,
            animateWater: this.animateWater,
            showLighting: this.showLighting,
            showFog: true,
            isPlayerView: true,
            activeTool: 'none',
            drawingManager: this.drawingManager
          },
          timestamp
        );
      }

      // Render External Dual Screen Window if open (pure map for players on 2nd monitor)
      if (this.externalWindow && !this.externalWindow.closed && this.externalRenderer) {
        this.externalRenderer.render(
          this.tileMap,
          {
            showGrid: this.showGrid,
            gridThickness: this.gridThickness,
            animateWater: this.animateWater,
            showLighting: this.showLighting,
            showFog: true,
            isPlayerView: true,
            activeTool: 'none',
            drawingManager: this.drawingManager
          },
          timestamp
        );
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  // --- UI Initialization ---
  private initUI(): void {
    // Tool buttons
    const toolBtns = document.querySelectorAll<HTMLButtonElement>('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTool = btn.dataset.tool as ToolType;

        // Auto filter category tab based on tool
        if (this.activeTool === 'terrain') this.setCategoryFilter('terrain');
        else if (this.activeTool === 'liquid') this.setCategoryFilter('liquid');
        else if (this.activeTool === 'prop') this.setCategoryFilter('prop');
        else if (this.activeTool === 'door') this.setCategoryFilter('door');
        else this.setCategoryFilter('all');

        this.updatePaletteUI();
      });
    });

    // Category Filter Tabs
    const catTabs = document.querySelectorAll<HTMLButtonElement>('.cat-tab');
    catTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.dataset.cat as AssetCategory | 'all';
        this.setCategoryFilter(cat);
      });
    });

    // Brush modes
    const modeBtns = document.querySelectorAll<HTMLButtonElement>('.brush-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.brushMode = btn.dataset.mode as BrushMode;
        // Refresh palette to show/hide brush controls
        this.updatePaletteUI();
      });
    });

    // Checkboxes
    const chkGrid = document.getElementById('chk-grid') as HTMLInputElement;
    chkGrid?.addEventListener('change', () => { this.showGrid = chkGrid.checked; });

    // Grid Thickness Slider
    const sliderGridThick = document.getElementById('slider-grid-thick') as HTMLInputElement;
    const valGridThick = document.getElementById('val-grid-thick');
    sliderGridThick?.addEventListener('input', () => {
      this.gridThickness = parseFloat(sliderGridThick.value);
      if (valGridThick) valGridThick.textContent = `${this.gridThickness} px`;
    });

    const chkWater = document.getElementById('chk-water-fx') as HTMLInputElement;
    chkWater?.addEventListener('change', () => { this.animateWater = chkWater.checked; });

    const chkLighting = document.getElementById('chk-lighting') as HTMLInputElement;
    chkLighting?.addEventListener('change', () => { this.showLighting = chkLighting.checked; });

    const chkFog = document.getElementById('chk-fog') as HTMLInputElement;
    chkFog?.addEventListener('change', () => { this.showFog = chkFog.checked; });

    // Eraser Settings Button & Popover
    const btnEraserSettings = document.getElementById('btn-eraser-settings');
    const popover = document.getElementById('eraser-popover');
    const btnClosePopover = document.getElementById('btn-close-popover');

    btnEraserSettings?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = popover?.style.display === 'flex';
      if (popover) popover.style.display = isVisible ? 'none' : 'flex';
      btnEraserSettings.classList.toggle('active', !isVisible);
    });

    btnClosePopover?.addEventListener('click', () => {
      if (popover) popover.style.display = 'none';
      btnEraserSettings?.classList.remove('active');
    });

    // Close popover when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (popover && popover.style.display === 'flex' && !popover.contains(e.target as Node) && e.target !== btnEraserSettings) {
        popover.style.display = 'none';
        btnEraserSettings?.classList.remove('active');
      }
    });

    // Bind Popover Checkboxes
    const bindFilter = (id: string, key: keyof typeof this.eraseFilters) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) {
        el.checked = this.eraseFilters[key];
        el.addEventListener('change', () => {
          this.eraseFilters[key] = el.checked;
          this.updatePaletteUI();
        });
      }
    };
    bindFilter('pop-ef-foliage', 'foliage');
    bindFilter('pop-ef-props', 'props');
    bindFilter('pop-ef-lights', 'lights');
    bindFilter('pop-ef-liquid', 'liquid');
    bindFilter('pop-ef-walls', 'walls');
    bindFilter('pop-ef-doors', 'doors');
    bindFilter('pop-ef-terrain', 'terrain');
    bindFilter('pop-ef-drawing', 'drawing');

    // Palette Search Bar
    const searchInput = document.getElementById('palette-search') as HTMLInputElement;
    const btnClearSearch = document.getElementById('btn-clear-search');

    searchInput?.addEventListener('input', () => {
      this.searchQuery = searchInput.value;
      if (btnClearSearch) btnClearSearch.style.display = this.searchQuery ? 'block' : 'none';
      this.updatePaletteUI();
    });

    btnClearSearch?.addEventListener('click', () => {
      this.searchQuery = '';
      if (searchInput) searchInput.value = '';
      btnClearSearch.style.display = 'none';
      this.updatePaletteUI();
    });

    // Grid size selector
    const selGrid = document.getElementById('select-grid-px') as HTMLSelectElement;
    selGrid?.addEventListener('change', () => {
      this.tileMap.pixelsPerGrid = parseInt(selGrid.value, 10);
      this.renderer.centerOnMap(this.tileMap);
      this.updateStatusTelemetry();
    });

    // Map resize inputs
    const btnResize = document.getElementById('btn-resize-map');
    btnResize?.addEventListener('click', () => {
      const inW = document.getElementById('input-map-w') as HTMLInputElement;
      const inH = document.getElementById('input-map-h') as HTMLInputElement;
      const nw = Math.max(5, Math.min(200, parseInt(inW.value, 10) || 30));
      const nh = Math.max(5, Math.min(200, parseInt(inH.value, 10) || 25));
      this.tileMap.resize(nw, nh);
      this.renderer.centerOnMap(this.tileMap);
      this.updateStatusTelemetry();
    });

    // Undo / Redo / Clear / Reset View
    document.getElementById('btn-undo')?.addEventListener('click', () => this.handleUndo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.handleRedo());
    document.getElementById('btn-clear')?.addEventListener('click', () => {
      if (confirm('Sei sicuro di voler pulire la mappa?')) {
        this.tileMap.clear();
        this.updateStatusTelemetry();
      }
    });
    document.getElementById('btn-reset-zoom')?.addEventListener('click', () => {
      this.renderer.centerOnMap(this.tileMap);
      this.updateStatusTelemetry();
    });

    // Export buttons
    document.getElementById('btn-export-vtt')?.addEventListener('click', () => this.exportVTT());
    document.getElementById('btn-export-png')?.addEventListener('click', () => this.exportPNG());

    // Presets
    document.getElementById('preset-dungeon')?.addEventListener('click', () => this.loadDungeonPreset());
    document.getElementById('preset-tavern')?.addEventListener('click', () => this.loadTavernPreset());
    document.getElementById('preset-lava')?.addEventListener('click', () => this.loadLavaPreset());
    document.getElementById('preset-cave')?.addEventListener('click', () => this.loadCavePreset());
  }

  private setCategoryFilter(cat: AssetCategory | 'all'): void {
    this.activeCategoryFilter = cat;
    this.activeSubcat = 'all';
    const catTabs = document.querySelectorAll<HTMLButtonElement>('.cat-tab');
    catTabs.forEach(t => {
      if (t.dataset.cat === cat) t.classList.add('active');
      else t.classList.remove('active');
    });
    this.updatePaletteUI();
  }

  // --- Dynamic Palette UI ---
  private updatePaletteUI(): void {
    const titleEl = document.getElementById('palette-title')!;
    const subEl = document.getElementById('palette-subtitle')!;
    const bodyEl = document.getElementById('palette-body')!;
    bodyEl.innerHTML = '';

    if (this.activeTool === 'pan') {
      titleEl.textContent = 'Navigazione';
      subEl.textContent = 'Sposta e zooma la mappa';
      bodyEl.innerHTML = `
        <div style="font-size: 0.8rem; line-height: 1.5; color: var(--text-muted);">
          <p>• <strong>Trascina</strong> per navigare.</p>
          <p>• <strong>Rotella</strong> per zoomare.</p>
          <p>• <strong>Spazio / Tasto Destro</strong> per navigare in qualsiasi momento.</p>
        </div>
      `;
      return;
    }

    if (this.activeTool === 'wall') {
      titleEl.textContent = 'Muri VTT';
      subEl.textContent = 'Linea di Vista (LoS)';
      bodyEl.innerHTML = `
        <div style="font-size: 0.8rem; line-height: 1.5; color: var(--text-muted);">
          <p>• Clicca vicino a un <strong>bordo della casella</strong> per piazzare o togliere pareti.</p>
          <p>• Usa <strong>Rettangolo</strong> per erigere intere stanze con muri perimetrali!</p>
          <p style="margin-top: 0.5rem; color: var(--primary);">I muri verranno fusi automaticamente all'esportazione VTT.</p>
        </div>
      `;
      return;
    }

    if (this.activeTool === 'foliage') {
      titleEl.textContent = 'Foliage & Fasci d\'Erba';
      subEl.textContent = 'Strato erba sovrapposto (stile Unreal Engine)';
      this.renderFoliageControls(bodyEl);
      return;
    }

    if (this.activeTool === 'light') {
      titleEl.textContent = 'Sorgenti di Luce';
      subEl.textContent = 'Illuminazione dinamica VTT';
      this.renderLightControls(bodyEl);
      return;
    }

    if (this.activeTool === 'fog') {
      titleEl.textContent = 'Nebbia di Guerra';
      subEl.textContent = 'Nascondi o rivela aree ai giocatori';
      this.renderFogControls(bodyEl);
      return;
    }

    if (this.activeTool === 'draw') {
      titleEl.textContent = 'Disegno Overlay';
      subEl.textContent = 'Annotazioni di sessione';
      this.renderDrawingPaletteInfo(bodyEl);
      return;
    }

    if (this.activeTool === 'interact') {
      titleEl.textContent = 'Strumento Interazione';
      subEl.textContent = 'Apri / Chiudi porte durante la sessione';
      bodyEl.innerHTML = `
        <div style="font-size: 0.8rem; line-height: 1.6; color: var(--text-muted);">
          <p style="color: var(--primary); font-weight: 600; margin-bottom: 0.5rem;">👆 Modalità Interazione</p>
          <p>• <strong>Clicca su una porta</strong> per aprirla o chiuderla istantaneamente.</p>
          <p style="margin-top:0.3rem;">• La porta <strong>scorre lateralmente</strong> lungo il muro quando aperta.</p>
          <p style="margin-top:0.3rem;">• Funziona anche nella <strong>finestra di Presentazione</strong> (non ancora).</p>
          <p style="margin-top:0.5rem; color: var(--accent-cyan);">💡 Usa lo strumento <strong>Porta</strong> per piazzare nuove porte, e <strong>Interazione</strong> per gestirle durante il gioco.</p>
        </div>
        <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-sm); border: 1px solid var(--border); font-size: 0.75rem; color: var(--text-muted);">
          <div id="interact-door-status">Nessuna porta selezionata</div>
        </div>
      `;
      return;
    }

    if (this.activeTool === 'erase') {
      titleEl.textContent = 'Proprietà Gomma';
      subEl.textContent = 'Filtra gli elementi da cancellare';

      bodyEl.innerHTML = `
        <div style="font-size: 0.78rem; line-height: 1.4; color: var(--text-muted); margin-bottom: 0.5rem;">
          Seleziona quali tipi di elementi rimuovere al passaggio della gomma:
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.45rem; background: var(--bg-input); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border);">
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-foliage" ${this.eraseFilters.foliage ? 'checked' : ''} /> <strong>🌿 Erba & Foliage Sovrapposto</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-props" ${this.eraseFilters.props ? 'checked' : ''} /> <strong>📦 Oggetti / Props</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-lights" ${this.eraseFilters.lights ? 'checked' : ''} /> <strong>🔥 Luci Dinamiche</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-liquid" ${this.eraseFilters.liquid ? 'checked' : ''} /> <strong>🌊 Liquidi (Acqua, Lava, Veleno)</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-walls" ${this.eraseFilters.walls ? 'checked' : ''} /> <strong>🛡️ Muri (Ostacoli LoS)</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-doors" ${this.eraseFilters.doors ? 'checked' : ''} /> <strong>🚪 Porte & Varchi</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-terrain" ${this.eraseFilters.terrain ? 'checked' : ''} /> <strong>🧱 Terreno (Pavimentazione)</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-drawing" ${this.eraseFilters.drawing ? 'checked' : ''} /> <strong>✏️ Disegni / Annotazioni</strong></label>
        </div>

        <div style="display: flex; gap: 0.4rem; margin-top: 0.4rem;">
          <button id="btn-ef-all" class="btn btn-secondary btn-xs" style="flex: 1;">Tutti</button>
          <button id="btn-ef-only-props" class="btn btn-secondary btn-xs" style="flex: 1;">Solo Oggetti</button>
          <button id="btn-ef-only-lights" class="btn btn-secondary btn-xs" style="flex: 1;">Solo Luci</button>
        </div>

        <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 0.6rem; line-height: 1.4;">
          💡 <em>Esempio: per cancellare un tile di lava mantenendo la sua luce, disattiva "Luci" e lascia attivo "Liquidi".</em>
        </div>
      `;

      // Panel Checkbox Listeners & Sync with popover
      const bindPanelCheck = (id: string, popId: string, key: keyof typeof this.eraseFilters) => {
        const chk = bodyEl.querySelector(`#${id}`) as HTMLInputElement;
        const popChk = document.getElementById(popId) as HTMLInputElement;
        chk?.addEventListener('change', () => {
          this.eraseFilters[key] = chk.checked;
          if (popChk) popChk.checked = chk.checked;
        });
      };
      bindPanelCheck('ef-panel-foliage', 'pop-ef-foliage', 'foliage');
      bindPanelCheck('ef-panel-props', 'pop-ef-props', 'props');
      bindPanelCheck('ef-panel-lights', 'pop-ef-lights', 'lights');
      bindPanelCheck('ef-panel-liquid', 'pop-ef-liquid', 'liquid');
      bindPanelCheck('ef-panel-walls', 'pop-ef-walls', 'walls');
      bindPanelCheck('ef-panel-doors', 'pop-ef-doors', 'doors');
      bindPanelCheck('ef-panel-terrain', 'pop-ef-terrain', 'terrain');
      bindPanelCheck('ef-panel-drawing', 'pop-ef-drawing', 'drawing');

      bodyEl.querySelector('#btn-ef-all')?.addEventListener('click', () => {
        Object.keys(this.eraseFilters).forEach(k => (this.eraseFilters as any)[k] = true);
        this.syncAllEraserCheckboxes();
        this.updatePaletteUI();
      });

      bodyEl.querySelector('#btn-ef-only-props')?.addEventListener('click', () => {
        Object.keys(this.eraseFilters).forEach(k => (this.eraseFilters as any)[k] = false);
        this.eraseFilters.props = true;
        this.syncAllEraserCheckboxes();
        this.updatePaletteUI();
      });

      bodyEl.querySelector('#btn-ef-only-lights')?.addEventListener('click', () => {
        Object.keys(this.eraseFilters).forEach(k => (this.eraseFilters as any)[k] = false);
        this.eraseFilters.lights = true;
        this.syncAllEraserCheckboxes();
        this.updatePaletteUI();
      });

      return;
    }

    // Render Subcategory Pills (pinned above swatches)
    this.renderSubcategoryPills();

    // Swatches display for Terrain, Liquid, Prop, Wall, Door
    titleEl.textContent = this.getCategoryTitle(this.activeCategoryFilter);
    subEl.textContent = this.searchQuery
      ? `Filtro: "${this.searchQuery}"`
      : 'Clicca per selezionare • [+ Aggiungi] per importare';

    this.renderFilteredSwatches(bodyEl, this.activeCategoryFilter);

    // If Prop tool or prop category selected, show dimension and rotation controls
    if (this.activeTool === 'prop' || this.activeCategoryFilter === 'prop') {
      this.renderPropSizeControls(bodyEl);
    }

    // If brush mode is active and tool is terrain/liquid, show brush controls
    if (this.brushMode === 'brush' && (this.activeTool === 'terrain' || this.activeTool === 'liquid')) {
      this.renderBrushControls(bodyEl);
    }

    // If Door tool or door category selected, also show door state controls
    if (this.activeTool === 'door' || this.activeCategoryFilter === 'door') {
      this.renderDoorStateControls(bodyEl);
    }
  }

  private renderSubcategoryPills(): void {
    const pillsContainer = document.getElementById('subcategory-pills');
    if (!pillsContainer) return;
    pillsContainer.innerHTML = '';

    let subcats: { id: string; label: string }[] = [];

    if (this.activeCategoryFilter === 'terrain') {
      subcats = [
        { id: 'all', label: 'Tutti (100)' },
        { id: 'natural', label: '🌱 Naturali (25)' },
        { id: 'snow_ice', label: '❄️ Neve (10)' },
        { id: 'cave', label: '🦇 Grotte (15)' },
        { id: 'urban', label: '🏛️ Urbani (25)' },
        { id: 'fantasy_alien', label: '🔮 Magici (25)' }
      ];
    } else if (this.activeCategoryFilter === 'prop') {
      subcats = [
        { id: 'all', label: 'Tutti (100)' },
        { id: 'furniture', label: '🪵 Arredo (25)' },
        { id: 'magic_light', label: '🔮 Magia (15)' },
        { id: 'containers', label: '📦 Merci (15)' },
        { id: 'military', label: '⚔️ Militare (15)' },
        { id: 'nature', label: '🌲 Natura (15)' },
        { id: 'dungeon', label: '💀 Dungeon (15)' }
      ];
    }

    if (subcats.length > 0) {
      pillsContainer.style.display = 'flex';
      subcats.forEach(sc => {
        const pill = document.createElement('button');
        pill.className = `subcat-pill ${this.activeSubcat === sc.id ? 'active' : ''}`;
        pill.textContent = sc.label;
        pill.addEventListener('click', () => {
          this.activeSubcat = sc.id;
          this.updatePaletteUI();
        });
        pillsContainer.appendChild(pill);
      });
    } else {
      pillsContainer.style.display = 'none';
    }
  }

  private getCategoryTitle(cat: AssetCategory | 'all'): string {
    switch (cat) {
      case 'terrain': return 'Palette Terreni (100)';
      case 'liquid': return 'Palette Liquidi (10)';
      case 'wall': return 'Muri VTT (10)';
      case 'prop': return 'Oggetti & Props (100)';
      case 'door': return 'Porte & Varchi (5)';
      default: return 'Catalogo Completo (215 Asset)';
    }
  }

  private renderFilteredSwatches(container: HTMLElement, category: AssetCategory | 'all'): void {
    const assets = this.assetManager.getAssetsByCategory(category, this.activeSubcat, this.searchQuery);

    if (assets.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.cssText = 'text-align: center; color: var(--text-dim); font-size: 0.8rem; padding: 2rem 0;';
      emptyMsg.textContent = 'Nessun asset corrispondente alla ricerca.';
      container.appendChild(emptyMsg);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'swatches-grid';

    assets.forEach(asset => {
      const isSelected =
        (asset.category === 'terrain' && asset.builtinType === this.selectedTerrain) ||
        (asset.category === 'liquid' && asset.builtinType === this.selectedLiquid) ||
        (asset.category === 'wall' && asset.id === this.tileMap.activeWallId) ||
        (asset.category === 'prop' && asset.id === this.selectedPropAssetId) ||
        (asset.category === 'door' && asset.builtinType === this.selectedDoorType);

      const el = document.createElement('div');
      el.className = `swatch-item ${isSelected ? 'active' : ''}`;

      let previewContent = asset.icon || '📦';
      if (asset.imageUrl) {
        previewContent = `<img src="${asset.imageUrl}" alt="${asset.name}" />`;
      }

      el.innerHTML = `
        <div class="swatch-preview">${previewContent}</div>
        <span class="swatch-name" title="${asset.name}">${asset.name}</span>
        ${asset.isCustom ? `<span class="swatch-delete" title="Elimina asset personalizzato">&times;</span>` : ''}
      `;

      el.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('swatch-delete')) {
          e.stopPropagation();
          if (confirm(`Eliminare l'asset "${asset.name}"?`)) {
            this.assetManager.removeCustomAsset(asset.id);
            this.updatePaletteUI();
          }
          return;
        }

        grid.querySelectorAll('.swatch-item').forEach(s => s.classList.remove('active'));
        el.classList.add('active');

        if (asset.category === 'terrain') {
          this.selectedTerrain = asset.builtinType || 1;
          this.switchTool('terrain');
        } else if (asset.category === 'liquid') {
          this.selectedLiquid = asset.builtinType || 1;
          this.switchTool('liquid');
        } else if (asset.category === 'wall') {
          this.tileMap.activeWallId = asset.id;
          this.switchTool('wall');
        } else if (asset.category === 'prop') {
          this.selectedPropAssetId = asset.id;
          this.switchTool('prop');
        } else if (asset.category === 'door') {
          this.selectedDoorType = asset.builtinType || DoorType.STANDARD_DOOR;
          this.switchTool('door');
        }
      });

      grid.appendChild(el);
    });

    container.appendChild(grid);
  }

  private switchTool(tool: ToolType): void {
    this.activeTool = tool;
    const toolBtns = document.querySelectorAll<HTMLButtonElement>('.tool-btn');
    toolBtns.forEach(btn => {
      if (btn.dataset.tool === tool) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  private syncAllEraserCheckboxes(): void {
    const set = (id: string, val: boolean) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) el.checked = val;
    };
    set('pop-ef-foliage', this.eraseFilters.foliage);
    set('pop-ef-props', this.eraseFilters.props);
    set('pop-ef-lights', this.eraseFilters.lights);
    set('pop-ef-liquid', this.eraseFilters.liquid);
    set('pop-ef-walls', this.eraseFilters.walls);
    set('pop-ef-doors', this.eraseFilters.doors);
    set('pop-ef-terrain', this.eraseFilters.terrain);
    set('pop-ef-drawing', this.eraseFilters.drawing);
  }

  private renderPropSizeControls(container: HTMLElement): void {
    const sizeCtrl = document.createElement('div');
    sizeCtrl.className = 'palette-control';
    sizeCtrl.style.marginTop = '0.6rem';
    sizeCtrl.style.paddingTop = '0.6rem';
    sizeCtrl.style.borderTop = '1px solid var(--border)';

    const rotDeg = Math.round((this.propRotation * 180) / Math.PI);

    sizeCtrl.innerHTML = `
      <div class="palette-control-row">
        <span>Dimensione (Celle Griglia):</span>
        <strong id="val-prop-size" style="color: var(--primary);">${this.propWidth} × ${this.propHeight}</strong>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.25rem; margin-top: 0.35rem;">
        <button class="btn btn-secondary btn-xs ${this.propWidth === 1 && this.propHeight === 1 ? 'active' : ''}" data-pw="1" data-ph="1" title="1 quadratino (Standard)">1×1</button>
        <button class="btn btn-secondary btn-xs ${this.propWidth === 2 && this.propHeight === 1 ? 'active' : ''}" data-pw="2" data-ph="1" title="2×1 (Tavoli, Altari)">2×1</button>
        <button class="btn btn-secondary btn-xs ${this.propWidth === 2 && this.propHeight === 2 ? 'active' : ''}" data-pw="2" data-ph="2" title="2×2 (Alberi, Grandi)">2×2</button>
        <button class="btn btn-secondary btn-xs ${this.propWidth === 3 && this.propHeight === 3 ? 'active' : ''}" data-pw="3" data-ph="3" title="3×3 (Enormi)">3×3</button>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-top: 0.45rem;">
        <div style="flex: 1;">
          <label style="font-size: 0.68rem; color: var(--text-dim);">Larghezza:</label>
          <input type="number" id="input-prop-w" min="0.5" max="10" step="0.5" value="${this.propWidth}" style="width: 100%; background: var(--bg-input); border: 1px solid var(--border); color: var(--text-main); padding: 0.25rem; font-size: 0.75rem; border-radius: var(--radius-sm); text-align: center;" />
        </div>
        <div style="flex: 1;">
          <label style="font-size: 0.68rem; color: var(--text-dim);">Altezza:</label>
          <input type="number" id="input-prop-h" min="0.5" max="10" step="0.5" value="${this.propHeight}" style="width: 100%; background: var(--bg-input); border: 1px solid var(--border); color: var(--text-main); padding: 0.25rem; font-size: 0.75rem; border-radius: var(--radius-sm); text-align: center;" />
        </div>
      </div>

      <div class="palette-control-row" style="margin-top: 0.5rem;">
        <span style="font-size: 0.72rem;">Rotazione: <strong>${rotDeg}°</strong></span>
        <button id="btn-prop-rotate" class="btn btn-secondary btn-xs" title="Ruota di 90° (tasto R)">↻ Ruota (R)</button>
      </div>
    `;

    container.appendChild(sizeCtrl);

    sizeCtrl.querySelectorAll<HTMLButtonElement>('button[data-pw]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.propWidth = parseFloat(btn.dataset.pw || '1');
        this.propHeight = parseFloat(btn.dataset.ph || '1');
        this.updatePaletteUI();
      });
    });

    const inW = sizeCtrl.querySelector('#input-prop-w') as HTMLInputElement;
    const inH = sizeCtrl.querySelector('#input-prop-h') as HTMLInputElement;
    inW?.addEventListener('input', () => {
      this.propWidth = Math.max(0.5, Math.min(10, parseFloat(inW.value) || 1));
      const valSize = sizeCtrl.querySelector('#val-prop-size');
      if (valSize) valSize.textContent = `${this.propWidth} × ${this.propHeight}`;
    });
    inH?.addEventListener('input', () => {
      this.propHeight = Math.max(0.5, Math.min(10, parseFloat(inH.value) || 1));
      const valSize = sizeCtrl.querySelector('#val-prop-size');
      if (valSize) valSize.textContent = `${this.propWidth} × ${this.propHeight}`;
    });

    const btnRotate = sizeCtrl.querySelector('#btn-prop-rotate');
    btnRotate?.addEventListener('click', () => {
      this.propRotation = (this.propRotation + Math.PI * 0.5) % (Math.PI * 2);
      this.updatePaletteUI();
    });
  }

  private renderDoorStateControls(container: HTMLElement): void {
    const stateCtrl = document.createElement('div');
    stateCtrl.className = 'palette-control';
    stateCtrl.style.marginTop = '0.5rem';
    stateCtrl.innerHTML = `
      <label>Stato Iniziale Porta:</label>
      <div style="display: flex; gap: 0.4rem; margin-top: 0.3rem;">
        <button id="door-state-closed" class="btn btn-secondary btn-sm ${this.selectedDoorState === DoorState.CLOSED ? 'active' : ''}" style="flex:1;">Chiusa</button>
        <button id="door-state-open" class="btn btn-secondary btn-sm ${this.selectedDoorState === DoorState.OPEN ? 'active' : ''}" style="flex:1;">Aperta</button>
      </div>
    `;
    container.appendChild(stateCtrl);

    const btnClosed = stateCtrl.querySelector('#door-state-closed');
    const btnOpen = stateCtrl.querySelector('#door-state-open');
    btnClosed?.addEventListener('click', () => {
      this.selectedDoorState = DoorState.CLOSED;
      btnClosed.classList.add('active');
      btnOpen?.classList.remove('active');
    });
    btnOpen?.addEventListener('click', () => {
      this.selectedDoorState = DoorState.OPEN;
      btnOpen.classList.add('active');
      btnClosed?.classList.remove('active');
    });
  }

  /**
   * Brush Controls Panel � shown when brushMode === 'brush' and terrain/liquid tool active.
   * Mimics Unreal Engine Landscape Brush controls: Radius, Hardness, Opacity/Strength.
   */
  private renderBrushControls(container: HTMLElement): void {
    const ctrl = document.createElement('div');
    ctrl.className = 'palette-control';
    ctrl.style.marginTop = '0.6rem';
    ctrl.style.paddingTop = '0.6rem';
    ctrl.style.borderTop = '1px solid var(--border)';
    ctrl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem;">
        <span style="font-size: 0.95rem;">???</span>
        <strong style="font-size: 0.82rem; color: var(--primary);">Brush Circolare (Landscape)</strong>
      </div>

      <div class="palette-control-row">
        <span>Raggio:</span>
        <strong id="val-brush-radius"> celle</strong>
      </div>
      <input type="range" id="slider-brush-radius" min="1" max="12" step="0.5" value="" />

      <div class="palette-control-row" style="margin-top: 0.5rem;">
        <span>Durezza (Hardness):</span>
        <strong id="val-brush-hardness">%</strong>
      </div>
      <input type="range" id="slider-brush-hardness" min="0" max="1" step="0.05" value="" />
      <div style="font-size: 0.68rem; color: var(--text-dim); margin-top: 0.1rem;">
        0% = bordo morbido � 100% = bordo netto
      </div>

      <div class="palette-control-row" style="margin-top: 0.5rem;">
        <span>Forza / Opacit�:</span>
        <strong id="val-brush-opacity">%</strong>
      </div>
      <input type="range" id="slider-brush-opacity" min="0.1" max="1" step="0.05" value="" />

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.3rem; margin-top: 0.5rem;">
        <button class="btn btn-secondary btn-xs brush-preset" data-r="1" data-h="0.9" data-o="1.0" title="Piccolo e preciso">S 1�</button>
        <button class="btn btn-secondary btn-xs brush-preset" data-r="3" data-h="0.6" data-o="0.85" title="Medio bilanciato">M 3�</button>
        <button class="btn btn-secondary btn-xs brush-preset" data-r="6" data-h="0.4" data-o="0.7" title="Grande morbido">L 6�</button>
      </div>

      <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 0.5rem; line-height: 1.4; border-top: 1px solid var(--border); padding-top: 0.4rem;">
        ?? <em>Trascina con il tasto sinistro. Il bordo morbido crea transizioni naturali come il Landscape Tool di Unreal Engine.</em>
      </div>
    `;
    container.appendChild(ctrl);

    const slR = ctrl.querySelector('#slider-brush-radius') as HTMLInputElement;
    const valR = ctrl.querySelector('#val-brush-radius')!;
    slR?.addEventListener('input', () => {
      this.brushRadius = parseFloat(slR.value);
      valR.textContent = `${this.brushRadius} celle`;
    });

    const slH = ctrl.querySelector('#slider-brush-hardness') as HTMLInputElement;
    const valH = ctrl.querySelector('#val-brush-hardness')!;
    slH?.addEventListener('input', () => {
      this.brushHardness = parseFloat(slH.value);
      valH.textContent = `${Math.round(this.brushHardness * 100)}%`;
    });

    const slO = ctrl.querySelector('#slider-brush-opacity') as HTMLInputElement;
    const valO = ctrl.querySelector('#val-brush-opacity')!;
    slO?.addEventListener('input', () => {
      this.brushOpacity = parseFloat(slO.value);
      valO.textContent = `${Math.round(this.brushOpacity * 100)}%`;
    });

    ctrl.querySelectorAll<HTMLButtonElement>('.brush-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        this.brushRadius = parseFloat(btn.dataset.r ?? '2');
        this.brushHardness = parseFloat(btn.dataset.h ?? '0.6');
        this.brushOpacity = parseFloat(btn.dataset.o ?? '0.85');
        this.updatePaletteUI();
      });
    });
  }

  /**
   * Foliage & Grass Overlay Controls Panel (Unreal Engine Foliage Brush style).
   */
  private renderFoliageControls(container: HTMLElement): void {
    const typeGrid = document.createElement('div');
    typeGrid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; margin-bottom: 0.75rem;';

    FOLIAGE_VARIANTS.forEach(ft => {
      const btn = document.createElement('button');
      btn.className = `btn btn-secondary btn-xs ${this.selectedFoliageVariantId === ft.id ? 'active' : ''}`;
      btn.style.cssText = 'display: flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.5rem; text-align: left; height: auto; border: 1px solid var(--border);';
      btn.innerHTML = `<span style="font-size: 1.15rem;">${ft.icon}</span><span style="font-size: 0.73rem; line-height: 1.2;"><strong>${ft.name}</strong></span>`;
      btn.title = ft.description;
      btn.addEventListener('click', () => {
        this.selectedFoliageVariantId = ft.id;
        this.selectedFoliageType = ft.key as FoliageType;
        this.updatePaletteUI();
      });
      typeGrid.appendChild(btn);
    });

    container.appendChild(typeGrid);

    // Current wind angle in degrees
    const currentWindAngleDeg = Math.round(
      (Math.atan2(this.tileMap.windDirection[1], this.tileMap.windDirection[0]) * 180) / Math.PI + 360
    ) % 360;

    // Sliders & Controls Panel
    const ctrl = document.createElement('div');
    ctrl.className = 'palette-control';
    ctrl.style.marginTop = '0.5rem';
    ctrl.innerHTML = `
      <!-- 1. Brush Radius -->
      <div class="palette-control-row">
        <span>Raggio Pennello:</span>
        <strong id="val-foliage-radius" style="color: var(--primary);">${this.foliageBrushRadius} celle</strong>
      </div>
      <input type="range" id="slider-foliage-radius" min="0.5" max="6.0" step="0.25" value="${this.foliageBrushRadius}" />

      <!-- 2. Density -->
      <div class="palette-control-row" style="margin-top: 0.5rem;">
        <span>Densità di Spargimento:</span>
        <strong id="val-foliage-density" style="color: var(--primary);">${this.foliageDensity} campioni</strong>
      </div>
      <input type="range" id="slider-foliage-density" min="2" max="40" step="1" value="${this.foliageDensity}" />

      <!-- 3. Poisson-Disk Min Distance -->
      <div class="palette-control-row" style="margin-top: 0.5rem;">
        <span>Spaziatura Poisson-Disk (Min Dist):</span>
        <strong id="val-foliage-mindist" style="color: var(--primary);">${this.foliageMinDistance} celle</strong>
      </div>
      <input type="range" id="slider-foliage-mindist" min="0.10" max="0.80" step="0.02" value="${this.foliageMinDistance}" />
      <div style="font-size: 0.67rem; color: var(--text-dim); margin-top: 0.15rem;">
        Distribuzione Blue-Noise: previene sovrapposizioni innaturali.
      </div>

      <!-- 4. Scale & Jitter -->
      <div class="palette-control-row" style="margin-top: 0.5rem;">
        <span>Dimensione Media (Scala):</span>
        <strong id="val-foliage-scale" style="color: var(--primary);">${Math.round(this.foliageScale * 100)}%</strong>
      </div>
      <input type="range" id="slider-foliage-scale" min="0.5" max="2.2" step="0.05" value="${this.foliageScale}" />

      <!-- 5. Presets -->
      <div style="display: flex; gap: 0.3rem; margin-top: 0.6rem;">
        <button id="btn-foliage-preset-dense" class="btn btn-secondary btn-xs" style="flex:1;">🌿 Folta</button>
        <button id="btn-foliage-preset-light" class="btn btn-secondary btn-xs" style="flex:1;">🌾 Rada</button>
        <button id="btn-foliage-preset-huge" class="btn btn-secondary btn-xs" style="flex:1;">🌳 Grande</button>
      </div>

      <!-- 6. Wind Shader Controls -->
      <div style="margin-top: 0.8rem; border-top: 1px solid var(--border); padding-top: 0.6rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
          <strong style="font-size: 0.78rem; color: var(--primary);">💨 Shader Vento (GLSL)</strong>
          <span id="wind-compass-icon" style="display: inline-block; transform: rotate(${currentWindAngleDeg}deg); font-size: 1.1rem; transition: transform 0.1s;">➔</span>
        </div>

        <div class="palette-control-row">
          <span>Forza Vento (uWindStrength):</span>
          <strong id="val-wind-strength" style="color: var(--primary);">${Math.round(this.tileMap.windStrength * 100)}%</strong>
        </div>
        <input type="range" id="slider-wind-strength" min="0.0" max="2.0" step="0.05" value="${this.tileMap.windStrength}" />

        <div class="palette-control-row" style="margin-top: 0.4rem;">
          <span>Direzione Vento (uWindDirection):</span>
          <strong id="val-wind-dir" style="color: var(--primary);">${currentWindAngleDeg}°</strong>
        </div>
        <input type="range" id="slider-wind-dir" min="0" max="359" step="5" value="${currentWindAngleDeg}" />
      </div>

      <!-- 7. JSON Layer Actions & Memory -->
      <div style="margin-top: 0.8rem; border-top: 1px solid var(--border); padding-top: 0.6rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
          <span style="font-size: 0.72rem; color: var(--text-muted);">Ciuffi GPU: <strong style="color: #4ade80;">${this.tileMap.foliage.length}</strong></span>
          <button id="btn-clear-foliage" class="btn btn-secondary btn-xs" style="color: #ef4444;" title="Rimuovi tutti i ciuffi d'erba dalla mappa">Pulisci Foliage</button>
        </div>

        <div style="display: flex; gap: 0.35rem; margin-top: 0.4rem;">
          <button id="btn-export-foliage-json" class="btn btn-secondary btn-xs" style="flex:1;" title="Esporta e copia lo schema JSON del layer foliage">💾 Esporta JSON</button>
          <button id="btn-import-foliage-json" class="btn btn-secondary btn-xs" style="flex:1;" title="Carica layer foliage da JSON">📂 Importa JSON</button>
        </div>
      </div>

      <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 0.6rem; line-height: 1.4; background: rgba(34, 197, 94, 0.08); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(34, 197, 94, 0.2);">
        ⚡ <strong>Batch GPU Instancing:</strong> Rendering a <strong>singola Draw Call WebGL</strong> con vertici ancorati alla base e flessione elastica realistica in tempo reale.
      </div>
    `;

    container.appendChild(ctrl);

    const slR = ctrl.querySelector('#slider-foliage-radius') as HTMLInputElement;
    const valR = ctrl.querySelector('#val-foliage-radius')!;
    slR?.addEventListener('input', () => {
      this.foliageBrushRadius = parseFloat(slR.value);
      valR.textContent = `${this.foliageBrushRadius} celle`;
    });

    const slD = ctrl.querySelector('#slider-foliage-density') as HTMLInputElement;
    const valD = ctrl.querySelector('#val-foliage-density')!;
    slD?.addEventListener('input', () => {
      this.foliageDensity = parseInt(slD.value, 10);
      valD.textContent = `${this.foliageDensity} campioni`;
    });

    const slMD = ctrl.querySelector('#slider-foliage-mindist') as HTMLInputElement;
    const valMD = ctrl.querySelector('#val-foliage-mindist')!;
    slMD?.addEventListener('input', () => {
      this.foliageMinDistance = parseFloat(slMD.value);
      valMD.textContent = `${this.foliageMinDistance} celle`;
    });

    const slS = ctrl.querySelector('#slider-foliage-scale') as HTMLInputElement;
    const valS = ctrl.querySelector('#val-foliage-scale')!;
    slS?.addEventListener('input', () => {
      this.foliageScale = parseFloat(slS.value);
      valS.textContent = `${Math.round(this.foliageScale * 100)}%`;
    });

    // Wind sliders
    const slWS = ctrl.querySelector('#slider-wind-strength') as HTMLInputElement;
    const valWS = ctrl.querySelector('#val-wind-strength')!;
    slWS?.addEventListener('input', () => {
      this.tileMap.windStrength = parseFloat(slWS.value);
      valWS.textContent = `${Math.round(this.tileMap.windStrength * 100)}%`;
    });

    const slWD = ctrl.querySelector('#slider-wind-dir') as HTMLInputElement;
    const valWD = ctrl.querySelector('#val-wind-dir')!;
    const compassIcon = ctrl.querySelector('#wind-compass-icon') as HTMLElement;
    slWD?.addEventListener('input', () => {
      const deg = parseFloat(slWD.value);
      const rad = (deg * Math.PI) / 180;
      this.tileMap.windDirection = [Math.cos(rad), Math.sin(rad)];
      valWD.textContent = `${deg}°`;
      if (compassIcon) compassIcon.style.transform = `rotate(${deg}deg)`;
    });

    ctrl.querySelector('#btn-foliage-preset-dense')?.addEventListener('click', () => {
      this.foliageBrushRadius = 2.0;
      this.foliageDensity = 24;
      this.foliageMinDistance = 0.22;
      this.foliageScale = 1.0;
      this.updatePaletteUI();
    });

    ctrl.querySelector('#btn-foliage-preset-light')?.addEventListener('click', () => {
      this.foliageBrushRadius = 1.6;
      this.foliageDensity = 8;
      this.foliageMinDistance = 0.40;
      this.foliageScale = 0.85;
      this.updatePaletteUI();
    });

    ctrl.querySelector('#btn-foliage-preset-huge')?.addEventListener('click', () => {
      this.foliageBrushRadius = 3.2;
      this.foliageDensity = 18;
      this.foliageMinDistance = 0.35;
      this.foliageScale = 1.6;
      this.updatePaletteUI();
    });

    ctrl.querySelector('#btn-clear-foliage')?.addEventListener('click', () => {
      if (confirm('Vuoi rimuovere tutti i ciuffi di foliage dalla mappa?')) {
        this.tileMap.saveState();
        this.tileMap.foliage = [];
        this.tileMap.foliageIndex.clear();
        this.updatePaletteUI();
      }
    });

    // JSON Export / Import buttons
    ctrl.querySelector('#btn-export-foliage-json')?.addEventListener('click', () => {
      const jsonStr = FoliageModel.toJSON(this.tileMap.exportFoliageJSON());
      navigator.clipboard?.writeText(jsonStr).then(() => {
        alert(`Schema JSON Foliage esportato e copiato negli appunti! (${this.tileMap.foliage.length} ciuffi)`);
      }).catch(() => {
        prompt('Copia il JSON del layer Foliage:', jsonStr);
      });
    });

    ctrl.querySelector('#btn-import-foliage-json')?.addEventListener('click', () => {
      const input = prompt('Incolla qui il codice JSON del layer Foliage:');
      if (input) {
        const parsed = FoliageModel.fromJSON(input);
        this.tileMap.importFoliageJSON(parsed);
        this.updatePaletteUI();
        alert(`Caricati con successo ${parsed.instances.length} ciuffi d'erba!`);
      }
    });
  }

  private renderLightControls(container: HTMLElement): void {
    const ctrl = document.createElement('div');
    ctrl.className = 'palette-control';
    ctrl.innerHTML = `
      <div class="palette-control-row">
        <span>Raggio Luce:</span>
        <strong id="val-light-radius">${this.lightSettings.radius} celle</strong>
      </div>
      <input type="range" id="slider-light-radius" min="1" max="15" step="0.5" value="${this.lightSettings.radius}" />

      <div class="palette-control-row" style="margin-top: 0.6rem;">
        <span>Intensità:</span>
        <strong id="val-light-intensity">${Math.round(this.lightSettings.intensity * 100)}%</strong>
      </div>
      <input type="range" id="slider-light-intensity" min="0.1" max="1.0" step="0.05" value="${this.lightSettings.intensity}" />

      <div class="palette-control-row" style="margin-top: 0.6rem;">
        <span>Colore Fiamma/Luce:</span>
        <input type="color" id="picker-light-color" value="${this.lightSettings.color}" />
      </div>

      <label class="checkbox-label" style="margin-top: 0.6rem;">
        <input type="checkbox" id="chk-light-flicker" ${this.lightSettings.flicker ? 'checked' : ''} />
        Sfarfallio Atmosferico (Torcia)
      </label>
    `;

    container.appendChild(ctrl);

    const radiusSlider = ctrl.querySelector('#slider-light-radius') as HTMLInputElement;
    const radiusVal = ctrl.querySelector('#val-light-radius')!;
    radiusSlider?.addEventListener('input', () => {
      this.lightSettings.radius = parseFloat(radiusSlider.value);
      radiusVal.textContent = `${this.lightSettings.radius} celle`;
    });

    const intensitySlider = ctrl.querySelector('#slider-light-intensity') as HTMLInputElement;
    const intensityVal = ctrl.querySelector('#val-light-intensity')!;
    intensitySlider?.addEventListener('input', () => {
      this.lightSettings.intensity = parseFloat(intensitySlider.value);
      intensityVal.textContent = `${Math.round(this.lightSettings.intensity * 100)}%`;
    });

    const colorPicker = ctrl.querySelector('#picker-light-color') as HTMLInputElement;
    colorPicker?.addEventListener('input', () => {
      this.lightSettings.color = colorPicker.value;
    });

    const flickerChk = ctrl.querySelector('#chk-light-flicker') as HTMLInputElement;
    flickerChk?.addEventListener('change', () => {
      this.lightSettings.flicker = flickerChk.checked;
    });
  }

  // --- Fog of War Controls ---
  private renderFogControls(container: HTMLElement): void {
    const ctrl = document.createElement('div');
    ctrl.className = 'palette-control';
    ctrl.innerHTML = `
      <div class="fog-mode-switch">
        <button id="btn-fog-hide" class="btn ${this.fogMode === 'hide' ? 'btn-primary' : 'btn-secondary'}">
          🌫️ Nascondi (Nebbia)
        </button>
        <button id="btn-fog-reveal" class="btn ${this.fogMode === 'reveal' ? 'btn-primary' : 'btn-secondary'}">
          👁️ Rivela (Cancella)
        </button>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.85rem;">
        <button id="btn-fog-fill-all" class="btn btn-secondary btn-sm" style="flex: 1; font-size: 0.72rem;" title="Copri tutta la mappa con la nebbia">
          🌫️ Copri Tutto
        </button>
        <button id="btn-fog-clear-all" class="btn btn-secondary btn-sm" style="flex: 1; font-size: 0.72rem;" title="Rivela l'intera mappa ai giocatori">
          👁️ Rivela Tutto
        </button>
      </div>

      <div class="palette-control-row">
        <span>Raggio Pennello:</span>
        <strong id="val-fog-radius">${this.brushRadius} celle</strong>
      </div>
      <input type="range" id="slider-fog-radius" min="1" max="6" step="1" value="${this.brushRadius}" />

      <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-sm); border: 1px solid var(--border); font-size: 0.75rem; color: var(--text-muted); line-height: 1.45;">
        <p style="color: var(--primary); font-weight: 600; margin-bottom: 0.35rem;">💡 Nebbia di Guerra VTT:</p>
        <p>• <strong>Nell'Editor</strong>: vedi le zone coperte come un velo scuro semitrasparente per poter continuare a lavorare.</p>
        <p style="margin-top: 0.25rem;">• <strong>Presentazione / 2° Schermo</strong>: le zone nascoste appaiono <strong>totalmente oscurate (nere)</strong> ai giocatori!</p>
      </div>
    `;

    container.appendChild(ctrl);

    ctrl.querySelector('#btn-fog-hide')?.addEventListener('click', () => {
      this.fogMode = 'hide';
      this.updatePaletteUI();
    });

    ctrl.querySelector('#btn-fog-reveal')?.addEventListener('click', () => {
      this.fogMode = 'reveal';
      this.updatePaletteUI();
    });

    ctrl.querySelector('#btn-fog-fill-all')?.addEventListener('click', () => {
      this.tileMap.saveState();
      this.tileMap.fillFog(true);
      this.updateStatusTelemetry();
    });

    ctrl.querySelector('#btn-fog-clear-all')?.addEventListener('click', () => {
      this.tileMap.saveState();
      this.tileMap.fillFog(false);
      this.updateStatusTelemetry();
    });

    const radiusSlider = ctrl.querySelector('#slider-fog-radius') as HTMLInputElement;
    const radiusVal = ctrl.querySelector('#val-fog-radius')!;
    radiusSlider?.addEventListener('input', () => {
      this.brushRadius = parseInt(radiusSlider.value, 10);
      radiusVal.textContent = `${this.brushRadius} celle`;
    });
  }

  // --- Drawing Palette Info Panel ---
  private renderDrawingPaletteInfo(container: HTMLElement): void {
    container.innerHTML = `
      <div style="font-size: 0.8rem; line-height: 1.6; color: var(--text-muted);">
        <p style="color: var(--primary); font-weight: 600; margin-bottom: 0.5rem;">✏️ Layer Annotazioni di Sessione</p>
        <p>• <strong>Disegna</strong> sul canvas senza modificare tile o oggetti.</p>
        <p style="margin-top:0.3rem;">• Usa la <strong>finestra flottante ⚙️</strong> per scegliere forma, colore, snap e persistenza.</p>
        <p style="margin-top:0.3rem;">• Forme <strong>temporanee</strong>: scompaiono al rilascio del mouse.</p>
        <p style="margin-top:0.3rem;">• Forme <strong>permanenti</strong>: rimangono finché non le cancelli con la Gomma.</p>
        <p style="margin-top:0.5rem; color: var(--accent-cyan);">💡 Il layer di disegno è visibile anche nella finestra di Presentazione!</p>
      </div>

      <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.4rem;">
        <button id="btn-drawing-palette-undo" class="btn btn-secondary btn-sm">↩ Annulla ultimo</button>
        <button id="btn-drawing-palette-clear" class="btn btn-danger btn-sm">🗑️ Cancella tutti i disegni</button>
        <button id="btn-drawing-palette-open-window" class="btn btn-primary btn-sm">⚙️ Apri Finestra Strumenti</button>
      </div>
    `;

    container.querySelector('#btn-drawing-palette-undo')?.addEventListener('click', () => {
      this.drawingManager.undo();
    });

    container.querySelector('#btn-drawing-palette-clear')?.addEventListener('click', () => {
      if (confirm('Cancellare tutti i disegni dall\'overlay?')) {
        this.drawingManager.clearAll();
      }
    });

    container.querySelector('#btn-drawing-palette-open-window')?.addEventListener('click', () => {
      const win = document.getElementById('drawing-tools-window');
      if (win) {
        win.style.display = win.style.display === 'none' ? 'flex' : 'none';
      }
    });
  }

  // --- Drawing Tools Floating Window ---
  private initDrawingToolsWindow(): void {
    const win = document.getElementById('drawing-tools-window') as HTMLElement;
    const header = document.getElementById('drawing-tools-header') as HTMLElement;
    const btnClose = document.getElementById('btn-drawing-tools-close');
    const btnOpen = document.getElementById('btn-drawing-tools-window');

    if (!win) return;

    // Open/close toggle via gear button in toolbar
    btnOpen?.addEventListener('click', (e) => {
      e.stopPropagation();
      win.style.display = win.style.display === 'none' ? 'flex' : 'none';
      win.style.flexDirection = 'column';
      // Also switch to draw tool when opening
      this.switchTool('draw');
      this.activeTool = 'draw';
      const toolBtns = document.querySelectorAll<HTMLButtonElement>('.tool-btn');
      toolBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === 'draw');
      });
      this.updatePaletteUI();
    });

    btnClose?.addEventListener('click', () => {
      win.style.display = 'none';
    });

    // --- Draggable window ---
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    header.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      isDragging = true;
      const rect = win.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      win.style.position = 'fixed';
      win.style.right = 'auto';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const newLeft = Math.max(0, Math.min(window.innerWidth - 240, e.clientX - dragOffsetX));
      const newTop = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffsetY));
      win.style.left = `${newLeft}px`;
      win.style.top = `${newTop}px`;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // --- Undo / Redo / Clear ---
    document.getElementById('btn-drawing-undo')?.addEventListener('click', () => {
      this.drawingManager.undo();
    });
    document.getElementById('btn-drawing-redo')?.addEventListener('click', () => {
      this.drawingManager.redo();
    });
    document.getElementById('btn-drawing-clear-all')?.addEventListener('click', () => {
      if (confirm('Cancellare tutti i disegni dall\'overlay?')) {
        this.drawingManager.clearAll();
      }
    });

    // --- Shape selection ---
    const shapeBtns = win.querySelectorAll<HTMLButtonElement>('.drawing-shape-btn');
    shapeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        shapeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.drawingManager.settings.shape = btn.dataset.shape as any;
      });
    });

    // --- Color picker ---
    const colorPicker = document.getElementById('drawing-color') as HTMLInputElement;
    colorPicker?.addEventListener('input', () => {
      this.drawingManager.settings.color = colorPicker.value;
      this.syncDrawingFillColorAlpha();
    });

    // --- Line width ---
    const sliderWidth = document.getElementById('drawing-line-width') as HTMLInputElement;
    const valWidth = document.getElementById('val-drawing-line-width');
    sliderWidth?.addEventListener('input', () => {
      this.drawingManager.settings.lineWidth = parseFloat(sliderWidth.value);
      if (valWidth) valWidth.textContent = `${this.drawingManager.settings.lineWidth} px`;
    });

    // --- Opacity ---
    const sliderOpacity = document.getElementById('drawing-opacity') as HTMLInputElement;
    const valOpacity = document.getElementById('val-drawing-opacity');
    sliderOpacity?.addEventListener('input', () => {
      this.drawingManager.settings.opacity = parseFloat(sliderOpacity.value);
      if (valOpacity) valOpacity.textContent = `${Math.round(this.drawingManager.settings.opacity * 100)}%`;
    });

    // --- Filled ---
    const chkFilled = document.getElementById('drawing-filled') as HTMLInputElement;
    const fillColorRow = document.getElementById('drawing-fill-color-row');
    chkFilled?.addEventListener('change', () => {
      this.drawingManager.settings.filled = chkFilled.checked;
      if (fillColorRow) fillColorRow.style.display = chkFilled.checked ? 'flex' : 'none';
      if (fillColorRow) fillColorRow.style.flexDirection = 'column';
    });

    // --- Fill color ---
    const fillColorPicker = document.getElementById('drawing-fill-color') as HTMLInputElement;
    fillColorPicker?.addEventListener('input', () => {
      this.syncDrawingFillColorAlpha();
    });

    // --- Fill opacity ---
    const sliderFillOpacity = document.getElementById('drawing-fill-opacity') as HTMLInputElement;
    const valFillOpacity = document.getElementById('val-drawing-fill-opacity');
    sliderFillOpacity?.addEventListener('input', () => {
      this.syncDrawingFillColorAlpha();
      if (valFillOpacity) valFillOpacity.textContent = `${Math.round(parseFloat(sliderFillOpacity.value) * 100)}%`;
    });

    // --- Snap mode ---
    const snapBtns = win.querySelectorAll<HTMLButtonElement>('.drawing-snap-btn');
    snapBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        snapBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.drawingManager.settings.snapMode = btn.dataset.snap as any;
      });
    });

    // --- Persistence ---
    const persistBtns = win.querySelectorAll<HTMLButtonElement>('.drawing-persist-btn');
    persistBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        persistBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.drawingManager.settings.persistent = btn.dataset.persist === 'true';
      });
    });

    // --- Quick color swatches ---
    const quickColors = win.querySelectorAll<HTMLElement>('.drawing-quick-color');
    quickColors.forEach(el => {
      el.addEventListener('click', () => {
        const color = el.dataset.color || '#ff4444';
        this.drawingManager.settings.color = color;
        if (colorPicker) colorPicker.value = color;
        quickColors.forEach(q => q.classList.remove('active'));
        el.classList.add('active');
        this.syncDrawingFillColorAlpha();
      });
    });
  }

  private syncDrawingFillColorAlpha(): void {
    const fillColorPicker = document.getElementById('drawing-fill-color') as HTMLInputElement;
    const sliderFillOpacity = document.getElementById('drawing-fill-opacity') as HTMLInputElement;
    if (!fillColorPicker || !sliderFillOpacity) return;

    const hex = fillColorPicker.value;
    const alpha = parseFloat(sliderFillOpacity.value);
    // Convert hex + alpha to rgba
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    this.drawingManager.settings.fillColor = `rgba(${r},${g},${b},${alpha})`;
  }

  // --- Modal Events (Add Custom Asset) ---
  private initModalEvents(): void {
    const modal = document.getElementById('modal-add-asset') as HTMLElement;
    const btnOpen = document.getElementById('btn-open-add-asset');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-asset');
    const btnSave = document.getElementById('btn-save-asset');
    const dropZone = document.getElementById('asset-drop-zone') as HTMLElement;
    const fileInput = document.getElementById('asset-file-input') as HTMLInputElement;
    const previewContainer = document.getElementById('asset-preview-container') as HTMLElement;
    const previewImg = document.getElementById('asset-preview-img') as HTMLImageElement;
    const catSelect = document.getElementById('asset-category-select') as HTMLSelectElement;
    const liquidSettings = document.getElementById('liquid-custom-settings') as HTMLElement;

    const openModal = () => {
      modal.style.display = 'flex';
      this.pendingAssetFile = null;
      previewContainer.style.display = 'none';
      (document.getElementById('asset-name-input') as HTMLInputElement).value = '';
      if (this.activeCategoryFilter !== 'all') {
        catSelect.value = this.activeCategoryFilter;
      }
      liquidSettings.style.display = catSelect.value === 'liquid' ? 'block' : 'none';
    };

    const closeModal = () => {
      modal.style.display = 'none';
    };

    btnOpen?.addEventListener('click', openModal);
    btnClose?.addEventListener('click', closeModal);
    btnCancel?.addEventListener('click', closeModal);

    catSelect?.addEventListener('change', () => {
      liquidSettings.style.display = catSelect.value === 'liquid' ? 'block' : 'none';
    });

    // File Drag & Drop
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        this.handleAssetFile(e.dataTransfer.files[0], previewImg, previewContainer);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.handleAssetFile(fileInput.files[0], previewImg, previewContainer);
      }
    });

    // Save Asset
    btnSave?.addEventListener('click', async () => {
      const nameInput = (document.getElementById('asset-name-input') as HTMLInputElement).value.trim();
      const category = catSelect.value as AssetCategory;

      if (!nameInput) {
        alert('Inserisci un nome per il nuovo asset.');
        return;
      }

      if (!this.pendingAssetFile && category !== 'liquid') {
        alert('Carica un\'immagine per l\'asset.');
        return;
      }

      const newId = `custom_${Date.now()}`;
      const newAsset: AssetDefinition = {
        id: newId,
        name: nameInput,
        category: category,
        imageUrl: this.pendingAssetFile || undefined,
        icon: category === 'prop' ? '📦' : category === 'terrain' ? '🧱' : category === 'liquid' ? '🌊' : '🚪'
      };

      if (category === 'liquid') {
        newAsset.liquidConfig = {
          colorDeep: (document.getElementById('liquid-color-deep') as HTMLInputElement).value,
          colorShallow: (document.getElementById('liquid-color-shallow') as HTMLInputElement).value,
          foamColor: (document.getElementById('liquid-color-foam') as HTMLInputElement).value,
          causticColor: 'rgba(255, 255, 255, 0.25)'
        };
      }

      await this.assetManager.addCustomAsset(newAsset);
      closeModal();
      this.setCategoryFilter(category);
      this.updatePaletteUI();
    });
  }

  private handleAssetFile(file: File, previewImg: HTMLImageElement, previewContainer: HTMLElement): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.pendingAssetFile = e.target?.result as string;
      previewImg.src = this.pendingAssetFile;
      previewContainer.style.display = 'block';

      // Auto fill name if empty
      const nameInput = document.getElementById('asset-name-input') as HTMLInputElement;
      if (!nameInput.value) {
        nameInput.value = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }
    };
    reader.readAsDataURL(file);
  }

  // --- Presentation Mode Events ---
  private initPresentationEvents(): void {
    const btnPres = document.getElementById('btn-presentation');
    const btnSidebarPres = document.getElementById('btn-sidebar-presentation');
    const btnSidebarDual = document.getElementById('btn-sidebar-dual-screen');
    const btnPopout = document.getElementById('btn-pres-popout');
    const modal = document.getElementById('presentation-modal');
    const card = document.getElementById('presentation-card');
    const canvas = document.getElementById('presentation-canvas') as HTMLCanvasElement;
    const btnClose = document.getElementById('btn-pres-close');
    const btnCloseFooter = document.getElementById('btn-pres-close-footer');
    const btnFit = document.getElementById('btn-pres-fit');
    const btnZoomIn = document.getElementById('btn-pres-zoom-in');
    const btnZoomOut = document.getElementById('btn-pres-zoom-out');
    const btnFullscreen = document.getElementById('btn-pres-fullscreen');

    if (!modal || !canvas) return;

    const openPresentation = () => {
      modal.style.display = 'flex';
      this.isPresentationOpen = true;

      if (!this.presentationRenderer) {
        this.presentationRenderer = new ViewportRenderer(canvas, this.assetManager);
        this.presentationRenderer.atlas = this.renderer.atlas;
      }

      // Allow DOM layout to compute card dimensions before sizing canvas
      requestAnimationFrame(() => {
        if (this.presentationRenderer) {
          this.presentationRenderer.resizeCanvasToContainer();
          this.presentationRenderer.centerOnMap(this.tileMap);
        }
      });
    };

    const closePresentation = () => {
      modal.style.display = 'none';
      this.isPresentationOpen = false;
      card?.classList.remove('is-fullscreen');
    };

    btnPres?.addEventListener('click', openPresentation);
    btnSidebarPres?.addEventListener('click', openPresentation);
    btnClose?.addEventListener('click', closePresentation);
    btnCloseFooter?.addEventListener('click', closePresentation);

    // Close when clicking directly on the backdrop outside the card
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closePresentation();
      }
    });

    // ── DRAGGABLE MODAL WINDOW ──────────────────────────────────────────
    // Makes the presentation popup movable anywhere on screen
    let isCardDragging = false;
    let cardDragOffset = { x: 0, y: 0 };
    const modalHeader = card?.querySelector('.modal-header') as HTMLElement;

    modalHeader?.addEventListener('mousedown', (e) => {
      // Don't drag if clicking buttons or if in fullscreen mode
      if ((e.target as HTMLElement).closest('button') || card?.classList.contains('is-fullscreen')) {
        return;
      }
      isCardDragging = true;
      card?.classList.add('is-dragging');
      const rect = card!.getBoundingClientRect();
      cardDragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      // Fix position to current coordinates so it moves seamlessly
      card!.style.position = 'fixed';
      card!.style.margin = '0';
      card!.style.left = `${rect.left}px`;
      card!.style.top = `${rect.top}px`;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isCardDragging || !card || card.classList.contains('is-fullscreen')) return;
      const newLeft = Math.max(10, Math.min(window.innerWidth - 120, e.clientX - cardDragOffset.x));
      const newTop = Math.max(10, Math.min(window.innerHeight - 60, e.clientY - cardDragOffset.y));
      card.style.left = `${newLeft}px`;
      card.style.top = `${newTop}px`;
    });

    window.addEventListener('mouseup', () => {
      if (isCardDragging) {
        isCardDragging = false;
        card?.classList.remove('is-dragging');
      }
    });

    // Double-click header resets to centered
    modalHeader?.addEventListener('dblclick', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      if (card) {
        card.style.position = '';
        card.style.margin = '';
        card.style.left = '';
        card.style.top = '';
        requestAnimationFrame(() => {
          this.presentationRenderer?.resizeCanvasToContainer();
          this.presentationRenderer?.centerOnMap(this.tileMap);
        });
      }
    });

    // ── DUAL SCREEN / SECOND MONITOR DETACHED WINDOW ─────────────────────
    const openDualScreenWindow = () => {
      if (this.externalWindow && !this.externalWindow.closed) {
        this.externalWindow.focus();
        return;
      }

      const screenW = Math.min(1920, screen.availWidth);
      const screenH = Math.min(1080, screen.availHeight);
      this.externalWindow = window.open(
        '',
        'vtt_external_presentation',
        `width=${screenW},height=${screenH},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
      );

      if (!this.externalWindow) {
        alert('Impossibile aprire la finestra pop-up: consenti i pop-up del browser per abilitare la vista su 2° schermo.');
        return;
      }

      this.externalWindow.document.write(`
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <title>VTT TileCraft - Vista Mappa (Secondo Schermo)</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; overflow: hidden; background: #090b0e; user-select: none; }
            #ext-canvas { width: 100vw; height: 100vh; display: block; cursor: grab; }
            #ext-canvas:active { cursor: grabbing; }
            .ext-hint {
              position: absolute;
              bottom: 18px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(18, 21, 27, 0.85);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.15);
              border-radius: 9999px;
              color: #cbd5e1;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              font-size: 13px;
              padding: 6px 18px;
              pointer-events: none;
              box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6);
              transition: opacity 0.8s ease;
            }
          </style>
        </head>
        <body>
          <canvas id="ext-canvas"></canvas>
          <div class="ext-hint" id="ext-hint">🖥️ Trascina questa finestra sul 2° schermo • Premi F11 per schermo intero</div>
        </body>
        </html>
      `);
      this.externalWindow.document.close();

      const extCanvas = this.externalWindow.document.getElementById('ext-canvas') as HTMLCanvasElement;
      this.externalRenderer = new ViewportRenderer(extCanvas, this.assetManager);
      this.externalRenderer.atlas = this.renderer.atlas;

      const resizeExt = () => {
        if (!this.externalWindow || this.externalWindow.closed || !this.externalRenderer) return;
        const dpr = this.externalWindow.devicePixelRatio || 1;
        const w = this.externalWindow.innerWidth;
        const h = this.externalWindow.innerHeight;
        extCanvas.width = Math.floor(w * dpr);
        extCanvas.height = Math.floor(h * dpr);
        extCanvas.style.width = `${w}px`;
        extCanvas.style.height = `${h}px`;
      };

      setTimeout(() => {
        resizeExt();
        this.externalRenderer?.centerOnMap(this.tileMap);
      }, 50);

      this.externalWindow.addEventListener('resize', () => resizeExt());

      // Panning inside external window
      let isExtPanning = false;
      let extPanStart = { x: 0, y: 0 };

      extCanvas.addEventListener('mousedown', (e) => {
        isExtPanning = true;
        extPanStart = { x: e.clientX, y: e.clientY };
      });

      this.externalWindow.addEventListener('mousemove', (e) => {
        if (!isExtPanning || !this.externalRenderer) return;
        const dx = e.clientX - extPanStart.x;
        const dy = e.clientY - extPanStart.y;
        this.externalRenderer.camera.x += dx;
        this.externalRenderer.camera.y += dy;
        extPanStart = { x: e.clientX, y: e.clientY };
      });

      this.externalWindow.addEventListener('mouseup', () => {
        isExtPanning = false;
      });

      // Mouse wheel zoom inside external window
      extCanvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (!this.externalRenderer) return;
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        const rect = extCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const cam = this.externalRenderer.camera;
        const newZoom = Math.min(4.0, Math.max(0.1, cam.zoom * factor));
        cam.x = mouseX - (mouseX - cam.x) * (newZoom / cam.zoom);
        cam.y = mouseY - (mouseY - cam.y) * (newZoom / cam.zoom);
        cam.zoom = newZoom;
      }, { passive: false });

      // Auto fade hint after 4s
      const extHint = this.externalWindow.document.getElementById('ext-hint');
      setTimeout(() => {
        if (extHint) extHint.style.opacity = '0';
      }, 4000);

      this.externalWindow.addEventListener('beforeunload', () => {
        this.externalRenderer = null;
        this.externalWindow = null;
      });
    };

    btnPopout?.addEventListener('click', openDualScreenWindow);
    btnSidebarDual?.addEventListener('click', openDualScreenWindow);

    // Toggle Fullscreen on the modal card
    btnFullscreen?.addEventListener('click', () => {
      card?.classList.toggle('is-fullscreen');
      requestAnimationFrame(() => {
        if (this.presentationRenderer) {
          this.presentationRenderer.resizeCanvasToContainer();
          this.presentationRenderer.centerOnMap(this.tileMap);
        }
      });
    });

    btnFit?.addEventListener('click', () => {
      if (this.presentationRenderer) {
        this.presentationRenderer.resizeCanvasToContainer();
        this.presentationRenderer.centerOnMap(this.tileMap);
      }
    });

    btnZoomIn?.addEventListener('click', () => {
      if (this.presentationRenderer) {
        this.zoomPresentation(1.25);
      }
    });

    btnZoomOut?.addEventListener('click', () => {
      if (this.presentationRenderer) {
        this.zoomPresentation(0.8);
      }
    });

    // Panning inside Presentation Canvas
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
      this.isPresPanning = true;
      this.presPanStart = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPresentationOpen || !this.isPresPanning || !this.presentationRenderer) return;
      const dx = e.clientX - this.presPanStart.x;
      const dy = e.clientY - this.presPanStart.y;
      this.presentationRenderer.camera.x += dx;
      this.presentationRenderer.camera.y += dy;
      this.presPanStart = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isPresPanning = false;
    });

    // Mouse wheel zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (!this.presentationRenderer) return;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const cam = this.presentationRenderer.camera;
      const newZoom = Math.min(4.0, Math.max(0.1, cam.zoom * factor));
      cam.x = mouseX - (mouseX - cam.x) * (newZoom / cam.zoom);
      cam.y = mouseY - (mouseY - cam.y) * (newZoom / cam.zoom);
      cam.zoom = newZoom;
    }, { passive: false });

    // Handle Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isPresentationOpen) {
        closePresentation();
      }
    });

    // Handle window resize for presentation canvas
    window.addEventListener('resize', () => {
      if (this.isPresentationOpen && this.presentationRenderer) {
        this.presentationRenderer.resizeCanvasToContainer();
      }
    });
  }

  private zoomPresentation(factor: number): void {
    if (!this.presentationRenderer) return;
    const canvas = this.presentationRenderer.canvas;
    const dpr = window.devicePixelRatio || 1;
    const centerX = (canvas.width / dpr) / 2;
    const centerY = (canvas.height / dpr) / 2;
    const cam = this.presentationRenderer.camera;
    const newZoom = Math.min(4.0, Math.max(0.1, cam.zoom * factor));
    cam.x = centerX - (centerX - cam.x) * (newZoom / cam.zoom);
    cam.y = centerY - (centerY - cam.y) * (newZoom / cam.zoom);
    cam.zoom = newZoom;
  }

  // --- Map Library & History Events ---
  private initMapLibraryEvents(): void {
    const modal = document.getElementById('modal-map-library') as HTMLElement;
    const btnOpenTop = document.getElementById('btn-open-map-library');
    const btnSaveTop = document.getElementById('btn-save-map-library');
    const btnClose = document.getElementById('btn-close-library');
    const btnCloseFooter = document.getElementById('btn-close-library-footer');
    const btnNewMap = document.getElementById('btn-library-new-map');
    const btnSaveCurrent = document.getElementById('btn-library-save-current');
    const btnImportJSON = document.getElementById('btn-library-import-json');
    const fileInput = document.getElementById('input-import-map-file') as HTMLInputElement;
    const searchInput = document.getElementById('library-search-input') as HTMLInputElement;

    const openLibrary = () => {
      modal.style.display = 'flex';
      this.renderMapLibrary();
    };

    const closeLibrary = () => {
      modal.style.display = 'none';
    };

    btnOpenTop?.addEventListener('click', openLibrary);
    btnClose?.addEventListener('click', closeLibrary);
    btnCloseFooter?.addEventListener('click', closeLibrary);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLibrary();
    });

    btnSaveTop?.addEventListener('click', () => this.saveCurrentMapPrompt());
    btnSaveCurrent?.addEventListener('click', () => this.saveCurrentMapPrompt());

    btnNewMap?.addEventListener('click', () => {
      if (confirm('Vuoi iniziare una nuova mappa vuota? Assicurati di aver salvato eventuali modifiche alla mappa corrente.')) {
        this.currentMapId = null;
        this.currentMapName = 'Nuova Mappa';
        this.tileMap.clear();
        this.renderer.centerOnMap(this.tileMap);
        this.updateStatusTelemetry();
        closeLibrary();
      }
    });

    btnImportJSON?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.importMapFromFile(fileInput.files[0], () => {
          this.renderMapLibrary();
        });
      }
    });

    searchInput?.addEventListener('input', () => {
      this.renderMapLibrary(searchInput.value);
    });

    // Close on Escape if library modal is open
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeLibrary();
      }
    });
  }

  public saveCurrentMapPrompt(): void {
    const defaultName = this.currentMapName || 'Mappa ' + new Date().toLocaleDateString('it-IT');
    const name = prompt('Inserisci il nome per salvare la mappa nello storico:', defaultName);
    if (!name || !name.trim()) return;

    this.currentMapName = name.trim();
    if (!this.currentMapId) {
      this.currentMapId = `map_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    const thumb = MapStorage.generateThumbnail(this.tileMap, this.renderer.atlas);
    const mapData = this.tileMap.exportJSON(this.currentMapName);

    const entry: SavedMapEntry = {
      id: this.currentMapId,
      name: this.currentMapName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      width: this.tileMap.width,
      height: this.tileMap.height,
      pixelsPerGrid: this.tileMap.pixelsPerGrid,
      thumbnailUrl: thumb,
      data: mapData
    };

    MapStorage.saveMap(entry);
    this.renderMapLibrary();
    alert(`Mappa "${this.currentMapName}" salvata con successo nello storico!`);
  }

  public renderMapLibrary(query = ''): void {
    const grid = document.getElementById('library-grid');
    const countEl = document.getElementById('library-count-text');
    if (!grid) return;

    grid.innerHTML = '';
    let maps = MapStorage.getAllMaps();

    if (query.trim()) {
      const q = query.toLowerCase();
      maps = maps.filter(m => m.name.toLowerCase().includes(q));
    }

    if (countEl) {
      countEl.textContent = `${maps.length} ${maps.length === 1 ? 'mappa salvata' : 'mappe salvate'}`;
    }

    if (maps.length === 0) {
      grid.innerHTML = `
        <div class="library-empty">
          <span class="library-empty-icon">🗺️</span>
          <h3>Nessuna mappa trovata nello storico</h3>
          <p>Salva la mappa corrente cliccando su "Salva Corrente" oppure importa un file .json!</p>
        </div>
      `;
      return;
    }

    for (const map of maps) {
      const card = document.createElement('div');
      card.className = 'library-card-item';

      const dateStr = new Date(map.updatedAt).toLocaleDateString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      card.innerHTML = `
        <div class="library-thumb-wrap">
          ${map.thumbnailUrl ? `<img src="${map.thumbnailUrl}" alt="${map.name}" />` : `<span class="library-thumb-placeholder">🗺️</span>`}
        </div>
        <div class="library-card-info">
          <div class="library-card-title" title="${map.name}">${map.name}</div>
          <div class="library-card-meta">
            <span>📐 ${map.width} × ${map.height} celle</span>
            <span>🕒 ${dateStr}</span>
          </div>
        </div>
        <div class="library-card-actions">
          <button class="btn btn-primary btn-load-map" title="Carica questa mappa nell'editor">▶ Carica</button>
          <button class="btn btn-secondary btn-duplicate-map" title="Duplica mappa">📋</button>
          <button class="btn btn-secondary btn-export-map" title="Scarica file .json">💾</button>
          <button class="btn btn-danger btn-delete-map" title="Elimina dallo storico">🗑️</button>
        </div>
      `;

      card.querySelector('.btn-load-map')?.addEventListener('click', () => {
        if (confirm(`Vuoi caricare la mappa "${map.name}"? Le modifiche non salvate alla mappa attuale andranno perse.`)) {
          this.currentMapId = map.id;
          this.currentMapName = map.name;
          this.tileMap.loadFromJSON(map.data);
          this.renderer.centerOnMap(this.tileMap);
          this.updateStatusTelemetry();
          const modal = document.getElementById('modal-map-library');
          if (modal) modal.style.display = 'none';
        }
      });

      card.querySelector('.btn-duplicate-map')?.addEventListener('click', () => {
        MapStorage.duplicateMap(map.id);
        this.renderMapLibrary(query);
      });

      card.querySelector('.btn-export-map')?.addEventListener('click', () => {
        MapStorage.triggerDownloadJSON(`${map.name}.json`, map.data);
      });

      card.querySelector('.btn-delete-map')?.addEventListener('click', () => {
        if (confirm(`Sei sicuro di voler eliminare definitivamente "${map.name}" dallo storico?`)) {
          MapStorage.deleteMap(map.id);
          if (this.currentMapId === map.id) {
            this.currentMapId = null;
          }
          this.renderMapLibrary(query);
        }
      });

      grid.appendChild(card);
    }
  }

  private importMapFromFile(file: File, onSuccess: () => void): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as TileMapJSON;
        if (!parsed.width || !parsed.height || !Array.isArray(parsed.terrain)) {
          alert('Il file selezionato non è un formato mappa VTT valido.');
          return;
        }

        const mapName = parsed.name || file.name.replace(/\.[^/.]+$/, '');
        const newId = `map_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const entry: SavedMapEntry = {
          id: newId,
          name: mapName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          width: parsed.width,
          height: parsed.height,
          pixelsPerGrid: parsed.pixelsPerGrid || 100,
          data: parsed
        };

        MapStorage.saveMap(entry);
        onSuccess();
        alert(`Mappa "${mapName}" importata con successo nello storico!`);
      } catch (err) {
        alert('Errore durante la lettura del file JSON: ' + err);
      }
    };
    reader.readAsText(file);
  }

  // --- Canvas Interaction ---
  private initCanvasEvents(): void {
    const canvas = this.renderer.canvas;

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.button === 1 || e.button === 2 || this.activeTool === 'pan' || (e.shiftKey && this.activeTool !== 'draw')) {
        this.isPanning = true;
        this.panStart = { x: mouseX - this.renderer.camera.x, y: mouseY - this.renderer.camera.y };
        canvas.style.cursor = 'grabbing';
        return;
      }

      if (e.button === 0) {
        this.isMouseDown = true;
        const world = this.renderer.screenToWorld(mouseX, mouseY);
        const tile = this.renderer.worldToTile(world.x, world.y, this.tileMap.pixelsPerGrid);
        this.dragStartTile = { ...tile };

        if (this.activeTool === 'draw') {
          this.drawingManager.beginStroke(world.x, world.y, this.tileMap.pixelsPerGrid);
        } else if (this.activeTool === 'interact') {
          // Interact always uses single-click logic regardless of brushMode
          this.applyToolAt(world.x, world.y, true);
        } else if (this.activeTool === 'foliage' || this.brushMode === 'single') {
          this.applyToolAt(world.x, world.y, true);
        } else if (this.brushMode === 'fill') {
          this.applyFloodFillAt(tile.x, tile.y);
        } else if (this.brushMode === 'brush') {
          this.tileMap.saveState();
          this.applyBrushAt(world.x, world.y);
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (this.isPanning) {
        this.renderer.camera.x = mouseX - this.panStart.x;
        this.renderer.camera.y = mouseY - this.panStart.y;
        return;
      }

      const world = this.renderer.screenToWorld(mouseX, mouseY);
      const s = this.tileMap.pixelsPerGrid;
      const tile = this.renderer.worldToTile(world.x, world.y, s);
      const edgeInfo = this.renderer.getNearestTileEdge(world.x, world.y, s);

      this.hoverTile = tile;
      this.hoverEdge = edgeInfo.edge;
      this.hoverWorld = world;

      const curTileEl = document.getElementById('stat-cursor-tile');
      if (curTileEl) curTileEl.textContent = `Cella: [${tile.x}, ${tile.y}]`;

      if (this.isMouseDown && this.activeTool === 'draw') {
        this.drawingManager.continueStroke(world.x, world.y, this.tileMap.pixelsPerGrid);
      } else if (this.isMouseDown && (this.activeTool === 'foliage' || this.brushMode === 'single')) {
        this.applyToolAt(world.x, world.y, false);
      } else if (this.isMouseDown && this.brushMode === 'brush') {
        this.applyBrushAt(world.x, world.y);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        canvas.style.cursor = this.activeTool === 'draw' ? 'crosshair' : 'crosshair';
      }

      if (this.isMouseDown) {
        if (this.activeTool === 'draw') {
          this.drawingManager.endStroke();
        } else if (this.brushMode === 'rect' && this.hoverTile) {
          this.applyRectFill(this.dragStartTile, this.hoverTile);
        }
        this.isMouseDown = false;
        this.updateStatusTelemetry();
      }
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const oldZoom = this.renderer.camera.zoom;
      const newZoom = Math.max(0.15, Math.min(4.0, oldZoom * zoomFactor));

      this.renderer.camera.x = mouseX - (mouseX - this.renderer.camera.x) * (newZoom / oldZoom);
      this.renderer.camera.y = mouseY - (mouseY - this.renderer.camera.y) * (newZoom / oldZoom);
      this.renderer.camera.zoom = newZoom;

      const statZoom = document.getElementById('stat-zoom');
      if (statZoom) statZoom.textContent = `Zoom: ${Math.round(newZoom * 100)}%`;
    }, { passive: false });

    // Touch support per tablet Android (android-port)
    new TouchHandler(
      canvas,
      (delta, cx, cy) => {
        const zoomFactor = 1 + delta * 0.01;
        const oldZoom = this.renderer.camera.zoom;
        const newZoom = Math.max(0.15, Math.min(4.0, oldZoom * zoomFactor));
        this.renderer.camera.x = cx - (cx - this.renderer.camera.x) * (newZoom / oldZoom);
        this.renderer.camera.y = cy - (cy - this.renderer.camera.y) * (newZoom / oldZoom);
        this.renderer.camera.zoom = newZoom;
      },
      (dx, dy) => {
        this.renderer.camera.x += dx;
        this.renderer.camera.y += dy;
      }
    );
  }

  // --- Tool Application Logic ---
  private applyToolAt(worldX: number, worldY: number, isInitialClick: boolean): void {
    const s = this.tileMap.pixelsPerGrid;
    const tile = this.renderer.worldToTile(worldX, worldY, s);
    const edgeInfo = this.renderer.getNearestTileEdge(worldX, worldY, s);

    if (!this.tileMap.isInBounds(tile.x, tile.y)) return;

    if (isInitialClick) {
      this.tileMap.saveState();
    }

    switch (this.activeTool) {
      case 'foliage': {
        this.foliageBrush.config.radius = this.foliageBrushRadius;
        this.foliageBrush.config.density = this.foliageDensity;
        this.foliageBrush.config.minDistance = this.foliageMinDistance;
        this.foliageBrush.config.variantId = this.selectedFoliageVariantId;
        this.foliageBrush.config.scaleMin = Math.max(0.4, this.foliageScale * (1 - this.foliageScaleJitter));
        this.foliageBrush.config.scaleMax = this.foliageScale * (1 + this.foliageScaleJitter);

        const newTufts = this.foliageBrush.paint(
          worldX / s,
          worldY / s,
          (tx, ty) => this.tileMap.isInBounds(tx, ty),
          isInitialClick
        );

        for (const tuft of newTufts) {
          this.tileMap.foliage.push(tuft);
        }
        break;
      }

      case 'terrain':
        this.tileMap.setTerrain(tile.x, tile.y, this.selectedTerrain);
        break;

      case 'liquid':
        this.tileMap.setLiquid(tile.x, tile.y, this.selectedLiquid);
        if (this.selectedLiquid === LiquidType.LAVA) {
          // Automatic dim ambient light for lava
          const lx = tile.x + 0.5;
          const ly = tile.y + 0.5;
          const hasLight = this.tileMap.lights.some(l => Math.hypot(l.x - lx, l.y - ly) < 0.6);
          if (!hasLight) {
            this.tileMap.addLight({
              id: `lava_light_${tile.x}_${tile.y}`,
              x: lx,
              y: ly,
              radius: 2.2,
              intensity: 0.45,
              color: '#ea580c',
              flicker: true
            });
          }
        }
        break;

      case 'prop':
        if (isInitialClick) {
          // Snap prop origin to half or center of tile
          const gridX = Math.round((worldX / s) * 2) / 2;
          const gridY = Math.round((worldY / s) * 2) / 2;
          this.tileMap.addProp({
            id: `prop_${Date.now()}`,
            assetId: this.selectedPropAssetId,
            x: gridX,
            y: gridY,
            width: this.propWidth,
            height: this.propHeight,
            rotation: this.propRotation,
            scale: 1.0
          });
        }
        break;

      case 'wall':
        if (isInitialClick) {
          this.tileMap.toggleWallEdge(edgeInfo.tileX, edgeInfo.tileY, edgeInfo.edge);
        }
        break;

      case 'door':
        if (isInitialClick) {
          const key = this.tileMap.getDoorKey(edgeInfo.tileX, edgeInfo.tileY, edgeInfo.edge);
          if (this.tileMap.doors.has(key)) {
            const existing = this.tileMap.doors.get(key)!;
            existing.state = existing.state === DoorState.CLOSED ? DoorState.OPEN : DoorState.CLOSED;
          } else {
            this.tileMap.addDoor({
              id: `door_${Date.now()}`,
              x: edgeInfo.tileX,
              y: edgeInfo.tileY,
              edge: edgeInfo.edge,
              type: this.selectedDoorType,
              state: this.selectedDoorState
            });
          }
        }
        break;

      case 'light':
        if (isInitialClick) {
          const gridFloatX = worldX / s;
          const gridFloatY = worldY / s;
          this.tileMap.addLight({
            id: `light_${Date.now()}`,
            x: Math.round(gridFloatX * 2) / 2,
            y: Math.round(gridFloatY * 2) / 2,
            radius: this.lightSettings.radius,
            intensity: this.lightSettings.intensity,
            color: this.lightSettings.color,
            flicker: this.lightSettings.flicker
          });
        }
        break;

      case 'erase':
        // Selective erasure controlled by eraseFilters:
        if (this.eraseFilters.drawing) {
          this.drawingManager.eraseAt(worldX, worldY, s * 1.2);
        }

        if (this.eraseFilters.foliage) {
          this.tileMap.removeFoliageInRadius(worldX / s, worldY / s, 1.2);
        }

        if (this.eraseFilters.props) {
          this.tileMap.removePropAt(worldX / s, worldY / s);
        }

        if (this.eraseFilters.lights) {
          this.tileMap.removeLightAt(worldX / s, worldY / s, 0.7);
        }

        if (this.eraseFilters.doors) {
          this.tileMap.removeDoor(edgeInfo.tileX, edgeInfo.tileY, edgeInfo.edge);
        }

        if (this.eraseFilters.walls) {
          this.tileMap.setWall(tile.x, tile.y, 0);
        }

        if (this.eraseFilters.liquid) {
          this.tileMap.setLiquid(tile.x, tile.y, LiquidType.NONE);
        }

        if (this.eraseFilters.terrain) {
          this.tileMap.setTerrain(tile.x, tile.y, TileType.EMPTY);
        }
        break;

      case 'fog':
        this.tileMap.setFog(tile.x, tile.y, this.fogMode === 'hide');
        break;

      case 'interact':
        // Interact tool: click on or near a door to toggle open/closed.
        // We check all 4 edges of the hovered tile plus neighbours within click radius.
        if (isInitialClick) {
          const toggled = this.tryToggleNearestDoor(worldX, worldY, s);
          if (!toggled) {
            // Also check adjacent tiles (the edge might be stored in the neighbour)
            const neighbors: [number, number][] = [
              [tile.x, tile.y - 1], [tile.x, tile.y + 1],
              [tile.x - 1, tile.y], [tile.x + 1, tile.y]
            ];
            for (const [nx, ny] of neighbors) {
              if (this.tryToggleNearestDoor(worldX, worldY, s, nx, ny)) break;
            }
          }
        }
        break;
    }
  }

  /**
   * Finds the door closest to (worldX, worldY) on a given tile and toggles it.
   * Returns true if a door was found and toggled.
   */
  private tryToggleNearestDoor(
    worldX: number, worldY: number, s: number,
    tileX?: number, tileY?: number
  ): boolean {
    const tx = tileX ?? Math.floor(worldX / s);
    const ty = tileY ?? Math.floor(worldY / s);

    const edges: Array<'N' | 'E' | 'S' | 'W'> = ['N', 'E', 'S', 'W'];
    let bestDoor: import('./types').DoorData | null = null;
    let bestDist = Infinity;

    for (const edge of edges) {
      const key = this.tileMap.getDoorKey(tx, ty, edge);
      const door = this.tileMap.doors.get(key);
      if (!door) continue;

      // World position of the edge centre
      const ex = (tx + (edge === 'E' ? 1 : edge === 'W' ? 0 : 0.5)) * s;
      const ey = (ty + (edge === 'S' ? 1 : edge === 'N' ? 0 : 0.5)) * s;
      const dist = Math.hypot(worldX - ex, worldY - ey);

      if (dist < bestDist) {
        bestDist = dist;
        bestDoor = door;
      }
    }

    // Only toggle if click is within ~0.65 tiles of the edge
    if (bestDoor && bestDist < s * 0.65) {
      this.tileMap.saveState();
      if (bestDoor.state === DoorState.OPEN) {
        bestDoor.state = DoorState.CLOSED;
      } else {
        bestDoor.state = DoorState.OPEN;
      }
      return true;
    }
    return false;
  }

  /**
   * Landscape-style circular brush painting (like Unreal Engine's Landscape Brush).
   *
   * For each tile whose center falls within brushRadius tiles of (worldX, worldY):
   *   - Computes a normalized distance [0..1] within the brush circle
   *   - Applies a smooth falloff: tiles inside hardness zone always painted,
   *     tiles in the outer soft zone painted with probability = falloff * opacity
   *   - This creates a natural, irregular edge instead of a hard circle
   */
  private applyBrushAt(worldX: number, worldY: number): void {
    const s = this.tileMap.pixelsPerGrid;
    const r = this.brushRadius;
    const hardness = this.brushHardness;
    const opacity = this.brushOpacity;

    const centerTileX = worldX / s;
    const centerTileY = worldY / s;
    const radiusTiles = Math.ceil(r);

    const tileX = Math.floor(centerTileX);
    const tileY = Math.floor(centerTileY);

    for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
        const tx = tileX + dx;
        const ty = tileY + dy;
        if (!this.tileMap.isInBounds(tx, ty)) continue;

        // Distance from brush center to tile center (in tiles)
        const tileCX = tx + 0.5;
        const tileCY = ty + 0.5;
        const dist = Math.hypot(tileCX - centerTileX, tileCY - centerTileY);

        if (dist > r) continue;

        // Falloff function (matches UE landscape brush falloff behavior):
        // 0..hardness zone → full strength
        // hardness..1 zone → smoothstep fade to 0
        const normalizedDist = dist / r;
        let strength: number;
        if (normalizedDist <= hardness) {
          strength = opacity;
        } else {
          const t = (normalizedDist - hardness) / (1.0 - hardness + 0.0001);
          // Smoothstep: 3t² - 2t³
          const smooth = t * t * (3 - 2 * t);
          strength = opacity * (1.0 - smooth);
        }

        // Probabilistic painting: scatter at falloff zone creates natural organic edges
        if (Math.random() > strength) continue;

        // Apply terrain or liquid
        if (this.activeTool === 'terrain') {
          this.tileMap.setTerrain(tx, ty, this.selectedTerrain);
        } else if (this.activeTool === 'fog') {
          this.tileMap.setFog(tx, ty, this.fogMode === 'hide');
        } else if (this.activeTool === 'liquid') {
          this.tileMap.setLiquid(tx, ty, this.selectedLiquid);
          if (this.selectedLiquid === LiquidType.LAVA) {
            const lx = tx + 0.5;
            const ly = ty + 0.5;
            if (!this.tileMap.lights.some(l => Math.hypot(l.x - lx, l.y - ly) < 0.6)) {
              this.tileMap.addLight({
                id: `lava_light_${tx}_${ty}`,
                x: lx, y: ly,
                radius: 2.2,
                intensity: 0.45,
                color: '#ea580c',
                flicker: true
              });
            }
          }
        }
      }
    }
  }

  private applyRectFill(t1: { x: number; y: number }, t2: { x: number; y: number }): void {
    const minX = Math.max(0, Math.min(t1.x, t2.x));
    const maxX = Math.min(this.tileMap.width - 1, Math.max(t1.x, t2.x));
    const minY = Math.max(0, Math.min(t1.y, t2.y));
    const maxY = Math.min(this.tileMap.height - 1, Math.max(t1.y, t2.y));

    this.tileMap.saveState();

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (this.activeTool === 'terrain') {
          this.tileMap.setTerrain(x, y, this.selectedTerrain);
        } else if (this.activeTool === 'fog') {
          this.tileMap.setFog(x, y, this.fogMode === 'hide');
        } else if (this.activeTool === 'liquid') {
          this.tileMap.setLiquid(x, y, this.selectedLiquid);
          if (this.selectedLiquid === LiquidType.LAVA) {
            const lx = x + 0.5;
            const ly = y + 0.5;
            if (!this.tileMap.lights.some(l => Math.hypot(l.x - lx, l.y - ly) < 0.6)) {
              this.tileMap.addLight({
                id: `lava_light_${x}_${y}`,
                x: lx,
                y: ly,
                radius: 2.2,
                intensity: 0.45,
                color: '#ea580c',
                flicker: true
              });
            }
          }
        } else if (this.activeTool === 'wall') {
          if (y === minY) this.tileMap.toggleWallEdge(x, y, 'N');
          if (y === maxY) this.tileMap.toggleWallEdge(x, y, 'S');
          if (x === minX) this.tileMap.toggleWallEdge(x, y, 'W');
          if (x === maxX) this.tileMap.toggleWallEdge(x, y, 'E');
        } else if (this.activeTool === 'erase') {
          if (this.eraseFilters.props) {
            this.tileMap.removePropAt(x + 0.5, y + 0.5);
          }
          if (this.eraseFilters.lights) {
            this.tileMap.removeLightAt(x + 0.5, y + 0.5, 0.7);
          }
          if (this.eraseFilters.liquid) {
            this.tileMap.setLiquid(x, y, LiquidType.NONE);
          }
          if (this.eraseFilters.walls) {
            this.tileMap.setWall(x, y, 0);
          }
          if (this.eraseFilters.doors) {
            this.tileMap.removeDoor(x, y, 'N');
            this.tileMap.removeDoor(x, y, 'S');
            this.tileMap.removeDoor(x, y, 'E');
            this.tileMap.removeDoor(x, y, 'W');
          }
          if (this.eraseFilters.terrain) {
            this.tileMap.setTerrain(x, y, TileType.EMPTY);
          }
        }
      }
    }
  }

  private applyFloodFillAt(x: number, y: number): void {
    if (this.activeTool === 'terrain') {
      this.tileMap.floodFillTerrain(x, y, this.selectedTerrain);
    } else if (this.activeTool === 'fog') {
      const target = this.tileMap.getFog(x, y);
      const replacement = this.fogMode === 'hide';
      if (target !== replacement) {
        this.tileMap.saveState();
        const queue: [number, number][] = [[x, y]];
        const visited = new Uint8Array(this.tileMap.width * this.tileMap.height);
        while (queue.length > 0) {
          const [cx, cy] = queue.pop()!;
          const idx = this.tileMap.getIndex(cx, cy);
          if (!this.tileMap.isInBounds(cx, cy) || visited[idx]) continue;
          visited[idx] = 1;
          if (this.tileMap.getFog(cx, cy) !== target) continue;
          this.tileMap.setFog(cx, cy, replacement);
          if (cx > 0) queue.push([cx - 1, cy]);
          if (cx < this.tileMap.width - 1) queue.push([cx + 1, cy]);
          if (cy > 0) queue.push([cx, cy - 1]);
          if (cy < this.tileMap.height - 1) queue.push([cx, cy + 1]);
        }
      }
    } else if (this.activeTool === 'liquid') {
      this.tileMap.floodFillLiquid(x, y, this.selectedLiquid);
      if (this.selectedLiquid === LiquidType.LAVA) {
        for (let fy = 0; fy < this.tileMap.height; fy++) {
          for (let fx = 0; fx < this.tileMap.width; fx++) {
            if (this.tileMap.getLiquid(fx, fy) === LiquidType.LAVA) {
              const lx = fx + 0.5;
              const ly = fy + 0.5;
              if (!this.tileMap.lights.some(l => Math.hypot(l.x - lx, l.y - ly) < 0.6)) {
                this.tileMap.addLight({
                  id: `lava_light_${fx}_${fy}`,
                  x: lx,
                  y: ly,
                  radius: 2.2,
                  intensity: 0.45,
                  color: '#ea580c',
                  flicker: true
                });
              }
            }
          }
        }
      }
    }
    this.updateStatusTelemetry();
  }

  // --- Keyboard Shortcuts ---
  private initKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.handleRedo();
        else this.handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.handleRedo();
      } else if (e.key.toLowerCase() === 'r') {
        // Rotate Prop
        this.propRotation = (this.propRotation + Math.PI * 0.5) % (Math.PI * 2);
        this.updatePaletteUI();
      } else if (e.key === ']' || e.key === '+') {
        // Grow Prop
        this.propWidth = Math.min(10, this.propWidth + 1);
        this.propHeight = Math.min(10, this.propHeight + 1);
        this.updatePaletteUI();
      } else if (e.key === '[' || e.key === '-') {
        // Shrink Prop
        this.propWidth = Math.max(1, this.propWidth - 1);
        this.propHeight = Math.max(1, this.propHeight - 1);
        this.updatePaletteUI();
      } else if (e.key === ' ') {
        this.renderer.canvas.style.cursor = 'grab';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === ' ') {
        this.renderer.canvas.style.cursor = 'crosshair';
      }
    });
  }

  private handleUndo(): void {
    if (this.tileMap.undo()) {
      this.updateStatusTelemetry();
    }
  }

  private handleRedo(): void {
    if (this.tileMap.redo()) {
      this.updateStatusTelemetry();
    }
  }

  private updateStatusTelemetry(): void {
    const memEl = document.getElementById('stat-mem');
    if (memEl) memEl.textContent = `Memoria Dati: ${this.tileMap.getFormattedMemoryUsage()}`;

    const gridEl = document.getElementById('stat-grid-size');
    if (gridEl) gridEl.textContent = `${this.tileMap.width} × ${this.tileMap.height} celle`;
  }

  // --- Presets Showcase ---
  public loadDungeonPreset(): void {
    const w = 32;
    const h = 24;
    this.tileMap.resize(w, h);
    this.tileMap.clear(TileType.FLAGSTONE);

    // Canal
    for (let x = 0; x < w; x++) {
      this.tileMap.setLiquid(x, 11, LiquidType.WATER_CANAL);
      this.tileMap.setLiquid(x, 12, LiquidType.WATER_CANAL);
    }

    // North Fortress Room
    const r1MinX = 6, r1MaxX = 16, r1MinY = 3, r1MaxY = 9;
    for (let y = r1MinY; y <= r1MaxY; y++) {
      for (let x = r1MinX; x <= r1MaxX; x++) {
        this.tileMap.setTerrain(x, y, TileType.DUNGEON_TILES);
        if (y === r1MinY) this.tileMap.walls[this.tileMap.getIndex(x, y)] |= WALL_NORTH;
        if (y === r1MaxY) this.tileMap.walls[this.tileMap.getIndex(x, y)] |= WALL_SOUTH;
        if (x === r1MinX) this.tileMap.walls[this.tileMap.getIndex(x, y)] |= WALL_WEST;
        if (x === r1MaxX) this.tileMap.walls[this.tileMap.getIndex(x, y)] |= WALL_EAST;
      }
    }

    this.tileMap.addDoor({ id: 'd1', x: 11, y: 9, edge: 'S', type: DoorType.DOUBLE_DOOR, state: DoorState.CLOSED });
    this.tileMap.addDoor({ id: 'd_sec', x: 16, y: 6, edge: 'E', type: DoorType.SECRET_DOOR, state: DoorState.CLOSED });

    // Torches
    this.tileMap.addLight({ id: 'l1', x: 8.5, y: 5.5, radius: 4.5, intensity: 0.8, color: '#ff9933', flicker: true });
    this.tileMap.addLight({ id: 'l2', x: 13.5, y: 5.5, radius: 4.5, intensity: 0.8, color: '#ff9933', flicker: true });

    // Props in Dungeon Room (Table and chairs)
    this.tileMap.addProp({ id: 'p1', assetId: 'p_wood_table', x: 11, y: 6, width: 2, height: 1, rotation: 0, scale: 1 });
    this.tileMap.addProp({ id: 'p2', assetId: 'p_chair', x: 11, y: 5, width: 1, height: 1, rotation: 0, scale: 0.8 });
    this.tileMap.addProp({ id: 'p3', assetId: 'p_chair', x: 11, y: 7, width: 1, height: 1, rotation: Math.PI, scale: 0.8 });
    this.tileMap.addProp({ id: 'p4', assetId: 'p_chest', x: 7.5, y: 4.5, width: 1, height: 1, rotation: 0, scale: 1 });

    this.renderer.centerOnMap(this.tileMap);
    this.updateStatusTelemetry();
  }

  public loadTavernPreset(): void {
    const w = 26;
    const h = 20;
    this.tileMap.resize(w, h);
    this.tileMap.clear(TileType.GRASS);

    // River
    for (let y = 0; y < h; y++) {
      this.tileMap.setLiquid(0, y, LiquidType.WATER_DEEP);
      this.tileMap.setLiquid(1, y, LiquidType.WATER_DEEP);
      this.tileMap.setLiquid(2, y, LiquidType.WATER_SHALLOW);
      this.tileMap.setLiquid(3, y, LiquidType.WATER_SHALLOW);
    }

    // Tavern building
    for (let y = 4; y <= 16; y++) {
      for (let x = 7; x <= 22; x++) {
        this.tileMap.setTerrain(x, y, TileType.WOOD_PLANKS);
        if (y === 4) this.tileMap.walls[this.tileMap.getIndex(x, y)] |= WALL_NORTH;
        if (y === 16) this.tileMap.walls[this.tileMap.getIndex(x, y)] |= WALL_SOUTH;
        if (x === 7) this.tileMap.walls[this.tileMap.getIndex(x, y)] |= WALL_WEST;
        if (x === 22) this.tileMap.walls[this.tileMap.getIndex(x, y)] |= WALL_EAST;
      }
    }

    this.tileMap.addDoor({ id: 't_door', x: 14, y: 16, edge: 'S', type: DoorType.DOUBLE_DOOR, state: DoorState.CLOSED });
    this.tileMap.addDoor({ id: 't_win1', x: 10, y: 16, edge: 'S', type: DoorType.WINDOW, state: DoorState.CLOSED });
    this.tileMap.addDoor({ id: 't_win2', x: 18, y: 16, edge: 'S', type: DoorType.WINDOW, state: DoorState.CLOSED });

    // Tavern Barrels & Crates
    this.tileMap.addProp({ id: 'tb1', assetId: 'p_barrel', x: 8.5, y: 5.5, width: 1, height: 1, rotation: 0, scale: 1 });
    this.tileMap.addProp({ id: 'tb2', assetId: 'p_barrel', x: 9.5, y: 5.5, width: 1, height: 1, rotation: 0, scale: 1 });
    this.tileMap.addProp({ id: 'tc1', assetId: 'p_crate', x: 8.5, y: 6.5, width: 1, height: 1, rotation: 0, scale: 1 });

    // Dining tables
    this.tileMap.addProp({ id: 'tt1', assetId: 'p_wood_table', x: 13, y: 10, width: 2, height: 1, rotation: 0, scale: 1 });
    this.tileMap.addProp({ id: 'tt2', assetId: 'p_wood_table', x: 18, y: 10, width: 2, height: 1, rotation: 0, scale: 1 });

    // Hearth fire
    this.tileMap.addLight({ id: 'hearth', x: 14.5, y: 5.5, radius: 7.0, intensity: 0.95, color: '#f97316', flicker: true });

    // Outside grass foliage & wildflowers
    for (let i = 0; i < 25; i++) {
      const rx = 4.5 + Math.random() * 20;
      const ry = Math.random() < 0.5 ? 0.8 + Math.random() * 2.5 : 16.8 + Math.random() * 2.5;
      const variant = i % 3 === 0 ? 2 : i % 4 === 0 ? 4 : 0;
      this.tileMap.addFoliage({
        id: `t_fol_${i}`,
        type: variant === 2 ? 'grass_flowers' : variant === 4 ? 'clover_patch' : 'grass_tuft_lush',
        variantId: variant,
        x: rx,
        y: ry,
        scale: 0.85 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2
      });
    }

    // River bank reeds
    for (let y = 1; y < h - 1; y += 2) {
      this.tileMap.addFoliage({
        id: `t_reed_${y}`,
        type: 'reeds',
        variantId: 5,
        x: 3.8 + (Math.random() * 0.5),
        y: y + Math.random() * 0.6,
        scale: 1.0 + Math.random() * 0.3,
        rotation: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.renderer.centerOnMap(this.tileMap);
    this.updateStatusTelemetry();
  }

  public loadLavaPreset(): void {
    const w = 28;
    const h = 22;
    this.tileMap.resize(w, h);
    this.tileMap.clear(TileType.DUNGEON_TILES);

    // Glowing Lava River running diagonally with dim fiery lights
    for (let x = 0; x < w; x++) {
      const ly = Math.floor(10 + Math.sin(x * 0.4) * 3);
      this.tileMap.setLiquid(x, ly, LiquidType.LAVA);
      this.tileMap.setLiquid(x, ly + 1, LiquidType.LAVA);

      if (x % 2 === 0) {
        this.tileMap.addLight({
          id: `lava_light_${x}_${ly}`,
          x: x + 0.5,
          y: ly + 0.5,
          radius: 2.5,
          intensity: 0.5,
          color: '#ea580c',
          flicker: true
        });
      }
    }

    // Sacred Altar and Pillars
    this.tileMap.addProp({ id: 'altar1', assetId: 'p_altar', x: 14, y: 4, width: 2, height: 1, rotation: 0, scale: 1.2 });
    this.tileMap.addProp({ id: 'pil1', assetId: 'p_pillar', x: 10, y: 4, width: 1, height: 1, rotation: 0, scale: 1 });
    this.tileMap.addProp({ id: 'pil2', assetId: 'p_pillar', x: 18, y: 4, width: 1, height: 1, rotation: 0, scale: 1 });

    // Lava ambient glow
    this.tileMap.addLight({ id: 'lava_glow', x: 14, y: 11, radius: 9, intensity: 0.9, color: '#f97316', flicker: true });

    this.renderer.centerOnMap(this.tileMap);
    this.updateStatusTelemetry();
  }

  public loadCavePreset(): void {
    const w = 28;
    const h = 22;
    this.tileMap.resize(w, h);
    this.tileMap.clear(TileType.CAVE_FLOOR);

    for (let y = 5; y <= 16; y++) {
      for (let x = 6; x <= 18; x++) {
        const dist = Math.hypot((x - 12) * 1.2, y - 10.5);
        if (dist < 4.2) this.tileMap.setLiquid(x, y, LiquidType.WATER_DEEP);
        else if (dist < 5.8) this.tileMap.setLiquid(x, y, LiquidType.WATER_SHALLOW);
      }
    }

    this.tileMap.addProp({ id: 'rock1', assetId: 'p_rock', x: 8, y: 6, width: 1, height: 1, rotation: 0.4, scale: 1.2 });
    this.tileMap.addProp({ id: 'rock2', assetId: 'p_rock', x: 17, y: 15, width: 1, height: 1, rotation: 1.2, scale: 1 });

    this.tileMap.addLight({ id: 'c1', x: 7.5, y: 7.5, radius: 4.0, intensity: 0.7, color: '#10b981', flicker: true });
    this.tileMap.addLight({ id: 'c2', x: 16.5, y: 14.5, radius: 4.5, intensity: 0.75, color: '#a855f7', flicker: true });

    this.renderer.centerOnMap(this.tileMap);
    this.updateStatusTelemetry();
  }

  // --- Export Actions ---
  public async exportVTT(): Promise<void> {
    const vttData = await VttExporter.exportUniversalVTT(
      this.tileMap,
      this.renderer.atlas,
      this.renderer.liquidRenderer,
      this.assetManager
    );

    const json = JSON.stringify(vttData, null, 2);
    VttExporter.triggerDownload('rpg-map.dd2vtt', json, 'application/json');
  }

  public async exportPNG(): Promise<void> {
    const base64 = await VttExporter.renderMapImageBase64(
      this.tileMap,
      this.renderer.atlas,
      this.renderer.liquidRenderer,
      this.assetManager,
      'image/png'
    );

    const link = document.createElement('a');
    link.download = 'rpg-map.png';
    link.href = `data:image/png;base64,${base64}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new EditorApp();
});
