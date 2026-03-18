#!/usr/bin/env bash
# install-tracebit.sh — Download and install the Tracebit CLI for the current platform
#
# Usage:
#   bash skills/tracebit-canaries/scripts/install-tracebit.sh
#
# What it does:
#   1. Detects OS (macOS / Linux) and architecture (amd64 / arm64)
#   2. Downloads the latest release from GitHub
#   3. Linux: runs the installer script
#   4. macOS: downloads the .pkg and opens it (human must click through)
#   5. Prints next steps

set -euo pipefail

RELEASES_URL="https://github.com/tracebit-com/tracebit-community-cli/releases/latest"
GITHUB_API="https://api.github.com/repos/tracebit-com/tracebit-community-cli/releases/latest"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[tracebit-install]${NC} $*"; }
success() { echo -e "${GREEN}[tracebit-install]${NC} $*"; }
warn()    { echo -e "${YELLOW}[tracebit-install]${NC} $*"; }
die()     { echo -e "${RED}[tracebit-install] ERROR:${NC} $*" >&2; exit 1; }

# ── Non-interactive mode (default for agent use) ─────────────────────────────
FORCE="${FORCE:-1}"  # Default: non-interactive, always proceed

# ── Check if already installed ────────────────────────────────────────────────
if command -v tracebit >/dev/null 2>&1; then
  CURRENT_VERSION=$(tracebit --version 2>/dev/null || echo "unknown")
  warn "Tracebit CLI is already installed: $CURRENT_VERSION"
  if [[ "$FORCE" != "1" ]]; then
    read -r -p "Continue with reinstall? [y/N] " CONFIRM
    [[ "${CONFIRM,,}" == "y" ]] || { info "Aborted."; exit 0; }
  else
    info "Proceeding with reinstall (non-interactive mode)"
  fi
fi

# ── Detect OS ─────────────────────────────────────────────────────────────────
OS=""
case "$(uname -s)" in
  Darwin) OS="macos" ;;
  Linux)  OS="linux" ;;
  *)      die "Unsupported OS: $(uname -s). Download manually from $RELEASES_URL" ;;
esac

# ── Detect architecture ───────────────────────────────────────────────────────
ARCH=""
case "$(uname -m)" in
  x86_64 | amd64)         ARCH="amd64" ;;
  aarch64 | arm64 | armv8) ARCH="arm64" ;;
  *)                       die "Unsupported architecture: $(uname -m). Download manually from $RELEASES_URL" ;;
esac

info "Detected: OS=$OS, ARCH=$ARCH"

# ── Fetch latest release metadata ─────────────────────────────────────────────
info "Fetching latest release info from GitHub..."
if command -v curl >/dev/null 2>&1; then
  RELEASE_JSON=$(curl -fsSL "$GITHUB_API" 2>/dev/null) || RELEASE_JSON=""
elif command -v wget >/dev/null 2>&1; then
  RELEASE_JSON=$(wget -qO- "$GITHUB_API" 2>/dev/null) || RELEASE_JSON=""
fi

if [[ -z "${RELEASE_JSON:-}" ]]; then
  warn "Could not fetch release metadata from GitHub API."
  info "Please download manually from: $RELEASES_URL"
  info "  macOS arm64:  install-tracebit-osx-arm.pkg"
  info "  macOS x64:    install-tracebit-osx-x64.pkg"
  info "  Linux:        bash install-tracebit-linux"
  exit 1
fi

# ── Find download URL ─────────────────────────────────────────────────────────
DOWNLOAD_URL=""
RELEASE_TAG=""

if command -v python3 >/dev/null 2>&1; then
  # Use python3 to parse JSON (more reliable than grep)
  RELEASE_TAG=$(echo "$RELEASE_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('tag_name', ''))
" 2>/dev/null || true)

  if [[ "$OS" == "macos" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
      PATTERN="install-tracebit-osx-arm.pkg"
    else
      PATTERN="install-tracebit-osx-x64.pkg"
    fi
  else
    PATTERN="install-tracebit-linux"
  fi

  DOWNLOAD_URL=$(echo "$RELEASE_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
pattern = '$PATTERN'
for asset in data.get('assets', []):
    if asset['name'] == pattern or pattern in asset['browser_download_url']:
        print(asset['browser_download_url'])
        break
" 2>/dev/null || true)
else
  # Fallback: grep-based parsing
  RELEASE_TAG=$(echo "$RELEASE_JSON" | grep -o '"tag_name": *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || true)
  if [[ "$OS" == "macos" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
      DOWNLOAD_URL=$(echo "$RELEASE_JSON" | grep -o "https://[^\"]*install-tracebit-osx-arm\.pkg" | head -1 || true)
    else
      DOWNLOAD_URL=$(echo "$RELEASE_JSON" | grep -o "https://[^\"]*install-tracebit-osx-x64\.pkg" | head -1 || true)
    fi
  else
    DOWNLOAD_URL=$(echo "$RELEASE_JSON" | grep -o 'https://[^"]*install-tracebit-linux"' | tr -d '"' | head -1 || true)
  fi
fi

if [[ -z "${DOWNLOAD_URL:-}" ]]; then
  warn "Could not find a download URL for $OS/$ARCH in the latest release."
  info "Please download manually from: $RELEASES_URL"
  info "Look for:"
  if [[ "$OS" == "macos" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
      info "  install-tracebit-osx-arm.pkg"
    else
      info "  install-tracebit-osx-x64.pkg"
    fi
  else
    info "  install-tracebit-linux"
  fi
  exit 1
fi

info "Latest release: ${RELEASE_TAG:-latest}"
info "Download URL: $DOWNLOAD_URL"

# ── Download ──────────────────────────────────────────────────────────────────
TMPDIR_INSTALL=$(mktemp -d)
trap 'rm -rf "$TMPDIR_INSTALL"' EXIT

FILENAME="${DOWNLOAD_URL##*/}"
DEST="$TMPDIR_INSTALL/$FILENAME"

info "Downloading $FILENAME..."
if command -v curl >/dev/null 2>&1; then
  curl -fSL --progress-bar "$DOWNLOAD_URL" -o "$DEST"
elif command -v wget >/dev/null 2>&1; then
  wget -q --show-progress "$DOWNLOAD_URL" -O "$DEST"
else
  die "Neither curl nor wget is available. Install one and retry."
fi

success "Downloaded: $DEST"

# ── Install ───────────────────────────────────────────────────────────────────
if [[ "$OS" == "linux" ]]; then
  info "Running Linux installer..."
  chmod +x "$DEST"
  bash "$DEST"
  success "Tracebit CLI installed."

elif [[ "$OS" == "macos" ]]; then
  info "Installing macOS package non-interactively..."
  if sudo -n true 2>/dev/null; then
    sudo installer -pkg "$DEST" -target /
    success "Tracebit CLI installed via macOS installer."
  else
    info "sudo requires a password. Attempting interactive install..."
    sudo installer -pkg "$DEST" -target / || {
      warn "Non-interactive install failed. Falling back to GUI installer."
      open "$DEST"
      warn "A system dialog should appear. Click through to complete install."
      if [[ "$FORCE" != "1" ]]; then
        read -r -p "Press Enter once the installer has finished..."
      else
        info "Waiting 15 seconds for installer to complete..."
        sleep 15
      fi
    }
  fi
fi

# ── Verify ────────────────────────────────────────────────────────────────────
if command -v tracebit >/dev/null 2>&1; then
  VERSION=$(tracebit --version 2>/dev/null || echo "installed")
  success "Tracebit CLI is ready: $VERSION"
else
  warn "The 'tracebit' command isn't in PATH yet."
  warn "You may need to open a new terminal, or the installer may still be running."
  warn "Try: which tracebit   (or restart your shell)"
fi

# ── Next steps ────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next steps:"
echo ""
echo "  1. Authenticate:        tracebit auth"
echo "     (opens a browser for OAuth login)"
echo ""
echo "  2. Deploy all canaries: tracebit deploy all"
echo ""
echo "  3. Verify deployment:   tracebit show"
echo ""
echo "  4. Set up Gmail hook:   see references/gmail-hook-setup.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
