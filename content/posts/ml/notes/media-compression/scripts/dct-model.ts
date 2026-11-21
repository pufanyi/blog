export const transformSize = 4 as const;
export const transformSource = [
  82, 83, 84, 86, 82, 84, 87, 91, 83, 86, 96, 108, 84, 88, 110, 140,
] as const;
export const quantizationTable = [4, 4, 6, 8, 4, 6, 8, 10, 6, 8, 10, 12, 8, 10, 12, 16] as const;

function dctScale(index: number) {
  return index === 0 ? Math.sqrt(1 / transformSize) : Math.sqrt(2 / transformSize);
}

function dct2(values: readonly number[]) {
  return Array.from({ length: transformSize * transformSize }, (_, index) => {
    const u = Math.floor(index / transformSize);
    const v = index % transformSize;
    let sum = 0;
    for (let x = 0; x < transformSize; x += 1) {
      for (let y = 0; y < transformSize; y += 1) {
        sum +=
          (values[x * transformSize + y] - 128) *
          Math.cos(((2 * x + 1) * u * Math.PI) / (2 * transformSize)) *
          Math.cos(((2 * y + 1) * v * Math.PI) / (2 * transformSize));
      }
    }
    return dctScale(u) * dctScale(v) * sum;
  });
}

function inverseDct2(coefficients: readonly number[]) {
  return Array.from({ length: transformSize * transformSize }, (_, index) => {
    const x = Math.floor(index / transformSize);
    const y = index % transformSize;
    let sum = 0;
    for (let u = 0; u < transformSize; u += 1) {
      for (let v = 0; v < transformSize; v += 1) {
        sum +=
          dctScale(u) *
          dctScale(v) *
          coefficients[u * transformSize + v] *
          Math.cos(((2 * x + 1) * u * Math.PI) / (2 * transformSize)) *
          Math.cos(((2 * y + 1) * v * Math.PI) / (2 * transformSize));
      }
    }
    return Math.max(0, Math.min(255, Math.round(sum + 128)));
  });
}

export const transformCoefficients = dct2(transformSource);
export const quantizedCoefficients = transformCoefficients.map((value, index) =>
  Math.round(value / quantizationTable[index]),
);
export const dequantizedCoefficients = quantizedCoefficients.map(
  (value, index) => value * quantizationTable[index],
);
export const reconstructedSource = inverseDct2(dequantizedCoefficients);
export const zeroCoefficients = quantizedCoefficients.filter((value) => value === 0).length;
export const reconstructionMse =
  transformSource.reduce(
    (sum, value, index) => sum + (value - reconstructedSource[index]) ** 2,
    0,
  ) / transformSource.length;
