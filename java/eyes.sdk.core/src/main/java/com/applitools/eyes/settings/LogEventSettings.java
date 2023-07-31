package com.applitools.eyes.settings;

import com.applitools.eyes.universal.dto.ProxyDto;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class LogEventSettings {
    private String serverUrl;
    private String apiKey;
    private ProxyDto proxy;
    private String agentId;
    private String level;
    private String type;
    private final String javaVersion = System.getProperty("java.version");

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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getJavaVersion() {
        return javaVersion;
    }

}
