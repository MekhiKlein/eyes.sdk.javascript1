#!/bin/bash

# module: eyes-appium-java5
# dependencies: [eyes-seleniun-java5]
mvn -f ../eyes.sdk.parent/pom.xml clean install -pl :eyes-appium-java5 -am -DskipTests
