# CRITICAL_SATURATION — Módulo de Saturação Crítica (ISC)

Módulo de rastreio da proporção entre **crítica ao sistema religioso** e **proclamação do Evangelho** em cada pregação. Complementa os eixos 2 e 8 (`CODEBOOK.md`) com uma métrica de razão calculada na camada lexical.

## 1. Contexto histórico e hipótese

A trajetória pública do pregador inclui uma ruptura marcante com um sistema religioso anterior ligado à teologia da prosperidade — marco histórico relevante para a identidade da Casa da Rocha. Em consequência, a crítica ao "mercado gospel", à barganha religiosa e à liderança autoritária é um tema recorrente e **legítimo** do púlpito (é parte do eixo 8, desconstrução da religião abusiva).

A pergunta deste módulo não é *se* essa crítica existe, mas **em que proporção**:

> **Hipótese de saturação crítica (a validar):** a desconstrução do sistema religioso abusivo — tema legítimo e historicamente relevante na trajetória da igreja — pode ocupar proporção tão alta da dieta formativa que reduz o espaço da proclamação propositiva do Evangelho. A validar: a proporção crítica/Evangelho por pregação e sua evolução 2020–2026 (a saturação diminuiu, manteve-se ou cresceu com o distanciamento do rompimento?).

**Nota metodológica obrigatória:** este módulo mede **proporção lexical/temática**, nunca intenção, motivação ou psicologia do pregador (regra 2 do `METHODOLOGY.md`). Qualquer leitura causal ("a crítica vem do trauma") permanece fora do escopo dos dados — é discernimento pastoral, não métrica.

## 2. A métrica: Índice de Saturação Crítica (ISC)

Calculado por pregação na camada lexical (camada 1 do pipeline):

```
isc = (menções do campo "crítica ao sistema" / menções do campo "Evangelho") × 100
```

Registrar sempre, junto com a razão, as **densidades absolutas** dos dois campos (por 10.000 palavras):

- `criticDensityPer10k` — densidade do campo crítica;
- `gospelDensityPer10k` — densidade do campo Evangelho;
- `iscRatio` — a razão em %.

A razão sozinha engana quando o denominador é pequeno (uma pregação com 2 menções de crítica e 1 do Evangelho daria ISC = 200% sem relevância real). Regra: **denominador mínimo** — se `menções_evangelho < N` (configurável, default 5), o ISC é marcado como `não_calculável` e a pregação aparece com as densidades absolutas apenas.

### Campos semânticos

- **Numerador — "crítica ao sistema"**: dicionário da seção 3 abaixo.
- **Denominador — "Evangelho"**: reutiliza os dicionários **Cruz/Soteriologia** + **Cristologia/Trindade** do `CODEBOOK.md` §5.

### Limiar e rótulos

| Rótulo | Condição (default) |
|---|---|
| `saturacao_baixa` | ISC < 15% |
| `saturacao_moderada` | 15% ≤ ISC < 30% |
| `saturacao_alta` | ISC ≥ 30% |

O limiar de 30% é valor inicial **configurável e declaradamente arbitrário** até calibração com a amostra revisada (comparar rótulos lexicais com `religiousDeconstructionScore` codificado e ajustar). Não usar rótulos acusatórios ("contaminado") em nenhuma superfície do produto.

## 3. Dicionário do campo "crítica ao sistema"

Expande o dicionário "Desconstrução religiosa" do `CODEBOOK.md` §5. Três subgrupos:

**Termos diretos:**
sistema religioso · mercado da fé · mercado gospel · gurus · instituição · CNPJ · barganha · caça-níqueis · dízimo · campanhas

**Termos irônicos/desconstrução (estilo característico do púlpito):**
alquimias da religião · fórmulas mágicas · gênio da lâmpada · bater continência para pastor · ungido · mandingas evangélicas · fábrica de crentes · recebe a vitória · toma posse · tá amarrado

**Críticas a ideologias de poder:**
idolatria política · gado · esquerdas e direitas na igreja

### Ressalvas de falso positivo

Termos como **"dízimo"**, **"campanhas"** e **"ungido"** têm usos neutros ou bíblicos (ensino de generosidade, campanha de oração, Davi como ungido). Como em todo o projeto:

- a camada lexical gera **candidatos** com snippet e posição (`analysisMethod: "dictionary"`);
- a **validação de sentido** (o termo foi usado como crítica?) vem da codificação por IA e revisão humana (camadas 2–3);
- o ISC lexical deve ser cruzado com o `religiousDeconstructionScore` codificado — **validação convergente**: se as duas medidas discordarem sistematicamente, o dicionário volta para calibração.

## 4. Visualizações (página P12b — `/dashboard/saturacao`)

Todas em Recharts, com o drill-down obrigatório do projeto e banner fixo: *"Métrica lexical — hipótese a validar; não mede intenção."*

1. **Linha temporal (a saturação mudou?):** média anual do ISC 2020–2026, com banda de dispersão (mín–máx ou interquartil) e marcação visual de anos cujas datas são majoritariamente estimadas. Objetivo: ver se, com o passar dos anos, a proporção de crítica caiu, manteve-se ou cresceu — **sem afirmar causa**.
2. **Scatter de pregações:** cada ponto é uma pregação (X = data, Y = ISC%); linha horizontal no limiar configurável; pontos `saturacao_alta` destacados em cor de alerta da paleta do projeto. Clique no ponto → sermão, score, e os **snippets exatos** do campo crítica com posição na transcrição.
3. **Card de diagnóstico comparativo:** texto dinâmico entre dois anos selecionados — *"Em {ANO_A}, a saturação crítica média (lexical) foi {X}% ({n_A} pregações); em {ANO_B}, {Y}% ({n_B} pregações)"* — com verbo neutro (subiu/caiu/estável) e denominadores sempre visíveis.

## 5. Persistência

Campos na camada lexical (ver `DATA_MODEL.md`): `iscRatio`, `criticDensityPer10k`, `gospelDensityPer10k`, `saturationLabel` — proveniência `dictionary`, badge `lexical` na UI. Snippets do campo crítica gravados em `sermon_evidence` com `category: "critica_ao_sistema"`.

## 6. Uso pastoral do resultado

Quando a codificação estiver completa, este módulo permite responder com dados uma intuição pastoral — por exemplo, quanto de uma mensagem de 50 minutos foi dedicado à crítica do sistema versus à proclamação propositiva. Se a linha temporal mostrar saturação persistentemente alta, o dado sustenta uma conversa madura com o presbitério sobre **equilíbrio entre desconstrução e reconstrução** (P12); se mostrar queda, documenta uma maturação da dieta formativa. Em ambos os casos, a formulação nos relatórios segue o `METHODOLOGY.md`: padrões observados e oportunidades formativas — nunca diagnóstico do pregador.
