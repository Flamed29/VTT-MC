/**
 * MODULO 4: SHADER DEL VENTO (GLSL Vertex & Fragment Shader)
 * Shader WebGL per flessione realistica del ciuffo d'erba ancorato alla base e mosso dal vento
 */

export const FOLIAGE_VERTEX_SHADER = /* glsl */ `
  precision highp float;

  // Uniform globali
  uniform float uTime;
  uniform vec2 uWindDirection;
  uniform float uWindStrength;
  uniform float uPixelsPerGrid; // Fattore di scala mondo

  // Attributi per-istanza
  attribute float aVariantId;
  attribute float aPhase;

  // Variabili interpolate per il Fragment Shader
  varying vec2 vUv;
  varying float vVariantId;

  void main() {
    vUv = uv;
    vVariantId = aVariantId;

    // 1. REQUISITO CHIAVE: Flessione ancorata alla base
    // La base (uv.y == 0.0) ha spostamento nullo (0.0).
    // La punta (uv.y == 1.0) subisce la massima deformazione elastica (curva quadratica).
    float swayFactor = pow(uv.y, 1.6);

    // 2. Calcolo della posizione del ciuffo nello spazio mondo tramite la matrice d'istanza
    vec4 instanceOrigin = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

    // 3. Calcolo dell'onda di vento (Multi-Frequency Wave)
    vec2 windDir = length(uWindDirection) > 0.001 ? normalize(uWindDirection) : vec2(1.0, 0.0);
    
    // Variazione spaziale in base alla posizione sulla mappa
    float spatialOffset = dot(instanceOrigin.xy, windDir * 0.08);

    // Onda primaria + raffica secondaria ad alta frequenza
    float primaryWave = sin(uTime * 3.2 + spatialOffset + aPhase);
    float gustWave    = sin(uTime * 6.5 + spatialOffset * 2.1 + aPhase * 1.7) * 0.35;
    float windWave    = primaryWave + gustWave;

    // Ampiezza massima della flessione in pixel
    float maxBendPixels = 24.0 * (uPixelsPerGrid / 100.0);
    vec2 displacement = windDir * windWave * uWindStrength * swayFactor * maxBendPixels;

    // 4. Trasformazione del vertice con rotazione/scala d'istanza e applicazione del vento
    vec4 localPos = instanceMatrix * vec4(position, 1.0);
    localPos.xy += displacement;

    gl_Position = projectionMatrix * modelViewMatrix * localPos;
  }
`;

export const FOLIAGE_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uAtlas;
  uniform vec2 uAtlasGrid; // ad es. vec2(4.0, 2.0) per 8 varianti

  varying vec2 vUv;
  varying float vVariantId;

  void main() {
    // Calcola le coordinate UV all'interno dell'atlas a griglia 4x2
    float variant = clamp(floor(vVariantId + 0.5), 0.0, 7.0);
    float col = mod(variant, uAtlasGrid.x);
    float row = floor(variant / uAtlasGrid.x);

    vec2 cellSize = 1.0 / uAtlasGrid;
    
    // Invertiamo l'asse Y per coordinata texture OpenGL
    vec2 atlasUv = vec2(
      (col + vUv.x) * cellSize.x,
      (row + (1.0 - vUv.y)) * cellSize.y
    );

    vec4 texColor = texture2D(uAtlas, atlasUv);

    // Alpha test con discard per evitare sovrascritture di profondità / alone trasparente
    if (texColor.a < 0.08) {
      discard;
    }

    gl_FragColor = texColor;
  }
`;
