# Publicação dos pictogramas no Google Cloud

Projeto autorizado: `territoriovivo`.

## Pré-condições

1. Usar uma conta com acesso legítimo ao projeto no Google Cloud CLI ou no Console.
2. Escolher um bucket controlado pelo Território Vivo; não usar o bucket do Cuidado Para Todos.
3. Definir a política de leitura pública apenas para estes ativos estáticos, se aprovada pela administração do projeto.
4. Manter os arquivos do repositório como fallback enquanto a entrega pelo bucket não for verificada.

## Estrutura sugerida

```text
gs://<bucket-do-territorio-vivo>/prescription-support/v1/
  routes/
  schedules/
  reasons/
  associations/
  taper/
  indigenous/
```

## Verificação obrigatória antes da troca da origem

- projeto ativo igual a `territoriovivo`;
- bucket pertencente ao projeto;
- HTTPS, cache e CORS funcionando no domínio publicado;
- todos os PNGs com status 200 e tipo `image/png`;
- nenhuma credencial, URL assinada ou dado clínico incorporado ao frontend;
- comparação visual real em desktop e celular;
- impressão e PDF funcionando com os ativos remotos.

O frontend não deve apontar para o bucket antes dessas verificações. Esta documentação não cria chaves, não concede IAM e não publica arquivos por conta própria.

Depois de conectar o Google Cloud CLI e escolher um bucket já configurado, o script `scripts/upload-prescription-assets-gcs.sh` valida que o projeto ativo é `territoriovivo` e envia os PNGs sem alterar IAM. Ele exige a variável `PRESCRIPTION_ASSETS_BUCKET`, usa caminho versionado e não sobrescreve objetos existentes.
