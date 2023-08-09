#!/bin/bash

# module: eyes-connectivity-java5
# dependencies: [eyes-common-java5]
mvn -f ../eyes.sdk.parent/pom.xml clean install -pl :eyes-connectivity -am -DskipTests

