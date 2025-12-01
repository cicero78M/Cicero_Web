const {
  contactLookupEvaluator,
  getContact,
  extractDisplayName,
  normalizeContactId,
} = require('../src/services/whatsappContactHelper');

describe('contactLookupEvaluator', () => {
  afterEach(() => {
    delete global.window;
  });

  const setWindowStore = (contact) => {
    global.window = {
      Store: {
        Contact: {
          get: jest.fn(() => contact),
        },
      },
    };
    return global.window.Store.Contact.get;
  };

  test('returns normalized contact info using supported store access', () => {
    const contact = {
      id: { _serialized: '123@c.us' },
      name: 'Alice',
      isMyContact: true,
      isBlocked: false,
    };

    const getSpy = setWindowStore(contact);
    const result = contactLookupEvaluator('123@c.us');

    expect(getSpy).toHaveBeenCalledWith('123@c.us');
    expect(result).toEqual({
      id: '123@c.us',
      isMyContact: true,
      isBlocked: false,
      displayName: 'Alice',
    });
  });

  test('does not throw when contact missing and returns null', () => {
    setWindowStore(null);
    const result = contactLookupEvaluator('missing@c.us');
    expect(result).toBeNull();
  });

  test('avoids legacy getIsMyContact helper by relying on flags', () => {
    const contact = {
      id: { _serialized: '321@c.us' },
      contact: { isMyContact: true },
    };
    Object.defineProperty(contact, 'getIsMyContact', {
      get() {
        throw new Error('legacy access should not be used');
      },
    });

    setWindowStore(contact);
    expect(() => contactLookupEvaluator('321@c.us')).not.toThrow();
  });
});

describe('helper utils', () => {
  test('normalizeContactId respects serialized field', () => {
    expect(normalizeContactId({ id: { _serialized: '987@c.us' } }, 'fallback')).toBe('987@c.us');
    expect(normalizeContactId({ id: '654@c.us' }, 'fallback')).toBe('654@c.us');
    expect(normalizeContactId({}, 'fallback')).toBe('fallback');
  });

  test('extractDisplayName walks display fields', () => {
    expect(extractDisplayName({ pushname: 'Push Name' })).toBe('Push Name');
    expect(extractDisplayName({ verifiedName: 'Verified User' })).toBe('Verified User');
    expect(extractDisplayName({})).toBeNull();
  });
});

describe('getContact', () => {
  test('evaluates contact lookup in page context safely', async () => {
    const page = {
      evaluate: jest.fn((fn, id) => {
        global.window = {
          Store: {
            Contact: {
              get: jest.fn(() => ({ id: id, isMyContact: false })),
            },
          },
        };
        const result = fn(id);
        delete global.window;
        return result;
      }),
    };

    const client = { pupPage: Promise.resolve(page) };
    const contact = await getContact(client, 'sample@c.us');
    expect(page.evaluate).toHaveBeenCalled();
    expect(contact).toEqual({
      id: 'sample@c.us',
      isMyContact: false,
      isBlocked: false,
      displayName: null,
    });
  });
});
