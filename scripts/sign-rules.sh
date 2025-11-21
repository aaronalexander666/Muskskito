#!/usr/bin/env bash
set -euo pipefail
COSIGN_PASSWORD="" cosign sign-blob --yes rules/*.yara > rules.sig
# anchor hash to ENS dragontools.eth text record "shield"
cast send-text dragontools.eth shield "$(sha256sum rules.sig | cut -d' ' -f1)"
