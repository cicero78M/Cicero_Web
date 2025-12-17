const DEFAULT_DIRREQUEST_SEQUENCE = [6, 9, 34, 35];
const DEFAULT_DELAY_MS = 2 * 60 * 1000;

const noopLogger = {
  info: () => {},
  error: () => {},
};

function validateFunction(fn, name) {
  if (typeof fn !== 'function') {
    throw new TypeError(`${name} must be a function`);
  }
}

function validateRecipient(superAdminRecipient) {
  if (!superAdminRecipient || typeof superAdminRecipient !== 'string') {
    throw new TypeError('superAdminRecipient must be a non-empty string');
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDitbinmasRecapAndCustomSequence({
  runDitbinmasRecap,
  executeDirrequestMenu,
  superAdminRecipient,
  delayMs = DEFAULT_DELAY_MS,
  sequence = DEFAULT_DIRREQUEST_SEQUENCE,
  logger = noopLogger,
}) {
  validateFunction(runDitbinmasRecap, 'runDitbinmasRecap');
  validateFunction(executeDirrequestMenu, 'executeDirrequestMenu');
  validateRecipient(superAdminRecipient);

  const { info = noopLogger.info, error = noopLogger.error } = logger;
  const targets = Array.isArray(sequence) && sequence.length > 0 ? sequence : DEFAULT_DIRREQUEST_SEQUENCE;

  info(
    `Starting Ditbinmas recap followed by dirrequest menus ${targets.join(', ')} for Super Admin ${superAdminRecipient}`
  );

  try {
    await runDitbinmasRecap(superAdminRecipient);

    for (let index = 0; index < targets.length; index += 1) {
      const menuId = targets[index];
      await executeDirrequestMenu(menuId, {
        recipient: superAdminRecipient,
        audience: 'super_admin',
      });

      const isLast = index === targets.length - 1;
      if (!isLast) {
        info(`Waiting ${delayMs}ms before executing dirrequest menu ${targets[index + 1]}`);
        await sleep(delayMs);
      }
    }

    info('Completed Ditbinmas recap and dirrequest sequence for Super Admin');
  } catch (err) {
    error('Ditbinmas recap or dirrequest sequence failed', err);
    throw err;
  }
}

module.exports = {
  DEFAULT_DELAY_MS,
  DEFAULT_DIRREQUEST_SEQUENCE,
  runDitbinmasRecapAndCustomSequence,
};
