#!/bin/bash

# module: eyes-appium-java5
# dependencies: [eyes-seleniun-java5]

BUILDS=(
  "../eyes.selenium.java"
)

# build dependant modules
for build_path in "${BUILDS[@]}"; do
  echo "in $(pwd)"
  echo "Executing build in: $build_path"
  cd "$build_path" || exit
  chmod +x "build.sh"
  ./build.sh "$1"
  cd - || exit
done

# build current module
mvn clean install -P "$1" -DskipTests
