import { NextResponse } from "next/server";
import { MASTER_COOKIE } from "@/lib/security/master-token";
import { logSecurity } from "@/lib/security/master";

export const dynamic = "force-dynamic";

export async function POST() {
  await logSecurity({ action: "master_logout", result: "allowed", route: "/api/master/logout" });
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(MASTER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
