from __future__ import absolute_import, unicode_literals

from typing import TYPE_CHECKING, Text

from appium.webdriver import WebElement as AppiumWebElement
from robot.api.deco import keyword as original_keyword
from selenium.webdriver.remote.webelement import WebElement as SeleniumWebElement

from applitools.common import AccessibilityRegionType, MatchLevel, VisualGridOption
from applitools.selenium.fluent import SeleniumCheckSettings

from ..base import LibraryComponent
from ..keywords_list import register_check_settings_keyword
from ..utils import (
    get_enum_by_upper_name,
    is_webelement_guard,
    parse_padding,
    parse_region,
)
from .keyword_tags import CHECK_SETTING, UFG_RELATED

if TYPE_CHECKING:
    from applitools.common.utils.custom_types import AnyWebElement

    from ..custom_types import Locator


def keyword(name=None, tags=(), types=()):
    """Keyword with predefined CHECK_SETTING tag"""
    register_check_settings_keyword(name)
    tags = tags + (CHECK_SETTING,)
    return original_keyword(name, tags, types)


class IgnoreCheckSettingsKeywords(LibraryComponent):
    @keyword("Ignore Region By Coordinates", types=(str,))
    def ignore_region_by_coordinates(
        self,
        region,  # type: Text
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object that ignores the region specified in the argument.

            | =Arguments=   | =Description=                                                       |
            | Region        | *Mandatory* - The region to ignore in format [left top width height] ,e.g. [100 200 300 300]  |

        *Example:*
            | Ignore Region By Coordinates           | [10 20 100 100]  |
        """
        return self.current_check_settings.ignore(parse_region(region))

    @keyword(
        "Ignore Region By Element",
        types={
            "element": (SeleniumWebElement, AppiumWebElement),
            "padding": str,
            "region_id": str,
        },
    )
    def ignore_region_by_element(
        self,
        element,  # type: AnyWebElement
        padding=None,  # type: str
        region_id=None,  # type: str
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object that ignores the region specified in the argument.

            | =Arguments=   | =Description=                                           |
            | Element       | *Mandatory* - The element to ignore                     |
            | padding       | Increase or decrease all or specified region dimensions |
            | region_id     | String identifier for the region used to match region in baseline and checkpoints. |

        *Example:*
            | ${element}=   | Get Webelement           | //*[@id="logo"]   |
            | ${target}=    | Ignore Region By Element | ${element}        | padding=20 | region_id=Ignored logo |
            | ${target}=    | Ignore Region By Element | ${element}        | padding=left:-10 top:20 right:30 bottom: 40 |
        """
        is_webelement_guard(element)
        return self.current_check_settings.ignore(
            element, padding=parse_padding(padding), region_id=region_id
        )

    @keyword("Ignore Region By Selector", types=(str, str, str))
    def ignore_region_by_selector(
        self,
        selector,  # type: Locator
        padding=None,  # type: str
        region_id=None,  # type: str
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object that ignores the region specified in the argument.

            | =Arguments=   | =Description=                                           |
            | Selector      | *Mandatory* - The selector for element to ignore. Selenium/Appium formats are supported. |
            | padding       | Increase or decrease all or specified region dimensions |
            | region_id     | String identifier for the region used to match region in baseline and checkpoints. |

        *Example:*
            | Ignore Region By Selector  | css:div |
            | Ignore Region By Selector  | css:div | padding=left: 10 |
        """
        return self.current_check_settings.ignore(
            *self.from_locators_to_supported_form(selector),
            padding=parse_padding(padding),
            region_id=region_id
        )


class LayoutCheckSettingsKeywords(LibraryComponent):
    @keyword("Layout Region By Coordinates", types=(str,))
    def layout_region_by_coordinates(
        self,
        region,  # type: Text
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with layout region specified in the argument.

            | =Arguments=   | =Description=                                                       |
            | Region        | *Mandatory* - The layout region in format [left top width height] ,e.g. [100 200 300 300]  |

        *Example:*
            | Leyout Region By Coordinates           | [10 20 100 100]  |
        """
        return self.current_check_settings.layout(parse_region(region))

    @keyword(
        "Layout Region By Element",
        types={
            "element": (SeleniumWebElement, AppiumWebElement),
            "padding": str,
            "region_id": str,
        },
    )
    def layout_region_by_element(
        self,
        element,  # type: AnyWebElement
        padding=None,  # type: str
        region_id=None,  # type: str
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with layout region specified in the argument.

            | =Arguments=   | =Description=                                               |
            | Element       | *Mandatory* - The element with layout region e.g. [100 200 300 300]  |
            | padding       | Increase or decrease all or specified region dimensions |
            | region_id     | String identifier for the region used to match region in baseline and checkpoints. |

        *Example:*
            | ${element}=   | Get Webelement           | //*[@id="logo"] |
            | ${target}=    | Layout Region By Element | ${element}      |
            | ${target}=    | Layout Region By Element | ${element}      | padding=10 | region_id=Layout Region |
        """
        is_webelement_guard(element)
        return self.current_check_settings.layout(
            element, padding=parse_padding(padding), region_id=region_id
        )

    @keyword("Layout Region By Selector", types=(str, str, str))
    def layout_region_by_selector(
        self,
        selector,  # type: Locator
        padding=None,  # type: str
        region_id=None,  # type: str
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with layout region specified in the argument.

            | =Arguments=   | =Description=                                               |
            | Selector      | *Mandatory* - The selector for element for layout region. Selenium/Appium formats are supported. |
            | padding       | Increase or decrease all or specified region dimensions |
            | region_id     | String identifier for the region used to match region in baseline and checkpoints. |

        *Example:*
            | Layout Region By Selector      | css:div         |
            | Layout Region By Selector      | css:div         | padding=top:10 | region_id=Layout region |
        """
        return self.current_check_settings.layout(
            *self.from_locators_to_supported_form(selector),
            padding=parse_padding(padding),
            region_id=region_id
        )


class ContentCheckSettingsKeywords(LibraryComponent):
    @keyword("Content Region By Coordinates", types=(str,))
    def content_region_by_coordinates(
        self,
        region,  # type: Text
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with content region specified in the argument.

            | =Arguments=   | =Description=                                                       |
            | Region        | *Mandatory* - The content region in format [left top width height] ,e.g. [100 200 300 300]  |

        *Example:*
            | Content Region By Coordinates           | [10 20 100 100]  |
        """
        return self.current_check_settings.content(parse_region(region))

    @keyword(
        "Content Region By Element",
        types={
            "element": (SeleniumWebElement, AppiumWebElement),
            "padding": str,
            "region_id": str,
        },
    )
    def content_region_by_element(
        self,
        element,  # type: AnyWebElement
        padding=None,  # type: str
        region_id=None,  # type: str
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with content region specified in the argument.

            | =Arguments=   | =Description=                                           |
            | Element       | *Mandatory* - The element to become content region      |
            | padding       | Increase or decrease all or specified region dimensions |
            | region_id     | String identifier for the region used to match region in baseline and checkpoints. |

        *Example:*
            | ${element}=   | Get Webelement             | //*[@id="logo"] |
            | ${target}=    | Content Region By Element  | ${element}      |
            | ${target}=    | Content Region By Element  | ${element}      | region_id=Logo |
        """
        is_webelement_guard(element)
        return self.current_check_settings.content(
            element, padding=parse_padding(padding), region_id=region_id
        )

    @keyword("Content Region By Selector", types=(str, str, str))
    def content_region_by_selector(
        self,
        selector,  # type: Locator
        padding=None,  # type: str
        region_id=None,  # type: str
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with content region specified in the argument.

            | =Arguments=   | =Description=                                               |
            | Selector      | *Mandatory* - The selector for element for content region. Selenium/Appium formats are supported. |
            | padding       | Increase or decrease all or specified region dimensions |
            | region_id     | String identifier for the region used to match region in baseline and checkpoints. |

        *Example:*
            | Content Region By Selector      | css:div         |
            | Content Region By Selector      | css:div         | padding=right: 20 |
        """
        return self.current_check_settings.content(
            *self.from_locators_to_supported_form(selector),
            padding=parse_padding(padding),
            region_id=region_id
        )


class StrictCheckSettingsKeywords(LibraryComponent):
    @keyword("Strict Region By Coordinates", types=(str,))
    def strict_region_by_coordinates(
        self,
        region,  # type: Text
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with content region specified in the argument.

            | =Arguments=   | =Description=                                                       |
            | Region        | *Mandatory* - The strict region in format [left top width height] ,e.g. [100 200 300 300]  |

        *Example:*
            | Strict Region By Coordinates           | [10 20 100 100]  |
        """
        return self.current_check_settings.strict(parse_region(region))

    @keyword(
        "Strict Region By Element",
        types={
            "element": (SeleniumWebElement, AppiumWebElement),
            "padding": str,
            "region_id": str,
        },
    )
    def strict_region_by_element(
        self,
        element,  # type: AnyWebElement
        padding=None,  # type: str
        region_id=None,  # type: str
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with strict region specified in the argument.

            | =Arguments=   | =Description=                                           |
            | Element       | *Mandatory* - The element to become strict region       |
            | padding       | Increase or decrease all or specified region dimensions |
            | region_id     | String identifier for the region used to match region in baseline and checkpoints. |

        *Example:*
            | ${element}=   | Get Webelement                | //*[@id="logo"]   |
            | ${target}=    | Strict Region By Element      | ${element}        |
            | ${target}=    | Strict Region By Element      | ${element}        | region_id=Logo
        """
        is_webelement_guard(element)
        return self.current_check_settings.strict(
            element, padding=parse_padding(padding), region_id=region_id
        )

    @keyword("Strict Region By Selector", types=(str, str, str))
    def strict_region_by_selector(
        self,
        selector,  # type: Locator
        padding=None,  # type: str
        region_id=None,  # type: str
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with strict region specified in the argument.

            | =Arguments=   | =Description=                                               |
            | Selector      | *Mandatory* - The selector for element for strict region. Selenium/Appium formats are supported. |
            | padding       | Increase or decrease all or specified region dimensions |
            | region_id     | String identifier for the region used to match region in baseline and checkpoints. |

        *Example:*
            | Eyes Check                         |          |
            | ...  Strict Region By Selector     | css:div  |
            | ...  Strict Region By Selector     | css:div  | padding=5 | region_id=A strict region |
        """
        return self.current_check_settings.strict(
            *self.from_locators_to_supported_form(selector),
            padding=parse_padding(padding),
            region_id=region_id
        )


class FloatingCheckSettingsKeywords(LibraryComponent):
    @keyword(
        "Floating Region With Max Offset By Coordinates",
        types=(int, str),
    )
    def floating_region_with_max_offset_by_coordinates(
        self,
        max_offset,  # type: int
        region,  # type: Text
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with floating region specified in the arguments.

            | =Arguments=  | =Description=                                                                                                 |
            | Max Offset   | *Mandatory* - The maximum amount that the region can shift in any direction and still be considered matching. |
            | Region       | *Mandatory* - The floating region e.g. [100 200 300 300]                                                       |

        *Example:*
            | Eyes Check                                            |     |                   |
            | ...   Floating Region With Max Offset By Coordinates  |  5  |  [10 20 100 100]  |
        """
        return self.current_check_settings.floating(max_offset, parse_region(region))

    @keyword(
        "Floating Region With Max Offset By Element",
        types={"max_offset": int, "element": (SeleniumWebElement, AppiumWebElement)},
    )
    def floating_region_with_max_offset_by_element(
        self,
        max_offset,  # type: int
        element,  # type: AnyWebElement
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with floating region specified in the arguments.

            | =Arguments=  | =Description=                                                                                                 |
            | Max Offset   | *Mandatory* - The maximum amount that the region can shift in any direction and still be considered matching. |
            | Element       | *Mandatory* - The element to become floating region

        *Example:*
            | ${element}=   | Get Webelement                        |  //*[@id="logo"]  |              |
            | Eyes Check                                            |                   |              |
            | ...   Floating Region With Max Offset By Element      |       5           |  ${element}  |
        """
        is_webelement_guard(element)
        return self.current_check_settings.floating(max_offset, element)

    @keyword(
        "Floating Region With Max Offset By Selector",
        types=(str, str),
    )
    def floating_region_with_max_offset_by_selector(
        self,
        max_offset,  # type: int
        selector,  # type: Locator
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with floating region specified in the arguments.

            | =Arguments=  | =Description=                                                                                                 |
            | Max Offset   | *Mandatory* - The maximum amount that the region can shift in any direction and still be considered matching. |
            | Selector     | *Mandatory* - The selector to become floating region e.g. //*[@id="logo"]                                     |

        *Example:*
            | Eyes Check                                            |                   |                    |
            | ...   Floating Region With Max Offset By Selector     |       5           |  //*[@id="logo"]   |
        """
        return self.current_check_settings.floating(
            max_offset, self.from_locator_to_supported_form(selector)
        )

    @keyword(
        "Floating Region By Coordinates",
        types=(str, int, int, int, int),
    )
    def floating_region_by_coordinates(
        self,
        region,  # type: Text
        max_up_offset=0,  # type: int
        max_down_offset=0,  # type: int
        max_left_offset=0,  # type: int
        max_right_offset=0,  # type: int
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with floating region specified in the arguments.

            | =Arguments=       | =Description=                                                                                              |
            | Region            | *Mandatory* - The floating region e.g. [100 200 300 300]                                                        |
            | Max Up Offset     | The maximum amount that the region can shift upwards and still be considered matching.       |
            | Max Down Offset   | The maximum amount that the region can shift downwards and still be considered matching.     |
            | Max Left Offset   | The maximum amount that the region can shift to the left and still be considered matching.   |
            | Max Right Offset  | The maximum amount that the region can shift to the right and still be considered matching.  |

        *Example:*
            | Eyes Check Window                       |                   |     |     |    |     |
            | ...     Floating Region By Coordinates  |  [10 20 100 100]  |  5  |  5  | 5  |  5  |
            | ...     Floating Region By Coordinates  |  [10 20 100 100]  |  max_right_offset=5  |   |   |    |
        """
        return self.current_check_settings.floating(
            parse_region(region),
            max_up_offset,
            max_down_offset,
            max_left_offset,
            max_right_offset,
        )

    @keyword(
        "Floating Region By Element",
        types={
            "element": (SeleniumWebElement, AppiumWebElement),
            "max_up_offset": int,
            "max_down_offset": int,
            "max_left_offset": int,
            "max_right_offset": int,
        },
    )
    def floating_region_by_element(
        self,
        element,  # type: AnyWebElement
        max_up_offset=0,  # type: int
        max_down_offset=0,  # type: int
        max_left_offset=0,  # type: int
        max_right_offset=0,  # type: int
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with floating region specified in the arguments.

            | =Arguments=      | =Description=                                                                                                       |
            | Element          | *Mandatory* - The WebElement to set as float region.                                                  |
            | Max Up Offset    | The maximum amount that the region can shift upwards and still be considered matching.             |
            | Max Down Offset  | The maximum amount that the region can shift downwards and still be considered matching.         |
            | Max Left Offset  | The maximum amount that the region can shift to the left and still be considered matching.       |
            | Max Right Offset | The maximum amount that the region can shift to the right and still be considered matching.     |

        *Example:*
            | ${element}=                           |  Get Webelement  |  //*[@id="logo"]  |  |  |  |
            | Eyes Check Window                     |               |     |     |     |     |
            | ...   Floating Region By Element      |  ${element}   |  5  |  5  |  5  |  5  |
            | ...   Floating Region By Element      |  ${element}   |  max_left_offset=5 |   |   |    |

        """
        is_webelement_guard(element)
        return self.current_check_settings.floating(
            element,
            max_up_offset,
            max_down_offset,
            max_left_offset,
            max_right_offset,
        )

    @keyword(
        "Floating Region By Selector",
        types=(str, int, int, int, int),
    )
    def floating_region_by_selector(
        self,
        selector,  # type: Text
        max_up_offset=0,  # type: int
        max_down_offset=0,  # type: int
        max_left_offset=0,  # type: int
        max_right_offset=0,  # type: int
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with floating region specified in the arguments.

            | =Arguments=       | =Description=                                                                                |
            | Selector          | The selector to become floating region e.g. //*[@id="logo"]                                  |
            | Max Up Offset     | The maximum amount that the region can shift upwards and still be considered matching.       |
            | Max Down Offset   | The maximum amount that the region can shift downwards and still be considered matching.     |
            | Max Left Offset   | The maximum amount that the region can shift to the left and still be considered matching.   |
            | Max Right Offset  | The maximum amount that the region can shift to the right and still be considered matching.  |

        *Example:*
            | Eyes Check Window                       |                  |     |     |     |      |
            | ...     Floating Region By Selector     |  //*[@id="logo"] |  5  |  5  |  5  |  5   |
            | ...     Floating Region By Selector     |  //*[@id="logo"] |  max_left_offset=5 |   |   |    |
        """
        return self.current_check_settings.floating(
            self.from_locator_to_supported_form(selector),
            max_up_offset,
            max_down_offset,
            max_left_offset,
            max_right_offset,
        )


class AccessibilityCheckSettingsKeywords(LibraryComponent):
    @keyword("Accessibility Region By Selector", types=(str, str))
    def accessibility_region_by_selector(
        self,
        selector,  # type: Text
        type,  # type: AccessibilityRegionType
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with accessibility region specified in the arguments.

            | =Arguments=   |   =Description=                                          |
            | Selector      |  *Mandatory* - The selector for element for accessibility region. Selenium/Appium formats are supported. |
            | Type          | *Mandatory* - Type of AccessibilityRegion. (`IgnoreContrast`, `RegularText`, `LargeText`, `BoldText`, `GraphicalObject`)    |

        *Example:*
            | Eyes Check                                |              |                  |
            | ...     Accessibility Region By Selector  |  //selector  |  GraphicalObject |
        """
        return self.current_check_settings.accessibility(
            *self.from_locators_to_supported_form(selector),
            type=AccessibilityRegionType(type)
        )

    @keyword(
        "Accessibility Region By Element",
        types={"element": (SeleniumWebElement, AppiumWebElement), "type": str},
    )
    def accessibility_region_by_element(
        self,
        element,  # type: Text
        type,  # type: AccessibilityRegionType
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with accessibility region specified in the arguments.

            | =Arguments=      | =Description=                                                            |
            | Element          | *Mandatory* - The accessibility region e.g. [100 200 300 300]                                                             |
            | Type             | *Mandatory* - Type of AccessibilityRegion. (`IgnoreContrast`, `RegularText`, `LargeText`, `BoldText`, `GraphicalObject`)  |

        *Example:*
            | Eyes Check                                   |              |                   |
            | ...     Accessibility Region By Coordinates  |  ${element}  |  GraphicalObject  |
        """
        is_webelement_guard(element)
        return self.current_check_settings.accessibility(
            element, type=AccessibilityRegionType(type)
        )

    @keyword("Accessibility Region By Coordinates", types=(str, str))
    def accessibility_region_by_coordinates(
        self,
        region,  # type: Text
        type,  # type: AccessibilityRegionType
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with accessibility region specified in the arguments.

            | =Arguments=      | =Description=                                                            |
            | Region           | *Mandatory* - The accessibility region e.g. [100 200 300 300]                                                        |
            | Type             | *Mandatory* - Type of AccessibilityRegion. (`IgnoreContrast`, `RegularText`, `LargeText`, `BoldText`, `GraphicalObject`)    |

        *Example:*
            | Eyes Check                                   |                 |                   |
            | ...     Accessibility Region By Coordinates  |  [10 20 30 40]  |  GraphicalObject  |
        """
        return self.current_check_settings.accessibility(
            region=parse_region(region), type=AccessibilityRegionType(type)
        )


class UFGCheckSettingsKeywords(LibraryComponent):
    @keyword("Visual Grid Option", types=(str, str), tags=(UFG_RELATED,))
    def visual_grid_option(
        self,
        name,  # type: Text
        value,  # type: Text
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with VisualGridOption specified in the arguments.

            | =Arguments=   | =Description=                              |                                                           |
            | name          | *Mandatory* - The VisualGridOption name.   |                                                     |                                                         |
            | value         | *Mandatory* - The VisualGridOption value.  |

        *Example:*
            | Eyes Check                  |
            | ...     Visual Grid Option  |  key name     value   |
            | ...     Visual Grid Option  |  key name2    value   |
        """
        return self.current_check_settings.visual_grid_options(
            VisualGridOption(name, value)
        )

    @keyword("Disable Browser Fetching", tags=(UFG_RELATED,))
    def disable_browser_fetching(
        self,
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with disable_browser_fetching specified in the arguments.

        *Example:*
            | Eyes Check                        |           |
            | ...     Disable Browser Fetching  |           |
        """
        return self.current_check_settings.disable_browser_fetching(True)

    @keyword("Enable Layout Breakpoints", tags=(UFG_RELATED,))
    def enable_layout_breakpoints(
        self,
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with enabled layout_breakpoints specified in the arguments.

        *Example:*
            | Eyes Check                         |          |
            | ...     Enable Layout Breakpoints  |          |
        """
        return self.current_check_settings.layout_breakpoints(True)

    @keyword("Layout Breakpoints", types=(str, bool), tags=(UFG_RELATED,))
    def layout_breakpoints(
        self,
        breakpoints,  # type:str
        reload=None,  # type: bool
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object specified layout_breakpoints in the arguments.

            | =Arguments=     | =Description=                             |
            | breakpoints     | Specify layout breakpoint, e.g. 25 56 89  |

        *Example:*
            | Eyes Check  |  Target Window  |  Layout Breakpoints  |  23 45 67 89 |

        """
        breakpoints = [int(b) for b in breakpoints.split(" ")]
        return self.current_check_settings.layout_breakpoints(
            *breakpoints, reload=reload
        )

    @keyword("Before Render Screenshot Hook", types=(str,), tags=(UFG_RELATED,))
    def before_render_screenshot_hook(
        self,
        hook,  # type:str
    ):
        # type: (...)->SeleniumCheckSettings
        return self.current_check_settings.before_render_screenshot_hook(hook)


class CheckSettingsKeywords(
    IgnoreCheckSettingsKeywords,
    LayoutCheckSettingsKeywords,
    ContentCheckSettingsKeywords,
    StrictCheckSettingsKeywords,
    FloatingCheckSettingsKeywords,
    AccessibilityCheckSettingsKeywords,
    UFGCheckSettingsKeywords,
):
    @keyword("Scroll Root Element By Selector", types=(str,))
    def scroll_root_element_by_selector(
        self,
        selector,  # type: Locator
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with selected Scroll Root Element by selector

            |  =Arguments=  | =Description=                                          |
            | Selector       | *Mandatory* - The selector of scroll root element     |

        *Example:*
            |  Scroll Root Element By Element  |  ${element}  |
        """
        return self.current_check_settings.scroll_root_element(
            self.from_locator_to_supported_form(selector)
        )

    @keyword(
        "Scroll Root Element By Element",
        types={"element": (SeleniumWebElement, AppiumWebElement)},
    )
    def scroll_root_element_by_element(
        self,
        element,  # type: Locator
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object with selected Scroll Root Element

            |  =Arguments=  | =Description=                                          |
            | Element       | *Mandatory* - The scroll root element                  |

        *Example:*
            |  Scroll Root Element By Element  |  ${element}  |
        """
        is_webelement_guard(element)
        return self.current_check_settings.scroll_root_element(element)

    @keyword("Variation Group Id", types=(str,))
    def variation_group_id(
        self,
        variation_group_id,  # type: Text
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object specified variant group id.

            | =Arguments=  | =Description=                                                      |
            | variation_group_id  | will be associated with all of the test result steps that result from executing this checkpoint |

        *Example:*
            | Eyes Check   |  Target Window  |  Variation Group Id  |  variation1 |
        """
        return self.current_check_settings.variation_group_id(variation_group_id)

    @keyword("Match Level", types=(str,))
    def match_level(
        self,
        match_level,  # type: Text
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object specified match level.

            | =Arguments=  | =Description=                                                      |
            | match_level  | Specify the match level that should be used for the target area (NONE LAYOUT CONTENT STRICT EXACT) |

        *Example:*
            | Eyes Check   |  Target Window  |  Match Level  STRICT |
        """
        match_level = get_enum_by_upper_name(match_level, MatchLevel)
        return self.current_check_settings.match_level(match_level)

    @keyword("Enable Patterns")
    def enable_patterns(
        self,
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object specified enable patterns.

        *Example:*
            | Eyes Check   |  Target Window  |  Enable Patterns  |
        """
        return self.current_check_settings.enable_patterns(True)

    @keyword("Ignore Displacements")
    def ignore_displacements(
        self,
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object specified ignore displacements.

        *Example:*
            | Eyes Check   |  Target Window  |  Ignore Displacements |
        """
        return self.current_check_settings.ignore_displacements(True)

    @keyword("Ignore Caret")
    def ignore_caret(
        self,
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object specified ignore caret.

        *Example:*
            | Eyes Check   |  Target Window  |  Ignore Caret |
        """
        return self.current_check_settings.ignore_caret(True)

    @keyword("Fully")
    def fully(
        self,
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object specified fully.

        *Example:*
            | Eyes Check   |  Target Window  |  Fully |
        """
        return self.current_check_settings.fully(True)

    @keyword("With Name", types=(str,))
    def with_name(
        self,
        name,  # type: Text
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object specified tag from argument.

            | =Arguments=  | =Description=                                                                |
            | name         | Specifies a tag for this target (instead of a parameter to the Eyes Check )  |

        *Example:*
            | Eyes Check         |    Target Window        |
            | ...     With Name  |   User Check Step name  |
        """
        return self.current_check_settings.with_name(name)

    @keyword("Timeout", types=(int,))
    def timeout(
        self,
        timeout,  # type: int
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object specified maximum amount of time that Eyes should retry capturing the window content if there are mismatches.

            | =Arguments=  | =Description=                                       |
            | timeout      | Specify timeout in milliseconds, e.g. 1000 (1 sec)  |

        *Example:*
            | Eyes Check         |    Target Window    |
            | ...     Timeout    |   3000              |
        """
        return self.current_check_settings.timeout(timeout)

    @keyword("Use Dom")
    def use_dom(
        self,
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object specified use dom.

        *Example:*
            | Eyes Check   |    Target Window    |  Use Dom   |
        """
        return self.current_check_settings.use_dom(True)

    @keyword("Send Dom")
    def send_dom(
        self,
    ):
        # type: (...)->SeleniumCheckSettings
        """
        Returns a CheckSettings object specified send dom.

        *Example:*
            | Eyes Check   |    Target Window    |  Send Dom   |
        """
        return self.current_check_settings.send_dom(True)
