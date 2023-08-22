#!/bin/bash

../Eyes.Images.DotNet/build.sh

# build current module
dotnet pack *.csproj
