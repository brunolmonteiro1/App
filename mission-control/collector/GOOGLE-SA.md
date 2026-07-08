# Service Account do Google (para o coletor gravar na planilha)

O coletor grava direto nas abas da planilha via API, sem OAuth interativo. Para isso usa uma **Service Account** (uma "conta de robô" do Google).

## Passo a passo (uma vez, ~5 min)

1. No [Google Cloud Console](https://console.cloud.google.com), mesmo projeto do n8n (mission control);
2. **APIs e Serviços → Biblioteca** → ative a **Google Sheets API** (se ainda não estiver);
3. **APIs e Serviços → Credenciais → Criar credenciais → Conta de serviço**:
   - Nome: `coletor-mission-control` → Criar e continuar → Concluir;
4. Na conta de serviço criada → aba **Chaves → Adicionar chave → Criar nova chave → JSON** → baixa um arquivo `.json`;
5. Copie esse arquivo para o VPS como `/opt/mission-control/collector/sa-key.json` (permissão 600);
6. Abra o `.json`, copie o valor de `"client_email"` (algo como `coletor-mission-control@...iam.gserviceaccount.com`);
7. Na **planilha do piloto** → botão **Compartilhar** → cole esse e-mail → dê permissão de **Editor** → Enviar.

Pronto. O coletor agora consegue escrever nas abas `Relatorio_Inadimplencia` e `Relatorio_Renovacoes` sozinho.

## Segurança

- O `sa-key.json` é uma credencial — fica só no VPS (permissão 600), nunca no git (já está no `.gitignore`);
- A Service Account só tem acesso às planilhas que você compartilhar com ela explicitamente — escopo mínimo;
- Se vazar, dá para revogar a chave no Console sem afetar mais nada.
