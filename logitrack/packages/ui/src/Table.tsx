import { useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import './Table.css';

export type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  getRowClassName?: (row: T) => string | undefined;
  emptyMessage: string;
  ariaLabel: string;
  virtualized?: boolean;
  virtualizationThreshold?: number;
};

export function Table<T>({
  columns,
  rows,
  getRowKey,
  getRowClassName,
  emptyMessage,
  ariaLabel,
  virtualized = false,
  virtualizationThreshold = 100,
}: TableProps<T>) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const shouldVirtualize = virtualized && rows.length >= virtualizationThreshold;
  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 52,
    getScrollElement: () => scrollRef.current,
    overscan: 8,
  });

  if (rows.length === 0) {
    return <div className="table-empty">{emptyMessage}</div>;
  }

  if (shouldVirtualize) {
    const virtualRows = virtualizer.getVirtualItems();

    return (
      <div className="table-wrapper table-wrapper--virtualized" ref={scrollRef}>
        <table className="table table--virtualized" aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`table__cell--${column.align ?? 'left'}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];

              return (
                <tr className={getRowClassName?.(row)} key={getRowKey(row)} style={{ transform: `translateY(${virtualRow.start}px)` }}>
                  {columns.map((column) => (
                    <td key={column.key} className={`table__cell--${column.align ?? 'left'}`}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="table" aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`table__cell--${column.align ?? 'left'}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className={getRowClassName?.(row)} key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={`table__cell--${column.align ?? 'left'}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
