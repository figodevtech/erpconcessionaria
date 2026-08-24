# ESPECIFICAÇÃO — MODERNIZAÇÃO VISUAL DOS MÓDULOS

## Projeto que será alterado

`figodevtech/erpconcessionaria`

Repositório:

`https://github.com/figodevtech/erpconcessionaria`

## Projeto de referência visual

`figodevtech/erpoficina`

Repositório:

`https://github.com/figodevtech/erpoficina`

---

# OBJETIVO

Modernizar visualmente o frontend interno do ERP Concessionária para que ele utilize a mesma linguagem de design do ERP Oficina.

A sidebar já foi modernizada anteriormente.

Nesta tarefa, o foco será:

1. Dashboard
2. KPIs
3. Gráficos
4. Módulo de Veículos
5. Tabelas
6. Filtros e toolbars
7. Cards internos
8. Containers e superfícies
9. Estados de hover/loading/empty
10. Responsividade dos módulos

O resultado deve fazer com que:

```text
ERP Oficina
+
ERP Concessionária
=
mesma família visual
```

Porém cada ERP deve continuar tendo suas próprias funcionalidades e seus próprios dados.

---

# REGRA MAIS IMPORTANTE

## ESTA TAREFA É VISUAL

NÃO implementar novas funcionalidades.

NÃO transformar o dashboard do ERP Concessionária no dashboard do ERP Oficina.

NÃO copiar indicadores do ERP Oficina.

NÃO criar novas APIs.

NÃO criar novas consultas.

NÃO adicionar novos KPIs.

NÃO adicionar novos gráficos.

NÃO adicionar filtros que não existem.

NÃO alterar regras financeiras.

NÃO alterar cálculos.

NÃO modificar banco.

NÃO modificar migrations.

NÃO alterar permissões.

NÃO alterar autenticação.

NÃO alterar fluxo de cadastro de veículos.

NÃO alterar fluxo de vendas.

NÃO alterar comportamento funcional das páginas.

A regra é:

```text
MESMOS DADOS
MESMAS FUNCIONALIDADES
MESMAS AÇÕES
MESMAS ROTAS

+

NOVO VISUAL
```

---

# 1. ANALISE OS DOIS PROJETOS ANTES DE ALTERAR

Antes de começar a implementação, analise o frontend atual de:

```text
figodevtech/erpconcessionaria
```

e depois compare com:

```text
figodevtech/erpoficina
```

O ERP Oficina deve ser utilizado como referência de:

* linguagem visual;
* cores;
* superfícies;
* sombras;
* bordas;
* raio;
* espaçamentos;
* tipografia;
* cards;
* KPIs;
* gráficos;
* tabelas;
* cabeçalhos;
* toolbars;
* filtros;
* empty states;
* loading states;
* responsividade.

Não copie regras específicas do domínio de oficina.

---

# 2. ARQUIVOS IMPORTANTES DO ERP CONCESSIONÁRIA

Analise especialmente:

```text
src/app/(app)/dashboard/page.tsx

src/app/(app)/dashboard/components/vehicle-kpi-cards.tsx

src/app/(app)/dashboard/components/vehicle-brand-chart.tsx

src/app/(app)/dashboard/components/vehicle-status-chart.tsx

src/app/(app)/veiculos/page.tsx

src/app/(app)/veiculos/components/vehicle-module-client.tsx

src/app/(app)/veiculos/components/vehicle-kpis.tsx

src/app/(app)/veiculos/components/vehicle-manager.tsx

src/app/(app)/veiculos/components/vehicle-filters.tsx

src/app/(app)/veiculos/components/vehicle-list-client.tsx

src/app/(app)/veiculos/components/vehicle-table.tsx

src/app/(app)/veiculos/components/vehicle-card.tsx

src/components/ui/card.tsx

src/components/ui/table.tsx

src/components/ui/chart.tsx

src/app/globals.css
```

Identifique também outros módulos que utilizem os mesmos componentes visuais.

---

# 3. REFERÊNCIAS IMPORTANTES DO ERP OFICINA

Analise principalmente:

```text
src/app/(app)/(pages)/dashboard/page.tsx

src/app/(app)/(pages)/dashboard/components/

src/app/(app)/(pages)/dashboard/components/dashboard-ordemservico/components/kpi-ordemservico.tsx

src/app/(app)/(pages)/dashboard/components/dashboard-ordemservico/components/chart-card.tsx

src/app/(app)/(pages)/dashboard/components/dashboard-ordemservico/components/dashboard-ordemservico.tsx

src/app/(app)/(pages)/veiculos/tabela-veiculos.tsx

src/components/ui/table.tsx

src/components/ui/card.tsx

src/app/globals.css
```

Preste atenção especialmente às classes:

```text
dashboard-canvas
dashboard-root
dashboard-surface
dashboard-kpi
dashboard-kpi-strip
dashboard-card-title
dashboard-card-description
```

Não é obrigatório utilizar exatamente esses nomes no ERP Concessionária.

O importante é reproduzir a mesma linguagem visual.

---

# 4. NÃO COPIAR A COMPLEXIDADE DO DASHBOARD DO OFICINA

O dashboard do ERP Oficina possui muito mais informações.

Isso NÃO significa que o ERP Concessionária deve passar a possuir essas informações.

O dashboard atual do ERP Concessionária já possui:

```text
KPIs
├─ Veículos em Estoque
├─ Valor em Estoque
├─ Veículos Vendidos
└─ Pagamentos Pendentes

GRÁFICOS
├─ Veículos por Marca
└─ Status do Estoque
```

MANTER EXATAMENTE ESSES INDICADORES.

Não criar:

```text
ticket médio
tendência
receita 30d
comparação mensal
ranking
metas
percentuais adicionais
novos status
novos gráficos
```

se esses dados não existem atualmente.

Queremos:

```text
Dashboard simples
+
Visual premium
```

e não:

```text
Dashboard simples
→ virar dashboard complexo
```

---

# 5. NOVO CONCEITO VISUAL DO DASHBOARD

Hoje o Dashboard está excessivamente baseado em:

```text
Card externo
 ├─ CardHeader
 └─ CardContent
     ├─ Cards KPI
     └─ Cards gráficos
```

Isso causa sensação visual de:

```text
caixa
  dentro de caixa
    dentro de caixa
```

Reduza essa sensação.

Utilize o padrão visual do ERP Oficina.

Estrutura desejada:

```text
┌────────────────────────────────────────────────────────────┐
│ DASHBOARD CANVAS                                           │
│                                                            │
│ Visão Geral                                                │
│ Informações principais do estoque                          │
│                                                            │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│ │ KPI    │ │ KPI    │ │ KPI    │ │ KPI    │               │
│ └────────┘ └────────┘ └────────┘ └────────┘               │
│                                                            │
│ ┌──────────────────────────────┐ ┌───────────────────────┐ │
│ │ Veículos por Marca           │ │ Status do Estoque     │ │
│ │                              │ │                       │ │
│ │ gráfico                      │ │ gráfico               │ │
│ │                              │ │                       │ │
│ └──────────────────────────────┘ └───────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Visual limpo, moderno e executivo.

---

# 6. DASHBOARD CANVAS

Criar uma área visual semelhante ao `dashboard-canvas` do ERP Oficina.

Características:

* bordas arredondadas grandes;
* background levemente diferente do `background`;
* gradientes radiais extremamente sutis;
* detalhes violeta/azul quase transparentes;
* boa separação do conteúdo principal;
* funcionar em light e dark;
* não parecer uma landing page.

Referência aproximada:

```css
border-radius: 1.5rem ~ 1.75rem;
overflow: hidden;
position: relative;
```

No light:

```text
background quase branco/lilás
```

No dark:

```text
background quase preto arroxeado
```

Evitar fundos fortes ou chamativos.

---

# 7. SUPERFÍCIES INTERNAS

Criar/reutilizar um padrão visual equivalente a:

```text
dashboard-surface
```

para gráficos e blocos importantes.

Características:

```text
border-radius: ~1.25rem
border: none ou extremamente sutil
background: card levemente translúcido
box-shadow: suave
```

Hover opcional:

```text
translateY(-1px)
sombra discretamente maior
```

Transição:

```text
~180ms
```

NÃO criar cards saltando excessivamente.

---

# 8. KPIs — PRINCIPAL MUDANÇA

Os KPIs atuais devem manter seus valores e descrições.

Alterar apenas a apresentação.

O padrão desejado é semelhante ao componente de KPI do ERP Oficina.

Estrutura:

```text
┌───────────────────────────┐
│ Veículos em Estoque    🚗 │
│                           │
│ 42                        │
│                           │
│ Status: Em venda...       │
└───────────────────────────┘
```

Porém com o ícone dentro de uma cápsula:

```text
┌──────┐
│  🚗  │
└──────┘
```

Visual do ícone:

```text
background: primary/10
color: primary
border-radius: xl
```

---

# 9. VISUAL DOS KPI CARDS

Utilizar aproximadamente:

```text
border-radius: 1.15rem
padding: 12–16px
min-height coerente
```

Background:

```text
gradiente muito suave
card → muted/card
```

Sombra:

```text
curta + sombra difusa muito sutil
```

Adicionar detalhe decorativo discreto no canto inferior direito semelhante ao ERP Oficina.

Algo como:

```css
::after {
  width: 5rem;
  height: 5rem;
  border-radius: 999px;
  background: primary com ~9% de intensidade;
}
```

Esse detalhe NÃO deve prejudicar a leitura.

---

# 10. HIERARQUIA DOS KPIs

Título:

```text
12–14px
muted-foreground
line-height compacto
```

Valor:

```text
18px mobile
20–24px desktop
font-semibold
tracking-tight
```

Descrição atual:

```text
11–12px
muted-foreground
```

Não utilizar fontes gigantes.

É um ERP.

---

# 11. GRID DOS KPIs

Manter responsivo.

Algo próximo de:

```text
mobile:
1 coluna

sm/md:
2 colunas

desktop:
4 colunas
```

Preferir:

```text
gap-2 / gap-3
```

em vez de espaços excessivos.

---

# 12. LOADING DOS KPIs

O módulo Veículos já possui skeleton.

Modernize também o skeleton para respeitar:

* mesmo border-radius dos KPIs;
* mesma altura;
* mesmo grid;
* sem mudança brusca de layout quando os dados carregarem.

O layout não pode "pular".

---

# 13. GRÁFICOS

Manter exatamente os gráficos existentes:

```text
Veículos por Marca
Status do Estoque
```

Não alterar os dados.

Melhorar:

* container;
* padding;
* título;
* descrição;
* legenda;
* grid;
* tooltip;
* responsividade;
* cores;
* uso do espaço.

---

# 14. CARD DE GRÁFICO

Criar um componente reaproveitável semelhante conceitualmente ao:

```text
ChartCard
```

do ERP Oficina.

Pode ser algo como:

```tsx
<DashboardSurface
  title="Veículos por Marca"
  description="Quantidade de veículos disponíveis por fabricante"
>
   ...
</DashboardSurface>
```

Não é obrigatório esse nome.

Objetivo: evitar repetir estrutura visual.

---

# 15. TÍTULO DOS GRÁFICOS

Utilizar aproximadamente:

```text
font-size: 14px
font-weight: 600
tracking: levemente negativo
```

Descrição:

```text
font-size: 12px
muted-foreground
margin-top: 2px
```

---

# 16. GRÁFICO DE VEÍCULOS POR MARCA

Preservar o `BarChart` e os mesmos dados.

Melhorar visualmente.

Usar:

* grid horizontal sutil;
* sem eixo visual pesado;
* tick de 11–12px;
* barras arredondadas no topo;
* cor baseada nos tokens do tema;
* tooltip consistente;
* margens mais bem calculadas.

Evitar hardcodes como:

```text
oklch(...)
```

diretamente dentro do gráfico se já houver token apropriado.

Preferir:

```text
var(--primary)
var(--chart-1)
```

ou equivalente suportado.

---

# 17. GRÁFICO DE STATUS

Preservar a distribuição atual.

Pode continuar como donut.

Melhorar:

* espessura;
* espaçamento;
* cores;
* tooltip;
* legenda;
* labels;
* responsividade.

NÃO mudar a informação apresentada.

Não transformar em outro gráfico apenas por gosto, a menos que haja problema real de responsividade.

---

# 18. CORES DOS GRÁFICOS

Usar a linguagem do ERP Oficina.

A paleta principal pode trabalhar com:

```text
violeta
roxo
azul
verde
rosa
âmbar
```

através de:

```text
--chart-1
--chart-2
--chart-3
--chart-4
--chart-5
```

Não usar todos os elementos com exatamente o mesmo tom.

Também não transformar o dashboard em arco-íris.

---

# 19. MÓDULO VEÍCULOS

Este módulo deve receber atenção especial.

Atualmente ele possui:

```text
KPIs
Filtros
Lista de veículos
Tabela
Visualização em grade
Visualização em lista
Paginação
Novo Veículo
Exibir Fotos
Ações
```

MANTER TUDO.

Apenas reorganizar visualmente.

---

# 20. ESTRUTURA VISUAL DE VEÍCULOS

Desejado:

```text
VEÍCULOS

┌──── KPI ────┐
┌──── KPI ────┐
┌──── KPI ────┐
┌──── KPI ────┐

┌──────────────────────────────────────────────┐
│ Busca                    Status              │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Lista de Veículos           fotos | ▦ | ☷   │
│ 123 resultados                  + Veículo    │
│──────────────────────────────────────────────│
│                                              │
│ TABELA / CARDS                               │
│                                              │
│──────────────────────────────────────────────│
│ paginação                                    │
└──────────────────────────────────────────────┘
```

Mas não necessariamente com borda externa em todos os blocos.

---

# 21. FILTROS DE VEÍCULOS

Hoje os filtros vivem em um `Card` separado.

Reavalie esse excesso de containers.

Pode transformar filtros em uma superfície mais compacta:

```text
🔍 Buscar marca, modelo, placa...       Status ▾
```

Características:

* altura compacta;
* border-radius coerente;
* fundo levemente destacado;
* sem cabeçalho grande escrito simplesmente "Filtros", caso não seja necessário;
* controles alinhados;
* mobile empilha;
* desktop fica horizontal.

NÃO remover os filtros existentes.

---

# 22. LISTA DE VEÍCULOS — HEADER

Melhorar o cabeçalho:

```text
Lista de Veículos
123 resultados
```

Resultado deve ser informação secundária.

Evitar:

```text
Lista de Veículos | 123 resultados
```

como uma única linha visual pesada.

Preferir:

```text
Lista de Veículos
123 resultados
```

ou:

```text
Lista de Veículos   123 resultados
```

com badge/secondary text discreto.

---

# 23. AÇÕES DO HEADER DE VEÍCULOS

Organizar adequadamente:

```text
Exibir fotos
Lista / Grade
Novo Veículo
```

Dar hierarquia:

### Primária

```text
Novo Veículo
```

### Secundárias

```text
Exibir fotos
Lista/Grade
Recarregar
```

Não aumentar os botões excessivamente.

---

# 24. TOGGLE LISTA / GRADE

Manter funcionalidade atual.

Modernizar visual como segmented control:

```text
┌─────────────┐
│ ☷   |   ▦   │
└─────────────┘
```

Estado ativo:

```text
background card
shadow-sm
foreground
```

Inativo:

```text
muted-foreground
```

---

# 25. CARDS DE VEÍCULOS

A visualização Grid já existe.

Não mudar dados nem ações.

Melhorar visualmente:

* border-radius;
* sombra;
* proporção da foto;
* hierarquia;
* badges;
* preço;
* informações secundárias;
* botão de ações;
* hover.

Evitar aparência de card de marketplace público.

Esse módulo é administrativo.

O card deve parecer:

```text
ERP premium
```

e não:

```text
anúncio publicitário
```

---

# 26. FOTO DO VEÍCULO

Manter grande o suficiente para identificação.

Usar:

```text
object-cover
overflow-hidden
border-radius superior coerente
```

Hover pode ter:

```text
scale ~1.02
```

ou até manter o comportamento atual.

Não exagerar no zoom.

---

# 27. PREÇO DO VEÍCULO

É uma informação relevante.

Manter destaque.

Usar:

```text
font-semibold
tracking-tight
```

Evitar `font-mono` se isso estiver deixando o visual inconsistente com o ERP Oficina.

Avalie e padronize tipografia.

---

# 28. BADGES DE STATUS

Manter as mesmas categorias e regras.

Apenas padronizar visualmente.

Badges devem ter:

```text
border: transparent ou muito sutil
background: cor / 10%
text: cor com contraste adequado
rounded
font-size: ~11px
```

Exemplo:

```text
Em venda    azul/violeta
Repasse     laranja
Em breve    roxo
Vendido     verde
Rascunho    cinza
Pagamento   âmbar
```

Não alterar estados do domínio.

---

# 29. TABELAS — NOVO PADRÃO

Todas as tabelas modernizadas nesta tarefa devem ter uma aparência consistente.

Não alterar dados ou colunas.

Priorizar:

```text
VehicleTable
```

e componentes compartilhados, quando seguro.

---

# 30. CONTAINER DA TABELA

Evitar:

```text
border forte
dentro de Card
dentro de outro Card
```

Usar uma única superfície.

Algo como:

```text
rounded-xl / rounded-2xl
overflow-hidden
background card
shadow suave
border extremamente sutil
```

No dark:

```text
border white/5 ~ white/10
```

---

# 31. CABEÇALHO DA TABELA

Hoje o `TableHead` é bastante neutro.

Para módulos administrativos, utilizar cabeçalho mais distinto.

Exemplo:

```text
background: muted/30 ~ muted/50
```

Header:

```text
font-size: 11–12px
font-weight: 600
color: muted-foreground ou foreground/70
```

Pode usar uppercase apenas se ficar elegante.

Não obrigatoriamente.

---

# 32. LINHAS DA TABELA

Linha normal:

```text
background transparente
border-bottom sutil
```

Hover:

```text
bg-muted/35 ou equivalente
```

Transição:

```text
150–180ms
```

Se a linha é interativa, cursor pointer.

Não criar borda em cada célula.

---

# 33. ALTURA DAS LINHAS

A tabela precisa continuar densa.

É um ERP.

Usar aproximadamente:

```text
44–56px
```

dependendo da presença de foto.

Evitar:

```text
70–90px
```

para tabelas sem imagem.

---

# 34. TIPOGRAFIA DA TABELA

Cabeçalho:

```text
11–12px
font-medium / semibold
```

Conteúdo:

```text
12–13px
```

Informação principal:

```text
font-medium
```

Informação financeira importante:

```text
font-semibold
```

---

# 35. VALORES FINANCEIROS

No VehicleTable existem:

```text
Valor Compra
Receitas Ops.
Despesas Ops.
Valor Venda
Lucro
% Lucro
```

Preservar todos.

Manter semântica:

```text
receita/lucro positivo → verde
despesa/prejuízo → vermelho
valor principal → foreground/primary
```

Mas diminuir saturação caso esteja muito forte.

Preferir cores adequadas para light e dark.

---

# 36. FOTO NA TABELA

Quando `Exibir Fotos` estiver ativo:

* tamanho consistente;
* border-radius;
* object-cover;
* fundo fallback;
* sem alterar altura desnecessariamente.

Não mudar a funcionalidade do switch.

---

# 37. AÇÕES DA TABELA

Continuar utilizando menu:

```text
...
```

Não colocar vários botões visíveis em cada linha.

Trigger:

```text
ghost
size icon
```

No hover da linha deve continuar fácil de localizar.

---

# 38. PAGINAÇÃO

Modernizar mantendo a mesma funcionalidade.

Características:

* compacta;
* bem alinhada;
* não ocupar largura desnecessária;
* botões outline/ghost;
* contador de páginas discreto.

Mobile deve continuar funcional.

---

# 39. EMPTY STATE

Hoje existem mensagens simples como:

```text
Nenhum veículo encontrado para a busca.
```

Melhorar visualmente sem adicionar funcionalidade.

Pode usar:

```text
ícone discreto
título
descrição curta
```

Exemplo:

```text
🚗

Nenhum veículo encontrado

Tente alterar os filtros da pesquisa.
```

Somente se isso puder ser feito sem alterar o fluxo.

---

# 40. LOADING DA TABELA

Preservar o loading existente.

Pode modernizar a barra superior ou utilizar skeleton.

NÃO fazer duas soluções simultâneas.

Evitar flash de conteúdo.

Durante reload, preferir manter dados existentes com:

```text
opacity ~0.7
```

em vez de desmontar a tabela, caso já seja compatível com o comportamento atual.

---

# 41. DARK MODE

Todos os novos estilos precisam funcionar em dark mode.

ERP Oficina deve ser a referência.

No dark:

* não utilizar preto puro em todos os containers;
* usar diferentes níveis sutis de superfície;
* borders muito leves;
* sombras mais profundas;
* primary violeta;
* muted legível.

---

# 42. LIGHT MODE

O light mode não deve ser branco puro em toda a tela.

Use a linguagem do ERP Oficina:

```text
background levemente lilás/cinza
cards brancos
primary violeta
borders lilás/cinza muito suaves
```

Mas não alterar a identidade funcional da sidebar já implementada.

---

# 43. TOKENS DE TEMA

O ERP Concessionária ainda possui vários tokens genéricos/default.

Compare cuidadosamente com os tokens usados pelo ERP Oficina.

O objetivo é aproximar:

```text
background
foreground
card
card-foreground
primary
secondary
muted
accent
border
ring
chart-1..5
```

à família visual do ERP Oficina.

IMPORTANTE:

Não substituir tokens cegamente se isso quebrar componentes existentes.

Faça uma análise de impacto.

Preferir alterações coordenadas e reutilizáveis.

---

# 44. PRIMARY

A família visual deve ficar alinhada ao violeta utilizado no ERP Oficina.

Referência:

```text
primary aproximadamente #6d28d9 no light
primary aproximadamente #8b5cf6 no dark
```

Não precisa espalhar esses hexadecimais.

Usar tokens.

---

# 45. BACKGROUND

Referência light:

```text
#f7f4fb
```

ou tonalidade equivalente.

Não é obrigatório copiar valor exato se houver conflito.

O objetivo é tirar a aparência de:

```text
template shadcn padrão
```

e aproximar de:

```text
produto Figo
```

---

# 46. NÃO ALTERAR GLOBALMENTE CARD SEM ANALISAR

Evite simplesmente mudar:

```text
src/components/ui/card.tsx
```

de forma que todas as telas do sistema mudem inesperadamente.

Preferir inicialmente componentes/classes como:

```text
module-surface
dashboard-surface
kpi-card
data-table-surface
```

ou variantes.

Se uma mudança no componente `Card` for segura e realmente global, documente a decisão.

---

# 47. NÃO ALTERAR GLOBALMENTE TABLE SEM ANALISAR

O `Table` base é compartilhado.

Não fazer uma alteração radical em:

```text
src/components/ui/table.tsx
```

se isso puder quebrar tabelas em dialogs, selects ou outras telas.

Preferir classes/contextos específicos para tabelas de módulos.

Por exemplo:

```text
module-table
data-table
```

ou wrappers apropriados.

---

# 48. CRIAR UMA LINGUAGEM REUTILIZÁVEL

Evite fazer:

```text
Dashboard → estilo A
Veículos → estilo B
Clientes → estilo C
Financeiro → estilo D
```

Crie conceitos reutilizáveis.

Exemplo:

```text
ModulePage
ModuleSurface
KpiCard
ChartSurface
DataTableSurface
ModuleToolbar
```

Não é obrigatório criar esses componentes exatamente.

Também não crie abstrações excessivas.

Use quando reduz repetição real.

---

# 49. OUTROS MÓDULOS

Depois que o padrão visual de Dashboard e Veículos estiver estabelecido, faça uma inspeção dos demais módulos.

Onde houver componentes equivalentes como:

```text
tabelas
cards de KPI
toolbars
containers
filtros
```

aplique a mesma linguagem visual **somente quando isso puder ser feito sem alterar comportamento**.

Prioridade:

```text
1. Dashboard
2. Veículos
3. Tabelas reutilizadas por outros módulos
4. Outros módulos com alterações visuais triviais/seguras
```

Não transformar esta tarefa em uma refatoração completa de todas as páginas.

---

# 50. PRESERVAR RESPONSIVIDADE

Testar:

```text
375px
430px
768px
1024px
1366px
1440px
1920px
```

Especialmente:

### Dashboard

KPIs não podem ficar espremidos.

### Gráficos

Não podem cortar labels.

### Veículos

Toolbar precisa quebrar corretamente.

### Tabela

Deve possuir scroll horizontal quando necessário.

### Grid

Deve continuar adaptativo.

---

# 51. MICROINTERAÇÕES

Usar animações apenas onde melhoram percepção.

Permitido:

```text
hover translateY(-1px)
hover shadow
transition 180ms
fade do loading
hover da linha
```

Evitar:

```text
cards pulando
scale forte
animações longas
gradientes animados
efeitos chamativos
```

É um sistema administrativo.

---

# 52. CONSISTÊNCIA DE BORDER RADIUS

Criar hierarquia.

Exemplo:

```text
canvas principal      24–28px
superfície grande     18–20px
KPI                    18px
input/button            8–10px
badge                 999px ou padrão
```

Não misturar:

```text
rounded-sm
rounded-md
rounded-xl
rounded-3xl
```

aleatoriamente na mesma tela.

---

# 53. ESPAÇAMENTO

Usar densidade semelhante ao ERP Oficina.

Não aumentar demais os espaços.

Padrões aproximados:

```text
entre grandes seções: 16–24px
entre KPIs: 8–12px
padding superfície: 12–16px
```

---

# 54. HEADER DOS MÓDULOS

Preservar o header geral que já foi implementado com a sidebar.

Dentro dos módulos, evitar repetir títulos gigantes.

Criar hierarquia:

```text
Header global:
Veículos

Conteúdo:
KPIs
Filtros
Lista de Veículos
```

Não repetir:

```text
VEÍCULOS
Gerenciamento de Veículos
Módulo de Veículos
Lista de Veículos
```

sem necessidade.

---

# 55. ÍCONES

Continuar utilizando `lucide-react`.

Tamanho padrão nos cards:

```text
14–18px
```

Nos containers de KPI:

```text
ícone 14–16px
container 28–32px
```

---

# 56. ACESSIBILIDADE

Não prejudicar:

* contraste;
* focus;
* navegação por teclado;
* aria-label;
* tooltips;
* botões;
* links;
* estados disabled.

O visual não pode remover feedback de foco.

---

# 57. NÃO MODIFICAR A SIDEBAR

A sidebar foi modernizada em tarefa anterior e está aprovada.

NÃO refatorar a sidebar nesta tarefa.

Somente faça alteração nela se alguma mudança de token global causar regressão visual e for necessário ajustar compatibilidade.

---

# 58. NÃO ALTERAR FUNCIONALIDADES DE VEÍCULOS

Preservar integralmente:

```text
Novo Veículo
Editar
Excluir
Busca
Filtro por status
Mostrar fotos
Lista
Grade
Paginação
Recarregar
Duplo clique
Permissões
Dialog
```

Não mudar callbacks.

Não mudar endpoints.

Não mudar payloads.

Não mudar consulta.

---

# 59. NÃO ALTERAR CÁLCULO DOS KPIs

Preservar integralmente os cálculos atuais.

No Dashboard:

```text
totalVehicles
totalStockValue
vehiclesSold
vehiclesPendingPayment
```

No módulo Veículos:

```text
totalVehicles
availableCount
soldCount
averageValue
```

Não trocar significado.

---

# 60. NÃO ALTERAR CONSULTAS DO DASHBOARD

Não alterar a consulta atual apenas para deixar o Dashboard parecido com o ERP Oficina.

Visual não justifica mudança de banco/API.

---

# 61. CRITÉRIO VISUAL DO DASHBOARD

Antes:

```text
Card
├ Card
├ Card
├ Card
├ Card
│
├ Card gráfico
└ Card gráfico
```

Depois:

```text
Canvas
│
├ KPI surface
├ KPI surface
├ KPI surface
├ KPI surface
│
├ Chart surface
└ Chart surface
```

Mais integrado.

Mais sofisticado.

Menos aparência de componentes shadcn colocados diretamente na tela.

---

# 62. CRITÉRIO VISUAL DE VEÍCULOS

Antes:

```text
Card filtros

Card lista
 ├ header
 ├ controles
 ├ border
 │ └ tabela
 └ paginação
```

Depois:

```text
KPIs modernos

Toolbar compacta

Surface principal
├ header elegante
├ controles
├ tabela limpa
└ paginação
```

---

# 63. IDENTIDADE DE PRODUTO

Quando o usuário navegar entre:

```text
Dashboard
Veículos
Clientes
Vendas
Financeiro
```

deve sentir que permanece dentro do mesmo produto.

Quando comparar:

```text
ERP Concessionária
ERP Oficina
```

deve perceber que são produtos da mesma empresa.

---

# 64. EVITAR

Não quero:

```text
glassmorphism exagerado
gradientes fortes
neon
cards coloridos demais
bordas grossas
sombras enormes
fontes gigantes
ícones gigantes
dashboard de criptomoedas
dashboard de startup genérico
landing page
```

---

# 65. QUERO

Quero:

```text
ERP moderno
profissional
compacto
elegante
executivo
leve
consistente
violeta
bem hierarquizado
```

---

# 66. ORDEM DE IMPLEMENTAÇÃO

Execute:

### Etapa 1

Analise os componentes atuais do ERP Concessionária.

### Etapa 2

Analise o Dashboard e estilos do ERP Oficina.

### Etapa 3

Defina tokens/classes visuais reutilizáveis.

### Etapa 4

Modernize o Dashboard.

### Etapa 5

Modernize os KPIs do Dashboard.

### Etapa 6

Modernize os gráficos.

### Etapa 7

Modernize os KPIs de Veículos.

### Etapa 8

Modernize filtros e toolbar de Veículos.

### Etapa 9

Modernize tabela de Veículos.

### Etapa 10

Modernize cards da visualização em grade.

### Etapa 11

Modernize paginação/empty/loading.

### Etapa 12

Verifique componentes equivalentes nos demais módulos e aplique apenas melhorias seguras e puramente visuais.

### Etapa 13

Teste light/dark.

### Etapa 14

Teste responsividade.

### Etapa 15

Execute lint/build conforme scripts disponíveis.

---

# 67. VALIDAÇÃO FUNCIONAL

Antes e depois da alteração, as funcionalidades devem ser idênticas.

Validar:

* [ ] Dashboard possui os mesmos 4 KPIs.
* [ ] Dashboard possui os mesmos 2 gráficos.
* [ ] Os valores dos KPIs não mudaram por causa desta tarefa.
* [ ] Os gráficos utilizam os mesmos dados.
* [ ] Nenhuma API nova foi criada.
* [ ] Veículos continua cadastrando.
* [ ] Veículos continua editando.
* [ ] Veículos continua excluindo.
* [ ] Busca continua funcionando.
* [ ] Filtro de status continua funcionando.
* [ ] Switch de fotos continua funcionando.
* [ ] Lista/grade continua funcionando.
* [ ] Paginação continua funcionando.
* [ ] Permissões continuam funcionando.
* [ ] Dialogs continuam funcionando.

---

# 68. VALIDAÇÃO VISUAL

* [ ] Dashboard possui canvas visual semelhante ao Oficina.
* [ ] KPIs possuem nova superfície.
* [ ] Ícones dos KPIs estão em cápsulas.
* [ ] Cards possuem sombras mais sofisticadas.
* [ ] Bordas são mais sutis.
* [ ] Gráficos parecem parte do mesmo Dashboard.
* [ ] Tabelas possuem cabeçalho mais elegante.
* [ ] Hover das linhas está consistente.
* [ ] Valores financeiros estão bem hierarquizados.
* [ ] Status badges estão consistentes.
* [ ] Filtros estão compactos.
* [ ] Toolbar está organizada.
* [ ] Grid de veículos está refinado.
* [ ] Light mode está correto.
* [ ] Dark mode está correto.
* [ ] Mobile está correto.
* [ ] Desktop está correto.
* [ ] Sidebar aprovada não sofreu regressão.

---

# 69. VALIDAÇÃO TÉCNICA

* [ ] Nenhum novo erro TypeScript.
* [ ] Nenhum hydration warning.
* [ ] Nenhum novo erro de lint.
* [ ] Build concluído.
* [ ] Nenhuma dependência desnecessária adicionada.
* [ ] Nenhum backend alterado.
* [ ] Nenhuma migration criada.
* [ ] Nenhuma API alterada por motivo exclusivamente visual.

---

# 70. RELATÓRIO FINAL

Ao terminar, informe:

## Arquivos alterados

```text
arquivo
→ alteração visual realizada
```

## Dashboard

Informe exatamente:

```text
o que mudou visualmente
o que foi preservado funcionalmente
```

## Veículos

Informe:

```text
KPIs
filtros
toolbar
tabela
grid
paginação
```

## Tema

Informe se houve alteração em:

```text
globals.css
tokens
classes reutilizáveis
```

## Testes

Informe apenas comandos realmente executados.

---

# CRITÉRIO DE SUCESSO

Ao colocar os dois projetos lado a lado:

```text
ERP Oficina
ERP Concessionária
```

o usuário deve perceber imediatamente a mesma linguagem visual.

Principalmente em:

```text
background
superfícies
cards
KPIs
gráficos
tabelas
border-radius
sombras
cores
tipografia
espaçamento
hover
dark mode
```

Porém o ERP Concessionária deve continuar oferecendo **exatamente as mesmas informações e funcionalidades que já oferecia antes desta tarefa**.

A missão não é tornar o ERP Concessionária mais complexo.

A missão é torná-lo **visualmente muito mais refinado**.

Faça a implementação de ponta a ponta. Não entregue apenas sugestões ou mockups.

---

Esse escopo está bem adequado ao código atual. Inclusive, eu **não mandaria o Codex copiar o `Table` do Oficina**, porque os dois componentes-base são praticamente iguais hoje.   A diferença visual vem principalmente de **como as tabelas são envolvidas por superfícies, headers, filtros, densidade e contexto**, e não do primitive `<Table>` em si.

Outro ponto que eu faria questão de manter no prompt é a modernização dos **tokens internos**: o Concessionária ainda está com o conjunto padrão azul/neutro em `globals.css`, enquanto o Oficina já utiliza o tema violeta e superfícies lilás que combinam com a sidebar aprovada.   Isso provavelmente vai ser uma das mudanças que mais vai fazer os dois ERPs parecerem da mesma família.

Depois coloque no chat do Codex somente:

```text
Leia integralmente e implemente a especificação:

docs/IMPLEMENTACAO_VISUAL_MODULOS.md

Esta tarefa é exclusivamente de frontend/visual.

Use o figodevtech/erpoficina como referência de design, mas preserve integralmente os dados, KPIs, gráficos, funcionalidades, rotas, permissões, APIs e regras de negócio atuais do ERP Concessionária.

Não implemente funcionalidades novas.

Faça a implementação de ponta a ponta e ao final execute as validações descritas no documento.
```

Eu começaria exatamente por essa etapa antes de mexer em Clientes, Vendas e Financeiro em profundidade, porque **Dashboard + Veículos vão estabelecer o design system interno** que depois fica muito mais fácil replicar para o restante do ERP.
