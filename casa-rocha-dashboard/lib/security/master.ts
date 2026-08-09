// Helpers server-side (Node) do Modo Diagnóstico Interno: leitura do cookie,
// verificação de acesso e registro na trilha de segurança. Nunca registra
// transcrições inteiras nem a MASTER_PASSWORD.

import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import { MASTER_COOKIE, verifyToken, isMasterConfigured } from "./master-token";

export { isMasterConfigured };

export async function isMasterAuthed(): Promise<boolean> {
  if (!isMasterConfigured()) return false;
  const jar = await cookies();
  return verifyToken(jar.get(MASTER_COOKIE)?.value);
}

async function ipHash(): Promise<string | null> {
  try {
    const h = await headers();
    const raw = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "";
    if (!raw) return null;
    const enc = new TextEncoder();
    const sig = await crypto.subtle.digest("SHA-256", enc.encode(raw));
    return Buffer.from(new Uint8Array(sig)).toString("hex").slice(0, 16);
  } catch {
    return null;
  }
}

async function userAgentSummary(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("user-agent")?.slice(0, 120) ?? null;
  } catch {
    return null;
  }
}

export async function logSecurity(entry: {
  action: string;
  result: "allowed" | "denied";
  route?: string;
  resourceType?: string;
  resourceId?: string;
  userLabel?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.securityAuditLog.create({
      data: {
        action: entry.action,
        result: entry.result,
        route: entry.route,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        userLabel: entry.userLabel ?? null,
        metadataJson: entry.metadata ? JSON.stringify(entry.metadata) : null,
        ipHash: await ipHash(),
        userAgent: await userAgentSummary(),
      },
    });
  } catch {
    // A trilha de segurança nunca deve derrubar a requisição.
  }
}

// Guarda para APIs master: retorna null se autorizado, ou um objeto de erro
// (já registrado) para o handler devolver.
export async function requireMaster(route: string): Promise<{ status: number; body: object } | null> {
  if (!isMasterConfigured()) {
    return { status: 404, body: { ok: false, error: "Modo diagnóstico interno não configurado." } };
  }
  if (!(await isMasterAuthed())) {
    await logSecurity({ action: "master_denied", result: "denied", route });
    return { status: 401, body: { ok: false, error: "Acesso negado." } };
  }
  return null;
}
