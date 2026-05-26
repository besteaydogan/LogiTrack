import { buildCsv } from './csv';

describe('buildCsv', () => {
  it('escapes commas, quotes, and newlines', () => {
    const csv = buildCsv(
      [
        {
          id: 'DRV-001',
          name: 'Ayse "Fast", Demir',
          note: 'Line 1\nLine 2',
        },
      ],
      [
        { header: 'ID', value: (row) => row.id },
        { header: 'Name', value: (row) => row.name },
        { header: 'Note', value: (row) => row.note },
      ],
    );

    expect(csv).toBe('ID,Name,Note\nDRV-001,"Ayse ""Fast"", Demir","Line 1\nLine 2"');
  });
});
