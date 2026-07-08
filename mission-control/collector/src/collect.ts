// ============================================================================
// Coletor TAG/STCOP (Vilesoft) — orquestração principal.
//
// FLUXO (mapeado dos prints do TAG Assistência / Vilesoft):
//   login → menu → Ativações-TAG → Relatórios → Inadimplência → CSV → Imprimir
//   (idem para "Contratos a Renovar")
//
// Seletores por TEXTO/ROLE (robustos a mudança de IDs internos do Vilesoft).
// Podem exigir pequeno ajuste no 1º dry-run contra o DOM real — os pontos
// prováveis estão marcados com AJUSTE.
// ============================================================================
import { chromium, type Browser, type Page, type Download } from "playwright";
import { promises as fs } from "fs";
import path from "path";
import { config, buildUrlAllowlist, buildWriteAllowlist } from "./config.js";
import { SafetyGuard } from "./safety.js";
import { gravarAba } from "./sheets.js";
import { parseCsv, MAPA_INADIMPLENCIA, MAPA_RENOVACOES, type ColumnMap } from "./csv.js";

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const auditDir = path.join(config.safety.auditDir, runId);
  await ensureDir(auditDir);
  console.log(`[coletor] run ${runId} | dry-run=${config.safety.dryRun}`);

  const guard = new SafetyGuard(
    buildUrlAllowlist(config.stcop.host),
    config.safety.dryRun,
    buildWriteAllowlist(config.stcop.host),
  );

  // No VPS o Playwright acha o Chromium sozinho (via `npx playwright install`).
  // PW_EXECUTABLE_PATH é uma exceção opcional para ambientes com browser
  // pré-instalado em caminho fixo (ex.: este sandbox).
  const browser: Browser = await chromium.launch({
    headless: true,
    ...(process.env.PW_EXECUTABLE_PATH ? { executablePath: process.env.PW_EXECUTABLE_PATH } : {}),
    // PW_PROXY_SERVER: só para ambientes atrás de proxy (este sandbox). No VPS
    // fica desligado e o Chromium conecta direto.
    ...(process.env.PW_PROXY_SERVER ? { proxy: { server: process.env.PW_PROXY_SERVER } } : {}),
  });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1366, height: 900 }, // layout desktop
    // ignoreHTTPSErrors só quando o proxy do sandbox faz interceptação TLS.
    ...(process.env.PW_IGNORE_HTTPS_ERRORS === "true" ? { ignoreHTTPSErrors: true } : {}),
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const page: Page = await context.newPage();
  await guard.attach(page);
  page.setDefaultTimeout(config.safety.stepTimeout);

  const shot = (nome: string) =>
    page.screenshot({ path: path.join(auditDir, `${nome}.png`), fullPage: true }).catch(() => {});

  // Abre o menu lateral (hamburguer) se estiver fechado, e clica num item.
  async function abrirMenu() {
    // O toggle é o ☰ no topo esquerdo. Clica se o menu não estiver visível.
    const menuItem = page.getByText("Ativações - TAG", { exact: false });
    if (!(await menuItem.isVisible().catch(() => false))) {
      // AJUSTE: seletor do hamburguer — tenta botão de menu no cabeçalho.
      await page.locator("header button, .navbar-toggler, [class*=menu-toggle]").first().click().catch(() => {});
    }
  }

  // dd/mm/aaaa de hoje e de N meses atrás.
  function dataBR(d: Date): string {
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }

  // Preenche um par de campos de data (de/até) por proximidade ao rótulo.
  // AJUSTE: o dry-run confirma se são inputs de texto ou date-pickers.
  async function preencherIntervaloVencimento() {
    const hoje = new Date();
    const de = new Date(hoje);
    de.setMonth(de.getMonth() - config.inadimplencia.vencimentoMesesAtras);
    // Os dois campos "Data de Vencimento" (de/até) são os primeiros do form.
    const campos = page.locator('label:has-text("Data de Vencimento") ~ input, label:has-text("Data de Vencimento") + * input');
    await campos.nth(0).fill(dataBR(de)).catch(() => {});
    await campos.nth(1).fill(dataBR(hoje)).catch(() => {});
  }

  // Marca o radio CSV e CONFIRMA. O PDF é o default do Vilesoft, então esta
  // etapa é obrigatória e verificada — não pode falhar em silêncio.
  async function selecionarCsv() {
    // Tenta várias estratégias de seleção (o dry-run confirma qual pega).
    const tentativas = [
      () => page.getByLabel("CSV", { exact: true }).check(),
      () => page.locator('input[type=radio][value*="csv" i]').check(),
      () => page.getByText("CSV", { exact: true }).click(),
    ];
    for (const t of tentativas) {
      await t().catch(() => {});
      if (await csvMarcado()) return;
    }
    throw new Error(
      "[coletor] Não consegui marcar o formato CSV (PDF é o default). " +
        "Abortando para não baixar PDF por engano. Verificar seletor do radio (ver AJUSTE).",
    );
  }

  // true se o formato selecionado é CSV (checa o radio marcado).
  async function csvMarcado(): Promise<boolean> {
    // O radio CSV marcado, por label OU por value.
    const porLabel = await page.getByLabel("CSV", { exact: true }).isChecked().catch(() => false);
    if (porLabel) return true;
    return await page
      .locator('input[type=radio][value*="csv" i]')
      .isChecked()
      .catch(() => false);
  }

  // Navega até um relatório do submenu Relatórios e devolve o download do CSV.
  async function baixarRelatorioCsv(
    itemRelatorio: string,
    arquivoDestino: string,
    preencherDatas = false,
  ): Promise<string> {
    await abrirMenu();
    await page.getByText("Ativações - TAG", { exact: false }).click();
    await page.getByText("Relatórios", { exact: false }).click();
    await page.getByText(itemRelatorio, { exact: false }).click();
    await page.waitForLoadState("domcontentloaded");
    await shot(`form-${itemRelatorio}`);

    if (preencherDatas) await preencherIntervaloVencimento();

    // Seleciona formato CSV — CRÍTICO: o PDF vem marcado por padrão. Se não
    // trocarmos para CSV, baixaríamos um PDF que o parser não lê. Por isso
    // clicamos E confirmamos que o CSV ficou marcado; senão, aborta com erro
    // claro (nunca deixa passar um PDF disfarçado).
    await selecionarCsv();

    // Dispara o "Imprimir" e captura o download.
    const [download] = (await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /imprimir/i }).click(),
    ])) as [Download, void];
    await download.saveAs(arquivoDestino);
    return arquivoDestino;
  }

  async function coletar(item: string, arquivo: string, mapa: ColumnMap, aba: string, cabecalho: string[]) {
    if (guard.isDryRun) {
      console.log(`[coletor] DRY-RUN: navegaria e baixaria "${item}" (sem gravar).`);
      await abrirMenu();
      await page.getByText("Ativações - TAG", { exact: false }).click();
      await page.getByText("Relatórios", { exact: false }).click();
      await page.getByText(item, { exact: false }).click();
      await shot(`dryrun-${item}`);
      return;
    }
    const csvPath = await baixarRelatorioCsv(item, path.join(auditDir, arquivo), item === "Inadimplência");
    const conteudo = await fs.readFile(csvPath, "utf8");
    // Salvaguarda final: se veio um PDF (magic bytes %PDF), aborta — o parser
    // não deve tentar ler PDF como CSV.
    if (conteudo.startsWith("%PDF")) {
      throw new Error(`[coletor] "${item}" baixou um PDF, não CSV. Verificar a seleção de formato.`);
    }
    const linhas = parseCsv(conteudo, mapa);
    console.log(`[coletor] ${item}: ${linhas.length} linhas.`);
    await gravarAba(aba, cabecalho, linhas);
  }

  try {
    // ---- LOGIN -------------------------------------------------------------
    guard.assertNavAllowed(config.stcop.loginUrl);
    await page.goto(config.stcop.loginUrl, { waitUntil: "domcontentloaded" });
    await shot("01-login");
    await page.getByPlaceholder(/e-?mail/i).fill(config.stcop.username);
    await page.getByPlaceholder(/senha/i).fill(config.stcop.password);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForLoadState("networkidle");
    await shot("02-logado");

    // ---- RELATÓRIOS --------------------------------------------------------
    await coletar(
      "Inadimplência",
      "inadimplencia.csv",
      MAPA_INADIMPLENCIA,
      config.sheets.abaInadimplencia,
      ["Cliente", "Telefone", "Placa", "Contrato", "Valor", "Vencimento"],
    );
    if (process.env.SO_INADIMPLENCIA !== "true") {
      await coletar(
        "Contratos a Renovar",
        "renovacoes.csv",
        MAPA_RENOVACOES,
        config.sheets.abaRenovacoes,
        ["Cliente", "Telefone", "Placa", "Contrato", "FimVigencia"],
      );
    }

    // ---- LOGOUT ------------------------------------------------------------
    await page.locator("header [title*=sair i], header [aria-label*=sair i]").first().click().catch(() => {});
    await shot("03-fim");
  } catch (err) {
    await shot("99-erro");
    console.error("[coletor] ERRO:", (err as Error).message);
    throw err;
  } finally {
    await context.tracing.stop({ path: path.join(auditDir, "trace.zip") });
    await browser.close();
    await fs.writeFile(
      path.join(auditDir, "safety-log.json"),
      JSON.stringify({ resumo: guard.summary(), eventos: guard.logs }, null, 2),
    );
    console.log(`[coletor] auditoria em ${auditDir} · segurança: ${guard.summary()}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
