# Android Port — Documentazione Modifiche

Questo file documenta tutte le modifiche apportate al branch `android-port`.
Il branch `main` non viene mai toccato. Ogni modifica è approvata dal proprietario prima di essere implementata.

---

## Modifica 1 — Supporto touch ibrido (pinch zoom + pan)

**Data approvazione:** 2026-11-25
**File creato:** `src/touch/TouchHandler.ts`

### Motivazione tecnica
Il tablet viene usato in modalità PC ibrida (mouse + touch attivi contemporaneamente).
Il codice mouse esistente rimane intatto e funzionante.
Il TouchHandler aggiunge il supporto ai gesti touch IN PARALLELO, senza sostituire né modificare
gli event listener mouse già presenti nel codice originale.

### Cosa fa
- Rileva tocco con due dita (pinch) e lo traduce in zoom, replicando il comportamento della rotella del mouse
- Rileva trascinamento con un dito (pan) e lo traduce in movimento della camera
- Si aggancia al canvas esistente senza modificare ViewportRenderer o TileMap
- È completamente disattivabile senza effetti sul resto dell'app

### File esistenti modificati
- `src/main.ts`: aggiunto import TouchHandler e istanziazione in fondo a initCanvasEvents()
- `src/foliage/WebGLFoliageRenderer.ts`: aggiunto import android-config, maxInstances ora usa ANDROID_FOLIAGE_MAX_INSTANCES

### Cosa NON fa
- Non rimuove né altera gli event listener del mouse
- Non cambia la logica di rendering, brush, posizionamento foliage

---

## Modifica 2 — Budget massimo istanze foliage (Android)

**Data approvazione:** 2026-11-25
**File creato:** `src/android-config.ts`

### Motivazione tecnica
La GPU di un tablet Android è significativamente meno potente di una GPU desktop.
Il sistema foliage usa WebGL GPU Instancing con shader GLSL animati in tempo reale —
con centinaia di istanze attive può causare cali di framerate su hardware mobile.

Il renderer del foliage (WebGLFoliageRenderer.ts) non viene modificato.
Viene invece introdotto un file di configurazione specifico per la build Android
che espone una costante `ANDROID_FOLIAGE_MAX_INSTANCES` (default: 200).
Il valore esatto verrà calibrato dopo test reali sul dispositivo fisico.

### Cosa fa
- Definisce un tetto massimo di istanze foliage visibili contemporaneamente
- Il valore è configurabile e testabile senza toccare il renderer

### Cosa NON fa
- Non modifica WebGLFoliageRenderer.ts né Canvas2DFoliageRenderer.ts
- Non cambia la logica di brush o posizionamento del foliage

---

## Modifica 3 — Hosting su GitHub Pages

**Data approvazione:** 2026-11-25
**File creato:** `.github/workflows/deploy.yml`

### Motivazione tecnica
Su Android non è possibile eseguire il file `avvia.bat` né un server Python locale.
L'app deve essere raggiungibile da browser senza installare nulla.
GitHub Pages serve la cartella `dist/` come sito statico gratuito.

Il deploy NON è automatico — viene eseguito manualmente solo dopo test e approvazione.

### Cosa fa
- Configura il workflow di build (tsc + vite build) per GitHub Pages
- L'app sarà raggiungibile da qualsiasi browser, incluso Chrome su tablet Android

### Cosa NON fa
- Non modifica vite.config.ts né package.json
- Non esegue deploy automatici
