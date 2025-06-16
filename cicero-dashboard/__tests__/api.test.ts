import { getDashboardStats } from '../utils/api';

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
