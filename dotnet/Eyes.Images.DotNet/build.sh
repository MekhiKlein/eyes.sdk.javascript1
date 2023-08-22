#!/bin/bash

pushd ../Eyes.Image.Core.DotNet
./build.sh
popd

# build current module
dotnet pack *.csproj
