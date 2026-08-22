-- Espelha no repositório uma verificação operacional sem alteração de schema/dados
-- registrada no histórico remoto durante a homologação da migration 031.
do $$ begin perform 1; end $$;
