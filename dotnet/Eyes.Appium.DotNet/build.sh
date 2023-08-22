#!/bin/bash

../Eyes.Selenium.DotNet/build.sh

# build current module
dotnet pack *.csproj
