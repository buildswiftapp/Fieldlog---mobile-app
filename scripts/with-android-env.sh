#!/usr/bin/env bash
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

if [[ ! -x "$ANDROID_HOME/platform-tools/adb" ]]; then
  echo "Android SDK not found at $ANDROID_HOME" >&2
  echo "Install Android Studio / SDK, or set ANDROID_HOME to your SDK path." >&2
  exit 1
fi

exec "$@"
