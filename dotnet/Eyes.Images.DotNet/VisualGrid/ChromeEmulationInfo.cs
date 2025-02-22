﻿using System;

namespace Applitools.VisualGrid
{
    public class ChromeEmulationInfo : EmulationBaseInfo, IRenderBrowserInfo, IEquatable<ChromeEmulationInfo>
    {
        public DeviceName DeviceName { get; set; }
    
        // public string SerializedDeviceName
        // {
        //     get
        //     {
        //         try { return DeviceName.GetAttribute<EnumMemberAttribute>().Value; }
        //         catch (Exception) { return DeviceName.ToString(); }
        //     }
        // }

        public ChromeEmulationInfo(DeviceName deviceName, 
            ScreenOrientation screenOrientation = ScreenOrientation.Portrait) : base(screenOrientation)
        {
            DeviceName = deviceName;
        }

        public override string ToString()
        {
            return $"{DeviceName} ({ScreenOrientation})";
        }

        public bool Equals(ChromeEmulationInfo other)
        {
            if (other == null) return false;
            return base.Equals(other) && DeviceName == other.DeviceName;
        }
    }
}