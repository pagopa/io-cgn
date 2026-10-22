#!/bin/sh

set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ps1_path="${script_dir}/export-devcontainer-ca.ps1"

is_wsl() {
  [ -n "${WSL_DISTRO_NAME:-}" ] && return 0
  grep -qi microsoft /proc/sys/kernel/osrelease 2>/dev/null && return 0
  grep -qi microsoft /proc/version 2>/dev/null && return 0
  return 1
}

case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    host_mode="windows-bash"
    ;;
  Linux)
    if is_wsl; then
      host_mode="wsl"
    else
      echo "Skipping certificate export: Windows host not detected."
      exit 0
    fi
    ;;
  *)
    echo "Skipping certificate export: Windows host not detected."
    exit 0
    ;;
esac

if ! command -v powershell.exe >/dev/null 2>&1; then
  echo "powershell.exe is required to export Windows certificate chains." >&2
  exit 1
fi

case "$host_mode" in
  windows-bash)
    if command -v cygpath >/dev/null 2>&1; then
      ps1_path="$(cygpath -w "$ps1_path")"
    else
      echo "cygpath is required to convert the script path for powershell.exe." >&2
      exit 1
    fi
    ;;
  wsl)
    if command -v wslpath >/dev/null 2>&1; then
      ps1_path="$(wslpath -w "$ps1_path")"
    else
      echo "wslpath is required to convert the script path for powershell.exe." >&2
      exit 1
    fi
    ;;
esac

exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$ps1_path"