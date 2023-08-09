#!/bin/bash

# module: eyes-selenium-java5
# dependencies: [eyes-selenium-common-java5, eyes-sdk-core-java5, eyes-connectivity-java5]
mvn -f ../eyes.sdk.parent/pom.xml clean install -pl :eyes-selenium-java5 -am -DskipTests