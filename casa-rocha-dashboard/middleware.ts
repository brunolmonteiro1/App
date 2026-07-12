// Duas camadas de proteção:
//  1) APP_PASSWORD — Basic Auth opcional para todo o painel (uso em servidor público).
//  2) MASTER_PASSWORD — Modo Diagnóstico Interno (/admin/*, /api/master/*), via cookie
//     assinado. A verificação forte (HMAC) também roda server-side na página/endpoint;
//     aqui é a primeira barreira (defesa em profundidade, §7.4).
import { NextRequest, NextResponse } from "next/server";
import { MASTER_COOKIE, verifyToken, isMasterConfigured } from "@/lib/security/master-token";

const MASTER_PATHS = [/^\/admin(\/|$)/, /^\/api\/master(\/|$)/];
// Rotas do próprio fluxo de login master ficam liberadas para permitir autenticar.
const MASTER_OPEN = [/^\/api\/master\/login(\/|$)/];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Camada 2 — Modo Diagnóstico Interno.
  if (MASTER_PATHS.some((r) => r.test(pathname)) && !MASTER_OPEN.some((r) => r.test(pathname))) {
    const gate = await masterGate(req, pathname);
    if (gate) return gate;
  }

  // Camada 1 — senha geral do painel.
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const [, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    if (pass === password) return NextResponse.next();
  }
  return new NextResponse("Autenticação necessária", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Casa da Rocha", charset="UTF-8"' },
  });
}

async function masterGate(req: NextRequest, pathname: string): Promise<NextResponse | null> {
  const isApi = pathname.startsWith("/api/");
  if (!isMasterConfigured()) {
    // Recurso desabilitado — 404 discreto (§7.5).
    return isApi
      ? NextResponse.json({ ok: false, error: "Não encontrado." }, { status: 404 })
      : new NextResponse("Não encontrado.", { status: 404 });
  }
  const ok = await verifyToken(req.cookies.get(MASTER_COOKIE)?.value);
  if (ok) return null; // autorizado; segue para a camada 1
  // A página /admin/master-diagnosis renderiza o próprio formulário de login,
  // então deixamos passar para ela mostrar a tela (o server component reconfere).
  if (!isApi && pathname.startsWith("/admin/master-diagnosis")) return null;
  return isApi
    ? NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 401 })
    : new NextResponse("Não encontrado.", { status: 404 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
