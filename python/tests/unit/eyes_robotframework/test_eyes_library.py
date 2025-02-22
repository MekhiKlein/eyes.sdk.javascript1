import contextlib
import os
import sys
from os.path import join
from typing import Callable, Text

import mock
import pytest
import yaml
from AppiumLibrary import AppiumLibrary
from SeleniumLibrary import SeleniumLibrary

from EyesLibrary import EyesLibrary, SelectedRunner
from EyesLibrary.utils import copy_config_to


def get_variable_value(path):
    # type: (Text) -> Callable[[Text], Text]
    copy_config_to(path)

    def func(name, *args):
        if name == "${SUITE_SOURCE}":
            return path

    return func


def get_library_instance(name):
    libs = {
        "SeleniumLibrary": mock.Mock(spec=SeleniumLibrary),
        "AppiumLibrary": mock.Mock(spec=AppiumLibrary),
    }
    return libs.get(name)


def get_context():
    return mock.Mock()


@contextlib.contextmanager
def eyes_lib_patcher(tmp_path):
    os.environ["APPLITOOLS_API_KEY"] = "key"
    with mock.patch(
        "robot.libraries.BuiltIn.BuiltIn.get_variable_value",
        side_effect=get_variable_value(str(tmp_path)),
    ), mock.patch(
        "robot.libraries.BuiltIn.BuiltIn.get_library_instance",
        side_effect=get_library_instance,
    ), mock.patch(
        "robot.libraries.BuiltIn.BuiltIn._get_context",
        side_effect=get_context,
    ):
        yield


def test_use_config_from_test_folder_if_no_config_path(tmp_path):
    with eyes_lib_patcher(tmp_path):
        lib = EyesLibrary()
    assert lib.selected_runner == SelectedRunner.web
    assert lib.config_path == "applitools.yaml"
    assert lib.configure


def test_parse_config_from_relative_folder(tmp_path):
    with eyes_lib_patcher(tmp_path):
        lib = EyesLibrary(config="applitools.yaml")
    assert lib.selected_runner == SelectedRunner.web
    assert lib.config_path == "applitools.yaml"
    assert lib.configure


def test_parse_config_from_absolute_folder(tmp_path):
    config_path = join(str(tmp_path), "applitools.yaml")
    with eyes_lib_patcher(tmp_path):
        lib = EyesLibrary(config=config_path)
    assert lib.selected_runner == SelectedRunner.web
    assert lib.config_path == config_path
    assert lib.configure


def test_parse_config_from_env_variable(tmp_path):
    os.environ["APPLITOOLS_CONFIG"] = "applitools.yaml"
    with eyes_lib_patcher(tmp_path):
        lib = EyesLibrary()
    assert lib.selected_runner == SelectedRunner.web
    assert lib.config_path == "applitools.yaml"
    assert lib.configure


@pytest.mark.parametrize(
    "runner",
    [
        SelectedRunner.web.value,
        SelectedRunner.web_ufg.value,
        SelectedRunner.mobile_native.value,
        SelectedRunner.native_mobile_grid.value,
    ],
)
@pytest.mark.skipif(sys.version_info[0] == 2, reason="requires python3+")
def test_parse_config_with_missing_runner_section(tmp_path, runner):
    config_path = join(str(tmp_path), "applitools.yaml")
    with eyes_lib_patcher(tmp_path):
        with open(config_path, "r") as f:
            raw_config = yaml.safe_load(f.read())

        with open(config_path, "w") as f:
            raw_config.pop(runner)
            yaml.dump(raw_config, f)
        with pytest.raises(KeyError):
            lib = EyesLibrary(config=config_path, runner=runner)


@pytest.mark.parametrize(
    "runner",
    [
        SelectedRunner.web_ufg.value,
        SelectedRunner.mobile_native.value,
        SelectedRunner.native_mobile_grid.value,
    ],
)
@pytest.mark.skipif(sys.version_info[0] == 2, reason="requires python3+")
def test_parse_config_with_missing_sections(tmp_path, runner):
    config_path = join(str(tmp_path), "applitools.yaml")
    with eyes_lib_patcher(tmp_path):
        with open(config_path, "r") as f:
            raw_config = yaml.safe_load(f.read())

        with open(config_path, "w") as f:
            raw_config.pop(runner)
            yaml.safe_dump(raw_config, f)
        lib = EyesLibrary(config=config_path)
