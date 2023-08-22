#!/bin/bash

../Eyes.Selenium4.DotNet/build.sh

# build current module
dotnet pack *.csproj
