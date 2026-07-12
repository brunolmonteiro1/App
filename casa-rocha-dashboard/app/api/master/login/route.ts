import { NextRequest, NextResponse } from "next/server";
import { expectedToken, isMasterConfigured, MASTER_COOKIE, verifyMasterPassword } from "@/lib/security/master-token";
import { logSecurity } from "@/lib/security/master";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isMasterConfigured()) {
    return NextResponse.json({ ok: false, error: "Modo diagnóstico interno não configurado." }, { status: 404 });
  }
  const { password, label } = await req.json().catch(() => ({}));
  const userLabel = typeof label === "string" && label.trim() ? label.trim().slice(0, 60) : null;

  if (!password || !(await verifyMasterPassword(password))) {
    await logSecurity({ action: "master_login_denied", result: "denied", route: "/api/master/login", userLabel });
    // Pequeno atraso para desencorajar força bruta.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ ok: false, error: "Senha incorreta." }, { status: 401 });
  }

  const token = await expectedToken();
  await logSecurity({ action: "master_login", result: "allowed", route: "/api/master/login", userLabel });
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(MASTER_COOKIE, token!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  });
  return res;
}
