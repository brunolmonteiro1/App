// ============================================================================
// Saída: grava as linhas coletadas nas abas da planilha do piloto.
// Substitui o passo manual "humano cola o relatório na planilha".
// Usa Service Account (compartilhe a planilha com o e-mail da SA).
// ============================================================================
import { google } from "googleapis";
import { config } from "./config.js";

async function client() {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.sheets.serviceAccountKeyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// Regrava a aba inteira: limpa os dados antigos (mantendo o cabeçalho) e
// escreve as novas linhas. Assim a planilha sempre reflete o export mais
// recente, sem acumular duplicatas dia após dia.
export async function gravarAba(
  aba: string,
  cabecalho: string[],
  linhas: Record<string, unknown>[],
): Promise<void> {
  const sheets = await client();
  const id = config.sheets.spreadsheetId;

  // 1. Limpa da linha 2 para baixo (preserva o cabeçalho na linha 1).
  await sheets.spreadsheets.values.clear({
    spreadsheetId: id,
    range: `${aba}!A2:Z`,
  });

  if (linhas.length === 0) {
    console.log(`[sheets] ${aba}: 0 linhas (aba limpa).`);
    return;
  }

  // 2. Monta a matriz na ordem do cabeçalho.
  const values = linhas.map((l) => cabecalho.map((c) => l[c] ?? ""));

  // 3. Escreve a partir de A2.
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `${aba}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  console.log(`[sheets] ${aba}: ${linhas.length} linhas gravadas.`);
}
