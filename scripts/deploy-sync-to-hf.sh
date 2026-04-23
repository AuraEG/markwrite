#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${HF_USERNAME:-}" ]]; then
  echo "HF_USERNAME is required"
  exit 1
fi

if [[ -z "${HF_SPACE_NAME:-}" ]]; then
  echo "HF_SPACE_NAME is required"
  exit 1
fi

if [[ -z "${HF_TOKEN:-}" ]]; then
  echo "HF_TOKEN is required"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_DIR="$(mktemp -d)"
SPACE_REPO_URL="https://user:${HF_TOKEN}@huggingface.co/spaces/${HF_USERNAME}/${HF_SPACE_NAME}"

cleanup() {
  rm -rf "${TEMP_DIR}"
}
trap cleanup EXIT

git clone "${SPACE_REPO_URL}" "${TEMP_DIR}/space"

find "${TEMP_DIR}/space" -mindepth 1 -maxdepth 1 ! -name ".git" -exec rm -rf {} +

cp -R "${REPO_ROOT}/apps/sync-server/src" "${TEMP_DIR}/space/src"
cp "${REPO_ROOT}/apps/sync-server/package.json" "${TEMP_DIR}/space/package.json"
cp "${REPO_ROOT}/apps/sync-server/tsconfig.json" "${TEMP_DIR}/space/tsconfig.json"
cp "${REPO_ROOT}/apps/sync-server/Dockerfile" "${TEMP_DIR}/space/Dockerfile"
cp "${REPO_ROOT}/apps/sync-server/.dockerignore" "${TEMP_DIR}/space/.dockerignore"

cat > "${TEMP_DIR}/space/README.md" <<EOF
---
title: MarkWrite Sync Server
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 10000
pinned: false
---

# MarkWrite Sync Server

Hocuspocus WebSocket sync service for MarkWrite collaborative editing.
EOF

cd "${TEMP_DIR}/space"
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

git add -A

if git diff --cached --quiet; then
  echo "No Hugging Face Space changes to deploy."
  exit 0
fi

git commit -m "chore: deploy MarkWrite sync-server from repository"
git push origin main

echo "Sync server deployed to https://huggingface.co/spaces/${HF_USERNAME}/${HF_SPACE_NAME}"
