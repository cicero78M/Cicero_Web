const cron = require('node-cron');

function normalizeRecipient(recipient) {
  if (recipient === undefined || recipient === null) return null;
  const normalized = String(recipient).trim();
  if (!normalized) return null;
  if (normalized.includes('@')) return normalized;
  if (/^\d+$/.test(normalized)) {
    return `${normalized}@c.us`;
  }
  return normalized;
}

async function dispatchReminders(client, reminders, logger = console) {
  if (!client || typeof client.sendMessage !== 'function') {
    throw new Error('dispatchReminders requires a WhatsApp client with sendMessage(contactId, message).');
  }

  const entries = Array.isArray(reminders) ? reminders : reminders ? [reminders] : [];

  for (const reminder of entries) {
    const recipient = normalizeRecipient(reminder?.to ?? reminder?.recipient);
    const message = reminder?.message ?? reminder?.text;

    if (!recipient || !message) {
      logger.warn?.('Skipping WhatsApp reminder with missing recipient or message.', {
        recipient,
        hasMessage: Boolean(message),
      });
      continue;
    }

    try {
      await client.sendMessage(recipient, message);
      logger.info?.(`WhatsApp reminder sent to ${recipient}`);
    } catch (error) {
      logger.error?.(`Failed to send WhatsApp reminder to ${recipient}`, error);
    }
  }
}

function cronWaNotificationReminder({ client, cronExpression, reminders, logger = console, start = true }) {
  if (!client || typeof client.sendMessage !== 'function') {
    throw new Error('cronWaNotificationReminder requires a WhatsApp client with sendMessage(contactId, message).');
  }

  if (!cronExpression || !cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression provided: ${cronExpression || '(empty)'}`);
  }

  const entries = Array.isArray(reminders) ? reminders : reminders ? [reminders] : [];
  if (!entries.length) {
    logger.warn?.('No reminders provided to cronWaNotificationReminder; scheduled task will be a no-op.');
  }

  const task = cron.schedule(
    cronExpression,
    () => dispatchReminders(client, entries, logger),
    { scheduled: start }
  );

  return task;
}

module.exports = {
  cronWaNotificationReminder,
  dispatchReminders,
  normalizeRecipient,
};
