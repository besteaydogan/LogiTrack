export function latestWindow<T>(items: T[], maxItems: number) {
  if (items.length <= maxItems) {
    return items;
  }

  return items.slice(items.length - maxItems);
}
