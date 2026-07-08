// ============================================================================
// Coletor STCOP — orquestração principal.
//
// FLUXO: login → navegar até o relatório → exportar/raspar → gravar no Sheets.
//
// O MIOLO ESPECÍFICO DO STCOP (a navegação até o relatório) está marcado com
// >>> PREENCHER <<< — vem do codegen que o cliente vai gravar (ver README).
// Tudo o mais (segurança, auditoria, saída) já está pronto e testado.
// ============================================================================
import { chromium, type Browser, type Page } from "playwright";
import { promises as fs } from "fs";
import path from "path";
import { config, buildUrlAllowlist, buildWriteAllowlist } from "./config.js";
import { SafetyGuard } from "./safety.js";
import { gravarAba } from "./sheets.js";

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
    executablePath: "/opt/pw-browsers/chromium", // pré-instalado; não baixar
    headless: true,
  });
  const context = await browser.newContext({ acceptDownloads: true });
  // Gravação de sessão para auditoria: trace + vídeo.
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

  const page: Page = await context.newPage();
  await guard.attach(page);

  const shot = async (nome: string) => {
    await page.screenshot({ path: path.join(auditDir, `${nome}.png`), fullPage: true }).catch(() => {});
  };

  try {
    // ---- 1. LOGIN ----------------------------------------------------------
    guard.assertNavAllowed(config.stcop.loginUrl);
    await page.goto(config.stcop.loginUrl, { timeout: config.safety.stepTimeout, waitUntil: "domcontentloaded" });
    await shot("01-login-abriu");

    // >>> PREENCHER (do codegen): seletores reais dos campos de login <<<
    // Exemplo típico — trocar pelos seletores que o codegen gerar:
    //   await page.fill('#usuario', config.stcop.username);
    //   await page.fill('#senha', config.stcop.password);
    //   await page.click('button[type="submit"]');
    //   await page.waitForLoadState('networkidle');
    throw new Error(
      "[coletor] Navegação do STCOP ainda não preenchida. " +
        "Grave o caminho com `npx playwright codegen` (ver README) e cole os seletores nas seções >>> PREENCHER <<<.",
    );

    // ---- 2. RELATÓRIO DE INADIMPLÊNCIA ------------------------------------
    // >>> PREENCHER (do codegen): navegar até o relatório e exportar <<<
    // Duas variantes conforme o STCOP:
    //
    // (a) DOWNLOAD de arquivo (CSV/XLSX) — mais robusto:
    //   const [dl] = await Promise.all([
    //     page.waitForEvent('download'),
    //     page.click('text=Exportar'),
    //   ]);
    //   const arquivo = path.join(auditDir, 'inadimplencia.csv');
    //   await dl.saveAs(arquivo);
    //   const linhas = parseCsvInadimplencia(await fs.readFile(arquivo, 'utf8'));
    //
    // (b) RASPAGEM de tabela na tela — quando não há botão de export:
    //   const linhas = await page.$$eval('table#relatorio tbody tr', (trs) =>
    //     trs.map((tr) => {
    //       const td = tr.querySelectorAll('td');
    //       return {
    //         Cliente: td[0]?.textContent?.trim(),
    //         Telefone: td[1]?.textContent?.trim(),
    //         Placa: td[2]?.textContent?.trim(),
    //         Contrato: td[3]?.textContent?.trim(),
    //         Valor: td[4]?.textContent?.trim(),
    //         Vencimento: td[5]?.textContent?.trim(),
    //       };
    //     }),
    //   );
    //
    // await shot('02-inadimplencia');
    // if (!guard.isDryRun) {
    //   await gravarAba(config.sheets.abaInadimplencia,
    //     ['Cliente','Telefone','Placa','Contrato','Valor','Vencimento'], linhas);
    // }

    // ---- 3. RELATÓRIO DE RENOVAÇÕES ---------------------------------------
    // >>> PREENCHER <<< (mesmo padrão do item 2, mapeando FimVigencia)

    // ---- 4. FINALIZA -------------------------------------------------------
    // await page.click('text=Sair'); // logout explícito
  } catch (err) {
    await shot("99-erro");
    console.error("[coletor] ERRO:", (err as Error).message);
    throw err;
  } finally {
    await context.tracing.stop({ path: path.join(auditDir, "trace.zip") });
    await browser.close();
    // Log de auditoria de segurança da execução.
    await fs.writeFile(
      path.join(auditDir, "safety-log.json"),
      JSON.stringify({ resumo: guard.summary(), eventos: guard.logs }, null, 2),
    );
    console.log(`[coletor] auditoria salva em ${auditDir}`);
    console.log(`[coletor] segurança: ${guard.summary()}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
