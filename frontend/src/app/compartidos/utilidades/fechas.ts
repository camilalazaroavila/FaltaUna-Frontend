/** Fecha local (no UTC) en formato `YYYY-MM-DD`. `toISOString()` corre el día a la noche en Argentina. */
export function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Convierte `YYYY-MM-DD` en una fecha local a medianoche. */
export function desdeIso(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}