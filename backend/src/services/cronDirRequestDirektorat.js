const DEFAULT_DIRECTORATE_TIME = '20:30';
const BIDHUMAS_EXTRA_GROUP_TIMES = ['15:05', '18:05'];
const BIDHUMAS_CLIENT_ID = 'BIDHUMAS';
const DITBINMAS_CLIENT_ID = 'DITBINMAS';

const normalizeClientId = (client = {}) => String(client.client_id || '').toUpperCase();

const isEligibleDirektoratClient = (client = {}) => {
  const clientType = String(client.client_type || '').toUpperCase();
  return (
    clientType === 'DIREKTORAT' &&
    Boolean(client.status) === true &&
    Boolean(client.instagram) === true &&
    Boolean(client.tiktok) === true
  );
};

const normalizeDefaultTimes = (defaultTimes) => {
  if (Array.isArray(defaultTimes) && defaultTimes.length > 0) {
    return defaultTimes;
  }
  return [DEFAULT_DIRECTORATE_TIME];
};

const scheduleGroupOnly = (scheduleJob, sendGroupReport, clientId, time, scheduledJobs) => {
  const handle = scheduleJob(time, () => sendGroupReport(clientId, time), {
    clientId,
    time,
    target: 'group',
  });
  scheduledJobs.push(handle);
};

const scheduleSuperAdminOnly = (scheduleJob, sendSuperAdminReport, clientId, time, scheduledJobs) => {
  const handle = scheduleJob(time, () => sendSuperAdminReport(clientId, time), {
    clientId,
    time,
    target: 'super_admin',
  });
  scheduledJobs.push(handle);
};

const scheduleGroupAndSuperAdmin = (
  scheduleJob,
  sendGroupReport,
  sendSuperAdminReport,
  clientId,
  time,
  scheduledJobs,
) => {
  const handle = scheduleJob(
    time,
    () => {
      sendGroupReport(clientId, time);
      sendSuperAdminReport(clientId, time);
    },
    {
      clientId,
      time,
      target: 'group_and_super_admin',
    },
  );
  scheduledJobs.push(handle);
};

/**
 * Schedule directorate report delivery based on active clients and platform flags.
 *
 * @param {Object} params
 * @param {Array<Object>} params.clients list of client rows queried from the `clients` table.
 * @param {Function} params.scheduleJob function invoked with (time, handler, meta) to register a cron-like job.
 * @param {Function} params.sendGroupReport callback that delivers the report to the WhatsApp group for the given client_id.
 * @param {Function} params.sendSuperAdminReport callback that delivers the report to the super admin for the given client_id.
 * @param {Array<string>} [params.defaultTimes] optional time strings (HH:mm) representing the legacy directorate schedule (defaults to 20:30 WIB).
 * @returns {Array<*>} array of handles returned by scheduleJob for observability/testing.
 */
function cronDirRequestDirektorat({
  clients = [],
  scheduleJob,
  sendGroupReport = () => {},
  sendSuperAdminReport = () => {},
  defaultTimes,
} = {}) {
  if (typeof scheduleJob !== 'function') {
    throw new Error('scheduleJob callback is required for cronDirRequestDirektorat');
  }

  const timeSlots = normalizeDefaultTimes(defaultTimes);
  const scheduledJobs = [];

  clients.filter(isEligibleDirektoratClient).forEach((client) => {
    const clientId = normalizeClientId(client);

    if (clientId === DITBINMAS_CLIENT_ID) {
      timeSlots.forEach((time) => {
        scheduleSuperAdminOnly(scheduleJob, sendSuperAdminReport, clientId, time, scheduledJobs);
      });
      return;
    }

    if (clientId === BIDHUMAS_CLIENT_ID) {
      BIDHUMAS_EXTRA_GROUP_TIMES.forEach((time) => {
        scheduleGroupOnly(scheduleJob, sendGroupReport, clientId, time, scheduledJobs);
      });
      timeSlots.forEach((time) => {
        scheduleGroupAndSuperAdmin(
          scheduleJob,
          sendGroupReport,
          sendSuperAdminReport,
          clientId,
          time,
          scheduledJobs,
        );
      });
      return;
    }

    timeSlots.forEach((time) => {
      scheduleGroupOnly(scheduleJob, sendGroupReport, clientId, time, scheduledJobs);
    });
  });

  return scheduledJobs;
}

module.exports = {
  BIDHUMAS_CLIENT_ID,
  BIDHUMAS_EXTRA_GROUP_TIMES,
  DITBINMAS_CLIENT_ID,
  DEFAULT_DIRECTORATE_TIME,
  cronDirRequestDirektorat,
  isEligibleDirektoratClient,
  normalizeClientId,
  normalizeDefaultTimes,
};
