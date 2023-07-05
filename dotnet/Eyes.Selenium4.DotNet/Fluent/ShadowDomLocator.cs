using System;
using Applitools.Utils;
using OpenQA.Selenium;
using SeleniumExtras.PageObjects;

namespace Applitools.Selenium
{
    public class ShadowDomLocator : TargetPathLocator
    {
        public ShadowDomLocator(TargetPathLocator parent, IPathNodeValue value)
            : base(parent, value)
        {
        }

        public RegionLocator Region(IWebElement element)
        {
            return new RegionLocator(this, new ElementReference(element));
        }

        public RegionLocator Region(By by)
        {
            return new RegionLocator(this, new ElementSelector(by));
        }

        public RegionLocator Region(string selector)
        {
            return new RegionLocator(this, new ElementSelector(selector)); // this
        }

        public ShadowDomLocator Shadow(IWebElement element)
        {
            return new ShadowDomLocator(this, new ElementReference(element));
        }

        public ShadowDomLocator Shadow(By by)
        {
            return new ShadowDomLocator(this, new ElementSelector(by));
        }

        public ShadowDomLocator Shadow(string selector)
        {
            return new ShadowDomLocator(this, new ElementSelector(selector)); //this
        }
    }

    public class ElementSelector : IPathNodeValue
    {
        public string Type { get; private set; }
        public string Selector { get; private set; }
        public ElementSelector Fallback { get; private set; }
        public ElementSelector Child { get; private set; }

        private ElementSelector()
        {
        }

        public ElementSelector(By by)
        {
            if (by is ByAll byAll)
            {
                PopulateFromByAll_(byAll);
            }
            else if (by is ByChained byChained)
            {
                PopulateFromByChained_(byChained);
            }
            else
            {
                ElementSelector clone = PopulateFromBy_(by);
                Selector = clone.Selector;
                Type = clone.Type;
            }
        }

        public ElementSelector(string selector)
        {
            Type = "css selector";
            Selector = selector;
        }

        private void PopulateFromByAll_(ByAll byAll)
        {
            try
            {
                var bys = byAll.GetPrivateFieldValue<By[]>("bys");
                ElementSelector fallback = null;
                for (int i = bys.Length - 1; i >= 0; i--)
                {
                    ElementSelector region = new ElementSelector(bys[i]);
                    Selector = region.Selector;
                    Type = region.Type;
                    Fallback = fallback;
                    fallback = region;
                }
            }
            catch (Exception e)
            {
                throw new EyesException("Got a failure trying to find By[] using reflection!", e);
            }
        }

        private void PopulateFromByChained_(ByChained byChained)
        {
            try
            {
                var bys = byChained.GetPrivateFieldValue<By[]>("bys");

                ElementSelector child = null;
                for (int i = bys.Length - 1; i >= 0; i--)
                {
                    ElementSelector region = new ElementSelector(bys[i]);
                    Selector = region.Selector;
                    Type = region.Type;
                    Child = child;
                    child = region;
                }
            }
            catch (Exception e)
            {
                throw new EyesException("Got a failure trying to find By[] using reflection!", e);
            }
        }

        private static ElementSelector PopulateFromBy_(By by)
        {
            ElementSelector es = new ElementSelector();

            string[] parts = by.ToString().Split(new[] { ':' }, 1);
            string selector = parts[0].Trim();
            string description = parts[1].Trim();
            es.Selector = selector;
            switch (description)
            {
                case "By.Id":
                    es.Type = "css selector";
                    es.Selector = $"[id=\"{selector}\"]";
                    break;
                case "By.XPath":
                    es.Type = "xpath";
                    break;
                case "By.LinkText":
                    es.Type = "link text";
                    break;
                case "By.PartialLinkText":
                    es.Type = "partial link text";
                    break;
                case "By.Name":
                    es.Type = "css selector";
                    es.Selector = $"[name=\"{selector}\"]";
                    break;
                case "By.TagName":
                    es.Type = "tag name";
                    break;
                case "By.ClassName[Contains]":
                    es.Type = "css selector";
                    es.Selector = $".{selector}";
                    break;
                case "By.CssSelector":
                    es.Type = "css selector";
                    break;
            }

            return es;
        }
    }
}