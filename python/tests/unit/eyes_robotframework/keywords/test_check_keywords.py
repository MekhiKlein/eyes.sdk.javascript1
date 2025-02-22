from collections import namedtuple
from typing import List

import attr
import mock
import pytest
from mock import Mock
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from applitools.common import Region
from applitools.common.fluent import RegionByRectangle
from applitools.common.fluent.target_path import TargetPath
from applitools.selenium.fluent import FrameLocator, RegionBySelector
from EyesLibrary import TargetPathKeywords
from EyesLibrary.keywords.check_settings import CheckSettingsKeywords

WEB_ELEMENT = Mock(WebElement)


def run_keyword(name, *args):
    if name == "Ignore Region By Coordinates":
        return CheckSettingsKeywords(Mock()).ignore_region_by_coordinates(*args)
    if name == "Shadow By Selector":
        return TargetPathKeywords(Mock()).shadow_by_selector(*args)


@pytest.fixture
def patched_run_keyword(eyes_library_with_selenium):
    def run_keyword(name, *args):
        if name == "Ignore Region By Coordinates":
            return CheckSettingsKeywords(
                eyes_library_with_selenium
            ).ignore_region_by_coordinates(*args)
        if name == "Shadow By Selector":
            return TargetPathKeywords(eyes_library_with_selenium).shadow_by_selector(
                *args
            )
        if name == "Shadow By Element":
            return TargetPathKeywords(eyes_library_with_selenium).shadow_by_element(
                *args
            )
        if name == "Region By Selector":
            return TargetPathKeywords(eyes_library_with_selenium).region_by_selector(
                *args
            )
        if name == "Region By Element":
            return TargetPathKeywords(eyes_library_with_selenium).region_by_element(
                *args
            )
        raise Exception("Unknown keyword: `{}`".format(name))

    with mock.patch(
        "robot.libraries.BuiltIn.BuiltIn.run_keyword", side_effect=run_keyword
    ):
        yield


CheckSettingsData = namedtuple("CheckSettingsData", "params result")


@attr.s
class TestData(object):
    method = attr.ib(type=str)
    check_tag = attr.ib(default=None)
    check_values = attr.ib(default=None)
    check_region_result = attr.ib(default=None)

    check_settings_data = CheckSettingsData(
        params=["Ignore Region By Coordinates", "[34 34 34 34]"],
        result=[RegionByRectangle(Region(34, 34, 34, 34))],
    )

    __test__ = False  # avoid warnings in test frameworks

    @property
    def check_params(self):
        # type: () -> List
        result = []
        # order does matter here!
        if self.check_values:
            if isinstance(self.check_values, list):
                result.extend(self.check_values)
            else:
                result.append(self.check_values)
        if self.check_tag:
            result.append(self.check_tag)
        if self.check_settings_data.params:
            result.extend(self.check_settings_data.params)
        return result

    def __str__(self):
        return "{} {}".format(
            self.method, "with tag" if self.check_tag else "without tag"
        )


@pytest.mark.parametrize(
    "data",
    [
        TestData(
            "check_window",
        ),
        TestData("check_window", check_tag="Tag"),
    ],
    ids=lambda d: str(d),
)
def test_check_window(check_keyword, data, patched_run_keyword):
    call_method = getattr(check_keyword, data.method)
    call_method(*data.check_params)

    check_settings, tag = check_keyword.results[0]
    assert tag == data.check_tag
    assert check_settings.values.ignore_regions == data.check_settings_data.result


@pytest.mark.parametrize(
    "data",
    [
        TestData(
            "check_region_by_coordinates",
            check_values="[20 20 20 20]",
            check_region_result=Region(20, 20, 20, 20),
        ),
        TestData(
            "check_region_by_selector",
            check_values="id:overflow-div",
            check_region_result=RegionBySelector(By.ID, "overflow-div"),
        ),
        TestData("check_region_by_element", check_values=WEB_ELEMENT),
        TestData(
            "check_region_by_target_path",
            check_values=[
                "Shadow By Selector",
                "id:overflow-div",
                "Shadow By Element",
                WEB_ELEMENT,
                "Region By Selector",
                "id:overflow-div",
            ],
            check_region_result=TargetPath.shadow([By.ID, "overflow-div"])
            .shadow(WEB_ELEMENT)
            .region([By.ID, "overflow-div"]),
        ),
        TestData(
            "check_region_by_target_path",
            check_values=[
                "Shadow By Element",
                WEB_ELEMENT,
                "Region By Element",
                WEB_ELEMENT,
            ],
            check_region_result=TargetPath.shadow(WEB_ELEMENT).region(WEB_ELEMENT),
        ),
    ],
    ids=lambda d: str(d),
)
def test_check_region(check_keyword, data, patched_run_keyword):
    call_method = getattr(check_keyword, data.method)

    call_method(*data.check_params)

    check_settings, tag = check_keyword.results[0]
    assert tag == data.check_tag
    assert not check_settings.values.is_target_empty
    assert check_settings.values.ignore_regions == data.check_settings_data.result


@pytest.mark.parametrize(
    "data",
    [
        TestData(
            "check_frame_by_element",
            check_values=WEB_ELEMENT,
            check_region_result=FrameLocator(
                frame_locator=TargetPath.frame(WEB_ELEMENT)
            ),
        ),
        TestData(
            "check_frame_by_index",
            check_values=1,
            check_region_result=FrameLocator(frame_index=1),
        ),
        TestData(
            "check_frame_by_name",
            check_values="framename",
            check_region_result=FrameLocator(frame_name_or_id="framename"),
        ),
        TestData(
            "check_frame_by_selector",
            check_values="id:overflow-div",
            check_region_result=FrameLocator(
                frame_locator=TargetPath.frame(By.ID, "overflow-div")
            ),
        ),
    ],
    ids=lambda d: str(d),
)
def test_check_frame(check_keyword, data, patched_run_keyword):
    call_method = getattr(check_keyword, data.method)

    call_method(*data.check_params)

    check_settings, tag = check_keyword.results[0]
    assert tag == data.check_tag
    assert check_settings.values.frame_chain == [data.check_region_result]
    assert check_settings.values.ignore_regions == data.check_settings_data.result
