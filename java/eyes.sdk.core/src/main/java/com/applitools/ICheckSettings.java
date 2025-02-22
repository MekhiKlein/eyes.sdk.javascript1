package com.applitools;

import com.applitools.eyes.*;
import com.applitools.eyes.options.LayoutBreakpointsOptions;
import com.applitools.eyes.visualgrid.model.VisualGridOption;

/**
 * The interface of the match settings object.
 */
public interface ICheckSettings {
    /**
     * Adds one or more ignore regions.
     * @param region A region to ignore when validating the screenshot.
     * @param regions Optional extra regions to ignore when validating the screenshot.
     * @return An updated clone of this settings object.
     */
    ICheckSettings ignore(Region region, Region... regions);

    /**
     * Adds one or more ignore regions.
     * @param regions An array of regions to ignore when validating the screenshot.
     * @return An updated clone of this settings object.
     */
    ICheckSettings ignore(Region[] regions);

    /**
     * Adds one or more layout regions.
     * @param region A region to match using the Layout method.
     * @param regions Optional extra regions to match using the Layout method.
     * @return An updated clone of this settings object.
     */
    ICheckSettings layout(Region region, Region... regions);

    /**
     * Adds one or more layout regions.
     * @param regions An array of regions to match using the Layout method.
     * @return An updated clone of this settings object.
     */
    ICheckSettings layout(Region[] regions);

    /**
     * Adds one or more strict regions.
     * @param region A region to match using the Strict method.
     * @param regions Optional extra regions to match using the Strict method.
     * @return An updated clone of this settings object.
     */
    ICheckSettings strict(Region region, Region... regions);

    /**
     * Adds one or more strict regions.
     * @param regions An array of regions to match using the Strict method.
     * @return An updated clone of this settings object.
     */
    ICheckSettings strict(Region[] regions);

    /**
     * Adds one or more content regions.
     * @param region A region to match using the Content method.
     * @param regions Optional extra regions to match using the Content method.
     * @return An updated clone of this settings object.
     */
    ICheckSettings content(Region region, Region... regions);

    /**
     * Adds one or more content regions.
     * @param regions An array of regions to match using the Content method.
     * @return An updated clone of this settings object.
     */
    ICheckSettings content(Region[] regions);

    /**
     * Defines that the screenshot will contain the entire element or region, even if it's outside the view.
     * @return An updated clone of this settings object.
     */
    ICheckSettings fully();

    /**
     * Defines whether the screenshot will contain the entire element or region, even if it's outside the view.
     * @param fully defines whether the screenshot will contain the entire element or region.
     * @return An updated clone of this settings object.
     */
    ICheckSettings fully(Boolean fully);

    /**
     * Adds a floating region. A floating region is a a region that can be placed within the boundaries of a bigger region.
     * @param maxOffset How much each of the content rectangles can move in any direction.
     * @param regions One or more content rectangles.
     * @return An updated clone of this settings object.
     */
    ICheckSettings floating(int maxOffset, Region... regions);

    /**
     * Adds a floating region. A floating region is a a region that can be placed within the boundaries of a bigger region.
     * @param region The content rectangle.
     * @param maxUpOffset How much the content can move up.
     * @param maxDownOffset How much the content can move down.
     * @param maxLeftOffset How much the content can move to the left.
     * @param maxRightOffset How much the content can move to the right.
     * @return An updated clone of this settings object.
     */
    ICheckSettings floating(Region region, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset);

    /**
     * Defines the timeout to use when acquiring and comparing screenshots.
     * @param timeoutMilliseconds The timeout to use in milliseconds.
     * @return An updated clone of this settings object.
     */
    ICheckSettings timeout(Integer timeoutMilliseconds);

    /**
     * Shortcut to set the match level to {@code MatchLevel.LAYOUT}.
     * @return An updated clone of this settings object.
     */
    ICheckSettings layout();

    /**
     * Shortcut to set the match level to {@code MatchLevel.EXACT}.
     * @return An updated clone of this settings object.
     */
    ICheckSettings exact();

    /**
     * Shortcut to set the match level to {@code MatchLevel.STRICT}.
     * @return An updated clone of this settings object.
     */
    ICheckSettings strict();

    /**
     * Shortcut to set the match level to {@code MatchLevel.CONTENT}.
     * @return An updated clone of this settings object.
     */
    ICheckSettings content();

    /**
     * Set the match level by which to compare the screenshot.
     * @param matchLevel The match level to use.
     * @return An updated clone of this settings object.
     */
    ICheckSettings matchLevel(MatchLevel matchLevel);

    /**
     * Defines if to detect and ignore a blinking caret in the screenshot.
     * @param ignoreCaret Whether or not to detect and ignore a blinking caret in the screenshot.
     * @return An updated clone of this settings object.
     */
    ICheckSettings ignoreCaret(Boolean ignoreCaret);

    /**
     * Defines to ignore a blinking caret in the screenshot.
     * @return An updated clone of this settings object.
     */
    ICheckSettings ignoreCaret();

    /**
     * A setter for the checkpoint name.
     * @param name A name by which to identify the checkpoint.
     * @return An updated clone of this settings object.
     */
    ICheckSettings withName(String name);


    ICheckSettings useDom(Boolean useDom);

    ICheckSettings sendDom(Boolean sendDom);

    ICheckSettings sendDom();

    ICheckSettings enablePatterns(Boolean enablePatterns);

    ICheckSettings enablePatterns();

    ICheckSettings scriptHook(String scriptHook);

    ICheckSettings beforeRenderScreenshotHook(String scriptHook);

    ICheckSettings ignoreDisplacements(Boolean ignoreDisplacements);

    ICheckSettings ignoreDisplacements();

    ICheckSettings accessibility(Region region, AccessibilityRegionType regionType);

    ICheckSettings visualGridOptions(VisualGridOption... options);

    Boolean isCheckWindow();

    /**
     * waits before every screenshot capturing.
     * @param milliSec wait time.
     * @return An updated clone of this settings object.
     */
    ICheckSettings waitBeforeCapture(Integer milliSec);

    /**
     * to handle lazy load will scroll before capturing
     * @return An updated clone of this settings object.
     */
    ICheckSettings lazyLoad();

    /**
     * to handle lazy load will scroll before capturing
     * @param lazyLoadOptions lazy load options
     * @return An updated clone of this settings object.
     */
    ICheckSettings lazyLoad(LazyLoadOptions lazyLoadOptions);

    /**
     * sets the density metrics for the screenshot
     *
     * @param xDpi  the exact physical pixels per inch of the screen in the X dimension
     * @param yDpi  the exact physical pixels per inch of the screen in the Y dimension
     * @return @return An updated clone of this settings object
     */
    ICheckSettings densityMetrics(int xDpi, int yDpi);

    /**
     * sets the density metrics for the screenshot.
     *
     * @param xDpi  the exact physical pixels per inch of the screen in the X dimension
     * @param yDpi  the exact physical pixels per inch of the screen in the Y dimension
     * @param scaleRatio  the scale ratio
     * @return @return An updated clone of this settings object
     */
    ICheckSettings densityMetrics(int xDpi, int yDpi, Double scaleRatio);

    /**
     * sets layout breakpoints using options.
     *
     * @param layoutBreakpointsOptions  the layout breakpoints options
     * @return an updated clone of this settings object
     */
    ICheckSettings layoutBreakpoints(LayoutBreakpointsOptions layoutBreakpointsOptions);

    ICheckSettings layoutBreakpoints(Integer... breakpoints);

    ICheckSettings layoutBreakpoints(Boolean shouldSet);
}
