import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/** `salt:derivedKey`, both hex. Stored as one column, no scheme prefix needed
 * yet since only this one scheme exists. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, keyHex] = storedHash.split(':');

  if (salt === undefined || keyHex === undefined) {
    return false;
  }

  const storedKey = Buffer.from(keyHex, 'hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedKey, derivedKey);
}

let dummyPasswordHash: Promise<string> | undefined;

/**
 * A hash of no real password, checked against on every unknown-email sign-in
 * attempt so `verifyPassword` always runs regardless of whether the account
 * exists - constant work, so response timing cannot disclose which
 * addresses are registered. Computed once per process and cached; it does
 * not need to be kept secret, since it hashes no real credential.
 */
export function getDummyPasswordHash(): Promise<string> {
  if (dummyPasswordHash === undefined) {
    dummyPasswordHash = hashPassword(randomBytes(32).toString('hex'));
  }

  return dummyPasswordHash;
}
