const cron = require('node-cron');
const {
  cronWaNotificationReminder,
  dispatchReminders,
  normalizeRecipient,
} = require('../src/services/cronWaNotificationReminder');

describe('normalizeRecipient', () => {
  test('appends @c.us for numeric recipients', () => {
    expect(normalizeRecipient('628123')).toBe('628123@c.us');
    expect(normalizeRecipient(628123)).toBe('628123@c.us');
  });

  test('returns null for empty or undefined values', () => {
    expect(normalizeRecipient('')).toBeNull();
    expect(normalizeRecipient('   ')).toBeNull();
    expect(normalizeRecipient(undefined)).toBeNull();
  });

  test('passes through when recipient already includes domain', () => {
    expect(normalizeRecipient('user@c.us')).toBe('user@c.us');
    expect(normalizeRecipient('custom-id@example')).toBe('custom-id@example');
  });
});

describe('dispatchReminders', () => {
  test('sends messages and logs success', async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

    await dispatchReminders(
      { sendMessage },
      [{ to: '628111', message: 'Hello' }, { recipient: 'user@c.us', text: 'Hai' }],
      logger,
    );

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenCalledWith('628111@c.us', 'Hello');
    expect(sendMessage).toHaveBeenCalledWith('user@c.us', 'Hai');
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('WhatsApp reminder sent'));
  });

  test('skips invalid reminder payloads and logs warning instead of throwing', async () => {
    const sendMessage = jest.fn();
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

    await dispatchReminders({ sendMessage }, [{ to: null, message: 'nope' }, { to: '123' }], logger);

    expect(sendMessage).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Skipping WhatsApp reminder with missing recipient or message.',
      expect.objectContaining({ recipient: null, hasMessage: true })
    );
  });

  test('catches sendMessage failures and logs error', async () => {
    const sendMessage = jest.fn().mockRejectedValue(new Error('network failure'));
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

    await dispatchReminders({ sendMessage }, [{ to: '6281', message: 'test' }], logger);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send WhatsApp reminder to 6281@c.us'),
      expect.any(Error)
    );
  });
});

describe('cronWaNotificationReminder', () => {
  beforeEach(() => {
    jest.spyOn(cron, 'validate').mockReturnValue(true);
    jest.spyOn(cron, 'schedule').mockImplementation((_, callback) => {
      callback();
      return { start: jest.fn(), stop: jest.fn() };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('throws on invalid cron expression', () => {
    cron.validate.mockReturnValue(false);

    expect(() =>
      cronWaNotificationReminder({
        client: { sendMessage: jest.fn() },
        cronExpression: 'invalid',
        reminders: [],
      })
    ).toThrow('Invalid cron expression provided');
  });

  test('schedules dispatch and returns task', () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const task = cronWaNotificationReminder({
      client: { sendMessage },
      cronExpression: '* * * * *',
      reminders: [{ to: '6281', message: 'Hello' }],
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    expect(cron.schedule).toHaveBeenCalledWith(
      '* * * * *',
      expect.any(Function),
      { scheduled: true }
    );
    expect(task).toHaveProperty('start');
    expect(sendMessage).toHaveBeenCalledWith('6281@c.us', 'Hello');
  });
});
