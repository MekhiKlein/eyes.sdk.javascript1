#!/bin/bash

# module: eyes-universal-core-arm
# dependencies: []

if [ -z "$(ls -A ../../../js/packages/core/bin)" ]; then
  # update core binaries to latest
  chmod +x ../../../scripts/download-core-bin.sh
  ./../../../scripts/download-core-bin.sh --platform linux-arm64 --dir "./src/main/resources"
else
  echo "Found js/core binaries"
  ls -A ../../../js/packages/core/bin
  mkdir -p src/main/resources
  cp ../../../js/packages/core/bin/core-linux-arm64 ./src/main/resources
fi

# build current module
mvn -f ../../eyes.sdk.parent/pom.xml clean install -pl :eyes-universal-core-arm -am -DskipTests
