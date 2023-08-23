#!/bin/bash

# Abort on Error
set -e;

export APPLITOOLS_LOG_DIR="./reports/logs/";

# remove the DISPLAY variable
unset DISPLAY

# Run module tests
pushd ../coverage-tests/test/Images/
dotnet test Tests.Eyes.Images.Generated.csproj
popd