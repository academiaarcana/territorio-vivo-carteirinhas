const initialState = {
  booting: true,
  session: null,
  user: null,
  profile: null,
  context: null,
  municipalities: [],
  units: [],
  teams: [],
  lastError: null
};

let state = { ...initialState };
const listeners = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener(state));
  return state;
}

export function resetState() {
  state = { ...initialState, booting: false };
  listeners.forEach((listener) => listener(state));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
