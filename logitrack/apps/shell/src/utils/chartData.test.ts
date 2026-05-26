import { latestWindow } from './chartData';

describe('latestWindow', () => {
  it('keeps the latest points when data exceeds the window', () => {
    expect(latestWindow([1, 2, 3, 4], 2)).toEqual([3, 4]);
  });

  it('returns the original points when data fits the window', () => {
    const values = [1, 2];

    expect(latestWindow(values, 5)).toBe(values);
  });
});
