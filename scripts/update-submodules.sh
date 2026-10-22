#!/bin/sh
# Pins every submodule in .gitmodules to the tip of its tracked remote branch; exits non-zero if any remote is unreachable.

set -eu

cd "$(git rev-parse --show-toplevel)"

fail() {
  echo "update-submodules: $*" >&2
  exit 1
}

git config -f .gitmodules --get-regexp '^submodule\..*\.path$' | while read -r key path; do
  name="${key#submodule.}"
  name="${name%.path}"
  url="$(git config -f .gitmodules "submodule.${name}.url")"
  branch="$(git config -f .gitmodules "submodule.${name}.branch" || echo master)"

  # Not piped into cut: a pipeline would hide the ls-remote exit status.
  ls_output="$(git ls-remote --exit-code "$url" "refs/heads/${branch}")" ||
    fail "cannot read refs/heads/${branch} from ${url} (submodule ${name}); retry when the remote is reachable"
  remote_sha="$(printf '%s\n' "$ls_output" | cut -f1)"
  [ -n "$remote_sha" ] || fail "empty revision for ${name} (${url} ${branch})"

  current="$(git ls-files -s -- "$path" | awk '$1 == "160000" { print $2 }')"
  [ -n "$current" ] || fail "${path} is not a gitlink in the index"

  if [ "$current" != "$remote_sha" ]; then
    git update-index --add --cacheinfo "160000,${remote_sha},${path}"
    echo "update-submodules: ${name} ${current%"${current#???????}"} -> ${remote_sha%"${remote_sha#???????}"} (${branch})"
  fi

  # Keep an already-initialised checkout aligned, otherwise `git commit -a` would revert the pointer.
  if [ -e "${path}/.git" ]; then
    if [ -n "$(git -C "$path" status --porcelain)" ]; then
      echo "update-submodules: ${path} has local changes, working tree left untouched" >&2
    else
      git -C "$path" fetch --quiet origin "$branch" || fail "fetch failed for ${name}"
      git -C "$path" checkout --quiet --detach "$remote_sha" || fail "checkout failed for ${name}"
    fi
  fi
done
