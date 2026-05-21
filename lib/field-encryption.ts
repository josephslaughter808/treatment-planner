import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const algorithm = "aes-256-gcm";
const envelopeMarker = "__clearpathEncrypted";

type EncryptedEnvelope = {
  [envelopeMarker]: true;
  v: 1;
  alg: "AES-256-GCM";
  iv: string;
  tag: string;
  data: string;
};

export function isFieldEncryptionConfigured() {
  return Boolean(process.env.CLEARPATH_FIELD_ENCRYPTION_KEY);
}

export function encryptJsonField<T>(value: T): T | EncryptedEnvelope {
  const key = getEncryptionKey();
  if (!key) {
    enforceEncryptionIfRequired();
    return value;
  }

  return encryptString(JSON.stringify(value), key);
}

export function decryptJsonField<T>(value: unknown, fallback: T): T {
  if (!isEncryptedEnvelope(value)) {
    return (value ?? fallback) as T;
  }

  const key = getEncryptionKey();
  if (!key) {
    enforceEncryptionIfRequired();
    return fallback;
  }

  try {
    return JSON.parse(decryptString(value, key)) as T;
  } catch {
    return fallback;
  }
}

export function encryptTextField(value: string) {
  const key = getEncryptionKey();
  if (!key) {
    enforceEncryptionIfRequired();
    return value;
  }

  return JSON.stringify(encryptString(value, key));
}

export function decryptTextField(value: unknown) {
  if (typeof value !== "string" || !value) {
    return "";
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isEncryptedEnvelope(parsed)) {
      return value;
    }

    const key = getEncryptionKey();
    if (!key) {
      enforceEncryptionIfRequired();
      return "";
    }

    return decryptString(parsed, key);
  } catch {
    return value;
  }
}

function encryptString(value: string, key: Buffer): EncryptedEnvelope {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);

  return {
    [envelopeMarker]: true,
    v: 1,
    alg: "AES-256-GCM",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64")
  };
}

function decryptString(envelope: EncryptedEnvelope, key: Buffer) {
  const decipher = createDecipheriv(algorithm, key, Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, "base64")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

function getEncryptionKey() {
  const raw = process.env.CLEARPATH_FIELD_ENCRYPTION_KEY;
  if (!raw) {
    return null;
  }

  const decoded = decodeKey(raw);
  if (decoded.length !== 32) {
    throw new Error("CLEARPATH_FIELD_ENCRYPTION_KEY must decode to 32 bytes for AES-256-GCM.");
  }

  return decoded;
}

function decodeKey(raw: string) {
  if (raw.startsWith("base64:")) {
    return Buffer.from(raw.slice("base64:".length), "base64");
  }

  if (raw.startsWith("hex:")) {
    return Buffer.from(raw.slice("hex:".length), "hex");
  }

  return Buffer.from(raw, "base64");
}

function enforceEncryptionIfRequired() {
  if (process.env.CLEARPATH_REQUIRE_FIELD_ENCRYPTION === "true") {
    throw new Error("Field encryption is required, but CLEARPATH_FIELD_ENCRYPTION_KEY is not configured.");
  }
}

function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Partial<EncryptedEnvelope>)[envelopeMarker] === true &&
      (value as Partial<EncryptedEnvelope>).alg === "AES-256-GCM"
  );
}
