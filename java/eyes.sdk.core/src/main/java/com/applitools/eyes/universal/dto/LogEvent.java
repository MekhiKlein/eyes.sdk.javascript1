package com.applitools.eyes.universal.dto;

import com.applitools.eyes.settings.LogEventSettings;

public class LogEvent {

    private LogEventSettings settings;

    public LogEvent(LogEventSettings settings) {
        this.settings = settings;
    }

    public LogEventSettings getSettings() {
        return settings;
    }

    public void setSettings(LogEventSettings settings) {
        this.settings = settings;
    }

    @Override
    public String toString() {
        return "LogEvent{" +
                "settings=" + settings +
                '}';
    }
}
