import sys

import selenium
from appium.version import version as appium_version
from pytest import fixture

from applitools.selenium import BatchInfo, ClassicRunner, Eyes, StitchMode

if appium_version.startswith("1"):
    from .devices_appium1 import (
        iphone_12,
        iphone_xs,
        pixel_3_xl,
        pixel_3a_xl,
        samsung_galaxy_s8,
    )
else:
    from .devices_appium2 import (
        iphone_12,
        iphone_xs,
        pixel_3_xl,
        pixel_3a_xl,
        samsung_galaxy_s8,
    )

# just to avoid unused imports warning
__all__ = [
    iphone_xs,
    iphone_12,
    pixel_3_xl,
    pixel_3a_xl,
    samsung_galaxy_s8,
]
batch_info = BatchInfo(
    "Py{}.{}|Sel{} Generated tests".format(*sys.version_info[:2], selenium.__version__)
)


@fixture(scope="function")
def app():
    return ""


@fixture(scope="function")
def browser_name():
    return ""


@fixture
def driver_builder(chrome):
    return chrome


@fixture(scope="function")
def orientation():
    return "portrait"


@fixture
def sauce_test_name(request):
    return "Py{}.{}|App{} {}".format(
        *sys.version_info[:2], appium_version, request.node.name[5:]
    )


@fixture
def driver(driver_builder):
    yield driver_builder
    driver_builder.quit()


@fixture
def stitch_mode():
    return StitchMode.Scroll


@fixture
def eyes_runner_class():
    return ClassicRunner()


@fixture
def eyes(eyes_runner_class, stitch_mode):
    """
    Basic Eyes setup. It'll abort test if wasn't closed properly.
    """
    eyes = Eyes(eyes_runner_class)
    eyes.configure.batch = batch_info
    eyes.configure.branch_name = "master"
    eyes.configure.parent_branch_name = "master"
    eyes.configure.set_stitch_mode(stitch_mode)
    eyes.configure.set_save_new_tests(False)
    eyes.configure.set_hide_caret(True)
    eyes.configure.set_hide_scrollbars(True)
    yield eyes
    # If the test was aborted before eyes.close was called, ends the test as aborted.
    eyes.abort()
