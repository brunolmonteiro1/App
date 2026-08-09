# DATA_AUDIT — Inspeção real dos dados de entrada

Auditoria feita em 2026-07-10 sobre o arquivo canônico `data/raw/A Casa da Rocha-backup-2026-07-10.json` (backup do NotebookLM, 9,3 MB). Estes números são fatos verificados por script, não estimativas.

## 1. Estrutura do JSON

```json
{
  "version": "1.0",
  "exportedAt": "2026-07-10T14:11:34.812Z",
  "notebook": { "id": "0c08b01b-…", "title": "A Casa da Rocha", "emoji": "⛪" },
  "sources": [
    {
      "id": "uuid",
      "title": "#01 - A Criação e seus Mandamentos - Zé Bruno - Do Princípio ao Fim",
      "url": "https://www.youtube.com/watch?v=Ckq6xHg3MQI",
      "sourceType": "SOURCE_TYPE_YOUTUBE_VIDEO",
      "content": "transcrição completa…"
    }
  ]
}
```

Campos por fonte: `id`, `title`, `url`, `sourceType`, `content`. Nada além disso — não há data, duração nem timestamps no JSON.

## 2. Contagens verificadas

| Métrica | Valor |
|---|---|
| Total de fontes | **266** |
| `SOURCE_TYPE_YOUTUBE_VIDEO` (pregações com transcrição) | **263** |
| `SOURCE_TYPE_TEXT` | 2 |
| `SOURCE_TYPE_PDF` | 1 |
| Transcrições vazias | 0 |
| Tamanho das transcrições (chars) | mín. 7.074 / máx. 61.741 / média ~33.698 |

Fontes não-YouTube:

1. `SOURCE_TYPE_PDF` — "Dossiê público sobre Pr. José Bruno.pdf" (material auxiliar; **não** entra na análise homilética).
2. `SOURCE_TYPE_TEXT` — "Texto colado" (material auxiliar).
3. `SOURCE_TYPE_TEXT` — **"casadarocha_ze_bruno_preliminar.csv"** — ver seção 3.

## 3. O CSV de metadados está EMBUTIDO no JSON

A fonte de texto `casadarocha_ze_bruno_preliminar.csv` contém o mapeamento das pregações em formato **TSV** (separado por tab), ~270 linhas, com as colunas:

```
Data da transmissão | Título da transmissão | Pregador identificado | Link do YouTube
| Duração | Visualizações | Série/tema | Fonte da confirmação | Nível de confiança | Observações
```

Exemplo de linha:

```
2020-01-19  #03 - Os dois Jardins - Zé Bruno - O Caminho da Cruz  Zé Bruno
https://www.youtube.com/watch?v=KKG-nAeRwqs  51:44  pendente YouTube API
O Caminho da Cruz  Título  Alta  Data estimada (interpolação linear + domingo)
```

**Consequência para o pipeline:** o importador extrai JSON + TSV do mesmo arquivo — não há dois arquivos de entrada. O cruzamento entre a fonte do NotebookLM e a linha do TSV é feito pelo **YouTube ID** extraído da URL.

## 4. Padrão dos títulos (parse determinístico)

Os títulos das pregações seguem o padrão regular:

```
#NN - Título da mensagem - Zé Bruno - Nome da Série
```

Isso permite extrair, sem IA: número da mensagem na série, título limpo, pregador e série. Séries observadas nos títulos: O Caminho da Cruz, A Videira, Do Princípio ao Fim, A Vida em Parábolas, A Última Semana, Meu Caro Amigo, Meu Caro Amigo 2, Quem é Jesus, O Povo da Cruz — além das esperadas Juntos no Natal, Deus Conosco e Mensagens Especiais. Há pequenas variações de espaçamento (`#02 -  Atraídos…`, `#02- A Negação…`) que o normalizador deve tolerar.

## 5. Limitações conhecidas (devem aparecer na UI e nos relatórios)

1. **Datas estimadas** — o TSV declara nas observações: *"Data estimada (interpolação linear + domingo)"*, com coluna própria de nível de confiança. O modelo de dados carrega `date_confidence`, e a linha do tempo sinaliza visualmente datas estimadas.
2. **Sem timestamps** — as transcrições não têm marcação de tempo; o drill-down abre o vídeo do YouTube no início + o trecho textual destacado (não há deep-link para o minuto exato).
3. **Visualizações pendentes** — a coluna "Visualizações" está como "pendente YouTube API"; ignorar ou completar via API futuramente.
4. **Transcrição automática** — o texto vem do reconhecimento de fala do YouTube: sem pontuação confiável, com possíveis erros de nomes próprios e termos teológicos. Transcrições muito curtas (< ~8k chars) para a duração declarada devem receber flag de baixa confiança.
5. **Conflitos JSON × TSV** — quando título/série divergirem entre o título da fonte e a linha do TSV, o sistema marca alerta e pede revisão humana (não resolve silenciosamente).

## 6. Arquivo ZIP auxiliar

O usuário também possui um ZIP com cada transcrição em arquivo `.md` separado. É **redundante** com o JSON (mesmo conteúdo) e serve apenas como backup/conferência manual. O JSON é a fonte canônica e o único arquivo versionado em `data/raw/`.
