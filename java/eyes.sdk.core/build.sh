#!/bin/bash

# module: eyes-sdk-core-java5
# dependencies: [eyes-universal-core, eyes-ufg-java5, eyes-connectivity-java5]
mvn -f ../eyes.sdk.parent/pom.xml clean install -pl :eyes-sdk-core-java5 -am -DskipTests
