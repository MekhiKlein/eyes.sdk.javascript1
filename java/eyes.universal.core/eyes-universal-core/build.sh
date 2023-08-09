#!/bin/bash

# module: eyes-universal-core
# dependencies: [eyes-common-java5]
# profiles: [eyes-universal-core-binaries, eyes-universal-core-alpine, eyes-universal-core-linux
#            eyes-universal-core-arm, eyes-universal-core-mac, eyes-universal-core-win]
mvn -f ../../eyes.sdk.parent/pom.xml clean install -pl :eyes-universal-core -am -DskipTests