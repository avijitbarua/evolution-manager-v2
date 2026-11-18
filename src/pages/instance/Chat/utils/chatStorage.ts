/**
 * Utility to manage and persist Archived and Locked chat JIDs.
 */

const ARCHIVED_KEY_PREFIX = "evo_archived_chats_";
const LOCKED_KEY_PREFIX = "evo_locked_chats_";

// Default initial archived chat (Joya 162994059239675@lid)
const DEFAULT_ARCHIVED = ["162994059239675@lid", "8801891692574@s.whatsapp.net"];

export const getArchivedJids = (instanceName?: string): Set<string> => {
  if (!instanceName || typeof window === "undefined") return new Set(DEFAULT_ARCHIVED);
  const key = `${ARCHIVED_KEY_PREFIX}${instanceName}`;
  const raw = localStorage.getItem(key);

  if (!raw) {
    // Initialize with default
    localStorage.setItem(key, JSON.stringify(DEFAULT_ARCHIVED));
    return new Set(DEFAULT_ARCHIVED);
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed);
    }
  } catch (e) {
    console.error("Failed to parse archived chats:", e);
  }

  return new Set(DEFAULT_ARCHIVED);
};

export const setArchivedJid = (
  instanceName: string,
  jid: string,
  archive: boolean,
): Set<string> => {
  const current = getArchivedJids(instanceName);
  const cleanNumber = jid.split("@")[0];

  if (archive) {
    current.add(jid);
    current.add(`${cleanNumber}@s.whatsapp.net`);
    current.add(`${cleanNumber}@lid`);
  } else {
    current.delete(jid);
    current.delete(`${cleanNumber}@s.whatsapp.net`);
    current.delete(`${cleanNumber}@lid`);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${ARCHIVED_KEY_PREFIX}${instanceName}`, JSON.stringify(Array.from(current)));
  }

  return new Set(current);
};

export const getLockedJids = (instanceName?: string): Set<string> => {
  if (!instanceName || typeof window === "undefined") return new Set();
  const key = `${LOCKED_KEY_PREFIX}${instanceName}`;
  const raw = localStorage.getItem(key);

  if (!raw) return new Set();

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed);
    }
  } catch (e) {
    console.error("Failed to parse locked chats:", e);
  }

  return new Set();
};

export const setLockedJid = (
  instanceName: string,
  jid: string,
  lock: boolean,
): Set<string> => {
  const current = getLockedJids(instanceName);
  const cleanNumber = jid.split("@")[0];

  if (lock) {
    current.add(jid);
    current.add(`${cleanNumber}@s.whatsapp.net`);
  } else {
    current.delete(jid);
    current.delete(`${cleanNumber}@s.whatsapp.net`);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`${LOCKED_KEY_PREFIX}${instanceName}`, JSON.stringify(Array.from(current)));
  }

  return new Set(current);
};
