package com.applitools.eyes.universal.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class LogEvent {

    protected String type;

    public LogEvent() {
        this.type = "JAVA_EVENT";
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class LogJavaVersion extends LogEvent {

        private final String javaVersion = System.getProperty("java.version");

        public LogJavaVersion() {
            super.setType("JAVA_VERSION");
        }

        public String getJavaVersion() {
            return javaVersion;
        }
    }
}
