const {
  registerDirRequestCustomSequences,
  buildCronExpression,
  REPORTING_WINDOWS,
  CLIENTS,
  MENUS,
  WIB_TIMEZONE,
} = require('../src/services/dirRequestScheduler');

describe('registerDirRequestCustomSequences', () => {
  it('registers dir request sequences for all clients, menus, and reporting windows', () => {
    const cronDirRequestCustomSequence = jest.fn();
    const scheduler = { cronDirRequestCustomSequence };

    registerDirRequestCustomSequences(scheduler);

    const expectedCallCount = CLIENTS.length * MENUS.length * REPORTING_WINDOWS.length;
    expect(cronDirRequestCustomSequence).toHaveBeenCalledTimes(expectedCallCount);

    CLIENTS.forEach((clientId) => {
      REPORTING_WINDOWS.forEach((window) => {
        const cronExpression = buildCronExpression(window);
        MENUS.forEach((menuId) => {
          expect(cronDirRequestCustomSequence).toHaveBeenCalledWith({
            clientId,
            menuId,
            cronExpression,
            timezone: WIB_TIMEZONE,
            windowLabel: window.label,
          });
        });
      });
    });
  });

  it('throws when scheduler is missing required method', () => {
    expect(() => registerDirRequestCustomSequences({})).toThrow(
      'scheduler.cronDirRequestCustomSequence is required',
    );
  });
});

describe('buildCronExpression', () => {
  it('creates cron expressions for WIB schedule', () => {
    expect(buildCronExpression({ minute: 0, hour: 15 })).toBe('0 15 * * *');
    expect(buildCronExpression({ minute: 30, hour: 20 })).toBe('30 20 * * *');
  });
});
