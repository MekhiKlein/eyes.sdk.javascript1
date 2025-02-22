﻿using Applitools.VisualGrid;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Drawing;

using Region = Applitools.Utils.Geometry.Region;

namespace Applitools.Selenium.Fluent
{
    public class SeleniumCheckSettings : CheckSettings, ISeleniumCheckTarget
    {
        private By targetSelector_;
        private IWebElement targetElement_;
        private readonly List<FrameLocator> frameChain_ = new List<FrameLocator>();
        private By scrollRootSelector_;
        private IWebElement scrollRootElement_;
        private VisualGridSelector vgTargetSelector_;
        private TargetPathLocator targetLocator_;
        private bool? useCookies_;

        internal SeleniumCheckSettings()
        {
        }

        internal SeleniumCheckSettings(By targetSelector)
        {
            targetSelector_ = targetSelector;
            fluentCode_.Clear();
            fluentCode_.Append($"Target.Region({targetSelector})");
        }
        
        internal SeleniumCheckSettings(TargetPathLocator targetLocator)
        {
            targetLocator_ = targetLocator;
            fluentCode_.Clear();
            fluentCode_.Append($"Target.Region({targetLocator})");
        }
        
        internal SeleniumCheckSettings(IWebElement targetElement)
        {
            targetElement_ = targetElement;
            fluentCode_.Clear();
            fluentCode_.Append($"Target.Region({targetElement})");
        }

        internal SeleniumCheckSettings(Rectangle region)
            : base(region)
        {
        }

        By ITargetContainer.GetTargetSelector()
        {
            return targetSelector_;
        }
        
        TargetPathLocator ITargetContainer.GetTargetLocator()
        {
            return targetLocator_;
        }

        IWebElement ITargetContainer.GetTargetElement()
        {
            return targetElement_;
        }

        IList<FrameLocator> ISeleniumCheckTarget.GetFrameChain()
        {
            return frameChain_;
        }

        CheckState ISeleniumCheckTarget.State { get; set; }

        By IScrollRootElementContainer.GetScrollRootSelector()
        {
            return scrollRootSelector_;
        }

        IWebElement IScrollRootElementContainer.GetScrollRootElement()
        {
            return scrollRootElement_;
        }

        public SeleniumCheckSettings Frame(By by)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.frameChain_.Add(new FrameLocator() { FrameSelector = by });
            clone.fluentCode_.Append($".Frame({by})");
            return clone;
        }

        public SeleniumCheckSettings Frame(string frameNameOrId)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.frameChain_.Add(new FrameLocator() { FrameNameOrId = frameNameOrId });
            clone.fluentCode_.Append($".Frame(\"{frameNameOrId}\")");
            return clone;
        }

        public SeleniumCheckSettings Frame(int index)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.frameChain_.Add(new FrameLocator() { FrameIndex = index });
            clone.fluentCode_.Append($".Frame({index})");
            return clone;
        }

        public SeleniumCheckSettings Frame(IWebElement frameReference)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.frameChain_.Add(new FrameLocator() { FrameReference = frameReference });
            clone.fluentCode_.Append($".Frame({frameReference})");
            return clone;
        }
        
        public SeleniumCheckSettings Region(Rectangle rect)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.UpdateTargetRegion(rect);
            clone.fluentCode_.Append($".Region(new Rectangle({rect.X},{rect.Y},{rect.Width},{rect.Height}))");
            return clone;
        }

        public SeleniumCheckSettings Region(Region region)
        {
            SeleniumCheckSettings clone = Clone_();
            Rectangle rect = region.ToRectangle();
            clone.UpdateTargetRegion(rect);
            clone.fluentCode_.Append($".Region(new Rectangle({rect.X},{rect.Y},{rect.Width},{rect.Height}))");
            return clone;
        }
        
        public SeleniumCheckSettings Region(By by)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.targetSelector_ = by;
            clone.fluentCode_.Append($".Region({by})");
            return clone;
        }

        public SeleniumCheckSettings Region(IWebElement targetElement)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.targetElement_ = targetElement;
            clone.fluentCode_.Append($".Region({targetElement})");
            return clone;
        }

        /// <summary>
        /// Adds one ignore region.
        /// </summary>
        /// <param name="selector">A selector representing a region to ignore when validating the screenshot.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Ignore(By selector, Padding padding = null, string regionId = null)
        {
            var list = new List<By> { selector };
            return Ignore(list, padding, regionId);
        }

        /// <summary>
        /// Adds one or more ignore regions.
        /// </summary>
        /// <param name="selector">A selector representing a region to ignore when validating the screenshot.</param>
        /// <param name="selectors">One or more selectors representing regions to ignore when validating the screenshot.</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Ignore(By selector, params By[] selectors)
        {
            var list = new List<By> { selector };
            list.AddRange(selectors);
            return Ignore(list);
        }

        /// <summary>
        /// Adds one or more ignore regions.
        /// </summary>
        /// <param name="selectors">An enumerable of selectors representing regions to ignore when validating the screenshot.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Ignore(IEnumerable<By> selectors, Padding padding = null, string regionId = null)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(Ignore)}(");
            foreach (By sel in selectors)
            {
                clone.Ignore_(new SimpleRegionBySelector(sel, padding, regionId));
                clone.fluentCode_.Append($", {sel}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }

        /// <summary>
        /// Adds one ignore region.
        /// </summary>
        /// <param name="element">An element to ignore when validating the screenshot.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Ignore(IWebElement element, Padding padding = null, string regionId = null)
        {
            var list = new List<IWebElement> { element };
            return Ignore(list, padding, regionId);
        }

        /// <summary>
        /// Adds one or more ignore regions.
        /// </summary>
        /// <param name="element">An element to ignore when validating the screenshot.</param>
        /// <param name="elements">One or more elements to ignore when validating the screenshot.</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Ignore(IWebElement element, params IWebElement[] elements)
        {
            var list = new List<IWebElement> { element };
            list.AddRange(elements);
            return Ignore(list);
        }

        /// <summary>
        /// Adds one or more ignore regions.
        /// </summary>
        /// <param name="elements">An enumerable of elements to ignore when validating the screenshot.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Ignore(IEnumerable<IWebElement> elements, Padding padding = null, string regionId = null)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(Ignore)}(");
            foreach (IWebElement elem in elements)
            {
                clone.Ignore_(new SimpleRegionByElement(elem, padding, regionId));
                clone.fluentCode_.Append($", {elem}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }

        /// <summary>
        /// Adds one layout region.
        /// </summary>
        /// <param name="selector">A selector representing a layout region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Layout(By selector, Padding padding = null, string regionId = null)
        {
            var list = new List<By> { selector };
            return Layout(list, padding, regionId);
        }

        /// <summary>
        /// Adds one or more layout regions.
        /// </summary>
        /// <param name="selector">A selector representing a layout region.</param>
        /// <param name="selectors">One or more selectors representing layout regions.</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Layout(By selector, params By[] selectors)
        {
            var list = new List<By> { selector };
            list.AddRange(selectors);
            return Layout(list);
        }

        /// <summary>
        /// Adds one or more layout regions.
        /// </summary>
        /// <param name="selectors">An enumerable of selectors representing layout regions.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Layout(IEnumerable<By> selectors, Padding padding = null, string regionId = null)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(Layout)}(");
            foreach (By sel in selectors)
            {
                clone.Layout_(new SimpleRegionBySelector(sel, padding, regionId));
                clone.fluentCode_.Append($", {sel}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }

        /// <summary>
        /// Adds one layout region.
        /// </summary>
        /// <param name="element">An element representing a layout region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Layout(IWebElement element, Padding padding = null, string regionId = null)
        {
            var list = new List<IWebElement> { element };
            return Layout(list, padding, regionId);
        }

        /// <summary>
        /// Adds one or more layout regions.
        /// </summary>
        /// <param name="element">An element representing a layout region.</param>
        /// <param name="elements">One or more elements, each representing a layout region.</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Layout(IWebElement element, params IWebElement[] elements)
        {
            var list = new List<IWebElement> { element };
            list.AddRange(elements);
            return Layout(list);
        }

        /// <summary>
        /// Adds one or more layout regions.
        /// </summary>
        /// <param name="elements">An enumerable of elements, each representing a layout region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Layout(IEnumerable<IWebElement> elements, Padding padding = null, string regionId = null)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(Layout)}(");
            foreach (IWebElement elem in elements)
            {
                clone.Layout_(new SimpleRegionByElement(elem, padding, regionId));
                clone.fluentCode_.Append($", {elem}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }

        /// <summary>
        /// Adds one strict region.
        /// </summary>
        /// <param name="selector">A selector representing a strict region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Strict(By selector, Padding padding = null, string regionId = null)
        {
            var list = new List<By> { selector };
            return Strict(list, padding, regionId);
        }

        /// <summary>
        /// Adds one or more strict regions.
        /// </summary>
        /// <param name="selector">A selector representing a strict region.</param>
        /// <param name="selectors">One or more selectors representing strict regions.</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Strict(By selector, params By[] selectors)
        {
            var list = new List<By> { selector };
            list.AddRange(selectors);
            return Strict(list);
        }

        /// <summary>
        /// Adds one or more strict regions.
        /// </summary>
        /// <param name="selectors">An enumerable of selectors representing strict regions.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Strict(IEnumerable<By> selectors, Padding padding = null, string regionId = null)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(Strict)}(");
            foreach (By sel in selectors)
            {
                clone.Strict_(new SimpleRegionBySelector(sel, padding, regionId));
                clone.fluentCode_.Append($", {sel}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }

        /// <summary>
        /// Adds one strict region.
        /// </summary>
        /// <param name="element">An element representing a strict region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Strict(IWebElement element, Padding padding = null, string regionId = null)
        {
            var list = new List<IWebElement> { element };
            return Strict(list, padding, regionId);
        }

        /// <summary>
        /// Adds one or more strict regions.
        /// </summary>
        /// <param name="element">An element representing a strict region.</param>
        /// <param name="elements">One or more elements, each representing a strict region.</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Strict(IWebElement element, params IWebElement[] elements)
        {
            var list = new List<IWebElement> { element };
            list.AddRange(elements);
            return Strict(list);
        }

        /// <summary>
        /// Adds one or more strict regions.
        /// </summary>
        /// <param name="elements">An enumerable of elements, each representing a strict region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings Strict(IEnumerable<IWebElement> elements, Padding padding = null, string regionId = null)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(Strict)}(");
            foreach (IWebElement elem in elements)
            {
                clone.Strict_(new SimpleRegionByElement(elem, padding, regionId));
                clone.fluentCode_.Append($", {elem}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }

        /// <summary>
        /// Adds one content region.
        /// </summary>
        /// <param name="selector">A selector representing a content region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        [Obsolete("Use IgnoreColors")]
        public SeleniumCheckSettings Content(By selector, Padding padding = null, string regionId = null)
        {
            var list = new List<By> { selector };
            return Content(list, padding, regionId);
        }
        
        /// <summary>
        /// Adds one content region.
        /// </summary>
        /// <param name="selector">A selector representing a content region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        [Obsolete("Use IgnoreColors")]
        public SeleniumCheckSettings IgnoreColors(By selector, Padding padding = null, string regionId = null)
        {
            var list = new List<By> { selector };
            return IgnoreColors(list, padding, regionId);
        }
        
        /// <summary>
        /// Adds one or more content regions.
        /// </summary>
        /// <param name="selector">A selector representing a content region.</param>
        /// <param name="selectors">One or more selectors representing content regions.</param>
        /// <returns>An updated clone of this settings object.</returns>
        [Obsolete("Use IgnoreColors")]
        public SeleniumCheckSettings Content(By selector, params By[] selectors)
        {
            var list = new List<By> { selector };
            list.AddRange(selectors);
            return Content(list);
        }
   
        /// <summary>
        /// Adds one or more content regions.
        /// </summary>
        /// <param name="selector">A selector representing a content region.</param>
        /// <param name="selectors">One or more selectors representing content regions.</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings IgnoreColors(By selector, params By[] selectors)
        {
            var list = new List<By> { selector };
            list.AddRange(selectors);
            return IgnoreColors(list);
        }

        /// <summary>
        /// Adds one or more content regions.
        /// </summary>
        /// <param name="selectors">An enumerable of selectors representing content regions.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        [Obsolete("Use IgnoreColors")]
        public SeleniumCheckSettings Content(IEnumerable<By> selectors, Padding padding = null, string regionId = null)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(Content)}(");
            foreach (By sel in selectors)
            {
                clone.Content_(new SimpleRegionBySelector(sel, padding, regionId));
                clone.fluentCode_.Append($", {sel}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }

        /// <summary>
        /// Adds one or more content regions.
        /// </summary>
        /// <param name="selectors">An enumerable of selectors representing content regions.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings IgnoreColors(IEnumerable<By> selectors, Padding padding = null, string regionId = null)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(IgnoreColors)}(");
            foreach (By sel in selectors)
            {
                clone.Content_(new SimpleRegionBySelector(sel, padding, regionId));
                clone.fluentCode_.Append($", {sel}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }

        /// <summary>
        /// Adds one content region.
        /// </summary>
        /// <param name="element">An element representing a content region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        [Obsolete("Use IgnoreColors")]
        public SeleniumCheckSettings Content(IWebElement element, Padding padding = null, string regionId = null)
        {
            var list = new List<IWebElement> { element };
            return Content(list, padding, regionId);
        }

        /// <summary>
        /// Adds one content region.
        /// </summary>
        /// <param name="element">An element representing a content region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings IgnoreColors(IWebElement element, Padding padding = null, string regionId = null)
        {
            var list = new List<IWebElement> { element };
            return IgnoreColors(list, padding, regionId);
        }

        /// <summary>
        /// Adds one or more content regions.
        /// </summary>
        /// <param name="element">An element representing a content region.</param>
        /// <param name="elements">One or more elements, each representing a content region.</param>
        /// <returns>An updated clone of this settings object.</returns>
        [Obsolete("Use IgnoreColors")]
        public SeleniumCheckSettings Content(IWebElement element, params IWebElement[] elements)
        {
            var list = new List<IWebElement> { element };
            list.AddRange(elements);
            return Content(list);
        }
        
        /// <summary>
        /// Adds one or more content regions.
        /// </summary>
        /// <param name="element">An element representing a content region.</param>
        /// <param name="elements">One or more elements, each representing a content region.</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings IgnoreColors(IWebElement element, params IWebElement[] elements)
        {
            var list = new List<IWebElement> { element };
            list.AddRange(elements);
            return IgnoreColors(list);
        }
        
        /// <summary>
        /// Adds one or more content regions.
        /// </summary>
        /// <param name="elements">An enumerable of elements, each representing a content region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        [Obsolete("Use IgnoreColors")]
        public SeleniumCheckSettings Content(IEnumerable<IWebElement> elements, Padding padding = null, string regionId = null)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(Content)}(");
            foreach (IWebElement elem in elements)
            {
                clone.Content_(new SimpleRegionByElement(elem, padding, regionId));
                clone.fluentCode_.Append($", {elem}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }
   
        /// <summary>
        /// Adds one or more content regions.
        /// </summary>
        /// <param name="elements">An enumerable of elements, each representing a content region.</param>
        /// <param name="padding">The padding</param>
        /// <param name="regionId">The regionId</param>
        /// <returns>An updated clone of this settings object.</returns>
        public SeleniumCheckSettings IgnoreColors(IEnumerable<IWebElement> elements, Padding padding = null, string regionId = null)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(IgnoreColors)}(");
            foreach (IWebElement elem in elements)
            {
                clone.Content_(new SimpleRegionByElement(elem, padding, regionId));
                clone.fluentCode_.Append($", {elem}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }

        public SeleniumCheckSettings Floating(By regionSelector, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.Floating_(new FloatingRegionBySelector(regionSelector, maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset));
            clone.fluentCode_.Append($".{nameof(Floating)}({regionSelector},{maxUpOffset},{maxDownOffset},{maxLeftOffset},{maxRightOffset})");
            return clone;
        }

        public SeleniumCheckSettings Floating(By regionSelector, int maxOffset = 0)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.Floating_(new FloatingRegionBySelector(regionSelector, maxOffset, maxOffset, maxOffset, maxOffset));
            clone.fluentCode_.Append($".{nameof(Floating)}({regionSelector},{maxOffset})");
            return clone;
        }

        public SeleniumCheckSettings Floating(IWebElement element, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.Floating_(new FloatingRegionByElement(element, maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset));
            clone.fluentCode_.Append($".{nameof(Floating)}({element},{maxUpOffset},{maxDownOffset},{maxLeftOffset},{maxRightOffset})");
            return clone;
        }

        public SeleniumCheckSettings Floating(IWebElement element, int maxOffset = 0)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.Floating_(new FloatingRegionByElement(element, maxOffset, maxOffset, maxOffset, maxOffset));
            clone.fluentCode_.Append($".{nameof(Floating)}({element},{maxOffset})");
            return clone;
        }

        public SeleniumCheckSettings Floating(int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset, params IWebElement[] elementsToIgnore)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(Floating)}({maxUpOffset},{maxDownOffset},{maxLeftOffset},{maxRightOffset}");
            foreach (IWebElement element in elementsToIgnore)
            {
                clone.Floating_(new FloatingRegionByElement(element, maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset));
                clone.fluentCode_.Append($", {element}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }
        
        public SeleniumCheckSettings Accessibility(By regionSelector, AccessibilityRegionType regionType)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.Accessibility_(new AccessibilityRegionBySelector(regionSelector, regionType));
            clone.fluentCode_.Append($".{nameof(Accessibility)}({regionSelector},{nameof(AccessibilityRegionType)}.{regionType})");
            return clone;
        }
        
        public SeleniumCheckSettings Accessibility(IWebElement element, AccessibilityRegionType regionType)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.Accessibility_(new AccessibilityRegionByElement(element, regionType));
            clone.fluentCode_.Append($".{nameof(Accessibility)}({element},{nameof(AccessibilityRegionType)}.{regionType})");
            return clone;
        }

        public SeleniumCheckSettings Accessibility(AccessibilityRegionType regionType, params IWebElement[] elements)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.fluentCode_.Append($".{nameof(Accessibility)}({nameof(AccessibilityRegionType)}.{regionType}");
            foreach (IWebElement element in elements)
            {
                clone.Accessibility_(new AccessibilityRegionByElement(element, regionType));
                clone.fluentCode_.Append($", {element}");
            }
            clone.fluentCode_.Append(")");
            return clone;
        }
        
        public SeleniumCheckSettings ScrollRootElement(By selector)
        {
            SeleniumCheckSettings clone = Clone_();
            if (frameChain_.Count == 0)
            {
                clone.scrollRootSelector_ = selector;
            }
            else
            {
                frameChain_[frameChain_.Count - 1].ScrollRootSelector = selector;
            }
            clone.fluentCode_.Append($".{nameof(ScrollRootElement)}({selector})");
            return clone;
        }
        public SeleniumCheckSettings ScrollRootElement(IWebElement element)
        {
            SeleniumCheckSettings clone = Clone_();
            if (frameChain_.Count == 0)
            {
                clone.scrollRootElement_ = element;
            }
            else
            {
                frameChain_[frameChain_.Count - 1].ScrollRootElement = element;
            }
            clone.fluentCode_.Append($".{nameof(ScrollRootElement)}({element})");
            return clone;
        }

        public SeleniumCheckSettings LayoutBreakpointsEnabled(bool shouldSet)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.LayoutBreakpointsOptions = new LayoutBreakpointsOptions().Breakpoints(shouldSet);
            return clone;
        }

        public SeleniumCheckSettings LayoutBreakpoints(params int[] breakpoints)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.LayoutBreakpointsOptions = new LayoutBreakpointsOptions().Breakpoints(breakpoints);
            return clone;
        }

        public SeleniumCheckSettings LayoutBreakpoints(bool shouldSet)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.LayoutBreakpointsOptions = new LayoutBreakpointsOptions().Breakpoints(shouldSet);
            return clone;
        }
        
        public SeleniumCheckSettings LayoutBreakpoints(LayoutBreakpointsOptions options)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.LayoutBreakpointsOptions = new LayoutBreakpointsOptions(options);
            return clone;
        }

        public SeleniumCheckSettings UseCookies(bool useCookies)
        {
            SeleniumCheckSettings clone = Clone_();
            clone.useCookies_ = useCookies;
            return clone;
        }

        bool? ISeleniumCheckTarget.GetUseCookies()
        {
            return useCookies_;
        }
        
        #region overrides
        public new SeleniumCheckSettings Accessibility(AccessibilityRegionByRectangle region)
        {
            return (SeleniumCheckSettings)base.Accessibility(region);
        }

        public new SeleniumCheckSettings Accessibility(Rectangle region, AccessibilityRegionType regionType)
        {
            return (SeleniumCheckSettings)base.Accessibility(region, regionType);
        }
        public new SeleniumCheckSettings Ignore(Rectangle region, params Rectangle[] regions)
        {
            return (SeleniumCheckSettings)base.Ignore(region, regions);
        }
        
        public new SeleniumCheckSettings Ignore(Region region, params Rectangle[] regions)
        {
            return (SeleniumCheckSettings)base.Ignore(region, regions);
        }

        public SeleniumCheckSettings Ignore(IEnumerable<Rectangle> regions)
        {
            return (SeleniumCheckSettings)base.Ignore(regions);
        }

        public new SeleniumCheckSettings Content(Rectangle region, params Rectangle[] regions)
        {
            return (SeleniumCheckSettings)base.Content(region, regions);
        }

        public SeleniumCheckSettings Content(IEnumerable<Rectangle> regions)
        {
            return (SeleniumCheckSettings)base.Content(regions);
        }

        public new SeleniumCheckSettings Layout(Rectangle region, params Rectangle[] regions)
        {
            return (SeleniumCheckSettings)base.Layout(region, regions);
        }

        public SeleniumCheckSettings Layout(IEnumerable<Rectangle> regions)
        {
            return (SeleniumCheckSettings)base.Layout(regions);
        }

        public new SeleniumCheckSettings Strict(Rectangle region, params Rectangle[] regions)
        {
            return (SeleniumCheckSettings)base.Strict(region, regions);
        }

        public SeleniumCheckSettings Strict(IEnumerable<Rectangle> regions)
        {
            return (SeleniumCheckSettings)base.Strict(regions);
        }

        public new SeleniumCheckSettings Floating(int maxOffset, params Rectangle[] regions)
        {
            return (SeleniumCheckSettings)base.Floating(maxOffset, regions);
        }

        public new SeleniumCheckSettings Floating(Rectangle region, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset)
        {
            return (SeleniumCheckSettings)base.Floating(region, maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset);
        }
        
        public new SeleniumCheckSettings Floating(Region region, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset)
        {
            return (SeleniumCheckSettings)base.Floating(region.ToRectangle(), maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset);
        }

        public new SeleniumCheckSettings Exact()
        {
            return (SeleniumCheckSettings)base.Exact();
        }

        public new SeleniumCheckSettings Layout()
        {
            return (SeleniumCheckSettings)base.Layout();
        }

        public new SeleniumCheckSettings Strict()
        {
            return (SeleniumCheckSettings)base.Strict();
        }

        [Obsolete("Use IgnoreColors()")]
        public new SeleniumCheckSettings Content()
        {
            return (SeleniumCheckSettings)base.Content();
        }

        public new SeleniumCheckSettings IgnoreColors()
        {
            return (SeleniumCheckSettings)base.IgnoreColors();
        }

        public new SeleniumCheckSettings MatchLevel(MatchLevel matchLevel)
        {
            return (SeleniumCheckSettings)base.MatchLevel(matchLevel);
        }

        public new SeleniumCheckSettings Fully()
        {
            return (SeleniumCheckSettings)base.Fully();
        }

        public new SeleniumCheckSettings Fully(bool fully)
        {
            return (SeleniumCheckSettings)base.Fully(fully);
        }

        public new SeleniumCheckSettings LazyLoad()
        {
            return (SeleniumCheckSettings)base.LazyLoad();
        }

        public new SeleniumCheckSettings LazyLoad(LazyLoadOptions lazyLoad)
        {
            return (SeleniumCheckSettings)base.LazyLoad(lazyLoad);
        }

        public new SeleniumCheckSettings Timeout(TimeSpan timeout)
        {
            return (SeleniumCheckSettings)base.Timeout(timeout);
        }

        public new SeleniumCheckSettings IgnoreCaret(bool ignoreCaret = true)
        {
            return (SeleniumCheckSettings)base.IgnoreCaret(ignoreCaret);
        }

        public new SeleniumCheckSettings SendDom(bool sendDom = true)
        {
            return (SeleniumCheckSettings)base.SendDom(sendDom);
        }

        public new SeleniumCheckSettings WithName(string name)
        {
            return (SeleniumCheckSettings)base.WithName(name);
        }

        public new SeleniumCheckSettings ReplaceLast(bool replaceLast = true)
        {
            return (SeleniumCheckSettings)base.ReplaceLast(replaceLast);
        }

        public new SeleniumCheckSettings UseDom(bool useDom = true)
        {
            return (SeleniumCheckSettings)base.UseDom(useDom);
        }

        public new SeleniumCheckSettings EnablePatterns(bool enablePatterns = true)
        {
            return (SeleniumCheckSettings)base.EnablePatterns(enablePatterns);
        }

        public new SeleniumCheckSettings IgnoreDisplacements(bool ignoreDisplacements = true)
        {
            return (SeleniumCheckSettings)base.IgnoreDisplacements(ignoreDisplacements);
        }

        public new SeleniumCheckSettings BeforeRenderScreenshotHook(string hook)
        {
            return (SeleniumCheckSettings)base.BeforeRenderScreenshotHook(hook);
        }

        [Obsolete("Use " + nameof(BeforeRenderScreenshotHook) + " instead.")]
        public new SeleniumCheckSettings ScriptHook(string hook)
        {
            return (SeleniumCheckSettings)base.ScriptHook(hook);
        }

        public new SeleniumCheckSettings VisualGridOptions(params VisualGridOption[] options)
        {
            return (SeleniumCheckSettings)base.VisualGridOptions(options);
        }

        public new SeleniumCheckSettings VariationGroupId(string variationGroupId)
        {
            return (SeleniumCheckSettings)base.VariationGroupId(variationGroupId);
        }
        #endregion

        private SeleniumCheckSettings Clone_()
        {
            return (SeleniumCheckSettings)Clone();
        }

        internal void SetTargetSelector(VisualGridSelector targetSelector)
        {
            vgTargetSelector_ = targetSelector;
        }

        public override VisualGridSelector GetTargetSelector()
        {
            return vgTargetSelector_;
        }

        protected override CheckSettings Clone()
        {
            SeleniumCheckSettings clone = new SeleniumCheckSettings();
            PopulateClone_(clone);
            clone.targetElement_ = targetElement_;
            clone.targetSelector_ = targetSelector_;
            clone.frameChain_.AddRange(frameChain_);
            clone.scrollRootElement_ = scrollRootElement_;
            clone.scrollRootSelector_ = scrollRootSelector_;
            clone.vgTargetSelector_ = vgTargetSelector_;
            clone.targetLocator_ = targetLocator_;
            ((ISeleniumCheckTarget)clone).State = ((ISeleniumCheckTarget)this).State;
            clone.useCookies_ = useCookies_;
            return clone;
        }
    }
}
