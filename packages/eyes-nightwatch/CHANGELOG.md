# Change Log

## Unreleased








## 1.11.1 - 2022/6/2

### Features
### Bug fixes
- Fix rounding error of image size when scaling introduces fractions

## 1.11.0 - 2022/6/1

### Features
- Support UFG for native mobile
- `runner.getAllTestResults` returns the corresponding UFG browser/device configuration for each test. This is available as `runner.getAllTestResults()[i].browserInfo`.
- Support iPhone SE `IosDeviceName.iPhone_SE` and iPhone 8 Plus `IosDeviceName.iPhone_8_Plus` iOS devices
- Support Galaxy S22 `DeviceName.Galaxy_S22` emulation device
- Added support for drivers that return screenshots in jpeg format
- Dorp support for Node.js versions <=12
### Bug fixes
- `runner.getAllTestResults` now aborts unclosed tests
- `runner.getAllTestResults` now returns all results, including aborted tests
- `extractText` now supports regions that don't use hints while using `x`/`y` coordinates
- accept ios and android lowercase as driver platformName capability when using custom grid
- Fixed check region fully in classic execution when using CSS stitching
- Support data urls in iframes
- Allow running with self-signed certificates
- Fixed bug in native apps when screenshot of the element was taken only for the small visible part of the element
- Fixed bug when navigation bar was presented in screenshot on Android 12
- Fixed `CheckSetting`'s `fully` being overridden by `Configuration`'s `forceFullPageScreenshot`
- Set EyesExceptions (such as new test, diffs exception and failed test exception) to exception property in TestResultsSummary
- Improve error message when failed to set viewport size
- Fixed incorrect calculation of coded regions in classic mode when using CSS stitching

## 1.10.3 - 2022/3/14

- fixing: Nightwatch 1.10.2 throwing Module assert/Strict not found
- updated to @applitools/eyes-api@1.2.0 (from 1.1.6)
- updated to @applitools/eyes-sdk-core@13.1.1 (from 12.24.7)
- updated to @applitools/types@1.2.2 (from 1.0.22)
- updated to @applitools/utils@1.2.13 (from 1.2.4)
- updated to @applitools/visual-grid-client@15.10.1 (from 15.8.53)
- updated to @applitools/visual-grid-client@15.10.1 (from 15.8.53)
## 1.10.2 - 2021/12/21

- updated to @applitools/eyes-sdk-core@12.24.7 (from 12.24.5)
- updated to @applitools/types@1.0.22 (from 1.0.21)
- updated to @applitools/visual-grid-client@15.8.53 (from 15.8.49)

## 1.10.1 - 2021/12/7

- implement `getCapabilities` instead of `getDriverInfo`
- updated to @applitools/eyes-sdk-core@12.24.5 (from 12.24.0)
- updated to @applitools/types@1.0.21 (from 1.0.19)
- updated to @applitools/visual-grid-client@15.8.49 (from 15.8.44)

## 1.10.0 - 2021/11/10

- support cookies
- updated to @applitools/eyes-api@1.0.11 (from 1.0.6)
- updated to @applitools/eyes-sdk-core@12.22.4 (from 12.21.2)
- updated to @applitools/utils@1.2.2 (from 1.2.0)
- updated to @applitools/visual-grid-client@15.8.18 (from 15.8.11)
- updated to @applitools/eyes-api@1.1.6 (from 1.1.5)
- updated to @applitools/eyes-sdk-core@12.24.0 (from 12.23.24)
- updated to @applitools/types@1.0.19 (from 1.0.18)
- updated to @applitools/visual-grid-client@15.8.44 (from 15.8.43)

## 1.9.0 - 2021/11/5

- updated to @applitools/eyes-api@1.1.5 (from 1.0.6)
- updated to @applitools/eyes-sdk-core@12.23.24 (from 12.21.2)
- updated to @applitools/utils@1.2.4 (from 1.2.0)
- updated to @applitools/visual-grid-client@15.8.43 (from 15.8.11)

## 1.8.3 - 2021/6/27

- fix nightwatch-api support
- updated to @applitools/eyes-api@1.0.6 (from 1.0.5)
- updated to @applitools/eyes-sdk-core@12.21.2 (from 12.21.1)

## 1.8.2 - 2021/5/25

- added full typescript support
- introduced @applitools/eyes-api package with new api
- updated to @applitools/eyes-api@1.0.3 (from 1.0.1)
- updated to @applitools/eyes-sdk-core@12.20.0 (from 12.19.2)
- updated to @applitools/utils@1.2.0 (from 1.1.3)
- updated to @applitools/visual-grid-client@15.8.7 (from 15.8.5)

## 1.8.1 - 2021/5/12

- updated to @applitools/eyes-api@1.0.1 (from 1.0.0)
- updated to @applitools/eyes-sdk-core@12.19.2 (from 12.19.1)
- updated to @applitools/visual-grid-client@15.8.5 (from 15.8.4)

## 1.8.0 - 2021/5/11

- added full typescript support
- introduced @applitools/eyes-api package with new api
- updated to @applitools/eyes-api@1.0.0 (from 0.0.2)
- updated to @applitools/eyes-sdk-core@12.19.1 (from 12.14.2)
- updated to @applitools/utils@1.1.3 (from 1.1.0)
- updated to @applitools/visual-grid-client@15.8.4 (from 15.5.14)

## 1.7.0 - 2021/4/27

- updated to @applitools/eyes-sdk-core@12.17.4 (from 12.17.2)
- updated to @applitools/visual-grid-client@15.8.2 (from 15.8.1)

## 1.6.0 - 2021/4/22

- fix spec.build for testing
- updated to @applitools/eyes-sdk-core@12.17.2 (from 12.14.2)
- updated to @applitools/visual-grid-client@15.8.1 (from 15.5.14)

## 1.5.2 - 2021/1/29

- chore: add husky
- updated to @applitools/eyes-sdk-core@12.14.2 (from 12.12.2)
- updated to @applitools/visual-grid-client@15.5.14 (from 15.5.5)

## 1.5.1 - 2021/1/12

- updated to @applitools/eyes-sdk-core@12.12.2 (from 12.10.0)
- updated to @applitools/visual-grid-client@15.5.5 (from 15.4.0)

## 1.5.0 - 2020/12/18

- updated to @applitools/eyes-sdk-core@12.10.0 (from 12.9.3)
- updated to @applitools/visual-grid-client@15.4.0 (from 15.3.2)

## 1.4.3 - 2020/12/15

- updated to @applitools/eyes-sdk-core@12.9.3 (from 12.9.2)
- updated to @applitools/visual-grid-client@15.3.2 (from 15.3.1)

## 1.4.2 - 2020/12/14

- updated to @applitools/eyes-sdk-core@12.9.2 (from 12.9.1)
- updated to @applitools/visual-grid-client@15.3.1 (from 15.3.0)

## 1.4.1 - 2020/12/11

- update chaining API to support new concurrency configuration

## 1.4.0 - 2020/12/11

- updated to @applitools/eyes-sdk-core@12.9.1 (from 12.8.4)
- updated to @applitools/visual-grid-client@15.3.0 (from 15.2.6)

## 1.3.0 - 2020/12/8

- updated to @applitools/eyes-sdk-core@12.8.4 (from 12.6.1)
- updated to @applitools/visual-grid-client@15.2.6 (from 15.2.1)

## 1.2.2 - 2020/12/1

- export `RunnerOptions`

## 1.2.1 - 2020/11/29

- updated to @applitools/visual-grid-client@15.2.1 (from 15.2.0)

## 1.2.0 - 2020/11/24

- updated to @applitools/eyes-sdk-core@12.6.1 (from 12.5.7)
- updated to @applitools/visual-grid-client@15.2.0 (from 15.1.1)

## 1.1.0 - 2020/11/12

- fix firefox region compensation issue
- add 2020 ios devices
- fix coded region calculation when running in target region ([Trello 538](https://trello.com/c/FQ8iJZdi))
- deprecate `saveDebugData`
- updated to @applitools/eyes-sdk-core@12.5.7 (from 12.5.5)
- updated to @applitools/visual-grid-client@15.1.1 (from 15.1.0)`

## 1.0.3 - 2020/11/5

- fix `getWindowRect` and `setWindowRect` so they work on drivers running with the JSON Wire Protocol (e.g., non-W3C)

## 1.0.2 - 2020/11/2

- fix `eyesOpen` API

## 1.0.1 - 2020/11/2

- no changes

## 1.0.0 - 2020/11/2

- initial release
