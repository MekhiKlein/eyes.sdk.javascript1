﻿using Applitools.Utils;
using Newtonsoft.Json;
using System.Collections;
using System.Collections.Generic;

namespace Applitools
{
    [JsonConverter(typeof(PropertiesCollectionConverter))]
    public class PropertiesCollection : IEnumerable<PropertyData>
    {
        private readonly List<PropertyData> properties_ = new List<PropertyData>();

        public void Add(string name, string value)
        {
            PropertyData pd = new PropertyData(name, value);
            properties_.Add(pd);
        }

        public PropertyData this[int index] => properties_[index];

        public void Clear()
        {
            properties_.Clear();
        }

        public IEnumerator<PropertyData> GetEnumerator()
        {
            return ((IEnumerable<PropertyData>)properties_).GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return ((IEnumerable<PropertyData>)properties_).GetEnumerator();
        }
    }
}