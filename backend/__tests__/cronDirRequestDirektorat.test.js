const {
  BIDHUMAS_CLIENT_ID,
  BIDHUMAS_EXTRA_GROUP_TIMES,
  DITBINMAS_CLIENT_ID,
  DEFAULT_DIRECTORATE_TIME,
  cronDirRequestDirektorat,
  isEligibleDirektoratClient,
} = require('../src/services/cronDirRequestDirektorat');

describe('isEligibleDirektoratClient', () => {
  it('filters only active directorate clients with instagram and tiktok enabled', () => {
    expect(
      isEligibleDirektoratClient({
        client_type: 'Direktorat',
        status: true,
        instagram: true,
        tiktok: true,
      }),
    ).toBe(true);

    expect(
      isEligibleDirektoratClient({
        client_type: 'satker',
        status: true,
        instagram: true,
        tiktok: true,
      }),
    ).toBe(false);

    expect(
      isEligibleDirektoratClient({
        client_type: 'Direktorat',
        status: false,
        instagram: true,
        tiktok: true,
      }),
    ).toBe(false);

    expect(
      isEligibleDirektoratClient({
        client_type: 'Direktorat',
        status: true,
        instagram: false,
        tiktok: true,
      }),
    ).toBe(false);

    expect(
      isEligibleDirektoratClient({
        client_type: 'Direktorat',
        status: true,
        instagram: true,
        tiktok: false,
      }),
    ).toBe(false);
  });
});

describe('cronDirRequestDirektorat', () => {
  const createMocks = () => {
    const sendGroupReport = jest.fn();
    const sendSuperAdminReport = jest.fn();
    const scheduledMeta = [];
    const scheduleJob = jest.fn((time, handler, meta) => {
      scheduledMeta.push(meta);
      handler();
      return { time, meta };
    });
    return { sendGroupReport, sendSuperAdminReport, scheduledMeta, scheduleJob };
  };

  const eligibleClients = [
    {
      client_id: DITBINMAS_CLIENT_ID,
      client_type: 'Direktorat',
      status: true,
      instagram: true,
      tiktok: true,
    },
    {
      client_id: BIDHUMAS_CLIENT_ID,
      client_type: 'Direktorat',
      status: true,
      instagram: true,
      tiktok: true,
    },
    {
      client_id: 'DITRESKRIMSUS',
      client_type: 'Direktorat',
      status: true,
      instagram: true,
      tiktok: true,
    },
    {
      client_id: 'SATKER_SKIP',
      client_type: 'Satker',
      status: true,
      instagram: true,
      tiktok: true,
    },
  ];

  it('schedules based on client list with BIDHUMAS and DITBINMAS rules applied', () => {
    const { sendGroupReport, sendSuperAdminReport, scheduledMeta, scheduleJob } = createMocks();

    const results = cronDirRequestDirektorat({
      clients: eligibleClients,
      scheduleJob,
      sendGroupReport,
      sendSuperAdminReport,
      defaultTimes: [DEFAULT_DIRECTORATE_TIME],
    });

    // scheduleJob should be called for 1x Ditbinmas + (2 extra + 1 default) for Bidhumas + 1x default for generic directorate
    const expectedJobs = 1 + (BIDHUMAS_EXTRA_GROUP_TIMES.length + 1) + 1;
    expect(scheduleJob).toHaveBeenCalledTimes(expectedJobs);
    expect(results).toHaveLength(expectedJobs);

    // DITBINMAS only goes to super admin at default time
    expect(sendSuperAdminReport).toHaveBeenCalledWith(DITBINMAS_CLIENT_ID, DEFAULT_DIRECTORATE_TIME);
    expect(sendGroupReport).not.toHaveBeenCalledWith(DITBINMAS_CLIENT_ID, expect.any(String));

    // BIDHUMAS two extra group times and default dual delivery
    BIDHUMAS_EXTRA_GROUP_TIMES.forEach((time) => {
      expect(sendGroupReport).toHaveBeenCalledWith(BIDHUMAS_CLIENT_ID, time);
    });
    expect(sendGroupReport).toHaveBeenCalledWith(BIDHUMAS_CLIENT_ID, DEFAULT_DIRECTORATE_TIME);
    expect(sendSuperAdminReport).toHaveBeenCalledWith(BIDHUMAS_CLIENT_ID, DEFAULT_DIRECTORATE_TIME);

    // Generic directorate gets scheduled group delivery only
    expect(sendGroupReport).toHaveBeenCalledWith('DITRESKRIMSUS', DEFAULT_DIRECTORATE_TIME);

    // Validate metadata captured by scheduler
    expect(scheduledMeta).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clientId: BIDHUMAS_CLIENT_ID, time: '15:05', target: 'group' }),
        expect.objectContaining({ clientId: BIDHUMAS_CLIENT_ID, time: '18:05', target: 'group' }),
        expect.objectContaining({
          clientId: BIDHUMAS_CLIENT_ID,
          time: DEFAULT_DIRECTORATE_TIME,
          target: 'group_and_super_admin',
        }),
        expect.objectContaining({
          clientId: DITBINMAS_CLIENT_ID,
          time: DEFAULT_DIRECTORATE_TIME,
          target: 'super_admin',
        }),
        expect.objectContaining({ clientId: 'DITRESKRIMSUS', target: 'group' }),
      ]),
    );
  });
});
