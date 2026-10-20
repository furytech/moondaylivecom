// Emails this browser has already started a signup for. A second submit for one of them only asks for
// the confirmation link again (auth.resend): it never calls signUp, so it cannot carry a different
// birthday or any other data to the account.

const KEY = "moonday:startedSignups";

const norm = (email: string) => email.trim().toLowerCase();

function read(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((e): e is string => typeof e === "string") : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* storage unavailable */
  }
}

export const hasStartedSignup = (email: string) => read().includes(norm(email));

export function markSignupStarted(email: string) {
  const list = read();
  if (!list.includes(norm(email))) write([...list, norm(email)]);
}

export function forgetStartedSignup(email: string) {
  write(read().filter((e) => e !== norm(email)));
}
