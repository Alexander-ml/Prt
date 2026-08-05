import { useCallback, useRef, useState } from 'react';

/**
 * useKitchenAlertSound — Alertas sonoras del KDS.
 *
 * En una cocina real el chef no está mirando la pantalla todo el tiempo; un
 * pedido nuevo o uno que cruza el umbral de urgencia necesita un canal
 * auditivo, no solo un cambio de color. Los tonos se generan con la Web
 * Audio API (sin archivos .mp3 que cargar) para mantener el prototipo
 * autocontenido. El estado "silenciado" es local a la sesión del chef.
 */
export function useKitchenAlertSound() {
  const [enabled, setEnabled] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    if (!ctxRef.current) ctxRef.current = new AudioCtor();
    return ctxRef.current;
  };

  const beep = useCallback((frequencies: number[], durationMs: number) => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * (durationMs / 1000);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + durationMs / 1000);
    });
  }, [enabled]);

  const playNewOrderBeep = useCallback(() => beep([880, 1175], 140), [beep]);
  const playUrgentBeep = useCallback(() => beep([660, 660, 660], 110), [beep]);

  return { enabled, setEnabled, playNewOrderBeep, playUrgentBeep };
}