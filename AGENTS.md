# Instruções para Agentes de IA (AGENTS.md)

Este arquivo contém diretrizes específicas para agentes de IA que trabalham neste projeto (FoodControl).

## Contexto do Projeto
O FoodControl é um sistema de gestão de refeições industriais. O objetivo é a precisão no controle de custos e a facilidade operacional para o fechamento de pedidos diários.

## Convenções de Desenvolvimento

### 1. Interface e Design
- **Estética:** Design moderno, limpo, utilizando a paleta de cores baseada em `#004354` (Teal escuro) e tons de ardósia/azul claro.
- **Componentes:** Use o layout base em `@/components/Layout.tsx`.
- **Responsividade:** Priorize o uso de classes utilitárias do Tailwind (`md:`, `lg:`) para garantir que o app funcione em tablets e desktops.

### 2. Integração com Banco de Dados (Supabase)
- **Flexibilidade de Esquema:** Sempre implemente lógica de fallback para nomes de colunas (ex: `emp.name || emp.nome`). Isso evita quebras se o esquema do Supabase for alterado entre inglês e português.
- **Tratamento de Erros:** Nunca deixe uma chamada ao banco sem um bloco `try/catch` e um feedback visual de erro para o usuário.
- **Refresh:** Sempre inclua um botão de "Atualizar" (Refresh) em telas que listam dados do banco.

### 3. Acessibilidade e Performance
- **Imagens:** Use o componente `next/image`. O `alt` deve ser descritivo (ex: `alt={emp.nome || 'Foto do colaborador'}`).
- **Referrer Policy:** Sempre inclua `referrerPolicy="no-referrer"` em componentes `<Image>` que carregam de fontes externas como Picsum.

### 4. Comunicação
- **Idioma:** Toda a interface e mensagens de erro devem estar em **Português do Brasil (pt-BR)**.
- **Feedback:** Use ícones da `lucide-react` para dar feedback visual (ex: `RefreshCw` com `animate-spin` para loading).

## Instruções de Manutenção
- Ao adicionar novas tabelas ao Supabase, atualize o `README.md` e o `app/debug-supabase/page.tsx` para permitir testes.
- Mantenha o arquivo `metadata.json` atualizado com o nome e descrição corretos do app.
