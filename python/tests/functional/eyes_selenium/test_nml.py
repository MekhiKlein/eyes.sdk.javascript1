from appium.webdriver import Remote
from pytest import fixture

from applitools.common import IosDeviceInfo, IosDeviceName
from applitools.selenium import Eyes, Target


@fixture
def ios_app_driver(sauce_mac_vm):
    caps = {
        "app": "storage:filename=UFGTestApp.app.zip",
        "platformName": "iOS",
        "appium:deviceName": "iPhone XS Simulator",
        "appium:platformVersion": "16.2",
        "appium:automationName": "XCUITest",
    }
    Eyes.set_mobile_capabilities(caps)
    with Remote(sauce_mac_vm, desired_capabilities=caps) as driver:
        yield driver


@fixture
def android_app_driver(sauce_vm):
    caps = {
        "app": "storage:filename=SimpleApp.apk",
        "platformName": "Android",
        "appium:platformVersion": "10.0",
        "appium:deviceName": "Google Pixel 3a XL GoogleAPI Emulator",
    }
    Eyes.set_mobile_capabilities(caps)
    with Remote(sauce_vm, desired_capabilities=caps) as driver:
        yield driver


@fixture
def eyes(request):
    eyes = Eyes()
    eyes.configuration.set_app_name("Applitools Eyes SDK")
    eyes.configuration.set_test_name(request.node.name)
    yield eyes
    eyes.abort()


def test_android_fullscreen(android_app_driver, eyes):
    eyes.open(android_app_driver)
    eyes.check(Target.window())
    eyes.close()


def test_android_system_screenshot(android_app_driver, eyes):
    eyes.open(android_app_driver)
    eyes.check(Target.window().use_system_screenshot())
    eyes.close()


def test_ios_fullscreen(ios_app_driver, eyes):
    eyes.open(ios_app_driver)
    eyes.check(Target.window())
    eyes.close()


def test_ios_system_screenshot(ios_app_driver, eyes):
    eyes.open(ios_app_driver)
    eyes.check(Target.window().use_system_screenshot())
    eyes.close()


def test_ios_two_devices(ios_app_driver, eyes):
    eyes.configuration.add_mobile_device(IosDeviceInfo(IosDeviceName.iPhone_Xs))
    eyes.configuration.add_mobile_device(IosDeviceInfo(IosDeviceName.iPad_7))
    eyes.open(ios_app_driver, "NML App", "iOS test")
    eyes.check(Target.window())
    eyes.close()
