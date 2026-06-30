-- =====================================================================
-- Instituto Integralle · Schema completo (idempotente)
-- Rodar inteiro no Supabase SQL Editor.
-- Login ÚNICO compartilhado: RLS libera tudo para usuário autenticado.
-- =====================================================================

create extension if not exists "pgcrypto";

-- Limpeza idempotente (ordem inversa de dependências)
drop table if exists fechamentos cascade;
drop table if exists lancamentos_financeiros cascade;
drop table if exists agendamentos cascade;
drop table if exists horarios_fixos cascade;
drop table if exists pacientes cascade;
drop table if exists profissionais cascade;
drop table if exists config cascade;

-- =====================================================================
-- TABELAS
-- =====================================================================

create table profissionais (
  id    uuid primary key default gen_random_uuid(),
  nome  text not null,
  cor   text not null            -- hex (diferenciação na agenda)
);

create table pacientes (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  telefone         text,
  profissional_id  uuid references profissionais(id),
  tipo_valor       text not null default 'novo' check (tipo_valor in ('antigo','novo')),
  valor            numeric(10,2) not null default 115,   -- editável por paciente
  modo_cobranca    text not null default 'fechamento'
                     check (modo_cobranca in ('fechamento','avulso','paga_na_hora')),
  tem_fechamento   boolean not null default true,
  ciclo_tipo       text check (ciclo_tipo in ('mensal','dias')),
  ciclo_dia_inicio int not null default 1,   -- dia do mês quando ciclo_tipo='mensal'
  ciclo_dias       int,                       -- ex.: 45 quando ciclo_tipo='dias'
  ativo            boolean not null default true,
  created_at       timestamptz not null default now()
);

create table horarios_fixos (
  id           uuid primary key default gen_random_uuid(),
  paciente_id  uuid references pacientes(id) on delete cascade,
  dia_semana   int not null check (dia_semana between 0 and 6), -- 0=Dom..6=Sáb
  hora         text not null,        -- 'HH:MM'
  duracao_min  int not null default 60
);

create table agendamentos (
  id              uuid primary key default gen_random_uuid(),
  data            date not null,
  hora            text not null,                 -- 'HH:MM'
  duracao_min     int not null default 60,
  paciente_id     uuid references pacientes(id) on delete cascade,
  profissional_id uuid references profissionais(id),
  status          text not null default 'agendado'
                    check (status in ('agendado','veio','nao_veio','remarcado')),
  valor_cobrado   numeric(10,2),                 -- snapshot do valor ao marcar 'veio'
  pago            boolean not null default false, -- usado por paga_na_hora
  evolucao        text,                           -- anotação clínica da sessão (prontuário)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table lancamentos_financeiros (
  id               uuid primary key default gen_random_uuid(),
  data             date not null default current_date,
  tipo             text not null check (tipo in ('entrada','saida','custo')),
  valor            numeric(10,2) not null,
  descricao        text not null default '',
  categoria        text,
  profissional_id  uuid references profissionais(id),
  agendamento_id   uuid references agendamentos(id) on delete set null,
  created_at       timestamptz not null default now()
);

create table fechamentos (
  id              uuid primary key default gen_random_uuid(),
  paciente_id     uuid references pacientes(id) on delete cascade,
  periodo_inicio  date not null,
  periodo_fim     date not null,
  qtd             int not null default 0,
  valor_total     numeric(10,2) not null default 0,
  mensagem        text not null default '',
  status          text not null default 'aberto' check (status in ('aberto','enviado','pago')),
  created_at      timestamptz not null default now()
);

create table config (
  chave text primary key,
  valor jsonb not null default '{}'::jsonb
);

-- Índices úteis
create index idx_pacientes_nome      on pacientes(lower(nome));
create index idx_agend_data          on agendamentos(data);
create index idx_agend_paciente      on agendamentos(paciente_id);
create index idx_agend_prof          on agendamentos(profissional_id);
create index idx_lanc_data           on lancamentos_financeiros(data);
create index idx_horarios_paciente   on horarios_fixos(paciente_id);

-- =====================================================================
-- SEED
-- =====================================================================
insert into profissionais (nome, cor) values
  ('Henrique', '#3B82F6'),   -- azul
  ('Eduardo',  '#F5F5F5');   -- branco

insert into config (chave, valor) values
  ('app', jsonb_build_object(
     'pdf_habilitado', false,
     'hora_abertura', '08:00',
     'hora_fechamento', '20:00',
     'dias_atendimento', jsonb_build_array(1,2,3,4,5,6)  -- seg..sáb
  ));

-- =====================================================================
-- updated_at automático em agendamentos
-- =====================================================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_agend_updated on agendamentos;
create trigger trg_agend_updated before update on agendamentos
  for each row execute function set_updated_at();

-- =====================================================================
-- RLS · login único compartilhado → libera tudo para autenticado
-- =====================================================================
alter table profissionais          enable row level security;
alter table pacientes              enable row level security;
alter table horarios_fixos         enable row level security;
alter table agendamentos           enable row level security;
alter table lancamentos_financeiros enable row level security;
alter table fechamentos            enable row level security;
alter table config                 enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'profissionais','pacientes','horarios_fixos','agendamentos',
    'lancamentos_financeiros','fechamentos','config'
  ] loop
    execute format('drop policy if exists "auth full %1$s" on %1$I;', t);
    execute format(
      'create policy "auth full %1$s" on %1$I for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- =====================================================================
-- Realtime
-- =====================================================================
alter publication supabase_realtime add table
  pacientes, horarios_fixos, agendamentos, lancamentos_financeiros, fechamentos;

-- =====================================================================
-- Pronto. Próximos passos manuais:
--   1) Authentication → Users → criar a conta única do instituto.
--   2) Authentication → Providers → Email → Confirm email = OFF (opcional).
-- =====================================================================
