const drafts = new Map();

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

export function readVolatileDraft(key, fallback = null) {
  if (!drafts.has(key)) return clone(fallback);
  return clone(drafts.get(key));
}

export function writeVolatileDraft(key, value) {
  drafts.set(key, clone(value));
  return value;
}

export function clearVolatileDraft(key) {
  drafts.delete(key);
}

export function clearAllVolatileDrafts() {
  drafts.clear();
}
