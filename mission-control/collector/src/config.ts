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
  // --- Sistema legado TAG/STCOP/ViaVante (Vilesoft) ---
  // URL e host NÃO são segredo (página de login pública) — têm default.
  // Usuário e senha são segredo: SÓ do .env do VPS, nunca em código/chat.
  stcop: {
    loginUrl: process.env.STCOP_LOGIN_URL || "https://sistema.tagassistencia.com.br/login",
    host: process.env.STCOP_HOST || "tagassistencia.com.br",
    username: required("STCOP_USERNAME"), // do .env, nunca versionado
    password: required("STCOP_PASSWORD"), // do .env, nunca versionado
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

  // --- Filtros do relatório de inadimplência ---
  // Janela de "Data de Vencimento" para capturar TODOS os inadimplentes.
  // Padrão: dos últimos 24 meses até hoje (dd/mm/aaaa).
  inadimplencia: {
    vencimentoMesesAtras: Number(process.env.VENC_MESES_ATRAS || 24),
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

// Allowlist de escrita: o POST de login E os POSTs de GERAÇÃO DE RELATÓRIO
// (o botão "Imprimir" do Vilesoft envia o formulário como POST, mas é leitura).
// O backstop de padrões proibidos (salvar/cancelar/ativar/boleto...) roda ANTES
// desta allowlist, então mesmo aqui uma ação de escrita real seria bloqueada.
export function buildWriteAllowlist(host: string): RegExp[] {
  const h = host.replace(/[.]/g, "\\.");
  const base = `^https?://([a-z0-9-]+\\.)?${h}`;
  return [
    // login
    new RegExp(`${base}/(login|autenticar|acessar|j_security_check|signin|default)`, "i"),
    // geração de relatório (Vilesoft): inadimplência, contratos a renovar, imprimir/exportar
    new RegExp(`${base}/.*(relatorio|inadimplencia|renovar|contratos.?a.?renovar|imprimir|exportar|report)`, "i"),
  ];
}
