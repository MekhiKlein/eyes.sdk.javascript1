#!/bin/bash

mkdir -p ./runtimes/linux-alpine/native/
mkdir -p ./runtimes/linux-x64/native/
mkdir -p ./runtimes/linux-arm64/native/
mkdir -p ./runtimes/osx-x64/native/
mkdir -p ./runtimes/win-x64/native/

if [ -z "$(ls -A ../../js/packages/core/bin)" ]; then
  # update core binaries to latest
  chmod +x ../../scripts/download-core-bin.sh
  ../../scripts/download-core-bin.sh --dir "./"
  mv core-alpine ./runtimes/linux-alpine/native/
  mv core-linux ./runtimes/linux-x64/native/
  mv core-linux-arm64 ./runtimes/linux-arm64/native/
  mv core-macos ./runtimes/osx-x64/native/
  mv core-win.exe ./runtimes/win-x64/native/
else
  echo "Found js/core binaries"
  ls
  cp ../../js/packages/core/bin/core-alpine ./runtimes/linux-alpine/native
  cp ../../js/packages/core/bin/core-linux ./runtimes/linux-x64/native
  cp ../../js/packages/core/bin/core-linux-arm64 ./runtimes/linux-arm64/native
  cp ../../js/packages/core/bin/core-macos ./runtimes/osx-x64/native
  cp ../../js/packages/core/bin/core-win.exe ./runtimes/win-x64/native
fi

# build current module
dotnet pack Eyes.Image.Core.DotNet.csproj
