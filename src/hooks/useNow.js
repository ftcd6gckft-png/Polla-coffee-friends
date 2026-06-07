import { useEffect, useState } from 'react';

/**
 * Hook que devuelve el timestamp actual y se re-evalúa cada `intervalMs`.
 * Útil para que la UI reaccione automáticamente cuando un partido entra
 * en su ventana de bloqueo (T-15 min) sin que el usuario tenga que recargar.
 *
 * Default: 30 segundos. No menor a 1 seg ni mayor a varios min para no
 * meter overhead innecesario.
 */
export function useNow(intervalMs = 30 * 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
