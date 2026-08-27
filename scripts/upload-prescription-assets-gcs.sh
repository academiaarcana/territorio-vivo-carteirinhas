#!/usr/bin/env bash
set -euo pipefail

required_project="territoriovivo"
asset_bucket="${PRESCRIPTION_ASSETS_BUCKET:-}"
asset_source="src/assets/prescription-support"
asset_destination_prefix="prescription-support/v1"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Google Cloud CLI não encontrada. Use o Cloud Shell do projeto territoriovivo ou instale o gcloud antes de continuar." >&2
  exit 1
fi

active_project="$(gcloud config get-value project 2>/dev/null)"
if [[ "${active_project}" != "${required_project}" ]]; then
  echo "Projeto ativo incorreto: ${active_project:-nenhum}. Selecione somente o projeto ${required_project}." >&2
  exit 1
fi

if [[ ! "${asset_bucket}" =~ ^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$ ]]; then
  echo "Defina PRESCRIPTION_ASSETS_BUCKET apenas com o nome do bucket controlado pelo Território Vivo." >&2
  exit 1
fi

bucket_uri="gs://${asset_bucket}"
gcloud storage buckets describe "${bucket_uri}" --project="${required_project}" >/dev/null

gcloud storage cp "${asset_source}"/*.png "${bucket_uri}/${asset_destination_prefix}/" \
  --project="${required_project}" \
  --cache-control="public,max-age=31536000,immutable" \
  --content-type="image/png" \
  --no-clobber

echo "Pictogramas enviados para ${bucket_uri}/${asset_destination_prefix}/ sem alterar IAM ou tornar o bucket público."
