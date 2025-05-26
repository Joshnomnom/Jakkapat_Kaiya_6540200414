import React, { useState } from "react";
import { TextInput, StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TextInputField = ({
  value,
  placeholder,
  onChangeText,
  secureTextEntry,
  style,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, style]}
        placeholder={placeholder}
        placeholderTextColor="#FF0B5D"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
      />

      {secureTextEntry && (
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color="#FF0B5D"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    width: "100%",
    position: "relative",
    marginVertical: 10,
  },
  input: {
    width: "100%",
    height: 40,
    backgroundColor: "#F5A3C7",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingRight: 50,
    color: "#FFF",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 8,
    zIndex: 1,
  },
});

export default TextInputField;
