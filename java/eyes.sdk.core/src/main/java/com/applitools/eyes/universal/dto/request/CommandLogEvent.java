package com.applitools.eyes.universal.dto.request;

import com.applitools.eyes.settings.LogEventSettings;

public class CommandLogEvent {

    private LogEventSettings settings;

    public CommandLogEvent(LogEventSettings settings) {
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
