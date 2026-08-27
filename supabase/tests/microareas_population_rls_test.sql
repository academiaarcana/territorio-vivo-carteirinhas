BEGIN;
SELECT plan(14);

SELECT has_table('public', 'microareas', 'microareas deve existir');
SELECT has_column('public', 'microareas', 'team_id', 'microareas deve pertencer a uma equipe');
SELECT has_column('public', 'microareas', 'population_count', 'microareas deve aceitar total agregado');
SELECT col_type_is('public', 'microareas', 'population_count', 'integer', 'total agregado deve ser inteiro');
SELECT col_is_null('public', 'microareas', 'population_count', 'total agregado deve aceitar nao informado');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.microareas'::regclass),
  'RLS deve estar habilitada em microareas'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.microareas', 'SELECT'),
  'anon nao deve consultar microareas'
);

SELECT ok(
  has_table_privilege('authenticated', 'public.microareas', 'SELECT'),
  'authenticated deve acessar microareas pela Data API sob RLS'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.microareas'::regclass
      AND contype = 'f'
      AND conname = 'microareas_team_id_fkey'
  ),
  'team_id deve possuir chave estrangeira'
);

SELECT has_index('public', 'microareas', 'microareas_team_id_idx', 'team_id deve possuir indice');

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'microareas' AND policyname = 'microareas_select_by_scope'),
  'policy de leitura por escopo deve existir'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'microareas' AND policyname = 'microareas_insert_by_management_scope'),
  'policy de cadastro pela gestao deve existir'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'microareas' AND policyname = 'microareas_update_by_management_scope'),
  'policy de atualizacao pela gestao deve existir'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'microareas' AND policyname = 'microareas_delete_by_management_scope'),
  'policy de exclusao pela gestao deve existir'
);

SELECT * FROM finish();
ROLLBACK;
