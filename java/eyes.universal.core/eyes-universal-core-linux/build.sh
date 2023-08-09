#!/bin/bash

# module: eyes-universal-core-linux
# dependencies: []

if [ -z "$(ls -A ../../../js/packages/core/bin)" ]; then
  # update core binaries to latest
  chmod +x ../../../scripts/download-core-bin.sh
  ./../../../scripts/download-core-bin.sh --platform linux --dir "./src/main/resources"
  rm -f "./src/main/resources/core-linux-arm64"
else
  echo "Found js/core binaries"
  ls -A ../../../js/packages/core/bin
  mkdir -p src/main/resources
  cp ../../../js/packages/core/bin/core-linux ./src/main/resources
fi

# build current module
mvn -f ../../eyes.sdk.parent/pom.xml clean install -pl :eyes-universal-core-linux -am -DskipTests
