package com.applitools.eyes.visualgrid.model;

import java.util.Arrays;

import com.fasterxml.jackson.annotation.JsonValue;

public enum IosDeviceName {
    iPhone_14_Pro_Max("iPhone 14 Pro Max"),
    iPhone_14("iPhone 14"),
    iPhone_13_Pro_Max("iPhone 13 Pro Max"),
    iPhone_13_Pro("iPhone 13 Pro"),
    iPhone_13("iPhone 13"),
    iPhone_12_Pro_Max("iPhone 12 Pro Max"),
    iPhone_12_Pro("iPhone 12 Pro"),
    iPhone_12("iPhone 12"),
    iPhone_12_mini("iPhone 12 mini"),
    iPhone_11_Pro("iPhone 11 Pro"),
    iPhone_11_Pro_Max("iPhone 11 Pro Max"),
    iPhone_11("iPhone 11"),
    iPhone_XR("iPhone XR"),
    iPhone_XS("iPhone Xs"),
    iPhone_X("iPhone X"),
    iPhone_8_Plus("iPhone 8 Plus"),
    iPhone_8("iPhone 8"),
    iPhone_7("iPhone 7"),
    iPhone_SE("iPhone SE (1st generation)"),
    iPad_Pro_3("iPad Pro (12.9-inch) (3rd generation)"),
    iPad_7("iPad (7th generation)"),
    iPad_9("iPad (9th generation)"),
    iPad_Air_2("iPad Air (2nd generation)"),
    iPad_Air_4("iPad Air (4th generation)");

    private final String name;

    IosDeviceName(String name) {
        this.name = name;
    }

    @JsonValue
    public String getName() {
        return name;
    }

    @Override
    public String toString() {
        return "IosDeviceName{" +
                "name='" + name + '\'' +
                '}';
    }

    /**
     * @return the Enum representation for the given string.
     * @throws IllegalArgumentException if unknown string.
     */
    public static IosDeviceName fromName(String value) throws IllegalArgumentException {
        return Arrays.stream(IosDeviceName.values())
            .filter(v -> v.name.equalsIgnoreCase(value))
            .findFirst()
            .orElse(null);
    }
}
