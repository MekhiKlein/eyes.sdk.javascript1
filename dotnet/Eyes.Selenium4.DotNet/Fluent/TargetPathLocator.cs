using System;

namespace Applitools.Selenium
{
    public class TargetPathLocator
    {
        protected TargetPathLocator Parent { get; }
        protected IPathNodeValue Value { get; }

        public TargetPathLocator()
        {
        }

        public TargetPathLocator(TargetPathLocator parent, IPathNodeValue value)
        {
            Parent = parent;
            Value = value;
        }
    }
}