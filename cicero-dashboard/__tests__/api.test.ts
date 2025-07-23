import { getDashboardStats, getRekapAmplify } from '../utils/api';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ data: 1 }) })
  ) as any;
});

afterEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

test('getDashboardStats calls endpoint with auth header', async () => {
  await getDashboardStats('token123');
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/dashboard/stats'),
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token123' })
    })
  );
});

test('getRekapAmplify calls endpoint with auth header', async () => {
  await getRekapAmplify('tok', 'c1', 'harian', '2024-01-01');
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/amplify/rekap'),
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer tok' })
    })
  );
});


