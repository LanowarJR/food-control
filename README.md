# FoodControl - Sistema de Gestão de Refeições e Presença

## 🚀 Visão Geral
O **FoodControl** é um Web App moderno e intuitivo desenvolvido para o controle de presença de colaboradores e gestão de refeições em ambientes industriais. O sistema oferece precisão no controle de custos, facilidade operacional para o fechamento de pedidos diários e segurança robusta através de Row Level Security (RLS).

![FoodControl Logo](/public/logo.png)

## 🛠️ Stack Tecnológica
- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4
- **Banco de Dados:** Supabase (PostgreSQL) com RLS Ativo
- **Autenticação:** Supabase Auth (Role-Based Access Control)
- **Ícones:** Lucide React
- **Gráficos:** Recharts
- **Animações:** Motion (framer-motion)

## 📁 Estrutura do Projeto
- `/app`: Rotas e páginas da aplicação.
  - `page.tsx`: Dashboard de Controle Diário (Snapshot do Dia).
  - `/gestao`: Gestão de Colaboradores e Contratos.
  - `/pedidos`: Fechamento de pedidos, rateio automático e envio via WhatsApp.
  - `/historico`: Histórico consolidado de consumo e gráficos.
  - `/extras`: Lançamento de lotes (Café, Jantar, Lanches extras).
  - `/login`: Portal de acesso seguro.
- `/components`: Componentes modulares (Layout, Sidebar, TopBar, BottomBar).
- `/public`: Assets estáticos, incluindo a nova Identidade Visual.

## 🔒 Segurança e Dados (RLS)
O projeto implementa **Row Level Security (RLS)** para garantir que os dados sejam acessíveis apenas por pessoal autorizado.
- **Role Control**: O acesso total (CRUD) é restrito a usuários com a role `super_admin`.
- **Profiles**: As permissões são gerenciadas através da tabela `public.profiles`, vinculada ao ID do usuário no Supabase Auth.
- **Tabelas Protegidas**: `daily_attendance`, `meal_history`, `food_cost_mapping`, `secondary_meals`.

## 📊 Modelo de Dados Principal
- **`collaborators`**: Base de funcionários vinculada ao projeto TerminalFlow.
- **`profiles`**: Gestão de usuários e permissões do sistema.
- **`daily_attendance`**: Registro diário de presença e extras.
- **`meal_history`**: Histórico oficial de fechamento de pedidos (consolidado).
- **`food_cost_mapping`**: Relacionamento N:1 entre colaboradores e centros de custo para rateio.
- **`secondary_meals`**: Controle de lotes de insumos avulsos.

## ✨ Funcionalidades Recentes
- **Identidade Visual**: Implementação da nova logo oficial (Chef Hat + Graph).
- **Gestão de Extras**: Adição e exclusão dinâmica de colaboradores avulsos no controle diário.
- **Snapshot Upsert**: O histórico oficial agora permite atualizações no mesmo dia sem duplicar registros.
- **Segurança de Função**: Funções SQL com `search_path` definido para evitar mutabilidade e vulnerabilidades.

## 🗺️ Roadmap
- [x] Implementar autenticação de usuários (Supabase Auth).
- [x] Conectar painéis aos dados reais do Supabase (Removendo Mocks).
- [x] Implementar Row Level Security (RLS).
- [x] Nova identidade visual e logo personalizada.
- [ ] Implementar CRUD completo na tela de Gestão (Adicionar/Editar/Remover).
- [ ] Integrar Gemini AI para análise preditiva de consumo e sugestão de cardápios.
- [ ] Adicionar exportação de relatórios em PDF/Excel.

---
&copy; 2024 FoodControl - Gestão de Refeições Industriais.
