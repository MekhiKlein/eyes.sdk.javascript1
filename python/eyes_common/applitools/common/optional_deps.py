from __future__ import absolute_import, division, print_function

try:
    from appium.webdriver import WebElement as AppiumWebElement
except ImportError:

    class AppiumNotInstalled(object):
        """Please install appium-python-client package to use this functionality"""

    AppiumWebElement = AppiumNotInstalled

try:
    from selenium.common.exceptions import StaleElementReferenceException
    from selenium.webdriver.common.by import By
    from selenium.webdriver.remote.webdriver import WebDriver
    from selenium.webdriver.remote.webelement import WebElement
    from selenium.webdriver.support.event_firing_webdriver import EventFiringWebElement
except ImportError:

    class SeleniumNotInstalled(object):
        """Please install selenium package to use this functionality"""

    By = SeleniumNotInstalled
    EventFiringWebElement = SeleniumNotInstalled
    StaleElementReferenceException = SeleniumNotInstalled
    WebDriver = SeleniumNotInstalled
    WebElement = SeleniumNotInstalled

try:
    from playwright.sync_api import ElementHandle
    from playwright.sync_api import Locator as PlaywrightLocator
    from playwright.sync_api import Page
except ImportError:

    class PlaywrightNotInstalled(object):
        """Please install playwright package to use this functionality"""

    Page = PlaywrightNotInstalled
    PlaywrightLocator = PlaywrightNotInstalled
    ElementHandle = PlaywrightNotInstalled
