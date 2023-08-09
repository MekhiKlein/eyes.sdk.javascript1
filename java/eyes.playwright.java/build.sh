#!/bin/bash

# module: eyes-playwright-java5
# dependencies: [eyes-sdk-core-java5, eyes-connectivity-java5]
mvn -f ../eyes.sdk.parent/pom.xml clean install -pl :eyes-playwright -am -DskipTests
