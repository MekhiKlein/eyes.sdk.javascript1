#!/bin/bash

# module: eyes-selenium-common-java5
# dependencies: [eyes-sdk-core-java5, eyes-connectivity-java5]
mvn -f ../eyes.sdk.parent/pom.xml clean install -pl :eyes-selenium-common-java5 -am -DskipTests