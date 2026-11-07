# Atualização imediata do site pelo ERP

O ERP salva os dados e aguarda a confirmação de `POST /api/revalidate` do site. A resposta mantém os campos atuais e acrescenta `siteSync` com `published` ou `pending`, o identificador do evento e, quando necessário, `retryable: false`. Uma falha de publicação não repete nem desfaz o cadastro, pagamento ou exclusão. O botão **Repetir publicação** entrega somente um evento já persistido.

## Configuração e ativação

Todas as variáveis abaixo são exclusivamente de servidor; não use prefixo `NEXT_PUBLIC_`.

| Aplicativo | Variável | Valor esperado |
|---|---|---|
| ERP | `SITE_REVALIDATE_URL` | URL HTTPS completa do site seguida de `/api/revalidate` |
| ERP e site | `SITE_REVALIDATE_SECRET` | Mesmo segredo aleatório nos dois aplicativos |
| ERP | `SITE_SYNC_CRON_SECRET` | Segredo distinto, com pelo menos 32 caracteres, para o scheduler |
| ERP | `SUPABASE_SERVICE_ROLE_KEY` | Credencial de backend já utilizada pelo ERP |
| Site | `PUBLIC_DATA_CACHE_ENABLED` | Manter ausente/`false` até confirmar a integração; ativar com `true` somente depois |

1. Revisar e aplicar `supabase/migrations/20261107025408_site_sync_outbox.sql` **no projeto Supabase do ERP**. A migração foi aplicada e verificada no projeto Itamatay em 2026-11-07, sem alterar cadastros de veículos. Não aplicar em um projeto diferente encontrado na conta conectada.
2. Fazer deploy do endpoint do site, mantendo o cache compartilhado desativado; configurar os segredos de servidor e fazer deploy do ERP. Código local não configura variáveis do hosting nem publica aplicações.
3. Habilitar `pg_cron` e `pg_net` no Supabase do ERP. Cadastrar no Vault `site_sync_retry_url` com a URL HTTPS do ERP seguida de `/api/site-sync/retry`, e `site_sync_cron_secret` com o mesmo valor de `SITE_SYNC_CRON_SECRET`.
4. Executar separadamente `supabase/setup-site-sync-cron.sql` após o deploy. Ele agenda o endpoint a cada minuto; não depende de Cron da Vercel. Os valores reais dos segredos não fazem parte dos arquivos.
5. Testar alteração de preço, status, fotos, exclusão, banner e cores. Após `siteSync.status = published`, abrir uma nova navegação e conferir os dados. Só então habilitar o cache compartilhado do site.

## Entrega, recuperação e limites

- Triggers transacionais registram alterações de veículos, imagens, vídeos, banners e configurações públicas em `site_sync_private.outbox`. Descrições, dados financeiros e credenciais não entram nos eventos. Alterações exclusivas de contadores IA não invalidam configurações públicas.
- Tabela com RLS e funções privadas; os únicos RPCs no schema público aceitam exclusivamente `service_role`. Usuários `anon` e `authenticated` não podem listar, criar ou confirmar eventos. O trigger possui permissão limitada para registrar eventos no mesmo commit da alteração.
- Fluxos normais aguardam publicação no servidor. Há até duas tentativas de três segundos para a chamada ao site; 4xx de configuração não são repetidos. O cron processa até 20 eventos por execução com concorrência quatro, e aplica espera progressiva de 30 segundos até uma hora quando a entrega falha.
- Se a fila não puder persistir o evento, a resposta fica `pending` com `retryable: false`: a interface não oferece um botão para um evento inexistente. Corrigir a configuração antes de ativar o cache. Eventos já registrados pelo trigger continuam disponíveis para o cron.
- O cron também recupera alterações parciais, encerramento inesperado do processo e alterações feitas por outros caminhos do banco. Atrasos nessa recuperação são informados como pendência, sem prometer publicação instantânea durante falhas.
- O ACK confirma a invalidação do cache do servidor. A próxima leitura/navegação recebe o estado atualizado; uma página já aberta ou restaurada pelo histórico pode conservar seu snapshot. Esta integração não acrescenta atualização em tempo real aos navegadores.
- Uploads normais, banners e imports usam caminhos novos para arquivos novos, sem sobrescrever URLs existentes. Troca de vídeo remove o arquivo antigo somente após confirmar o novo registro. Não sobrescrever manualmente um objeto Storage mantendo a mesma URL: caches de imagens dependem dessa URL.
- A fila preserva eventos para auditoria; acompanhar idade/quantidade de pendências e definir retenção de entregues conforme a operação. O cron envia HTTP de forma assíncrona via pg_net: sucesso do job indica enfileiramento; verificar também status HTTP quando houver falhas.

## Cobertura e verificação

Há publicação em CRUD de veículos; ordenação, upload e exclusão de fotos; vídeos e imports Instagram; status em massa; geração de descrição; registro/cancelamento de venda; quitação/estorno financeiro que muda status; banners, ordem e configurações públicas. Lotes parcialmente concluídos publicam os IDs efetivamente alterados. Ações de banners verificam autenticação, permissão específica e linhas afetadas antes de gerar eventos.

`node verify-site-sync.cjs` verifica sintaxe, entrega/ACK, falhas e repetição sem nova gravação, autenticação do cron e o caminho exato liberado pelo proxy. No ambiente de preparação também foi executado `verify-changes.cjs`, comparando tipos/lint contra os arquivos originais, sem regressões. Esses testes não substituem os do banco e do hosting: executar a migração em ambiente de teste, verificar negação dos RPCs para anon/authenticated, rollback junto com a outbox e entrega real antes da ativação.

Referências oficiais: [Supabase Cron com Vault](https://supabase.com/docs/guides/functions/schedule-functions), [pg_net HTTP GET](https://supabase.com/docs/guides/database/extensions/pg_net).
