#!/usr/bin/env bash
# scaffold-docs.sh — create the docs/ tree from the authoritative outline
set -euo pipefail

ROOT="${1:-.}"
DEST="$ROOT/docs"

mkdir -p "$ROOT"

mkdir -p \
  "$DEST/context" \
  "$DEST/architecture" \
  "$DEST/dependencies" \
  "$DEST/data" \
  "$DEST/behavior" \
  "$DEST/operations" \
  "$DEST/quality-security" \
  "$DEST/onboarding"

# Create stub files if missing (do not overwrite existing content)
create_stub() {
  local path="$1" title="$2"
  if [[ -f "$path" ]]; then
    return 0
  fi
  cat > "$path" <<EOF
# $title

Status: \`unknown\` — not written yet.

## Evidence

- (none yet)

## Content

_TODO_

## Open questions

- 
EOF
}

create_stub "$DEST/00-start-here.md" "Start here"
create_stub "$DEST/context/vision-product-brief.md" "Vision / product brief"
create_stub "$DEST/context/glossary-domain-model.md" "Glossary / domain model"
create_stub "$DEST/context/stakeholder-map.md" "Stakeholder map"
create_stub "$DEST/architecture/c4-system-context.md" "C4 Level 1 — System context"
create_stub "$DEST/architecture/c4-containers.md" "C4 Level 2 — Containers"
create_stub "$DEST/architecture/c4-components.md" "C4 Level 3 — Components"
create_stub "$DEST/architecture/architecture-decision-records.md" "Architecture Decision Records"
create_stub "$DEST/architecture/module-package-map.md" "Module / package map"
create_stub "$DEST/dependencies/dependency-inventory.md" "Dependency inventory"
create_stub "$DEST/dependencies/external-service-catalog.md" "External service catalog"
create_stub "$DEST/dependencies/internal-service-dependencies.md" "Internal service dependencies"
create_stub "$DEST/dependencies/sbom-summary.md" "SBOM summary"
create_stub "$DEST/data/data-model-erd.md" "Data model / ERD"
create_stub "$DEST/data/data-dictionary.md" "Data dictionary"
create_stub "$DEST/data/data-flow.md" "Data flow"
create_stub "$DEST/data/migration-history.md" "Migration history"
create_stub "$DEST/data/table-fill-sources.md" "Database tables — fill sources"
create_stub "$DEST/behavior/sequence-diagrams.md" "Sequence diagrams"
create_stub "$DEST/behavior/state-machines.md" "State machines"
create_stub "$DEST/behavior/business-rules-catalog.md" "Business rules catalog"
create_stub "$DEST/behavior/api-reference.md" "API reference"
create_stub "$DEST/behavior/event-catalog.md" "Event catalog"
create_stub "$DEST/behavior/required-document-uploads.md" "Required document uploads"
create_stub "$DEST/operations/deployment-infrastructure.md" "Deployment / infrastructure"
create_stub "$DEST/operations/runbook.md" "Runbook"
create_stub "$DEST/operations/configuration-reference.md" "Configuration reference"
create_stub "$DEST/operations/observability-guide.md" "Observability guide"
create_stub "$DEST/operations/cicd-pipeline.md" "CI/CD pipeline"
create_stub "$DEST/quality-security/test-strategy-coverage.md" "Test strategy & coverage"
create_stub "$DEST/quality-security/maintainability-analysis.md" "Maintainability static analysis"
create_stub "$DEST/quality-security/threat-model.md" "Threat model"
create_stub "$DEST/quality-security/authentication.md" "Authentication"
create_stub "$DEST/quality-security/access-control.md" "Access control"
create_stub "$DEST/quality-security/ui.md" "User interface"
create_stub "$DEST/quality-security/known-issues-tech-debt.md" "Known issues / tech debt"
mkdir -p "$DEST/quality-security/static-analysis"
create_stub "$DEST/onboarding/local-setup.md" "Local setup"
create_stub "$DEST/onboarding/contribution-guide.md" "Contribution guide"

# Seed start-here index if still stubby
if grep -q '_TODO_' "$DEST/00-start-here.md" 2>/dev/null; then
  cat > "$DEST/00-start-here.md" <<'EOF'
# Start here

System guide for this repository. Confidence tags: `confirmed` | `inferred` | `unknown`.

## Reading order

1. [Vision / product brief](context/vision-product-brief.md)
2. [Glossary / domain model](context/glossary-domain-model.md)
3. [C4 system context](architecture/c4-system-context.md)
4. [C4 containers](architecture/c4-containers.md)
5. [Local setup](onboarding/local-setup.md)
6. Then deepen via the index below.

## Index

### Context & purpose
- [Vision / product brief](context/vision-product-brief.md)
- [Glossary / domain model](context/glossary-domain-model.md)
- [Stakeholder map](context/stakeholder-map.md)

### Architecture
- [C4 Level 1 — System context](architecture/c4-system-context.md)
- [C4 Level 2 — Containers](architecture/c4-containers.md)
- [C4 Level 3 — Components](architecture/c4-components.md)
- [Architecture Decision Records](architecture/architecture-decision-records.md)
- [Module / package map](architecture/module-package-map.md)

### Dependencies
- [Dependency inventory](dependencies/dependency-inventory.md)
- [External service catalog](dependencies/external-service-catalog.md)
- [Internal service dependencies](dependencies/internal-service-dependencies.md)
- [SBOM summary](dependencies/sbom-summary.md) · raw: `sbom.cdx.json`

### Data
- [Data model / ERD](data/data-model-erd.md)
- [Data dictionary](data/data-dictionary.md)
- [Data flow](data/data-flow.md)
- [Migration history](data/migration-history.md)
- [Table fill sources](data/table-fill-sources.md)

### Behavior & logic
- [Sequence diagrams](behavior/sequence-diagrams.md)
- [State machines](behavior/state-machines.md)
- [Business rules catalog](behavior/business-rules-catalog.md)
- [API reference](behavior/api-reference.md)
- [Event catalog](behavior/event-catalog.md)
- [Required document uploads](behavior/required-document-uploads.md)

### Operations
- [Deployment / infrastructure](operations/deployment-infrastructure.md)
- [Runbook](operations/runbook.md)
- [Configuration reference](operations/configuration-reference.md)
- [Observability guide](operations/observability-guide.md)
- [CI/CD pipeline](operations/cicd-pipeline.md)

### Quality & security
- [Test strategy & coverage](quality-security/test-strategy-coverage.md)
- [Maintainability static analysis](quality-security/maintainability-analysis.md)
- [Threat model](quality-security/threat-model.md)
- [Authentication](quality-security/authentication.md)
- [Access control](quality-security/access-control.md)
- [User interface](quality-security/ui.md)
- [Known issues / tech debt](quality-security/known-issues-tech-debt.md)

### Onboarding
- [Local setup](onboarding/local-setup.md)
- [Contribution guide](onboarding/contribution-guide.md)

## Top unknowns

- (fill after gap review)
EOF
fi

echo "Scaffold ready: $DEST"
find "$DEST" -type f | sort
