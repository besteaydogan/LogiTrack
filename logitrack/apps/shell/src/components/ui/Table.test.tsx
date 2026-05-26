import { render, screen } from '@testing-library/react';

import { Table, type TableColumn } from './Table';

type Row = {
  id: string;
  name: string;
  count: number;
};

const columns: TableColumn<Row>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (row) => row.name,
  },
  {
    key: 'count',
    header: 'Count',
    align: 'right',
    render: (row) => row.count,
  },
];

describe('Table', () => {
  it('renders rows and headers', () => {
    render(
      <Table
        ariaLabel="Demo rows"
        columns={columns}
        emptyMessage="No rows"
        getRowKey={(row) => row.id}
        rows={[{ id: '1', name: 'Ankara', count: 4 }]}
      />,
    );

    expect(screen.getByRole('table', { name: 'Demo rows' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Ankara' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '4' })).toHaveClass('table__cell--right');
  });

  it('renders the empty state when no rows are available', () => {
    render(
      <Table
        ariaLabel="Demo rows"
        columns={columns}
        emptyMessage="No rows"
        getRowKey={(row) => row.id}
        rows={[]}
      />,
    );

    expect(screen.getByText('No rows')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
