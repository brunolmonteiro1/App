// ============================================================================
// Configuração do coletor. Segredos vêm SEMPRE de variáveis de ambiente
// (arquivo .env no VPS, nunca commitado). Nada de credencial em código.
// ============================================================================

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return v;
}

export const config = {
  // --- STCOP (preencher no .env do VPS) ---
  stcop: {
    // A URL de login. Só isto e as URLs de relatório entram na allowlist.
    loginUrl: required("STCOP_LOGIN_URL"),
    username: required("STCOP_USERNAME"),
    password: required("STCOP_PASSWORD"),
    // Host base do sistema, usado para montar a allowlist de navegação.
    host: required("STCOP_HOST"), // ex.: "sistema.stcop.com.br"
  },

  // --- Google Sheets (destino dos dados coletados) ---
  sheets: {
    // Mesma planilha do piloto.
    spreadsheetId: process.env.SHEET_ID || "1eHqd_ErtLIv5WuyZxDMaeQ2h84oUazcs7agFQwwzfpc",
    // Service Account JSON (caminho do arquivo) — compartilhe a planilha com
    // o e-mail da service account. Alternativa ao OAuth para automação.
    serviceAccountKeyFile: process.env.GOOGLE_SA_KEY_FILE || "./sa-key.json",
    abaInadimplencia: "Relatorio_Inadimplencia",
    abaRenovacoes: "Relatorio_Renovacoes",
  },

  // --- Segurança ---
  safety: {
    // dry-run: navega, loga tudo, mas NÃO baixa/grava nada. Sempre o 1º teste.
    dryRun: process.env.DRY_RUN !== "false", // padrão: true (seguro)
    // Onde salvar screenshots + trace de auditoria de cada execução.
    auditDir: process.env.AUDIT_DIR || "./audit",
    // Timeout global por passo (ms).
    stepTimeout: Number(process.env.STEP_TIMEOUT || 20000),
  },
};

// Allowlist de navegação: SÓ o host do STCOP. Monta a partir do host.
export function buildUrlAllowlist(host: string): RegExp[] {
  const h = host.replace(/[.]/g, "\\.");
  return [new RegExp(`^https?://([a-z0-9-]+\\.)?${h}(/|$|\\?)`, "i")];
}

// Allowlist de escrita: SÓ o POST de login. Ajuste o path quando soubermos
// o endpoint real do formulário de login do STCOP (capturado via codegen).
export function buildWriteAllowlist(host: string): RegExp[] {
  const h = host.replace(/[.]/g, "\\.");
  return [new RegExp(`^https?://([a-z0-9-]+\\.)?${h}/(login|autenticar|acessar|j_security_check|signin)`, "i")];
}
