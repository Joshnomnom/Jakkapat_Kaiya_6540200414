import React from "react";
import { TextInput, StyleSheet, View } from "react-native";

const PostField = ({ placeholder, value, onChangeText }) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        multiline={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "90%",
    marginVertical: 10,
  },
  input: {
    width: "100%",
    height: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#CCC",
    textAlignVertical: "top",
    position: "absolute",
    bottom: 100,
  },
});

export default PostField;
