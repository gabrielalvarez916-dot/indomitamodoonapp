const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// minúsculas y sin tildes, para buscar sin que importen los acentos
export function normalizar(t) {
  return (t ?? '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// 12300 → "3 h 25 min"
export function duracionLarga(seg) {
  const total = Math.round((Number(seg) || 0) / 60);
  if (total <= 0) return '';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

// 754 → "12:34"
export function duracionClase(seg) {
  const s = Number(seg) || 0;
  if (s <= 0) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const dos = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${dos(m)}:${dos(r)}` : `${m}:${dos(r)}`;
}

export function mesAnio(iso) {
  if (!iso) return '';
  const f = new Date(iso);
  if (isNaN(f.getTime())) return '';
  return `${MESES[f.getMonth()]} ${f.getFullYear()}`;
}

export function fechaCorta(iso) {
  if (!iso) return '';
  const f = new Date(iso);
  if (isNaN(f.getTime())) return '';
  return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
}

export function estudiantesTexto(n) {
  const v = Number(n) || 0;
  if (v <= 0) return '';
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',').replace(',0', '')} mil estudiantes`;
  return v === 1 ? '1 estudiante' : `${v} estudiantes`;
}

// En la app se muestra el precio de la app (con la comisión de Google Play).
export function precioTexto(c) {
  if (c.es_gratis) return 'Gratis';
  const n = c.precio_app_usd ?? c.precio_usd;
  if (n == null) return '';
  const num = Number(n);
  return `USD ${Number.isInteger(num) ? num : num.toFixed(2).replace('.', ',')}`;
}
