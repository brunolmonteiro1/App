# Segurança — Dashboard de Saúde Teológica · A Casa da Rocha

Este sistema contém transcrições e uma análise pastoral sensível de uma igreja real.
Trate os dados com o mesmo cuidado de um prontuário interno.

## Camadas de acesso

O sistema é single-user/single-tenant e usa **senha dupla** (não há contas de e-mail):

1. **`APP_PASSWORD`** — protege todo o painel (Basic Auth). Recomendada em servidor
   público. Vazia = painel aberto (uso local).
2. **`MASTER_PASSWORD`** — protege o **Modo Diagnóstico Interno** (`/admin/master-diagnosis`
   e `/api/master/*`), o painel estratégico confidencial. Mínimo de 6 caracteres. Vazia =
   o modo é **desabilitado** e a rota responde 404 (não aparece nem existe).

O acesso master é verificado em três camadas (defesa em profundidade): middleware, o
server component da página e cada endpoint (`requireMaster`). O cookie de sessão master é
um HMAC da senha, `httpOnly`, com validade de 8 horas; a senha nunca é enviada ao cliente.

## Trilha de segurança

Todo acesso ao Modo Diagnóstico Interno é registrado em `security_audit_logs` —
inclusive **tentativas com senha errada** — com ação, resultado (allowed/denied), rota,
hash do IP e resumo do user-agent. **Nunca** são gravados transcrições completas nem senhas.

## Princípios aplicados

- A `OPENROUTER_API_KEY` nunca é persistida em banco (tentativas, relatórios ou logs).
- Respostas do modo master usam `Cache-Control: no-store`.
- Snippets sensíveis só aparecem sob opt-in explícito, e o acesso fica registrado.
- Nenhum fluxo automático altera scores; toda mudança é ação humana registrada.
- Relatórios master nascem como rascunho (`GENERATED`) — nunca publicados automaticamente.

## Recomendações de operação

- Use senhas fortes e distintas para `APP_PASSWORD` e `MASTER_PASSWORD`.
- Sirva o app atrás de HTTPS (proxy reverso) em qualquer servidor exposto.
- Faça backup do volume `dados-do-banco/` antes de atualizações/migrações.
- Guarde o `.env.deploy` fora do controle de versão (já está no `.gitignore`).

## Relato de vulnerabilidades

Por ser um sistema interno de um projeto pastoral, relate qualquer problema de segurança
diretamente ao responsável técnico do projeto (não abra issue pública com detalhes exploráveis).
