#!/bin/bash

pushd ../Eyes.Images.DotNet
./build.sh
popd

# build current module
dotnet pack *.csproj
