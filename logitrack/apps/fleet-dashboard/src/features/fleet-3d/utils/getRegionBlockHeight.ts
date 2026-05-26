export function getRegionBlockHeight(delayRate: number) {
  return clamp(3.2 + delayRate / 5.8, 3.2, 16);
}

export function getRegionBlockFootprint(totalDeliveries: number) {
  return clamp(5 + Math.sqrt(totalDeliveries) * 0.55, 5, 10.5);
}

export function getWarehouseNodeHeight(capacity: number) {
  return clamp(4.8 + capacity / 38, 4.8, 12.5);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
