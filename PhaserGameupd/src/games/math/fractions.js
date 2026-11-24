// Exact rational arithmetic. Values stay small in the models; parsing and
// cross-products use BigInt so typed equivalents never depend on rounding.
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a < 0n ? -a : a; };
export function fraction(n, d = 1) {
  let a = BigInt(n), b = BigInt(d);
  if (!b) throw new RangeError('A denominator cannot be zero.');
  if (b < 0n) { a = -a; b = -b; }
  const g = gcd(a, b); a /= g; b /= g;
  if (a > BigInt(Number.MAX_SAFE_INTEGER) || a < BigInt(Number.MIN_SAFE_INTEGER) || b > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Fraction is too large.');
  return { n: Number(a), d: Number(b) };
}
export function parseFraction(text) {
  const value = String(text ?? '').trim().replace(/\u2044/g, '/');
  // A mixed number is written with a space: 2 1/3. No evaluation of input.
  const mixed = value.match(/^(\d{1,7})\s+(\d{1,7})\s*\/\s*(\d{1,7})$/);
  const simple = value.match(/^(-?\d{1,7})(?:\s*\/\s*(\d{1,7}))?$/);
  try {
    if (mixed && BigInt(mixed[3])) return fraction(BigInt(mixed[1]) * BigInt(mixed[3]) + BigInt(mixed[2]), mixed[3]);
    if (simple && (!simple[2] || BigInt(simple[2]))) return fraction(simple[1], simple[2] ?? 1);
  } catch { /* Invalid or out-of-range input is an ordinary answer error. */ }
  return null;
}
export const add = (a, b) => fraction(BigInt(a.n) * BigInt(b.d) + BigInt(b.n) * BigInt(a.d), BigInt(a.d) * BigInt(b.d));
export const subtract = (a, b) => fraction(BigInt(a.n) * BigInt(b.d) - BigInt(b.n) * BigInt(a.d), BigInt(a.d) * BigInt(b.d));
export const equal = (a, b) => Boolean(a && b && BigInt(a.n) * BigInt(b.d) === BigInt(b.n) * BigInt(a.d));
export const compare = (a, b) => Math.sign(Number(BigInt(a.n) * BigInt(b.d) - BigInt(b.n) * BigInt(a.d)));
export const sum = values => values.reduce(add, fraction(0));
export const asFraction = value => typeof value === 'string' ? parseFraction(value) : value;
export function mixedLabel(value) {
  if (!value) return '—';
  const { n, d } = value, whole = Math.trunc(n / d), rest = Math.abs(n % d);
  return !rest ? String(whole) : whole ? `${whole} ${rest}/${d}` : `${n}/${d}`;
}
export const commonUnit = (d, values) => Number.isInteger(d) && d > 0 && d <= 48 && values.every(value => d % value.d === 0);
export const partCount = (value, d) => value.n * (d / value.d);
export function split(value, d) { const whole = Math.floor(value.n / value.d); return { whole, parts: (value.n - whole * value.d) * (d / value.d) }; }
