export function polygonArea(points) {
  return Math.abs(points.reduce((sum, p, i) => {
    const next = points[(i + 1) % points.length];
    return sum + p.x * next.y - next.x * p.y;
  }, 0)) / 2;
}

// Clip the transformed jar interior with a horizontal surface in world space.
export function belowSurface(points, y) {
  const result = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const inA = a.y >= y, inB = b.y >= y;
    if (inA) result.push(a);
    if (inA !== inB) {
      const t = (y - a.y) / (b.y - a.y);
      result.push({ x: a.x + (b.x - a.x) * t, y });
    }
  }
  return result;
}

export function filledJar(interior, fraction) {
  if (fraction <= 0) return { points: [], surface: Math.max(...interior.map(p => p.y)) };
  const top = Math.min(...interior.map(p => p.y));
  const bottom = Math.max(...interior.map(p => p.y));
  const target = polygonArea(interior) * Math.min(1, fraction);
  let low = top, high = bottom;
  for (let i = 0; i < 28; i++) {
    const mid = (low + high) / 2;
    if (polygonArea(belowSurface(interior, mid)) > target) low = mid;
    else high = mid;
  }
  const surface = (low + high) / 2;
  return { points: belowSurface(interior, surface), surface };
}

export function transformJarPoint(point, x, y, width, height, angle) {
  const rad = angle * Math.PI / 180, px = point[0] * width, py = point[1] * height;
  return { x: x + px * Math.cos(rad) - py * Math.sin(rad), y: y + px * Math.sin(rad) + py * Math.cos(rad) };
}
