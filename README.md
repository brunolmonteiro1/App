# Norton Impact — Plataforma B2B2C de Impacto Social

Converte atividade física validada (Health Connect/HealthKit) em impacto social
mensurável, financiado por verba corporativa (ESG/CSR), com gamificação e
antifraude. **A tecnologia é o meio. O produto é a campanha. O cliente é a empresa.**

## Estrutura do repositório

| Caminho | Conteúdo |
|---|---|
| [`docs/01-analise-critica.md`](docs/01-analise-critica.md) | Análise do projeto: forças, riscos, opinião sobre a proposta Codegang |
| [`docs/02-blueprint-desenvolvimento.md`](docs/02-blueprint-desenvolvimento.md) | Arquitetura, modelo de dados, pipeline, stack, LGPD |
| [`docs/03-roadmap.md`](docs/03-roadmap.md) | Fases 0→3, backlog priorizado, KPIs, cronograma |
| [`docs/04-decisoes.md`](docs/04-decisoes.md) | Registro de decisões (tomadas e em aberto) |
| [`norton_app/`](norton_app/) | Protótipo Flutter navegável (dados mock) — gera APK de teste |
| [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) | CI que compila o APK a cada push |
| [`casa-rocha-dashboard/`](casa-rocha-dashboard/) | Subprojeto independente: Dashboard de Saúde Teológica e Formação Pastoral — A Casa da Rocha. App Next.js funcional (Fases 1–2) com instalação via Docker — ver [`INSTALL.md`](casa-rocha-dashboard/INSTALL.md) e [`CLAUDE.md`](casa-rocha-dashboard/CLAUDE.md) |

## Rodando o protótipo

```bash
cd norton_app
flutter pub get
flutter run            # em emulador/dispositivo
flutter build apk --debug   # gera build/app/outputs/flutter-apk/app-debug.apk
```

O protótipo usa dados fictícios (camada `ActivitySource` mock). A integração real
de saúde (pacote `health`) pluga na mesma interface na Fase 1a — ver roadmap.

## Status do projeto

**Fase 0 — validação comercial.** O protótipo existe para tangibilizar a tese em
reuniões com empresa-piloto e ONG. Backend, integrações reais e admin começam na
Fase 1a (ver [`docs/03-roadmap.md`](docs/03-roadmap.md)).
