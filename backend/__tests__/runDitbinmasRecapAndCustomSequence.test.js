const {
  DEFAULT_DELAY_MS,
  DEFAULT_DIRREQUEST_SEQUENCE,
  runDitbinmasRecapAndCustomSequence,
} = require('../src/jobs/runDitbinmasRecapAndCustomSequence');

describe('runDitbinmasRecapAndCustomSequence', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs recap and executes dirrequest menus sequentially for Super Admin with delays', async () => {
    const order = [];
    const runDitbinmasRecap = jest.fn(async (recipient) => {
      order.push(['recap', recipient]);
    });
    const executeDirrequestMenu = jest.fn(async (menuId, options) => {
      order.push(['menu', menuId, options]);
    });
    const logger = { info: jest.fn(), error: jest.fn() };

    const promise = runDitbinmasRecapAndCustomSequence({
      runDitbinmasRecap,
      executeDirrequestMenu,
      superAdminRecipient: 'SUPER_ADMIN',
      delayMs: DEFAULT_DELAY_MS,
      logger,
    });

    await Promise.resolve();

    expect(order).toEqual([
      ['recap', 'SUPER_ADMIN'],
      ['menu', DEFAULT_DIRREQUEST_SEQUENCE[0], { recipient: 'SUPER_ADMIN', audience: 'super_admin' }],
    ]);

    for (let i = 1; i < DEFAULT_DIRREQUEST_SEQUENCE.length; i += 1) {
      await jest.advanceTimersByTimeAsync(DEFAULT_DELAY_MS);
      await Promise.resolve();
      expect(order[i + 1]).toEqual([
        'menu',
        DEFAULT_DIRREQUEST_SEQUENCE[i],
        { recipient: 'SUPER_ADMIN', audience: 'super_admin' },
      ]);
    }

    await promise;

    expect(runDitbinmasRecap).toHaveBeenCalledTimes(1);
    expect(executeDirrequestMenu).toHaveBeenCalledTimes(DEFAULT_DIRREQUEST_SEQUENCE.length);
  });

  it('throws when required functions are missing', async () => {
    await expect(
      runDitbinmasRecapAndCustomSequence({
        executeDirrequestMenu: jest.fn(),
        superAdminRecipient: 'SUPER_ADMIN',
      })
    ).rejects.toThrow('runDitbinmasRecap must be a function');

    await expect(
      runDitbinmasRecapAndCustomSequence({
        runDitbinmasRecap: jest.fn(),
        superAdminRecipient: 'SUPER_ADMIN',
      })
    ).rejects.toThrow('executeDirrequestMenu must be a function');
  });

  it('defaults to the Super Admin audience only and handles custom sequences', async () => {
    const order = [];
    const runDitbinmasRecap = jest.fn(async (recipient) => order.push(['recap', recipient]));
    const executeDirrequestMenu = jest.fn(async (menuId, options) => order.push(['menu', menuId, options]));

    const promise = runDitbinmasRecapAndCustomSequence({
      runDitbinmasRecap,
      executeDirrequestMenu,
      superAdminRecipient: 'SA',
      sequence: [99],
    });

    await Promise.resolve();
    await promise;

    expect(order).toEqual([
      ['recap', 'SA'],
      ['menu', 99, { recipient: 'SA', audience: 'super_admin' }],
    ]);
  });
});
