# THEOLOGY_BASELINE — Padrão confessional de referência

Este documento define **o que "saudável" significa para a análise**: o padrão doutrinário
contra o qual as pregações são avaliadas. Ele é lido **em tempo de execução** pelo sistema
e incluído no prompt de codificação — as análises são julgadas contra o padrão da
**própria igreja**, não contra suposições do modelo de IA.

## Como editar

1. Substitua o texto entre os marcadores `BASELINE:START` e `BASELINE:END` abaixo pelo
   padrão confessional da Casa da Rocha (confissão de fé, valores doutrinários, ênfases).
2. Escreva de forma descritiva e curta (até ~40 linhas) — isso entra em TODO prompt.
3. Não inclua juízos sobre pessoas; apenas o padrão de crença e prática que a igreja confessa.
4. Após editar na VPS: `docker compose restart` (o arquivo é lido com cache por processo).

Enquanto o texto abaixo for o placeholder, o sistema usa este padrão evangélico histórico
como referência neutra — e o rotula como tal.

<!-- BASELINE:START -->
PLACEHOLDER — padrão evangélico histórico (substitua pelo padrão confessional da igreja):
- As Escrituras como autoridade final de fé e prática, lidas cristocentricamente;
- Um só Deus em três pessoas (Pai, Filho e Espírito Santo);
- Salvação somente pela graça, mediante a fé, por causa de Cristo (sua morte e ressurreição);
- A igreja como corpo de Cristo e comunidade de servos, não instituição de poder;
- Vida cristã como discipulado integral: crer, ser transformado e servir;
- Missão como participação na missão de Deus, no cotidiano e até os confins;
- Rejeição de: teologia da barganha/prosperidade, manipulação por culpa e medo,
  mercantilização da fé e liderança autoritária.
<!-- BASELINE:END -->
