import {
  DISPATCHER_CREDENTIALS,
  DEMO_OTP,
  RESPONDER_CREDENTIALS,
} from "./constants";
import type { AuthMethod, UserRole, UserSession } from "./types";

const SESSION_KEY = "tabang-daet-session";

export function createCitizenSession({
  name,
  phone,
  authMethod,
}: {
  name: string;
  phone: string;
  authMethod: AuthMethod;
}): UserSession {
  return {
    id: `citizen-${phone.replace(/\D/g, "")}`,
    name: name.trim() || "Verified Resident",
    phone,
    role: "citizen",
    authMethod,
  };
}

export function verifyStaffLogin(
  role: "dispatcher" | "responder",
  username: string,
  password: string,
): boolean {
  const creds =
    role === "dispatcher" ? DISPATCHER_CREDENTIALS : RESPONDER_CREDENTIALS;
  return username === creds.username && password === creds.password;
}

export function createStaffSession(
  role: "dispatcher" | "responder",
  displayName: string,
): UserSession {
  return {
    id: `${role}-${Date.now()}`,
    name: displayName,
    phone: "N/A",
    role,
    authMethod: "phone",
  };
}

export function verifyOtp(code: string): boolean {
  return code.trim() === DEMO_OTP;
}

export function saveSession(session: UserSession): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): UserSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserSession) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(SESSION_KEY);
}

export function requireRole(
  session: UserSession | null,
  role: UserRole,
): boolean {
  return session?.role === role;
}
