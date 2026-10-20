import test from 'node:test';
import assert from 'node:assert/strict';
import { filledJar, polygonArea, transformJarPoint } from '../../src/games/science/decantGeometry.js';

test('tilting a jar preserves fluid area and a horizontal liquid surface', () => {
  for (const angle of [0, 10, 20, 30, 50]) {
    const jar = [[-0.3, -0.35], [0.3, -0.35], [0.3, 0.4], [-0.3, 0.4]].map(p => transformJarPoint(p, 370, 364, 210, 316, angle));
    for (const fraction of [0.15, 0.35, 0.6, 0.83]) {
      const fluid = filledJar(jar, fraction);
      assert.ok(Math.abs(polygonArea(fluid.points) / polygonArea(jar) - fraction) < 1e-7);
      const surfacePoints = fluid.points.filter(p => Math.abs(p.y - fluid.surface) < 1e-7);
      assert.equal(surfacePoints.length, 2);
      assert.ok(fluid.points.every(p => p.y >= fluid.surface - 1e-7));
      for (const p of fluid.points) {
        const cross = jar.map((a, i) => {
          const b = jar[(i + 1) % jar.length];
          return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
        });
        assert.ok(cross.every(v => v >= -1e-6) || cross.every(v => v <= 1e-6), 'Fluid must stay inside the rotated glass');
      }
    }
  }
});

test('empty and full jars have bounded fluid areas', () => {
  const jar = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 20 }, { x: 0, y: 20 }];
  assert.deepEqual(filledJar(jar, 0).points, []);
  assert.deepEqual(filledJar(jar, -1).points, []);
  assert.ok(Math.abs(polygonArea(filledJar(jar, 2).points) - 200) < 1e-6);
});
