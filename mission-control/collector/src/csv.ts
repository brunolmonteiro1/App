// ============================================================================
// Parser do CSV exportado pelo STCOP.
// Trata particularidades de CSV brasileiro: BOM, separador ';' ou ',',
// aspas, e mapeia colunas por NOME de cabeçalho (não por posição), tolerando
// acentos e variações. O mapa real de colunas se ajusta quando virmos o
// primeiro export de verdade.
// ============================================================================

// Detecta o separador olhando a primeira linha (; é comum no Brasil).
function detectDelimiter(headerLine: string): string {
  const semis = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semis >= commas ? ";" : ",";
}

// Parser de linha CSV respeitando aspas.
function parseLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// Normaliza cabeçalho para casar variações: minúsculo, sem acento, sem espaço.
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Mapa: campo destino -> lista de possíveis nomes de coluna no STCOP.
// AJUSTAR quando virmos o CSV real. Cada campo tenta casar por norm().
export type ColumnMap = Record<string, string[]>;

// Confirmado do CSV real do TAG/Vilesoft. Cabeçalho:
// Cliente;Grupo;Classe Financeira;Matrícula;Conjunto;Placas;Data Emissão;
// Data Vencimento;Valor;Dias em Atraso;Consultor;Telefone 1;Telefone 2;E-mail;E-mail cobrança
export const MAPA_INADIMPLENCIA: ColumnMap = {
  Cliente: ["cliente", "nome", "razaosocial", "segurado"],
  // "Telefone 1" -> norm "telefone1"; alias "telefone" casa por includes.
  Telefone: ["telefone1", "telefone", "celular", "fone", "contato", "whatsapp"],
  Placa: ["placas", "placa", "veiculo"],
  // "Conjunto" é o contrato específico; "Matrícula" é o cadastro-mãe. Preferimos
  // Conjunto; findIndex casa pela ordem das colunas, então liste ambos.
  Contrato: ["conjunto", "matricula", "contrato", "proposta"],
  Valor: ["valor", "valorparcela", "vencido", "valoraberto"],
  Vencimento: ["datavencimento", "vencimento", "vencto"],
};

export const MAPA_RENOVACOES: ColumnMap = {
  Cliente: ["cliente", "nome", "nomecliente", "razaosocial", "segurado"],
  Telefone: ["telefone", "celular", "fone", "contato", "whatsapp"],
  Placa: ["placa", "veiculo", "placaveiculo"],
  Contrato: ["contrato", "numerocontrato", "ncontrato", "matricula", "proposta"],
  FimVigencia: ["fimvigencia", "vigenciafim", "fimvigen", "vencimentocontrato", "datafim", "terminovigencia"],
};

export type LinhaMapeada = Record<string, string>;

export function parseCsv(conteudo: string, mapa: ColumnMap): LinhaMapeada[] {
  // Remove BOM se presente.
  let txt = conteudo.replace(/^﻿/, "");
  const linhas = txt.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linhas.length < 2) return [];

  const delim = detectDelimiter(linhas[0]);
  const cabecalho = parseLine(linhas[0], delim);
  const cabNorm = cabecalho.map(norm);

  // Resolve índice de cada campo destino, respeitando a ORDEM DE PRIORIDADE
  // dos aliases (o 1º alias que encontrar uma coluna vence). Prefere match
  // exato; só cai para "contém" se nenhuma coluna bater exatamente com o alias.
  const idx: Record<string, number> = {};
  for (const [campo, aliases] of Object.entries(mapa)) {
    let achou = -1;
    for (const a of aliases) {
      let j = cabNorm.findIndex((c) => c === a);
      if (j < 0) j = cabNorm.findIndex((c) => c.includes(a));
      if (j >= 0) {
        achou = j;
        break;
      }
    }
    idx[campo] = achou; // -1 se não achou
  }

  // Alerta de campos não encontrados (crítico: aparece no log para ajuste).
  const naoAchados = Object.entries(idx).filter(([, i]) => i === -1).map(([c]) => c);
  if (naoAchados.length) {
    console.warn(
      `[csv] Colunas não mapeadas: ${naoAchados.join(", ")}. ` +
        `Cabeçalho do CSV: [${cabecalho.join(" | ")}]. Ajustar MAPA em csv.ts.`,
    );
  }

  const out: LinhaMapeada[] = [];
  for (let i = 1; i < linhas.length; i++) {
    const campos = parseLine(linhas[i], delim);
    const linha: LinhaMapeada = {};
    for (const campo of Object.keys(mapa)) {
      const j = idx[campo];
      linha[campo] = j >= 0 && j < campos.length ? campos[j] : "";
    }
    // Ignora linhas totalmente vazias.
    if (!Object.values(linha).some((v) => v.length > 0)) continue;
    // Ignora rodapés de total: Cliente = TOTAL/TOTAIS/SUBTOTAL e sem os demais
    // campos-chave preenchidos (evita descartar um cliente que por acaso se
    // chame algo parecido, exigindo que os outros campos estejam vazios).
    const cli = norm(linha.Cliente || "");
    const soCliente = Object.entries(linha).every(([k, v]) => k === "Cliente" || v.length === 0);
    if (/^(total|totais|subtotal|totalgeral)/.test(cli) && soCliente) continue;
    out.push(linha);
  }
  return out;
}
