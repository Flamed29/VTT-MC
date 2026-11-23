/**
 * MODULO 3: RENDERING & PERFORMANCE (GPU Instancing con Three.js & WebGL)
 * Rendering a singola Draw Call (Batch Instancing) capace di gestire oltre 60.000 ciuffi d'erba a 60 FPS
 */

import * as THREE from 'three';
import { FoliageInstance, FoliageLayerJSON } from './FoliageModel';
import { FOLIAGE_VERTEX_SHADER, FOLIAGE_FRAGMENT_SHADER } from './FoliageShader';

export class WebGLFoliageRenderer {
  public canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;

  private instancedMesh: THREE.InstancedMesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private atlasTexture: THREE.CanvasTexture | null = null;

  private maxInstances = 65536; // Supporto fino a 65.536 ciuffi contemporanei
  private dummyMatrix = new THREE.Matrix4();
  private dummyPosition = new THREE.Vector3();
  private dummyQuaternion = new THREE.Quaternion();
  private dummyScale = new THREE.Vector3();

  private windDirection = new THREE.Vector2(1.0, 0.3);
  private windStrength = 0.8;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 600;

    // WebGLRenderer con trasparenza per compositing immediato
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 800, 0, 600, -100, 100);

    this.initTextureAtlas();
    this.initInstancedMesh();
  }

  /**
   * Genera un Texture Atlas procedurale 1024x512 a griglia 4x2 con le 8 varianti di foliage
   */
  private initTextureAtlas(): void {
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = 1024;
    atlasCanvas.height = 512;
    const ctx = atlasCanvas.getContext('2d')!;

    const cellW = 256;
    const cellH = 256;

    // Disegna ciascuna delle 8 varianti nella propria cella della griglia 4x2
    for (let variantId = 0; variantId < 8; variantId++) {
      const col = variantId % 4;
      const row = Math.floor(variantId / 4);

      ctx.save();
      ctx.translate(col * cellW, row * cellH);
      this.drawVariantToCell(ctx, variantId, cellW, cellH);
      ctx.restore();
    }

    this.atlasTexture = new THREE.CanvasTexture(atlasCanvas);
    this.atlasTexture.magFilter = THREE.LinearFilter;
    this.atlasTexture.minFilter = THREE.LinearFilter;
    this.atlasTexture.needsUpdate = true;
  }

  /**
   * Rendering procedurale ad alta risoluzione del ciuffo per l'atlas
   */
  private drawVariantToCell(ctx: CanvasRenderingContext2D, variantId: number, w: number, h: number): void {
    const cx = w * 0.5;
    const cy = h * 0.85; // Base del ciuffo posizionata in basso per ancoraggio
    const scale = 3.6;

    ctx.save();
    ctx.translate(cx, cy);

    switch (variantId) {
      case 0: // Erba Rigogliosa
        this.renderAtlasLushGrass(ctx, scale);
        break;
      case 1: // Erba Secca Alta
        this.renderAtlasDryGrass(ctx, scale);
        break;
      case 2: // Prato Fiorito
        this.renderAtlasFlowerGrass(ctx, scale);
        break;
      case 3: // Felci
        this.renderAtlasFerns(ctx, scale);
        break;
      case 4: // Trifogli
        this.renderAtlasClover(ctx, scale);
        break;
      case 5: // Canneto & Giunchi
        this.renderAtlasReeds(ctx, scale);
        break;
      case 6: // Germogli Arcani
        this.renderAtlasBiolum(ctx, scale);
        break;
      case 7: // Foglie Autunnali
        this.renderAtlasAutumn(ctx, scale);
        break;
    }

    ctx.restore();
  }

  private renderAtlasLushGrass(ctx: CanvasRenderingContext2D, s: number): void {
    const bladeCount = 14;
    for (let i = 0; i < bladeCount; i++) {
      const angle = -Math.PI * 0.5 + ((i - (bladeCount - 1) * 0.5) / bladeCount) * Math.PI * 0.85;
      const len = (22 + (i % 5) * 4) * s;
      const isTop = i % 2 === 0;

      ctx.save();
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(0, 0, len, 0);
      grad.addColorStop(0, '#0f3817');
      grad.addColorStop(0.3, isTop ? '#16a34a' : '#14532d');
      grad.addColorStop(1, isTop ? '#86efac' : '#22c55e');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -3.0 * s);
      ctx.quadraticCurveTo(len * 0.5, 2.5 * s, len, 0);
      ctx.quadraticCurveTo(len * 0.5, -2.5 * s, 0, 3.0 * s);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderAtlasDryGrass(ctx: CanvasRenderingContext2D, s: number): void {
    const bladeCount = 13;
    for (let i = 0; i < bladeCount; i++) {
      const angle = -Math.PI * 0.5 + ((i - (bladeCount - 1) * 0.5) / bladeCount) * Math.PI * 0.9;
      const len = (24 + (i % 4) * 5) * s;

      ctx.save();
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(0, 0, len, 0);
      grad.addColorStop(0, '#451a03');
      grad.addColorStop(0.4, '#b45309');
      grad.addColorStop(1, '#fef08a');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -2.5 * s);
      ctx.quadraticCurveTo(len * 0.6, 2.0 * s, len, 0);
      ctx.quadraticCurveTo(len * 0.6, -2.0 * s, 0, 2.5 * s);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderAtlasFlowerGrass(ctx: CanvasRenderingContext2D, s: number): void {
    this.renderAtlasLushGrass(ctx, s * 0.95);

    // Fiori
    const colors = [
      { p: '#ffffff', c: '#eab308' },
      { p: '#ef4444', c: '#18181b' },
      { p: '#38bdf8', c: '#facc15' },
      { p: '#ec4899', c: '#fef08a' }
    ];

    for (let f = 0; f < 4; f++) {
      const fa = -Math.PI * 0.8 + (f / 3) * Math.PI * 0.6;
      const fd = (18 + (f % 2) * 5) * s;
      const fx = Math.cos(fa) * fd;
      const fy = Math.sin(fa) * fd;

      const col = colors[f % colors.length];
      ctx.fillStyle = col.p;
      for (let p = 0; p < 5; p++) {
        const pa = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(pa) * 3 * s, fy + Math.sin(pa) * 3 * s, 3.2 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = col.c;
      ctx.beginPath();
      ctx.arc(fx, fy, 2.2 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderAtlasFerns(ctx: CanvasRenderingContext2D, s: number): void {
    const fronds = 7;
    for (let i = 0; i < fronds; i++) {
      const angle = -Math.PI * 0.5 + ((i - (fronds - 1) * 0.5) / fronds) * Math.PI * 0.8;
      const len = 28 * s;

      ctx.save();
      ctx.rotate(angle);
      ctx.strokeStyle = '#065f46';
      ctx.lineWidth = 2.5 * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      for (let j = 1; j <= 6; j++) {
        const px = (j / 6) * len;
        const pSize = (1 - (j / 6) * 0.3) * 6 * s;
        ctx.beginPath();
        ctx.ellipse(px, -pSize * 0.7, pSize * 0.8, pSize * 0.35, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px, pSize * 0.7, pSize * 0.8, pSize * 0.35, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderAtlasClover(ctx: CanvasRenderingContext2D, s: number): void {
    for (let c = 0; c < 8; c++) {
      const ca = (c / 8) * Math.PI * 2;
      const cd = (8 + (c % 3) * 6) * s;
      const cx = Math.cos(ca) * cd;
      const cy = -12 * s + Math.sin(ca) * cd * 0.6;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#15803d';
      const lr = 4.5 * s;
      for (let l = 0; l < 3; l++) {
        const la = (l / 3) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(la) * lr, Math.sin(la) * lr, lr * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderAtlasReeds(ctx: CanvasRenderingContext2D, s: number): void {
    const reeds = 8;
    for (let i = 0; i < reeds; i++) {
      const angle = -Math.PI * 0.5 + ((i - (reeds - 1) * 0.5) / reeds) * 0.8;
      const len = 32 * s;

      ctx.save();
      ctx.rotate(angle);
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();

      if (i % 2 === 0) {
        ctx.fillStyle = '#713f12';
        ctx.beginPath();
        ctx.roundRect(len * 0.55, -3 * s, 10 * s, 6 * s, 3 * s);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderAtlasBiolum(ctx: CanvasRenderingContext2D, s: number): void {
    for (let i = 0; i < 7; i++) {
      const angle = -Math.PI * 0.5 + ((i - 3) / 7) * Math.PI * 0.8;
      const len = 25 * s;

      ctx.save();
      ctx.rotate(angle);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.5, 6 * s, len, 0);
      ctx.stroke();

      ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#c084fc';
      ctx.beginPath();
      ctx.arc(len, 0, 4.5 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(len, 0, 2.0 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderAtlasAutumn(ctx: CanvasRenderingContext2D, s: number): void {
    const colors = ['#b91c1c', '#c2410c', '#d97706', '#eab308', '#78350f'];
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const dist = (10 + (i % 3) * 6) * s;
      const lx = Math.cos(angle) * dist;
      const ly = -14 * s + Math.sin(angle) * dist * 0.7;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(i * 1.3);
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.5 * s, 3.2 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Inizializza l'InstancedBufferGeometry e il custom ShaderMaterial per l'animazione GLSL
   */
  private initInstancedMesh(): void {
    const quadW = 64;
    const quadH = 64;

    // PlaneGeometry: larghezza quadW, altezza quadH
    const geometry = new THREE.PlaneGeometry(quadW, quadH);
    
    // Ancoraggio della geometria: trasliamo l'asse Y verso l'alto
    // in modo che l'origine locale (0, 0) corrisponda alla base/radice del ciuffo
    geometry.translate(0, quadH * 0.5, 0);

    // Attributi per-istanza personalizzati
    const variantArray = new Float32Array(this.maxInstances);
    const phaseArray   = new Float32Array(this.maxInstances);

    geometry.setAttribute('aVariantId', new THREE.InstancedBufferAttribute(variantArray, 1));
    geometry.setAttribute('aPhase',     new THREE.InstancedBufferAttribute(phaseArray, 1));

    // Custom ShaderMaterial
    this.material = new THREE.ShaderMaterial({
      vertexShader: FOLIAGE_VERTEX_SHADER,
      fragmentShader: FOLIAGE_FRAGMENT_SHADER,
      uniforms: {
        uTime:           { value: 0.0 },
        uWindDirection:  { value: this.windDirection },
        uWindStrength:   { value: this.windStrength },
        uPixelsPerGrid:  { value: 100.0 },
        uAtlas:          { value: this.atlasTexture },
        uAtlasGrid:      { value: new THREE.Vector2(4.0, 2.0) }
      },
      transparent: true,
      depthTest: false,
      depthWrite: false
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, this.material, this.maxInstances);
    this.instancedMesh.count = 0;
    this.instancedMesh.frustumCulled = false;

    this.scene.add(this.instancedMesh);
  }

  /**
   * Aggiorna gli attributi di tutte le istanze d'erba nella GPU in un unico passaggio vettoriale
   */
  public updateInstances(instances: FoliageInstance[], pixelsPerGrid: number): void {
    if (!this.instancedMesh) return;

    const count = Math.min(instances.length, this.maxInstances);
    this.instancedMesh.count = count;

    const variantAttr = this.instancedMesh.geometry.getAttribute('aVariantId') as THREE.InstancedBufferAttribute;
    const phaseAttr   = this.instancedMesh.geometry.getAttribute('aPhase') as THREE.InstancedBufferAttribute;

    const variantArray = variantAttr.array as Float32Array;
    const phaseArray   = phaseAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const inst = instances[i];

      // 1. Matrice di trasformazione (Posizione mondo, rotazione, scala)
            const worldX = inst.x * pixelsPerGrid;
      const worldY = -inst.y * pixelsPerGrid; // Invert Y for Three.js (origin top-left in map, Y up in Three.js)
      const scale  = inst.scale * (pixelsPerGrid / 100);

      this.dummyPosition.set(worldX, worldY, 0);
      this.dummyQuaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), inst.rotation);
      this.dummyScale.set(scale, scale, 1);

      this.dummyMatrix.compose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);
      this.instancedMesh.setMatrixAt(i, this.dummyMatrix);

      // 2. Attributi custom (variante e fase)
      variantArray[i] = inst.variantId;
      phaseArray[i]   = inst.phase;
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    variantAttr.needsUpdate = true;
    phaseAttr.needsUpdate   = true;

    // Aggiorna pixelsPerGrid nello shader
    if (this.material) {
      this.material.uniforms.uPixelsPerGrid.value = pixelsPerGrid;
    }
  }

  /**
   * Imposta i parametri globali del vento guidati dall'interfaccia utente
   */
  public setWindParams(direction: [number, number], strength: number): void {
    this.windDirection.set(direction[0], direction[1]).normalize();
    this.windStrength = strength;

    if (this.material) {
      this.material.uniforms.uWindDirection.value.copy(this.windDirection);
      this.material.uniforms.uWindStrength.value = this.windStrength;
    }
  }

  /**
   * Sincronizza la telecamera ortografica con la viewport 2D e renderizza la scena in un'unica Draw Call
   */
  public renderToCanvas(
    targetCtx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    zoom: number,
    viewW: number,
    viewH: number,
    timeSec: number
  ): void {
    if (!this.instancedMesh || this.instancedMesh.count === 0) return;

    // 1. Ridimensiona il canvas WebGL se necessario
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.floor(viewW * dpr);
    const targetH = Math.floor(viewH * dpr);

    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
      this.renderer.setSize(viewW, viewH, false);
    }

    // 2. Sincronizzazione Camera Ortografica con il piano 2D Canvas
    // Mappa le coordinate mondo (worldX, worldY) con lo stesso zoom e pan
    const left   = -cameraX / zoom;
    const right  = (viewW - cameraX) / zoom;
    const top    = -cameraY / zoom;
    const bottom = (viewH - cameraY) / zoom;

    this.camera.left   = left;
    this.camera.right  = right;
    this.camera.top    = top;
    this.camera.bottom = bottom;
    this.camera.updateProjectionMatrix();

    // 3. Aggiorna tempo nello shader del vento
    if (this.material) {
      this.material.uniforms.uTime.value = timeSec;
    }

    // 4. Esegue il rendering WebGL (Singola Draw Call batch istanziata)
    this.renderer.render(this.scene, this.camera);

    // 5. Compositing trasparente sullo stack di layer del canvas 2D principale
    targetCtx.drawImage(this.canvas, 0, 0, viewW, viewH);
  }

  /**
   * Rilascio risorse
   */
  public dispose(): void {
    this.renderer.dispose();
    this.scene.clear();
    this.atlasTexture?.dispose();
    this.material?.dispose();
  }
}
