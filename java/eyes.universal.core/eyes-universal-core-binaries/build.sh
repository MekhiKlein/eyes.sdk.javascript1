#!/bin/bash

# module: eyes-universal-core-binaries
# dependencies: []

if [ -z "$(ls -A ../../../js/packages/core/bin)" ]; then
  # update core binaries to latest
  chmod +x ../../../scripts/download-core-bin.sh
  ./../../../scripts/download-core-bin.sh --dir "./src/main/resources"
else
  echo "Found js/core binaries"
  ls -A ../../../js/packages/core/bin
  mkdir -p src/main/resources
  cp ../../../js/packages/core/bin/core-alpine ./src/main/resources
  cp ../../../js/packages/core/bin/core-linux ./src/main/resources
  cp ../../../js/packages/core/bin/core-linux-arm64 ./src/main/resources
  cp ../../../js/packages/core/bin/core-macos ./src/main/resources
  cp ../../../js/packages/core/bin/core-win.exe ./src/main/resources
fi

# build current module
mvn -f ../../eyes.sdk.parent/pom.xml clean install -pl :eyes-universal-core-binaries -am -DskipTests
