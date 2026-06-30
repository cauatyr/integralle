# Instituto Integralle — PWA de Gestão

App de gestão (PWA instalável, mobile-first, PT-BR) para o Instituto Integralle:
agenda semanal, presença, fechamento de pacientes, financeiro e PDF.
Tema **preto e dourado**. Dados compartilhados em nuvem (Henrique e Eduardo usam a
mesma conta e veem tudo em tempo real).

## Stack
- React + Vite + TypeScript + TailwindCSS
- Supabase (Postgres + Auth + Realtime)
- TanStack Query · React Router · date-fns · lucide-react
- PWA via `vite-plugin-pwa` · PDF via `@react-pdf/renderer` (chunk lazy)

## Configuração

### 1. Supabase
1. Crie um projeto novo em https://supabase.com.
2. SQL Editor → cole e rode `supabase/schema.sql` (cria tabelas, RLS, seed dos 2
   profissionais e habilita Realtime).
3. Authentication → Users → **Add user**: crie a conta única do instituto
   (ex.: `instituto@integralle.com` + senha). Henrique e Eduardo usam essa conta.
4. (Opcional) Authentication → Providers → Email → **Confirm email = OFF**.

### 2. Variáveis de ambiente
Copie `.env.example` para `.env` e preencha:
```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```
(Settings → API no painel do Supabase.) O `.env` está no `.gitignore`.

### 3. Rodar localmente
```
npm install
npm run dev
```
Acesse http://localhost:5173 e faça login com a conta criada no passo 1.

### 4. Build / Deploy (Vercel)
```
npm run build      # gera dist/
```
Na Vercel: importe o repositório, framework **Vite**, e configure as duas env vars
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Deploy automático a cada push.

## Telas
- **Agenda** — semana seg–sáb, 2 colunas por horário (Henrique azul / Eduardo branco),
  editar/encaixar/mover atendimento, marcar **Veio / Não veio**.
- **Fim de dia** — atendimentos e faturamento por profissional (dia/semana/mês) +
  carga horária (base da divisão por horas entre os sócios). Engrenagem → Ajustes.
- **Pacientes** — CRUD em ordem alfabética: tipo (Antigo R$110 / Novo R$115, editável),
  modo de cobrança (Fechamento / Avulso / Paga na hora), ciclo individual
  (mensal ou X dias) e horários fixos.
- **Fechar** — para pacientes com fechamento: relação de datas do ciclo, total,
  **mensagem pronta pro WhatsApp** (copiar), marcar enviado/pago, PDF (se ligado).
- **Financeiro** — faturamento por profissional + caixa (entradas/saídas/custos) e
  resultado. Lançamentos manuais; “paga na hora” e fechamentos pagos entram sozinhos.
- **Ajustes** — liga/desliga o PDF, horário de funcionamento, sair da conta.

## Regras de negócio
- Só **“veio”** computa faturamento e carga horária (presença obrigatória).
- `valor_cobrado` é gravado no momento da presença (snapshot — mudar o preço do
  paciente depois não altera fechamentos antigos).
- **Paga na hora**: ao marcar “veio”, gera entrada no Financeiro e não entra em
  fechamento.
- Ciclo de fechamento é **por paciente** (mensal a partir do dia X, ou X dias corridos).
- Faturamento sempre **separado por profissional** (Henrique × Eduardo).

## Notas
- Os ícones do PWA são um placeholder SVG preto/dourado — substituir por
  `public/favicon.svg` (ou PNGs 192/512) quando o asset oficial chegar.
