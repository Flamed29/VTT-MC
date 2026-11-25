/**
 * android-config.ts — Configurazione specifica per la build Android
 * Branch: android-port
 *
 * Tutti i valori qui sono calibrabili dopo test reali sul dispositivo fisico.
 * Nessun file del codice originale viene modificato.
 */

/**
 * Numero massimo di istanze foliage (erba/vegetazione) renderizzate contemporaneamente.
 * Su desktop non c'è limite — su tablet Android la GPU è più debole.
 * Valore di partenza conservativo: 200 istanze.
 * Da aumentare o diminuire dopo test sul dispositivo fisico.
 */
export const ANDROID_FOLIAGE_MAX_INSTANCES = 200;

/**
 * Abilita i log di performance nella console del browser.
 * Utile durante i test per monitorare FPS e carico GPU.
 * Impostare a false prima del deploy finale.
 */
export const ANDROID_DEBUG_PERFORMANCE = true;
