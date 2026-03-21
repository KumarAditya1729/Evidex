import { randomBytes, scrypt, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function scryptAsync(
  password: string,
  salt: string,
  keyLen: number,
  options: { N: number; r: number; p: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLen, options, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  // Format: scrypt$N$r$p$salt$hash — parameters stored for future migration
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPasswordHash(password: string, encodedHash: string): Promise<boolean> {
  const parts = encodedHash.split("$");

  let N: number, r: number, p: number, salt: string, storedHash: string;

  if (parts.length === 6) {
    // New format: scrypt$N$r$p$salt$hash
    const [algorithm, rawN, rawR, rawP, rawSalt, rawHash] = parts;
    if (algorithm !== "scrypt") return false;
    N = Number(rawN); r = Number(rawR); p = Number(rawP);
    salt = rawSalt; storedHash = rawHash;
  } else if (parts.length === 3) {
    // Legacy format: scrypt$salt$hash (default N=16384, r=8, p=1)
    const [algorithm, rawSalt, rawHash] = parts;
    if (algorithm !== "scrypt") return false;
    N = 16384; r = 8; p = 1;
    salt = rawSalt; storedHash = rawHash;
  } else {
    return false;
  }

  if (!salt || !storedHash || !Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }

  const storedBuffer = Buffer.from(storedHash, "hex");
  if (!storedBuffer.length) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH, { N, r, p });
  if (derivedKey.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedBuffer);
}
