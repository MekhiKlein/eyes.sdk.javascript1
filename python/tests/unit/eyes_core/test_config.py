import pytest

from applitools.common import Configuration, MatchLevel, ProxySettings
from applitools.common.accessibility import (
    AccessibilityGuidelinesVersion,
    AccessibilityLevel,
    AccessibilitySettings,
)


@pytest.fixture
def config():
    return Configuration()


def test_set_get_values_present_in_image_match_settings(config):
    config.match_level = MatchLevel.LAYOUT
    assert config.match_level == MatchLevel.LAYOUT
    assert config.default_match_settings.match_level == MatchLevel.LAYOUT

    config.set_ignore_caret(True)
    assert config.ignore_caret
    assert config.default_match_settings.ignore_caret

    config.use_dom = True
    assert config.use_dom
    assert config.default_match_settings.use_dom

    config.enable_patterns = True
    assert config.enable_patterns
    assert config.default_match_settings.enable_patterns

    config.ignore_displacements = True
    assert config.ignore_displacements
    assert config.default_match_settings.ignore_displacements

    a_setting = AccessibilitySettings(
        AccessibilityLevel.AA, AccessibilityGuidelinesVersion.WCAG_2_1
    )
    assert config.accessibility_validation is None
    config.accessibility_validation = a_setting
    assert config.accessibility_validation == a_setting
    assert config.default_match_settings.accessibility_settings == a_setting


def test_set_get_proxy():
    PROXY_URL = "http://localhost:8888"

    config = Configuration()
    config.set_proxy(PROXY_URL)
    assert config.proxy.url == ProxySettings(PROXY_URL).url

    config = Configuration()
    config.set_proxy(ProxySettings(PROXY_URL))
    assert config.proxy.url == ProxySettings(PROXY_URL).url


def test_set_proxy_with_environment(monkeypatch):
    PROXY_URL = "http://localhost:8888"
    monkeypatch.setenv("APPLITOOLS_HTTP_PROXY", PROXY_URL)

    config = Configuration()
    assert config.proxy.url == ProxySettings(PROXY_URL).url
