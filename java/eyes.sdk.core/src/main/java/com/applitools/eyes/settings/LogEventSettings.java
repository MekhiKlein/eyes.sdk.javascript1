package com.applitools.eyes.settings;

import com.applitools.eyes.universal.dto.LogEvent;
import com.applitools.eyes.universal.dto.ProxyDto;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class LogEventSettings {
    private String serverUrl;
    private String apiKey;
    private ProxyDto proxy;
    private String agentId;
    private String level;
    private LogEvent event;

    public String getServerUrl() {
        return serverUrl;
    }

    public void setServerUrl(String serverUrl) {
        this.serverUrl = serverUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public ProxyDto getProxy() {
        return proxy;
    }

    public void setProxy(ProxyDto proxy) {
        this.proxy = proxy;
    }

    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public LogEvent getEvent() {
        return event;
    }

    public void setEvent(LogEvent event) {
        this.event = event;
    }
}
