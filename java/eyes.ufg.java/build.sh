#!/bin/bash

# module: eyes-ufg-java5
# dependencies: [eyes-common-java5]
mvn -f ../eyes.sdk.parent/pom.xml clean install -pl :eyes-ufg-java5 -am -DskipTests