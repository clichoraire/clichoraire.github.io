#!/bin/bash
# Local aliases remain local; build and publish from a disposable Git worktree.
set -euo pipefail
SITE="$(cd "$(dirname "$0")" && pwd)"
export GAME_PROJECTS_ROOT="$(cd "$SITE/.." && pwd)"
export GAME_PUBLISH_BRANCH="$(git -C "$SITE" symbolic-ref --short HEAD)"
BASE="$(git -C "$SITE" rev-parse HEAD)"
REMOTE="refs/remotes/origin/$GAME_PUBLISH_BRANCH"
if git -C "$SITE" show-ref --verify --quiet "$REMOTE"; then
  if git -C "$SITE" merge-base --is-ancestor "$BASE" "$REMOTE"; then BASE="$REMOTE"
  elif ! git -C "$SITE" merge-base --is-ancestor "$REMOTE" "$BASE"; then
    echo "Les historiques local et publié divergent : réconcilie-les avant de publier." >&2; exit 1
  fi
fi
BUILD_PARENT="$(mktemp -d "${TMPDIR:-/tmp}/jeux-publication.XXXXXX")"
BUILD="$BUILD_PARENT/site"
cleanup(){ git -C "$SITE" worktree remove --force "$BUILD" >/dev/null 2>&1 || true; rmdir "$BUILD_PARENT" 2>/dev/null || true; }
trap cleanup EXIT
# The normal worktree deliberately excludes the generated SnowKids files.
git -C "$SITE" worktree add --detach --no-checkout "$BUILD" "$BASE"
git -C "$BUILD" config --worktree core.sparseCheckout false
git -C "$BUILD" config --worktree core.sparseCheckoutCone false
git -C "$BUILD" read-tree --reset -u HEAD
# Preserve current edits to the site while excluding the local source shortcut.
rsync -a --exclude .git --exclude .DS_Store --exclude snow-kids "$SITE/" "$BUILD/"
if [ "${1:-}" = "--prepare-only" ]; then export GAME_PREPARE_ONLY=1; shift; fi
GAME_PUBLISH_BRANCH="$GAME_PUBLISH_BRANCH" GAME_PROJECTS_ROOT="$GAME_PROJECTS_ROOT" bash "$BUILD/deploy-build.sh" "$@"
