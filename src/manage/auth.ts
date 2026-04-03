import crypto from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { KVClient } from "../clients/KVClient";
import { getUserById } from "../datasource/usersRepository";
import { UnauthorizedMessageError } from "../errors";

const TEMP_TOKEN_TTL_SECS = 60 * 60;
const SESSION_TTL_SECS = 60 * 60;
const TEMP_TOKEN_PREFIX = "manage-minyan-token";
const SESSION_PREFIX = "manage-minyan-session";
const SESSION_COOKIE_NAME = "tzenter_manage_session";

export type ManageMinyanTokenPayload = {
  userId: number;
  minyanId: number;
  phone: string;
  issuedAt: string;
  sessionId?: string;
};

export type ManageMinyanSession = {
  userId: number;
  phone: string;
  displayName: string;
  minyanIdsAdminOf: number[];
  activeMinyanId: number;
};

function getKVClient<T>() {
  return new KVClient<T>(
    process.env.KV_REST_API_TOKEN!,
    process.env.KV_REST_API_URL!
  );
}

function tokenKey(token: string) {
  return `${TEMP_TOKEN_PREFIX}:${token}`;
}

function sessionKey(sessionId: string) {
  return `${SESSION_PREFIX}:${sessionId}`;
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
    path?: string;
  } = {}
) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  parts.push(`Path=${options.path || "/"}`);
  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }
  if (options.secure !== false) {
    parts.push("Secure");
  }
  parts.push(`SameSite=${options.sameSite || "Lax"}`);

  return parts.join("; ");
}

function parseCookies(header?: string): Record<string, string> {
  if (!header) {
    return {};
  }

  return header.split(";").reduce((acc, cookiePart) => {
    const [rawName, ...rawValue] = cookiePart.trim().split("=");
    if (!rawName) {
      return acc;
    }

    acc[rawName] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {} as Record<string, string>);
}

export function getManageMinyanBaseUrl(): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function buildManageMinyanUrl(token: string): string {
  return `${getManageMinyanBaseUrl()}/manage-minyan?t=${encodeURIComponent(
    token
  )}`;
}

export async function issueManageMinyanToken(
  payload: Omit<ManageMinyanTokenPayload, "issuedAt">
): Promise<string> {
  const token = crypto.randomBytes(24).toString("hex");
  const client = getKVClient<ManageMinyanTokenPayload>();
  await client.set(
    tokenKey(token),
    {
      ...payload,
      issuedAt: new Date().toISOString(),
    },
    TEMP_TOKEN_TTL_SECS
  );
  return token;
}

export async function getManageMinyanToken(
  token: string
): Promise<ManageMinyanTokenPayload | null> {
  const client = getKVClient<ManageMinyanTokenPayload>();
  return client.get(tokenKey(token));
}

export async function createManageSession(
  payload: ManageMinyanTokenPayload
): Promise<string | null> {
  const user = await getUserById(payload.userId);
  if (!user?.adminMinyans?.length) {
    return null;
  }

  const minyanIdsAdminOf = user.adminMinyans.map((minyan) => minyan.id);
  if (!minyanIdsAdminOf.includes(payload.minyanId)) {
    return null;
  }

  const sessionId = crypto.randomBytes(24).toString("hex");
  const client = getKVClient<ManageMinyanSession>();
  await client.set(
    sessionKey(sessionId),
    {
      userId: user.id,
      phone: user.phone,
      displayName: user.name,
      minyanIdsAdminOf,
      activeMinyanId: payload.minyanId,
    },
    SESSION_TTL_SECS
  );

  return sessionId;
}

export async function exchangeManageMinyanTokenForSession(
  token: string
): Promise<string | null> {
  const client = getKVClient<ManageMinyanTokenPayload>();
  const tokenPayload = await client.get(tokenKey(token));

  if (!tokenPayload) {
    return null;
  }

  if (tokenPayload.sessionId) {
    const existingSession = await getKVClient<ManageMinyanSession>().get(
      sessionKey(tokenPayload.sessionId)
    );

    if (!existingSession) {
      return null;
    }

    return tokenPayload.sessionId;
  }

  const sessionId = await createManageSession(tokenPayload);
  if (!sessionId) {
    return null;
  }

  await client.set(
    tokenKey(token),
    {
      ...tokenPayload,
      sessionId,
    },
    TEMP_TOKEN_TTL_SECS
  );

  return sessionId;
}

export async function getManageSession(
  req: Pick<VercelRequest, "headers">
): Promise<ManageMinyanSession | null> {
  const cookies = parseCookies(req.headers?.cookie);
  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (!sessionId) {
    return null;
  }

  const client = getKVClient<ManageMinyanSession>();
  return client.get(sessionKey(sessionId));
}

export async function requireManageSession(
  req: Pick<VercelRequest, "headers">
): Promise<ManageMinyanSession> {
  const session = await getManageSession(req);
  if (!session) {
    throw new UnauthorizedMessageError("Missing or invalid management session");
  }
  return session;
}

export function setManageSessionCookie(
  res: Pick<VercelResponse, "setHeader">,
  sessionId: string
) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, sessionId, {
      maxAge: SESSION_TTL_SECS,
    })
  );
}

export async function clearManageSession(
  req: Pick<VercelRequest, "headers">,
  res: Pick<VercelResponse, "setHeader">
) {
  const cookies = parseCookies(req.headers?.cookie);
  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (sessionId) {
    const client = getKVClient<ManageMinyanSession>();
    await client.del(sessionKey(sessionId));
  }

  res.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, "", {
      maxAge: 0,
    })
  );
}
