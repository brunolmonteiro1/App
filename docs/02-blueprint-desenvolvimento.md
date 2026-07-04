# Blueprint de Desenvolvimento — Norton Impact

> Arquitetura e plano técnico consolidados a partir dos documentos estratégicos.
> Decisões já tomadas: **Flutter** no mobile, docs + protótipo neste repositório.

## 1. Visão da arquitetura

```
┌─────────────────────────────┐
│  App Flutter (Android/iOS)  │  onboarding · permissões · home · causas ·
│                             │  desafios · ranking · ligas · perfil
│  ┌───────────────────────┐  │
│  │ ActivitySource (abstr.)│ │  ← health (HealthKit/Health Connect) · GPS · mock
│  └───────────┬───────────┘  │
└──────────────┼──────────────┘
               │ REST/JSON (ingestão idempotente por raw_source_id)
┌──────────────▼──────────────┐
│  Backend (Supabase no MVP)  │  Auth (Google/Apple/e-mail) · PostgreSQL · Storage
│                             │  Edge Functions:
│  normalização ActivityRecord│  → validação/antifraude → calculadora de impacto
│                             │  → leaderboards (snapshots) → relatórios CSV/PDF
└──────┬───────────────┬──────┘
       │               │
┌──────▼──────┐ ┌──────▼───────────┐
│ Admin (MVP: │ │ Landing page     │
│ Supabase    │ │ (Next.js/estático│
│ Studio ou   │ │  + captura de    │
│ Retool)     │ │  leads)          │
└─────────────┘ └──────────────────┘
```

**Por que Supabase no MVP**: Postgres gerenciado + auth social + storage + functions
prontos eliminam ~40% do backend custom do RFQ; o modelo relacional dos docs entra
direto; e a saída (é Postgres puro) não gera lock-in — a Fase 2 pode migrar para
NestJS/FastAPI dedicado sem retrabalho de schema.

## 2. Modelo de dados (consolidado dos docs)

Entidades e campos-chave — schema completo evolui em `supabase/migrations` quando o
backend começar:

- **User** — auth provider, perfil mínimo, consentimentos (LGPD), status.
- **Device** — plataforma, OS, permissões de saúde, token push.
- **Cause/NGO** — CNPJ, documentos, projeto, meta tangível, status de curadoria.
- **Sponsor** — empresa, orçamento (teto), regras de conversão, marca.
- **Campaign** — causa + sponsor, tipo, meta, período, fórmula de conversão, capping,
  marcos de liberação (25/50/100%), status.
- **Challenge** — regras parametrizáveis (passos/distância/streak; 1/7/21/30 dias),
  critério de conclusão, recompensa.
- **League** — código privado, empresa, período, regras.
- **Team** — criação, convite por link.
- **ActivityRecord** *(coração do sistema)* — `user_id`, `campaign_id`, `source`
  (`health_connect | healthkit | gps | manual | admin`), `activity_type`,
  `started_at/ended_at`, `distance_km`, `steps`, `duration_sec`, `platform`,
  `raw_source_id` (dedup), `status` (`pending → accepted | flagged | rejected |
  adjusted`), `validation_flags`, `impact_value`.
- **ImpactTransaction** — conversão de atividade aceita em pontos/valor, taxa usada,
  cap aplicado — ledger auditável.
- **RewardOffer / Redemption** — catálogo manual de cupons (P1), resgate por código.
- **Report** — métricas agregadas por campanha/sponsor, export CSV/PDF.

## 3. Pipeline de dados (a "esteira")

1. **Captura nativa** — Health Connect (Android) / HealthKit (iOS) leem passos,
   distância e workouts com consentimento; GPS in-app para treino ativo.
2. **Ingestão idempotente** — upsert por (`user_id`, `source`, `raw_source_id`);
   reenvio nunca duplica.
3. **Normalização** — tudo vira `ActivityRecord`, qualquer que seja a fonte.
4. **Validação/antifraude (regras, sem ML)** — dedup; capping diário por
   usuário/campanha/liga; velocidade plausível por modalidade; separação
   passivo × ativo; anomalias → `flagged` para revisão manual no admin; trilha de
   auditoria de quem mudou status.
5. **Calculadora de impacto** — só atividade `accepted` converte; pontos por
   modalidade (caminhada/corrida 1 km = 1 pt; bike 1 km = 0,25 pt; natação 1 km =
   4 pt; parametrizável por campanha); respeita teto e marcos de liberação.
6. **Leaderboards** — snapshots por desafio/time/liga/período com regra de
   desempate; nunca calculados no cliente.
7. **Saídas** — app (progresso, ranking), dashboard/relatórios agregados
   (privacy-first: sem dado individual de saúde; ranking nominal só com opt-in).

## 4. Stack mobile (Flutter)

| Necessidade | Pacote/abordagem |
|---|---|
| HealthKit + Health Connect | `health` (cobre os dois com uma API) |
| GPS workout | `geolocator` + serviço de sessão (start/stop/resumo) |
| Navegação | `go_router` |
| Estado | `provider` no protótipo; avaliar `riverpod` no MVP |
| Push | `firebase_messaging` (FCM + APNs) |
| Deep links (liga/time por código) | `app_links` + rotas do go_router |
| Analytics | `firebase_analytics` (eventos: onboarding, permissão, join, treino, resgate) |

O protótipo deste repositório (`norton_app/`) implementa a camada
**`ActivitySource` abstrata com implementação mock** — a integração real de saúde
pluga depois sem tocar as telas.

## 5. Como geramos APK com Claude Code (testar ideias)

Duas vias, ambas configuradas neste repositório:

1. **Build local na sessão** — Flutter + Android SDK instalados no ambiente;
   `flutter build apk --debug` gera o APK que envio direto na conversa. Ideal para
   iterar ideia → APK em minutos.
2. **CI (GitHub Actions)** — workflow `.github/workflows/build-apk.yml`: a cada push
   na branch, compila e publica o APK como artefato para download. Independe da
   sessão e serve de "fábrica de builds" contínua.

Instalação no aparelho: APK debug direto (habilitar "fontes desconhecidas") — sem
Play Store. Quando houver piloto: Play **internal/closed testing** (Android) e
TestFlight (iOS; exige conta Apple Developer e build em macOS — via GitHub Actions
`macos` runner).

## 6. Requisitos LGPD/compliance embutidos (não deixar para depois)

- Consentimento específico e destacado para dados de saúde (art. 11), com finalidade
  explícita por tela.
- Exclusão de conta + dados no app (exigência também das lojas).
- Dashboards B2B **somente agregados**; ranking nominal com opt-in explícito.
- Privacy Labels (App Store) e Data Safety (Play) preparados desde o primeiro build
  público.
- Pontos sem valor monetário de saque (evita enquadramento de loteria/sorteio).
- Verba de doação flui direto empresa→ONG; plataforma fatura só o fee (separação
  contábil).

## 7. Qualidade e verificação

- `flutter analyze` limpo como gate de todo commit.
- Testes de unidade nas regras críticas (validação, capping, conversão de pontos) —
  são as regras que protegem o dinheiro do patrocinador.
- Teste em aparelho real barato de Android (fabricantes agressivos com background)
  antes de qualquer piloto.
- QA de permissões: fluxo de negar/conceder/revogar saúde em ambas plataformas.
