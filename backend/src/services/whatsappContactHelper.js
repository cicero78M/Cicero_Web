const WHATSAPP_DISPLAY_FIELDS = ['name', 'pushname', 'shortName', 'verifiedName', 'formattedName'];

function resolveStore() {
  if (typeof window === 'undefined') {
    return null;
  }
  if (window.Store && window.Store.Contact && typeof window.Store.Contact.get === 'function') {
    return window.Store;
  }
  if (window.WWebJS && typeof window.WWebJS.getStore === 'function') {
    const store = window.WWebJS.getStore();
    if (store && store.Contact && typeof store.Contact.get === 'function') {
      return store;
    }
  }
  return null;
}

function normalizeContactId(contact, fallbackId) {
  if (!contact) return fallbackId;
  if (typeof contact.id === 'string') return contact.id;
  if (contact.id && typeof contact.id._serialized === 'string') {
    return contact.id._serialized;
  }
  return fallbackId;
}

function extractDisplayName(contact) {
  for (const field of WHATSAPP_DISPLAY_FIELDS) {
    if (contact && typeof contact[field] === 'string' && contact[field].trim()) {
      return contact[field];
    }
  }
  return null;
}

function contactLookupEvaluator(contactId) {
  const store = resolveStore();
  if (!store || !store.Contact || typeof store.Contact.get !== 'function') {
    return null;
  }
  const contact = store.Contact.get(contactId);
  if (!contact) return null;

  const isMyContact = Boolean(
    contact.isMyContact ?? contact.contact?.isMyContact ?? contact.__x_isMyContact
  );
  const isBlocked = Boolean(contact.isBlocked ?? contact.contact?.isBlocked ?? contact.__x_isBlocked);

  return {
    id: normalizeContactId(contact, contactId),
    isMyContact,
    isBlocked,
    displayName: extractDisplayName(contact),
  };
}

async function getContact(client, contactId) {
  const page = await client.pupPage;
  return page.evaluate(contactLookupEvaluator, contactId);
}

module.exports = {
  contactLookupEvaluator,
  getContact,
  resolveStore,
  normalizeContactId,
  extractDisplayName,
};
