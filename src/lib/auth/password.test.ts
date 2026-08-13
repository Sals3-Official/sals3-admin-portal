import { describe, expect, it } from 'vitest';
import { getDummyPasswordHash, hashPassword, verifyPassword } from './password';

describe('hashPassword / verifyPassword', () => {
  it('verifies the correct password against its own hash', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(await verifyPassword('correct horse battery staple', hash)).toBe(
      true,
    );
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });

  it('produces a different hash each time (random salt)', async () => {
    const first = await hashPassword('same password');
    const second = await hashPassword('same password');

    expect(first).not.toBe(second);
    expect(await verifyPassword('same password', first)).toBe(true);
    expect(await verifyPassword('same password', second)).toBe(true);
  });

  it('rejects a malformed stored hash instead of throwing', async () => {
    expect(await verifyPassword('anything', 'not-a-valid-hash')).toBe(false);
  });
});

describe('getDummyPasswordHash', () => {
  it('returns a hash that verifies against no real password, and never throws', async () => {
    const dummy = await getDummyPasswordHash();

    expect(await verifyPassword('whatever', dummy)).toBe(false);
    expect(await verifyPassword('', dummy)).toBe(false);
  });

  it('is stable across calls within the same process', async () => {
    expect(await getDummyPasswordHash()).toBe(await getDummyPasswordHash());
  });
});
