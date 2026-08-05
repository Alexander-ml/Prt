import { useEffect, useState } from 'react';

/**
 * useNowTick — Fuerza un re-render cada `intervalMs` sin exponer estado útil.
 *
 * El KDS calcula "minutos transcurridos" a partir de la hora actual en cada
 * render, pero React solo re-renderiza cuando algo cambia. Sin este hook, el
 * cronómetro de cada ticket quedaría congelado en el valor que tenía al
 * cargar la pantalla hasta que ocurriera otra acción (marcar un ítem, etc.),
 * lo cual es engañoso en una pantalla que se supone "en tiempo real".
 */
export function useNowTick(intervalMs: number = 20000): void {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}