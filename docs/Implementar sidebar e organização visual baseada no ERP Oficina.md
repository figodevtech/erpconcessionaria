# ESPECIFICAÇÃO DE IMPLEMENTAÇÃO — SIDEBAR

## Status
Esta especificação deve ser tratada como a fonte de verdade para esta tarefa.

## Projeto de referência
https://github.com/figodevtech/erpoficina

## Regra
O projeto de referência deve ser utilizado somente para frontend, UX,
sidebar, layout e organização visual.

Não copiar backend, APIs, banco, autenticação ou regras de negócio.

# Tarefa: aplicar o padrão de sidebar e organização de módulos do ERP Oficina neste ERP

Quero modernizar o frontend deste ERP utilizando como principal referência visual e estrutural outro sistema da mesma empresa:

**Repositório de referência:**
`https://github.com/figodevtech/erpoficina`

O foco desta tarefa é principalmente:

1. Sidebar
2. Organização visual dos módulos
3. Agrupamento de módulos e submódulos
4. Navegação
5. Estados ativo/recolhido/expandido
6. Responsividade
7. Integração da sidebar com o layout principal

Não quero copiar backend, banco de dados, APIs ou regras de negócio do ERP Oficina.

---

# REGRA MAIS IMPORTANTE

O `erpoficina` deve ser usado como **referência de frontend e UX**, não como fonte das regras do ERP atual.

Portanto:

- NÃO substituir as rotas deste ERP pelas rotas do `erpoficina`;
- NÃO copiar APIs do `erpoficina`;
- NÃO copiar models ou banco;
- NÃO copiar autenticação;
- NÃO copiar permissões diretamente;
- NÃO remover módulos existentes deste ERP;
- NÃO mudar regras de negócio;
- NÃO alterar funcionalidades das páginas;
- NÃO transformar este ERP em um clone funcional do ERP Oficina.

O objetivo é:

> pegar a excelente organização visual da sidebar do ERP Oficina e aplicá-la aos módulos e funcionalidades que já existem neste ERP.

---

# 1. PRIMEIRO ANALISE O ERP ATUAL

Antes de editar qualquer arquivo, faça uma inspeção completa do frontend deste repositório.

Identifique:

- framework utilizado;
- versão do Next.js, caso seja Next;
- estrutura de `app` ou `pages`;
- layout principal;
- sidebar atual;
- header atual;
- rotas existentes;
- módulos existentes;
- submódulos existentes;
- sistema de autenticação;
- sistema de permissões;
- componentes de UI existentes;
- Tailwind;
- shadcn/ui;
- Radix;
- lucide-react;
- tema claro/escuro;
- menu do usuário;
- comportamento mobile atual.

Não presuma que a estrutura deste ERP seja igual ao `erpoficina`.

Monte mentalmente um mapa:

```text
ROTA ATUAL
→ MÓDULO
→ SUBMÓDULO, se houver
→ PERMISSÃO, se houver
→ ÍCONE
→ POSIÇÃO ATUAL
```

Depois reorganize esses mesmos elementos seguindo o padrão visual do ERP Oficina.

---

# 2. REFERÊNCIA PRINCIPAL NO ERP OFICINA

Analise principalmente estes arquivos do repositório de referência:

```text
src/app/(app)/components/sidebar/sidebar.tsx

src/app/(app)/components/sidebar/components/nav-main.tsx

src/app/(app)/components/sidebar/components/nav-settings.tsx

src/app/(app)/components/sidebar/components/nav-user.tsx

src/components/ui/sidebar.tsx

src/app/(app)/(pages)/ClientAppShell.tsx

src/app/globals.css
```

Esses arquivos definem o padrão que queremos reproduzir.

Não faça simplesmente copy/paste.

Entenda a arquitetura e recrie/adapte de acordo com este projeto.

---

# 3. ESTRUTURA VISUAL DESEJADA

A sidebar deverá seguir conceitualmente esta estrutura:

```text
┌─────────────────────────┐
│                         │
│ MÓDULOS                 │
│                         │
│ 🔧 Módulo operacional   │
│ 📊 Dashboard            │
│ 👥 Clientes             │
│ 📄 Outro módulo         │
│                         │
│ 📦 Grupo A           ›  │
│                         │
│ 🏪 Grupo B           ›  │
│                         │
│ 💲 Financeiro        ›  │
│                         │
│ 📊 Relatórios           │
│                         │
│ AJUSTES                 │
│                         │
│ ⚙ Configurações      ›  │
│                         │
│                         │
│─────────────────────────│
│ Nome do usuário       ↕ │
│ email@empresa.com       │
└─────────────────────────┘
```

Porém os nomes acima são apenas exemplos.

Utilize os módulos reais deste ERP.

---

# 4. COMO O ERP OFICINA ORGANIZA OS MÓDULOS

Use a lógica do ERP Oficina como referência para entender a hierarquia.

Atualmente a seção principal é organizada aproximadamente assim:

```text
MÓDULOS

Execução
Dashboard
Clientes
Ordens de Serviço
Orçamentos
Agendamentos
Veículos
Desmanche

Estoque
 ├─ Produtos
 ├─ Uso/Consumo
 ├─ Etiquetas
 ├─ Movimentação
 ├─ Consulta Etiqueta
 └─ Histórico de estoque

Vendas
 ├─ Histórico
 ├─ Ponto de Venda
 └─ Marketplace

Financeiro
 ├─ Fluxo de Caixa
 ├─ Bancos
 ├─ Fiscal
 ├─ Pagamento de Ordens
 ├─ Pagamento de Vendas
 ├─ Acompanhamento
 └─ DRE

Acompanhamento
Relatórios
Seu Plano
```

E separadamente:

```text
AJUSTES

Configurações
 ├─ Geral
 ├─ Empresa
 ├─ Fiscal & Pagamentos
 ├─ Tipos
 ├─ Perfis & Permissões
 ├─ Usuários
 ├─ Checklist
 ├─ Telegram
 ├─ Auditoria
 └─ Site
```

NÃO copie esses módulos cegamente.

Use essa estrutura apenas para decidir como agrupar os módulos equivalentes do ERP atual.

---

# 5. ORGANIZAÇÃO DOS MÓDULOS DO ERP ATUAL

Reorganize os módulos deste ERP usando a seguinte lógica.

## Primeiro: operação diária

As funcionalidades utilizadas constantemente pelo usuário devem aparecer primeiro.

Exemplos:

```text
Dashboard
Operação principal
Clientes
Vendas
Ordens
Atendimentos
Agendamentos
```

A ordem exata depende do domínio deste ERP.

---

## Depois: módulos maiores agrupados

Quando várias páginas pertencem ao mesmo contexto, evite deixá-las todas no primeiro nível.

Em vez de:

```text
Produtos
Categorias
Movimentações
Inventário
Entrada
Saída
Histórico
```

prefira:

```text
Estoque
 ├─ Produtos
 ├─ Categorias
 ├─ Movimentações
 ├─ Inventário
 └─ Histórico
```

O mesmo vale para:

```text
Financeiro
Vendas
Fiscal
RH
Estoque
Cadastros
Relatórios
Configurações
```

Use agrupamento apenas quando fizer sentido semântico.

Não crie grupos artificiais apenas para deixar a sidebar menor.

---

# 6. SEPARAR "MÓDULOS" DE "AJUSTES"

A sidebar deve ter no mínimo duas áreas conceituais.

## MÓDULOS

Funcionalidades utilizadas para operar a empresa.

```text
MÓDULOS

Dashboard
Clientes
...
Financeiro
...
Relatórios
```

## AJUSTES

Administração/configuração do sistema.

```text
AJUSTES

Configurações
 ├─ Geral
 ├─ Empresa
 ├─ Usuários
 ├─ Permissões
 └─ ...
```

Se o ERP atual possuir outros módulos administrativos, avalie colocá-los nesta seção.

---

# 7. SIDEBAR DESKTOP

Utilize como referência as dimensões do ERP Oficina.

### Aberta

```text
width: 16rem
```

aproximadamente `256px`.

### Recolhida

```text
width: 3rem
```

aproximadamente `48px`.

Quando recolhida:

- mostrar somente os ícones;
- esconder textos;
- esconder labels "Módulos" e "Ajustes";
- esconder submenus;
- manter alinhamento perfeito;
- conteúdo principal deve aproveitar o espaço liberado;
- animação deve ser suave.

Utilize transição de aproximadamente:

```text
200ms ease-linear
```

ou equivalente já utilizado pelo projeto.

---

# 8. SIDEBAR MOBILE

Em telas mobile NÃO manter uma sidebar estreita permanentemente na esquerda.

Use comportamento tipo Drawer/Sheet.

A referência do ERP Oficina utiliza aproximadamente:

```text
18rem
```

de largura no mobile.

Fluxo:

```text
[☰]

usuário toca

↓
┌──────────────────────┐
│ Sidebar              │
│                      │
│ módulos              │
│ ...                  │
│                      │
└──────────────────────┘
████ overlay ██████████
```

Ao selecionar uma rota no mobile, se a biblioteca atual permitir, fechar o menu de forma natural.

Não causar:

- horizontal overflow;
- layout pulando;
- conteúdo comprimido;
- problemas de hidratação.

---

# 9. COLLAPSIBLE PARA GRUPOS

Grupos como:

```text
Estoque
Vendas
Financeiro
Configurações
```

devem utilizar um componente Collapsible/Accordion apropriado.

Preferencialmente:

```text
Collapsible
CollapsibleTrigger
CollapsibleContent
```

caso Radix/shadcn já esteja disponível.

Visual fechado:

```text
💲 Financeiro                >
```

Visual aberto:

```text
💲 Financeiro                v
│
├─ Fluxo de Caixa
├─ Contas
├─ Bancos
└─ DRE
```

Utilize `ChevronRight`.

Quando abrir:

```text
rotate(90deg)
```

com transição suave.

A duração utilizada no ERP Oficina é aproximadamente:

```text
200ms
```

---

# 10. SUBMÓDULOS

Os submódulos devem ficar visualmente subordinados ao módulo pai.

Utilizar:

- pequeno recuo;
- linha vertical à esquerda;
- espaçamento compacto;
- ícone menor ou do mesmo tamanho visual;
- hover;
- indicador ativo.

Referência conceitual:

```text
💲 Financeiro
   │
   ├  ↕ Fluxo de Caixa
   ├  🏦 Bancos
   ├  🧾 Fiscal
   └  📊 DRE
```

Não use árvore pesada ou exagerada.

O visual deve continuar limpo.

---

# 11. ROTA ATIVA

Implemente corretamente a identificação da rota ativa.

Para item normal:

```text
pathname === item.url
```

e, quando fizer sentido:

```text
pathname.startsWith(item.url + "/")
```

para páginas filhas.

Exemplo:

```text
/clientes
/clientes/123
/clientes/123/editar
```

devem manter `Clientes` ativo.

Porém tenha cuidado com rotas que compartilham prefixos.

Não marque dois módulos como ativos simultaneamente por causa de comparação ingênua de strings.

Crie uma função centralizada, por exemplo:

```ts
isPathActive()
```

ou utilize a abstração já existente no ERP.

---

# 12. GRUPO PAI ATIVO

Se qualquer filho estiver ativo:

```text
Financeiro
 ├─ Fluxo de Caixa
 ├─ Bancos ← rota atual
 └─ DRE
```

o item:

```text
Financeiro
```

também deve aparecer ativo/destacado.

Além disso, o grupo deve ser aberto automaticamente.

Comportamento esperado:

```ts
const isGroupActive = item.items.some(...)
```

e quando `isGroupActive === true`:

```text
open = true
```

Isso é importante.

O usuário não deve acessar `/financeiro/bancos` e encontrar `Financeiro` fechado.

---

# 13. ESTADO VISUAL ATIVO

Siga a estética do ERP Oficina.

Item normal:

```text
ícone + texto
```

Hover:

```text
fundo levemente destacado
```

Ativo:

```text
fundo violeta/roxo translúcido
font-semibold
leve borda/ring
texto de alto contraste
```

Não utilizar indicadores agressivos.

O destaque deve ser elegante.

---

# 14. PALETA DA SIDEBAR

O ERP Oficina usa aproximadamente:

```css
--sidebar: #160b2e;
--sidebar-foreground: #f7f2ff;

--sidebar-primary: #8b5cf6;
--sidebar-primary-foreground: #ffffff;

--sidebar-accent: #2a174a;
--sidebar-accent-foreground: #ffffff;

--sidebar-border: #332252;
--sidebar-ring: #a78bfa;
```

Utilize essa identidade como referência para a sidebar deste ERP.

Entretanto:

- não altere indiscriminadamente todo o tema do projeto;
- preserve componentes cuja identidade visual não esteja sendo migrada;
- se já houver sistema de variáveis CSS, integre essas cores nele;
- não espalhe hexadecimais por dezenas de componentes.

Preferir tokens como:

```css
--sidebar
--sidebar-foreground
--sidebar-primary
--sidebar-accent
--sidebar-border
```

---

# 15. ÍCONES

Utilize preferencialmente `lucide-react`, caso já esteja instalado.

Os ícones devem:

- possuir estilo consistente;
- ter aproximadamente `16px`;
- não variar aleatoriamente entre bibliotecas;
- representar semanticamente o módulo.

Exemplos:

```text
Dashboard       LayoutDashboard
Clientes        UsersRound
Financeiro      DollarSign
Estoque         Package
Vendas          Store
Configurações   Settings2
Relatórios      ClipboardList
Usuários        Users
```

NÃO altere ícones que já façam sentido apenas para imitar literalmente o ERP Oficina.

---

# 16. LABELS DOS GRUPOS

Adicionar labels discretos:

```text
MÓDULOS
```

e:

```text
AJUSTES
```

Estética:

```text
text-xs
font-medium
foreground com ~70% de intensidade
```

Ao recolher a sidebar, os labels devem desaparecer.

---

# 17. FOOTER DA SIDEBAR

O usuário autenticado deve permanecer no rodapé.

Visual aproximado:

```text
┌─────────────────────────┐
│ Lucas Rawlison        ↕ │
│ lucas@email.com          │
└─────────────────────────┘
```

Ao clicar, abrir o menu de usuário já existente.

Se este ERP já possui opções como:

```text
Meu perfil
Preferências
Alterar senha
Sair
```

preserve-as.

IMPORTANTE:

Não copie a lógica de autenticação do ERP Oficina.

Apenas adapte a apresentação visual.

Não introduza Supabase, NextAuth/Auth.js ou qualquer outro provider se este ERP utiliza outra solução.

---

# 18. SCROLL DA SIDEBAR

A região dos módulos deve poder rolar independentemente.

Estrutura conceitual:

```text
Sidebar
│
├─ Content
│    overflow-y-auto
│
└─ Footer
     usuário
```

Assim, mesmo que existam muitos módulos:

- o usuário permanece disponível no rodapé;
- os módulos podem ser rolados;
- a sidebar inteira não ultrapassa a viewport.

---

# 19. HEADER E INTEGRAÇÃO COM O LAYOUT

Além da sidebar, adapte o layout ao padrão do ERP Oficina quando fizer sentido.

Estrutura:

```text
┌──────────┬───────────────────────────────────────┐
│          │ ☰ | Título da Página          ações │
│ Sidebar  ├───────────────────────────────────────┤
│          │                                       │
│          │              CONTEÚDO                 │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

Header de referência:

```text
height: 64px
border-bottom
background card
```

Lado esquerdo:

```text
SidebarTrigger
Separator
Título da página
```

Lado direito:

preservar as ações que já existem no ERP atual.

---

# 20. NÃO COPIAR COMPONENTES ESPECÍFICOS DO HEADER

O ERP Oficina possui recursos específicos, como:

- rádio;
- DateTimeBadge;
- avisos de cobrança;
- lógica específica de plano;
- comportamento especial em determinadas rotas.

NÃO adicionar esses recursos neste ERP simplesmente porque existem no projeto de referência.

Copie apenas o padrão de layout.

---

# 21. TÍTULO DA ROTA

Se o ERP já possui breadcrumbs ou títulos de página, preserve-os.

Caso atualmente não exista uma solução adequada, centralize o mapeamento de:

```text
rota → título
```

em uma estrutura limpa.

Exemplo:

```ts
const routeTitles = {
  "/dashboard": "Dashboard",
  "/clientes": "Clientes",
}
```

Entretanto, priorize a arquitetura já existente no projeto.

---

# 22. SIDEBAR TRIGGER

Adicionar um botão claro para:

```text
abrir/recolher sidebar
```

no header.

Ícone:

```text
PanelLeft
```

ou equivalente.

Não utilizar botão muito grande.

Algo próximo de:

```text
28px
```

funciona bem.

---

# 23. RAIL CLICÁVEL

No desktop, se for viável com a arquitetura existente, implementar também uma pequena área clicável na borda direita da sidebar para recolher/expandir.

Isso existe no ERP Oficina.

Deve ser um aprimoramento discreto.

Não deve atrapalhar o redimensionamento nem cliques no conteúdo.

---

# 24. ATALHO DE TECLADO

Se não conflitar com atalhos existentes, implementar:

```text
Ctrl + B
```

no Windows/Linux

e:

```text
Cmd + B
```

no macOS

para abrir/recolher a sidebar.

Se já existir um sistema de shortcuts no projeto, integrar nele.

---

# 25. ESTADO DA SIDEBAR

A sidebar deve ter estado controlado.

Algo conceitualmente equivalente a:

```ts
const [sidebarOpen, setSidebarOpen] = useState(true)
```

O provider deverá permitir:

```text
expanded
collapsed
mobile-open
```

Se o sistema atual já salva a preferência do usuário, preserve essa solução.

Se não salvar, pode utilizar mecanismo simples e apropriado.

Não crie dependência de backend apenas para isso.

---

# 26. HOVER QUANDO RECOLHIDA

O ERP Oficina possui comportamento de abrir a sidebar ao passar o mouse em determinadas condições.

Pode reproduzir esse comportamento se ele resultar em boa UX neste ERP.

Mas faça isso de forma cuidadosa:

- somente desktop;
- não ficar abrindo/fechando freneticamente;
- não interferir no mobile;
- não provocar layout shift excessivo.

Se a arquitetura atual tiver uma solução melhor, mantenha-a.

---

# 27. NÃO COPIAR REGRA ESPECÍFICA DE `/ordens`

No ERP Oficina existe lógica específica que fecha a sidebar ao acessar determinadas páginas de Ordens de Serviço.

Essa é uma regra daquele produto.

NÃO copie essa lógica automaticamente.

Só implemente fechamento automático de sidebar se já houver necessidade equivalente neste ERP.

---

# 28. PERMISSÕES

Este é um requisito crítico.

Se este ERP já possui controle de permissões, preserve-o integralmente.

A nova sidebar deve apenas consumir essas permissões.

Exemplo conceitual:

```ts
{
  title: "Financeiro",
  permission: ...
}
```

Ao montar grupos:

- filtrar filhos sem permissão;
- se nenhum filho estiver disponível, esconder o grupo pai;
- não mostrar links que o usuário não pode acessar.

NÃO importar:

```text
PERMS
permissionSetHas
```

do ERP Oficina.

Use o mecanismo nativo deste ERP.

---

# 29. ESTRUTURA DE DADOS DA NAVEGAÇÃO

Evite escrever JSX repetitivo para cada item.

Centralize a navegação em uma configuração tipada.

Exemplo conceitual:

```ts
type NavItem = {
  title: string
  url?: string
  icon?: LucideIcon
  permission?: string
  items?: NavItem[]
}
```

E:

```ts
const navigation = {
  modules: [...],
  settings: [...]
}
```

Depois renderize a partir dessa configuração.

Adapte os tipos às necessidades reais deste ERP.

---

# 30. NÃO DUPLICAR DEFINIÇÕES

Se hoje o ERP possui:

```text
rotas
menu
permissões
breadcrumbs
```

em locais diferentes, tente evitar criar uma quarta fonte conflitante.

Sempre que possível:

- reutilize constantes existentes;
- extraia tipos comuns;
- centralize metadados da navegação.

Mas NÃO faça uma refatoração gigantesca fora do escopo.

---

# 31. COMPONENTIZAÇÃO ESPERADA

A arquitetura pode ficar parecida com:

```text
components/
  sidebar/
    app-sidebar.tsx
    nav-main.tsx
    nav-settings.tsx
    nav-user.tsx
    navigation.ts
```

ou equivalente dentro da arquitetura já usada neste ERP.

Responsabilidades:

### AppSidebar

Orquestra:

```text
Sidebar
SidebarContent
NavMain
NavSettings
SidebarFooter
NavUser
SidebarRail
```

### NavMain

Renderiza:

```text
MÓDULOS
```

e seus itens.

### NavSettings

Renderiza:

```text
AJUSTES
```

### NavUser

Renderiza usuário e menu de conta.

### navigation

Contém a configuração central da navegação.

Isso é apenas uma sugestão.

Não mova arquivos arbitrariamente caso o projeto já tenha uma organização coerente.

---

# 32. ESTILO DOS ITENS

Item principal:

```text
height ≈ 32px
font-size: 14px
padding: 8px
border-radius: médio
gap entre ícone/texto: 8px
```

Ícone:

```text
16px
```

Menus devem ser compactos.

Este é um ERP e não uma landing page.

Não criar sidebar com:

```text
itens gigantes
cards para cada módulo
gradientes exagerados
ícones 24-32px
margens enormes
```

---

# 33. HOVER

Todos os itens clicáveis devem apresentar feedback de hover.

Algo equivalente a:

```text
hover:bg-sidebar-accent
hover:text-sidebar-accent-foreground
cursor:pointer
```

Usar transições sutis.

---

# 34. ITEM ATIVO

Item de primeiro nível ativo:

```text
background: sidebar-primary com transparência
font-weight: 600
ring/border discreto
```

Subitem ativo:

```text
background: sidebar-accent
text: sidebar-accent-foreground
```

O contraste deve funcionar tanto no light quanto no dark mode.

---

# 35. DARK MODE

O ERP Oficina mantém a sidebar praticamente com a mesma identidade escura tanto no light quanto no dark.

Podemos seguir esse padrão.

Ou seja:

```text
Light:
sidebar escura

Dark:
sidebar escura
```

Enquanto o conteúdo principal muda de acordo com o tema.

Não transformar a sidebar em branca apenas porque o usuário está no light mode.

---

# 36. CONTEÚDO PRINCIPAL

A sidebar não deve ficar sobre o conteúdo no desktop.

Utilizar estrutura flex adequada:

```text
SidebarProvider
 ├─ AppSidebar
 └─ Main/SidebarInset
```

Quando aberta:

```text
sidebar 256px
conteúdo = restante
```

Quando fechada:

```text
sidebar 48px
conteúdo = restante
```

Tudo deve animar naturalmente.

---

# 37. RESPONSIVIDADE

Testar pelo menos:

```text
375px
430px
768px
1024px
1366px
1440px
1920px
```

Verificar especialmente:

- mobile;
- tablet;
- desktop;
- monitor largo.

Não permitir scroll horizontal causado pela sidebar.

---

# 38. ACESSIBILIDADE

Preservar/adicionar:

```tsx
aria-current={active ? "page" : undefined}
```

Nos collapsibles usar atributos adequados:

```text
aria-expanded
aria-controls
```

Botão da sidebar deve ter texto para screen readers.

Exemplo:

```text
Toggle Sidebar
```

ou:

```text
Alternar menu lateral
```

Links continuam sendo links reais.

Não transformar toda navegação em `<div onClick>`.

---

# 39. SKELETON / CARREGAMENTO

Se as permissões ou usuário dependem de carregamento assíncrono e hoje ocorre um "flash" dos módulos, implementar skeleton semelhante ao ERP Oficina.

Exemplo:

```text
MÓDULOS

▣ ███████████
▣ █████████
▣ █████████████
...
```

Mas só faça isso se realmente houver estado assíncrono.

Não introduza loading desnecessário.

---

# 40. NÃO ALTERAR O BACKEND

Esta tarefa é de FRONTEND.

Não modificar:

- migrations;
- schemas;
- banco;
- APIs;
- controllers;
- services;
- lógica fiscal;
- integrações;
- regras financeiras;
- autenticação backend.

Exceção somente se alguma pequena alteração puramente tipográfica/metadata for absolutamente necessária para a sidebar consumir algo já existente.

Evite isso sempre que possível.

---

# 41. NÃO ALTERAR FUNCIONALIDADE DOS MÓDULOS

Todas as páginas existentes devem continuar funcionando exatamente como antes.

Estamos alterando:

```text
COMO o usuário chega até a página
```

e não:

```text
O QUE a página faz.
```

---

# 42. NÃO REMOVER ROTAS

Faça um inventário das rotas acessíveis pelo menu atual.

Depois da alteração, todas elas precisam continuar acessíveis.

Se uma página passar a ser subitem:

```text
antes:
Produtos

depois:
Estoque
 └─ Produtos
```

a rota original deve permanecer a mesma.

---

# 43. NÃO CRIAR LINKS FALSOS

Não adicione módulos do ERP Oficina que não existem neste sistema.

Por exemplo, se este ERP não possui:

```text
Desmanche
Marketplace
Telegram
```

não crie links vazios apenas para imitar o outro ERP.

A sidebar deve refletir funcionalidades reais.

---

# 44. DEPENDÊNCIAS

Primeiro verifique o que já existe.

Se já houver:

```text
shadcn/ui
Radix
lucide-react
Tailwind
```

reutilize.

Não instalar outra biblioteca de sidebar sem necessidade.

Se for necessário adicionar componentes shadcn, adicione apenas os necessários.

Evite aumentar o bundle desnecessariamente.

---

# 45. TIPAGEM

Evite `any`.

Crie tipos adequados para:

```text
NavItem
NavGroup
NavigationConfig
Permission
```

sempre respeitando os tipos existentes no projeto.

Não enfraqueça o TypeScript para facilitar a implementação.

---

# 46. PERFORMANCE

A sidebar não deve rerenderizar todo o aplicativo a cada interação.

Quando apropriado use:

```text
useMemo
useCallback
```

mas sem micro-otimizações desnecessárias.

Configurações estáticas devem permanecer fora do componente quando possível.

---

# 47. NÃO CAUSAR HYDRATION MISMATCH

Se o projeto utiliza Next.js SSR/App Router, tome cuidado especial com:

- detecção de mobile;
- window;
- document;
- cookie;
- localStorage;
- Sheet;
- estado inicial da sidebar.

Não gere HTML diferente entre servidor e primeiro render do cliente.

---

# 48. RESULTADO VISUAL ESPERADO

Quero que, ao abrir os dois sistemas lado a lado, seja perceptível que pertencem à mesma família de produtos.

Algo como:

```text
ERP OFICINA
┌───────────┬──────────────────────────────┐
│ sidebar   │ header                      │
│ roxa      ├──────────────────────────────┤
│ compacta  │ conteúdo                    │
│ módulos   │                              │
└───────────┴──────────────────────────────┘


ERP ATUAL
┌───────────┬──────────────────────────────┐
│ sidebar   │ header                      │
│ roxa      ├──────────────────────────────┤
│ compacta  │ conteúdo                    │
│ módulos   │                              │
└───────────┴──────────────────────────────┘
```

Mesma linguagem de design.

Mas cada sistema mantém:

```text
seus módulos
suas rotas
suas permissões
suas regras
seus dados
```

---

# 49. PRIORIZAÇÃO

Prioridade máxima:

```text
1. Sidebar
2. Hierarquia dos módulos
3. Collapsibles
4. Estado ativo
5. Sidebar recolhível
6. Mobile
7. Footer do usuário
8. Integração com header/layout
```

Não gaste tempo refazendo dashboards, tabelas, formulários ou páginas internas nesta tarefa.

---

# 50. PROCEDIMENTO DE IMPLEMENTAÇÃO

Execute na seguinte ordem:

## Etapa 1

Inspecione o ERP atual.

## Etapa 2

Identifique todos os módulos e rotas existentes.

## Etapa 3

Identifique permissões associadas.

## Etapa 4

Analise os arquivos de referência no `figodevtech/erpoficina`.

## Etapa 5

Defina a nova árvore de navegação usando os módulos reais deste ERP.

## Etapa 6

Implemente/refatore os componentes de sidebar.

## Etapa 7

Implemente collapsibles.

## Etapa 8

Implemente rota ativa e abertura automática do grupo pai.

## Etapa 9

Integre sidebar ao layout/header.

## Etapa 10

Adapte o mobile.

## Etapa 11

Adapte o menu do usuário sem alterar autenticação.

## Etapa 12

Teste rotas e permissões.

## Etapa 13

Execute lint/typecheck/build.

---

# 51. VALIDAÇÃO FINAL OBRIGATÓRIA

Antes de considerar a tarefa concluída, valide:

- [ ] Todos os módulos existentes continuam acessíveis.
- [ ] Nenhuma rota foi alterada sem necessidade.
- [ ] Nenhum módulo real desapareceu.
- [ ] Nenhum módulo fictício do ERP Oficina foi introduzido.
- [ ] Permissões continuam funcionando.
- [ ] Usuário sem permissão não vê o módulo.
- [ ] Grupo sem filhos permitidos desaparece.
- [ ] Item ativo é destacado.
- [ ] Grupo pai fica ativo quando filho está ativo.
- [ ] Grupo do filho ativo abre automaticamente.
- [ ] Sidebar recolhe no desktop.
- [ ] Sidebar expandida possui aproximadamente 16rem.
- [ ] Sidebar recolhida possui aproximadamente 3rem.
- [ ] Mobile utiliza drawer/sheet.
- [ ] Não há scroll horizontal.
- [ ] Footer do usuário permanece visível.
- [ ] Conteúdo da sidebar possui scroll próprio.
- [ ] Header continua funcional.
- [ ] Tema claro funciona.
- [ ] Tema escuro funciona.
- [ ] Não houve alterações no backend.
- [ ] Não houve alteração nas regras de negócio.
- [ ] Não existem erros de TypeScript.
- [ ] Não existem hydration warnings.
- [ ] Lint não apresenta novos erros.
- [ ] Build é concluído com sucesso.

---

# 52. AO TERMINAR

Depois da implementação, apresente um relatório curto contendo:

### Arquivos alterados

```text
arquivo
→ o que foi alterado
```

### Nova organização da sidebar

Apresente uma árvore real:

```text
MÓDULOS
├─ ...
├─ ...
├─ Grupo
│  ├─ ...
│  └─ ...
│
AJUSTES
└─ Configurações
   ├─ ...
   └─ ...
```

### Funcionalidades preservadas

Informe:

```text
rotas
permissões
autenticação
menu do usuário
```

### Testes executados

Informe os comandos executados, como:

```bash
npm run lint
npm run typecheck
npm run build
```

use apenas os comandos realmente existentes no projeto.

---

# CRITÉRIO DE SUCESSO

A implementação estará correta quando este ERP possuir uma sidebar visualmente e comportamentalmente muito próxima à do:

`figodevtech/erpoficina`

especialmente em:

- hierarquia;
- espaçamento;
- cores;
- ícones;
- collapsibles;
- estado ativo;
- sidebar recolhida;
- navegação mobile;
- disposição dos módulos;
- separação entre Módulos e Ajustes;

mas continuar sendo integralmente o ERP atual em relação a:

- funcionalidades;
- rotas;
- permissões;
- autenticação;
- APIs;
- dados;
- regras de negócio.

Faça a implementação de ponta a ponta. Não entregue apenas sugestões ou exemplos de código.