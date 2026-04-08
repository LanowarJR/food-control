# FoodControl - Sistema de Gestão de Refeições e Presença

## Visão Geral
O **FoodControl** é um Web App moderno e intuitivo desenvolvido para substituir planilhas físicas e digitais no controle de presença de colaboradores e gestão de refeições em ambientes industriais (ex: Facility A). O sistema integra-se ao **Supabase** para persistência de dados e oferece ferramentas para fechamento diário de pedidos, histórico de consumo e gestão de pessoal.

## Stack Tecnológica
- **Framework:** Next.js 15+ (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4
- **Banco de Dados:** Supabase (PostgreSQL)
- **Ícones:** Lucide React
- **Gráficos:** Recharts
- **Animações:** Motion (motion/react)
- **Datas:** date-fns

## Estrutura do Projeto
- `/app`: Rotas e páginas da aplicação.
  - `page.tsx`: Dashboard de Controle Diário (Presença).
  - `/gestao`: Gestão de Colaboradores e Contratos.
  - `/pedidos`: Fechamento de pedidos e resumo para fornecedores.
  - `/historico`: Visualização de dados históricos e gráficos de consumo.
  - `/debug-supabase`: Ferramenta de diagnóstico de conexão com o banco.
- `/components`: Componentes reutilizáveis de UI.
  - `Layout.tsx`: Estrutura base (Sidebar + TopBar + BottomBar).
  - `Sidebar.tsx`: Navegação principal.
  - `TopBar.tsx`: Informações de perfil e data.
  - `BottomBar.tsx`: Resumo rápido de contagem de refeições.
- `/lib`: Utilitários e configurações (ex: `supabase.ts`).
- `/hooks`: Hooks customizados (ex: `use-mobile.ts`).

## Modelo de Dados (Supabase)
O projeto utiliza as seguintes tabelas principais:

### 1. `collaborators` (Colaboradores)
- `id`: UUID ou ID numérico.
- `nome` / `name`: Nome completo.
- `avatar_url`: URL da imagem de perfil.
- `cargo`: Função do colaborador.
- `centro_custo` / `cost_center`: Vínculo com contrato/centro de custo.
- `status`: 'Ativo' ou 'Inativo'.
- `status_presenca`: 'Presente', 'Falta', 'Atraso'.
- `comment`: Observações diárias.

### 2. `contracts` (Contratos / Centros de Custo)
- `id`: Identificador único.
- `nome` / `name`: Nome do centro de custo ou contrato.

## Variáveis de Ambiente
Necessárias no arquivo `.env` ou nas configurações do ambiente:
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima da API do Supabase.
- `NEXT_PUBLIC_GEMINI_API_KEY`: Chave para integração com IA (Gemini).

## Fluxos Principais
1. **Controle Diário:** O gestor marca a presença dos colaboradores na tela inicial. Os dados são sincronizados com o Supabase.
2. **Gestão de Pessoal:** Cadastro e edição de colaboradores e seus respectivos centros de custo.
3. **Fechamento de Pedido:** Consolidação das refeições do dia (Café, Almoço, Jantar) com opção de copiar resumo formatado para envio via WhatsApp.
4. **Histórico:** Análise de tendências de consumo semanal/mensal através de gráficos.

## Guia para IA e Desenvolvedores
- **Padrão de Código:** Componentes funcionais com hooks (`useState`, `useEffect`, `useCallback`).
- **Estilo:** Utilitários Tailwind puro. Evitar CSS inline.
- **Acessibilidade:** Sempre incluir `alt` em componentes `<Image>` e garantir contraste adequado.
- **Integração Supabase:** Utilizar o cliente em `@/lib/supabase`. Sempre tratar estados de `loading` e `error`.
- **Lógica de Colunas:** O código está preparado para lidar com nomes de colunas tanto em Inglês quanto em Português para compatibilidade com diferentes esquemas de banco.

## Roadmap de Expansão
- [ ] Implementar CRUD completo na tela de Gestão (Adicionar/Editar/Remover).
- [ ] Conectar a página de Histórico aos dados reais do Supabase (atualmente utiliza mock).
- [ ] Integrar Gemini AI para análise preditiva de consumo e sugestão de cardápios.
- [ ] Implementar autenticação de usuários (Supabase Auth).
- [ ] Adicionar exportação de relatórios em PDF/Excel.
