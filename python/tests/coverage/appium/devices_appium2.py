import os

import pytest
from appium.options.android import UiAutomator2Options
from appium.options.ios import XCUITestOptions
from appium.webdriver import Remote

from applitools.selenium import Eyes


@pytest.fixture
def pixel_3_xl(app, sauce_vm, browser_name, orientation, sauce_test_name, has_nml):
    options = UiAutomator2Options()
    options.device_name = "Google Pixel 3 XL GoogleAPI Emulator"
    options.orientation = orientation.upper()
    options.set_capability("platformVersion", "10.0")
    return appium(options, sauce_vm, sauce_test_name, app, browser_name, has_nml)


@pytest.fixture
def pixel_3a_xl(app, sauce_vm, browser_name, orientation, sauce_test_name, has_nml):
    options = UiAutomator2Options()
    options.device_name = "Google Pixel 3a XL GoogleAPI Emulator"
    options.orientation = orientation.upper()
    options.set_capability("platformVersion", "10.0")
    return appium(options, sauce_vm, sauce_test_name, app, browser_name, has_nml)


@pytest.fixture
def samsung_galaxy_s8(
    app, sauce_vm, browser_name, orientation, sauce_test_name, has_nml
):
    options = UiAutomator2Options()
    options.device_name = "Samsung Galaxy S8 FHD GoogleAPI Emulator"
    options.set_capability("platformVersion", "7.0")
    options.orientation = orientation.upper()
    return appium(options, sauce_vm, sauce_test_name, app, browser_name, has_nml)


@pytest.fixture
def iphone_xs(app, sauce_mac_vm, browser_name, orientation, sauce_test_name, has_nml):
    options = XCUITestOptions()
    options.device_name = "iPhone XS Simulator"
    options.orientation = orientation.upper()
    options.set_capability("platformVersion", "13.0")
    return appium(options, sauce_mac_vm, sauce_test_name, app, browser_name, has_nml)


@pytest.fixture
def iphone_12(app, sauce_mac_vm, browser_name, orientation, sauce_test_name, has_nml):
    options = XCUITestOptions()
    options.device_name = "iPhone 12 Pro Simulator"
    options.orientation = orientation.upper()
    options.set_capability("platformVersion", "15.2")
    return appium(options, sauce_mac_vm, sauce_test_name, app, browser_name, has_nml)


def appium(options, sauce_url, sauce_test_name, app, browser_name, has_nml):
    if app and browser_name:
        raise Exception("Appium drivers shouldn't contain both app and browserName")
    if not app and not browser_name:
        raise Exception("Appium drivers should have app or browserName")
    if app:
        options.app = app
        if has_nml:
            caps = {}
            Eyes.set_mobile_capabilities(caps)
            options.load_capabilities(caps)
    if browser_name:
        options.set_capability("browserName", browser_name)
    options.set_capability("sauce:options", {"name": sauce_test_name})

    selenium_url = os.getenv("SELENIUM_SERVER_URL", sauce_url)
    return Remote(command_executor=selenium_url, options=options)
