/**
 * Yerel oturum bayrağı — Supabase girişi gelene kadar.
 * Çıkış yapınca bayrak yazılır ve /login ekranına gidilir; giriş yapınca silinir.
 */
const KEY = 'session.loggedOut';
export const SESSION_EVENT = 'session:changed';

export function isLoggedOut(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function logout() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {}
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function login() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}
