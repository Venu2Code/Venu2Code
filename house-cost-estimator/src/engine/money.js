const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const fmt = (n) => '₹' + inr.format(Math.round(n));

// 12,34,567 -> ₹12.35 L ; 1,23,45,678 -> ₹1.23 Cr
export function fmtShort(n) {
  const v = Math.round(n);
  if (Math.abs(v) >= 1e7) return '₹' + (v / 1e7).toFixed(2) + ' Cr';
  if (Math.abs(v) >= 1e5) return '₹' + (v / 1e5).toFixed(2) + ' L';
  return fmt(v);
}
