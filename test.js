const assert = require('assert');
const { getFlags } = require('./index');
const { createCanvas } = require('canvas');
const { drawMandelbrotCPU } = require('./mandelbrotCpu');

function runTests() {
  const cases = [
    ['?cpu', { useCPU: true, useDD: false }],
    ['?Cpu', { useCPU: true, useDD: false }],
    ['?dd', { useCPU: false, useDD: true }],
    ['?DD', { useCPU: false, useDD: true }],
    ['?cpu&dd', { useCPU: true, useDD: true }],
    ['', { useCPU: false, useDD: false }],
  ];

  for (const [search, expected] of cases) {
    const result = getFlags(search);
    assert.deepStrictEqual(result, expected, `failed for ${search}`);
  }
  const canvas = createCanvas(20, 20);
  const ctx = canvas.getContext('2d');
  drawMandelbrotCPU(ctx, 20, 20, 20);
  const data = ctx.getImageData(10, 10, 1, 1).data;
  // center pixel should be black (inside the set)
  assert.strictEqual(data[0], 0);
  assert.strictEqual(data[1], 0);
  assert.strictEqual(data[2], 0);
  assert.strictEqual(data[3], 255);
  console.log('All tests passed.');
}

runTests();
