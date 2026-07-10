// Proteção opcional por senha (Basic Auth). Ativa apenas se APP_PASSWORD estiver
// definida no ambiente — sem ela, o dashboard fica aberto (uso local).
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
