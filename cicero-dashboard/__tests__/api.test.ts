import {
  getDashboardStats,
  getInstagramBasicProfile,
  getInstagramBasicPosts,
  getInstagramBasicAccessToken,
} from '../utils/api';

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

test('getInstagramBasicProfile adds access token query', async () => {
  await getInstagramBasicProfile('token123', 'IGTOKEN');
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/insta/basic-profile'),
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token123' })
    })
  );
});

test('getInstagramBasicPosts adds access token and limit', async () => {
  await getInstagramBasicPosts('token123', 'IGTOKEN', 5);
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/insta/basic-posts'),
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token123' })
    })
  );
});

test('getInstagramBasicAccessToken exchanges code', async () => {
  await getInstagramBasicAccessToken('CODE123');
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/insta/basic-token?code=CODE123')
  );
});
