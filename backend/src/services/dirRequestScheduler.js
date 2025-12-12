const WIB_TIMEZONE = 'Asia/Jakarta';

const REPORTING_WINDOWS = [
  { label: '15:00', minute: 0, hour: 15 },
  { label: '18:00', minute: 0, hour: 18 },
  { label: '20:30', minute: 30, hour: 20 },
  { label: '22:00', minute: 0, hour: 22 },
];

const CLIENTS = ['BIDHUMAS', 'DITSAMAPTA'];
const MENUS = [28, 29];

const buildCronExpression = ({ minute, hour }) => `${minute} ${hour} * * *`;

function registerDirRequestCustomSequences(scheduler) {
  if (!scheduler || typeof scheduler.cronDirRequestCustomSequence !== 'function') {
    throw new Error('scheduler.cronDirRequestCustomSequence is required');
  }

  CLIENTS.forEach((clientId) => {
    REPORTING_WINDOWS.forEach((window) => {
      MENUS.forEach((menuId) => {
        scheduler.cronDirRequestCustomSequence({
          clientId,
          menuId,
          cronExpression: buildCronExpression(window),
          timezone: WIB_TIMEZONE,
          windowLabel: window.label,
        });
      });
    });
  });
}

module.exports = {
  registerDirRequestCustomSequences,
  buildCronExpression,
  REPORTING_WINDOWS,
  CLIENTS,
  MENUS,
  WIB_TIMEZONE,
};
