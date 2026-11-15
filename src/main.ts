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
  AssetDefinition
} from './types';

class EditorApp {
  public tileMap: TileMap;
  public assetManager: AssetManager;
  public renderer: ViewportRenderer;

  public activeTool: ToolType = 'terrain';
  public brushMode: BrushMode = 'single';
  public activeCategoryFilter: AssetCategory | 'all' = 'all';
  public activeSubcat = 'all';
  public searchQuery = '';

  // Selected Assets
  public selectedTerrain: TileType = TileType.STONE_FLOOR;
  public selectedLiquid: LiquidType = LiquidType.WATER_SHALLOW;
  public selectedDoorType: DoorType = DoorType.STANDARD_DOOR;
  public selectedDoorState: DoorState = DoorState.CLOSED;
  public selectedPropAssetId = 'p_wood_table';
  public propRotation = 0; // in radians
  public propWidth = 1;    // default 1 quadratino
  public propHeight = 1;   // default 1 quadratino

  public lightSettings = {
    radius: 4.5,
    intensity: 0.8,
    color: '#ff9933',
    flicker: true
  };

  // Eraser Filters (Selective removal)
  public eraseFilters = {
    props: true,
    lights: true,
    liquid: true,
    walls: true,
    doors: true,
    terrain: false // don't wipe floor by default
  };

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

  // Modal State
  private pendingAssetFile: string | null = null;

  constructor() {
    this.tileMap = new TileMap(30, 25, 100);
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
          propHeight: this.propHeight
        },
        timestamp
      );

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
    bindFilter('pop-ef-props', 'props');
    bindFilter('pop-ef-lights', 'lights');
    bindFilter('pop-ef-liquid', 'liquid');
    bindFilter('pop-ef-walls', 'walls');
    bindFilter('pop-ef-doors', 'doors');
    bindFilter('pop-ef-terrain', 'terrain');

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

    if (this.activeTool === 'light') {
      titleEl.textContent = 'Sorgenti di Luce';
      subEl.textContent = 'Illuminazione dinamica VTT';
      this.renderLightControls(bodyEl);
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
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-props" ${this.eraseFilters.props ? 'checked' : ''} /> <strong>📦 Oggetti / Props</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-lights" ${this.eraseFilters.lights ? 'checked' : ''} /> <strong>🔥 Luci Dinamiche</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-liquid" ${this.eraseFilters.liquid ? 'checked' : ''} /> <strong>🌊 Liquidi (Acqua, Lava, Veleno)</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-walls" ${this.eraseFilters.walls ? 'checked' : ''} /> <strong>🛡️ Muri (Ostacoli LoS)</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-doors" ${this.eraseFilters.doors ? 'checked' : ''} /> <strong>🚪 Porte & Varchi</strong></label>
          <label class="checkbox-label"><input type="checkbox" id="ef-panel-terrain" ${this.eraseFilters.terrain ? 'checked' : ''} /> <strong>🧱 Terreno (Pavimentazione)</strong></label>
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
      bindPanelCheck('ef-panel-props', 'pop-ef-props', 'props');
      bindPanelCheck('ef-panel-lights', 'pop-ef-lights', 'lights');
      bindPanelCheck('ef-panel-liquid', 'pop-ef-liquid', 'liquid');
      bindPanelCheck('ef-panel-walls', 'pop-ef-walls', 'walls');
      bindPanelCheck('ef-panel-doors', 'pop-ef-doors', 'doors');
      bindPanelCheck('ef-panel-terrain', 'pop-ef-terrain', 'terrain');

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
    set('pop-ef-props', this.eraseFilters.props);
    set('pop-ef-lights', this.eraseFilters.lights);
    set('pop-ef-liquid', this.eraseFilters.liquid);
    set('pop-ef-walls', this.eraseFilters.walls);
    set('pop-ef-doors', this.eraseFilters.doors);
    set('pop-ef-terrain', this.eraseFilters.terrain);
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

  // --- Canvas Interaction ---
  private initCanvasEvents(): void {
    const canvas = this.renderer.canvas;

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.button === 1 || e.button === 2 || this.activeTool === 'pan' || e.shiftKey) {
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

        if (this.brushMode === 'single') {
          this.applyToolAt(world.x, world.y, true);
        } else if (this.brushMode === 'fill') {
          this.applyFloodFillAt(tile.x, tile.y);
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

      if (this.isMouseDown && this.brushMode === 'single') {
        this.applyToolAt(world.x, world.y, false);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        canvas.style.cursor = 'crosshair';
      }

      if (this.isMouseDown) {
        if (this.brushMode === 'rect' && this.hoverTile) {
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
