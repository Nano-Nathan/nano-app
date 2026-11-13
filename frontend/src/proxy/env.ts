/** Env var of the backend URL of a store: `backend` → `API_BACKEND_URL` */
export function urlEnv(sStore: string): string {
  return `API_${sStore.toUpperCase()}_URL`;
}

/** Env var of the value of a header of a store: `KEY` → `API_KEY_HEADER` */
export function headerEnv(sValue: string): string {
  return `API_${sValue.toUpperCase()}_HEADER`;
}
