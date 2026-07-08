// ============================================================================
// CAMADA DE SEGURANÇA — o coração do coletor.
// Tudo o que entra no STCOP passa por aqui. Read-only por design.
// Nada neste arquivo é específico do STCOP: são os trilhos que valem para
// qualquer sistema legado que venhamos a coletar.
// ============================================================================
import type { Page, Route, Request } from "playwright";

// Verbos/paths que NUNCA devem sair como requisição de escrita.
// Se a página tentar disparar qualquer um destes, a requisição é abortada
// e registrada. Ajuste conforme o vocabulário real do STCOP.
const FORBIDDEN_URL_PATTERNS: RegExp[] = [
  /salvar|save/i,
  /excluir|delete|remover/i,
  /cancelar|cancel/i,
  /ativar|activate|ativa[cç][aã]o/i,
  /gerar.?boleto|emitir.?boleto|boleto/i,
  /submit|enviar|efetivar|confirmar/i,
  /novo.?contrato|criar|create|insert|update/i,
];

// Métodos HTTP considerados de escrita. GET/HEAD passam; o resto é bloqueado
// a menos que a URL esteja explicitamente na allowlist de exceções (rara).
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export type SafetyLog = {
  ts: string;
  kind: "nav_blocked" | "write_blocked" | "nav_ok" | "write_allowed";
  method: string;
  url: string;
  reason?: string;
};

export class SafetyGuard {
  readonly logs: SafetyLog[] = [];

  constructor(
    // Somente URLs que casem com um destes prefixos podem ser navegadas.
    private readonly urlAllowlist: RegExp[],
    // Em dry-run, até GETs de export são apenas logados, sem baixar de fato.
    private readonly dryRun: boolean,
    // Allowlist de POSTs legítimos (ex.: o próprio submit do formulário de
    // LOGIN, que é POST mas é necessário). Mantê-la mínima e explícita.
    private readonly writeAllowlist: RegExp[] = [],
  ) {}

  private log(entry: Omit<SafetyLog, "ts">) {
    this.logs.push({ ts: new Date().toISOString(), ...entry });
  }

  // Liga a interceptação de rede na página. Deve ser chamado ANTES de navegar.
  async attach(page: Page): Promise<void> {
    await page.route("**/*", (route: Route, request: Request) => {
      const method = request.method().toUpperCase();
      const url = request.url();

      // 1. BACKSTOP UNIVERSAL: padrões proibidos bloqueiam em QUALQUER método,
      //    inclusive escritas que por acaso estejam na writeAllowlist. Assim
      //    "gerar boleto" / "cancelar" nunca passam, mesmo via POST de relatório.
      const hit = FORBIDDEN_URL_PATTERNS.find((re) => re.test(url));
      if (hit) {
        this.log({ kind: "write_blocked", method, url, reason: `padrão proibido: ${hit}` });
        return route.abort("blockedbyclient");
      }

      // 2. Requisições de escrita (POST/PUT/PATCH/DELETE): só as da writeAllowlist
      //    (login + geração de relatório, que é leitura mas trafega como POST).
      if (WRITE_METHODS.has(method)) {
        const allowed = this.writeAllowlist.some((re) => re.test(url));
        if (!allowed) {
          this.log({ kind: "write_blocked", method, url, reason: "método de escrita não permitido" });
          return route.abort("blockedbyclient");
        }
        this.log({ kind: "write_allowed", method, url, reason: "na writeAllowlist (login/relatório)" });
        return route.continue();
      }

      // 3. GET/HEAD: só se estiver dentro da allowlist de navegação, ou for
      //    recurso estático (css/js/img/fonte) do mesmo host.
      const inAllowlist = this.urlAllowlist.some((re) => re.test(url));
      const isAsset = /\.(css|js|png|jpe?g|gif|svg|woff2?|ico|map)(\?|$)/i.test(url);
      if (inAllowlist || isAsset) {
        this.log({ kind: "nav_ok", method, url });
        return route.continue();
      }

      // 4. Fora da allowlist → bloqueia (evita o robô "passear" pelo sistema)
      this.log({ kind: "nav_blocked", method, url, reason: "fora da urlAllowlist" });
      return route.abort("blockedbyclient");
    });
  }

  // Guarda de navegação explícita: chame antes de page.goto() para garantir
  // que só vamos a URLs permitidas.
  assertNavAllowed(url: string): void {
    if (!this.urlAllowlist.some((re) => re.test(url))) {
      throw new Error(`[SAFETY] Navegação bloqueada, URL fora da allowlist: ${url}`);
    }
  }

  get isDryRun(): boolean {
    return this.dryRun;
  }

  // Resumo para o log de auditoria da execução.
  summary(): string {
    const c = (k: SafetyLog["kind"]) => this.logs.filter((l) => l.kind === k).length;
    return [
      `navegações ok: ${c("nav_ok")}`,
      `navegações bloqueadas: ${c("nav_blocked")}`,
      `escritas bloqueadas: ${c("write_blocked")}`,
      `escritas permitidas (login): ${c("write_allowed")}`,
    ].join(" · ");
  }
}
