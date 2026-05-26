import { createCoalescedLiveUpdater } from './live';

describe('createCoalescedLiveUpdater', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesces multiple live events into one latest update', () => {
    const update = vi.fn();
    const updater = createCoalescedLiveUpdater<number>(update, 750);

    updater.push(1);
    updater.push(2);
    updater.push(3);

    expect(update).not.toHaveBeenCalled();

    vi.advanceTimersByTime(750);

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(3);
  });

  it('flushes the latest event on dispose', () => {
    const update = vi.fn();
    const updater = createCoalescedLiveUpdater<number>(update, 750);

    updater.push(1);
    updater.dispose();

    expect(update).toHaveBeenCalledWith(1);
  });
});
