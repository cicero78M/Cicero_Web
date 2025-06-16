import { groupUsersByKelompok } from '../utils/grouping';

describe('groupUsersByKelompok', () => {
  it('groups users by division prefix', () => {
    const users = [
      { name: 'A', divisi: 'Bag Humas' },
      { name: 'B', divisi: 'Sat Reskrim' },
      { name: 'C', divisi: 'Polsek Kota' },
      { name: 'D', divisi: 'SPKT 1' },
    ];
    const result = groupUsersByKelompok(users);
    expect(result.BAG).toHaveLength(1);
    expect(result.SAT).toHaveLength(1);
    expect(result.POLSEK).toHaveLength(1);
    expect(result['SI & SPKT']).toHaveLength(1);
  });
});
