export function readSession(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Blocked storage leaves the current page working without persisting the flag.
  }
}
