#!/bin/bash

# module: eyes-common-java5
# dependencies: []
mvn -f ../eyes.sdk.parent/pom.xml clean install -pl :eyes-common-java5 -am -DskipTests

