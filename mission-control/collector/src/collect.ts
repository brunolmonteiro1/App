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

  const browser: Browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium",
    headless: true,
  });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1366, height: 900 }, // layout desktop
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

    // Seleciona formato CSV (radio). AJUSTE: se o label não pegar, usar value.
    await page.getByText("CSV", { exact: true }).click().catch(async () => {
      await page.locator('input[type=radio][value*=csv i]').check().catch(() => {});
    });

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
    const linhas = parseCsv(await fs.readFile(csvPath, "utf8"), mapa);
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
    await coletar(
      "Contratos a Renovar",
      "renovacoes.csv",
      MAPA_RENOVACOES,
      config.sheets.abaRenovacoes,
      ["Cliente", "Telefone", "Placa", "Contrato", "FimVigencia"],
    );

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
