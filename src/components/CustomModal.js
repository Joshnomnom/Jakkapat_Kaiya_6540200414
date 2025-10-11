import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Modal from "react-native-modal";

const CustomModals = ({
  isVisible,
  onClose,
  title,
  message,
  confirmText = "OK",
  type = "error",
}) => {
  const imageSource =
    type === "success"
      ? require("../../assets/Success.png")
      : require("../../assets/Error.png");

  const displayTitle = title
    ? title.charAt(0).toUpperCase() + title.slice(1)
    : type === "success"
    ? "Success"
    : "Error";

  return (
    <Modal
      isVisible={isVisible}
      onBackButtonPress={onClose}
      onBackdropPress={onClose}
      animationIn="zoomIn"
      animationOut="zoomOut"
    >
      <View style={styles.modalContainer}>
        <Image source={imageSource} style={styles.image} />
        <Text
          style={type === "success" ? styles.successTitle : styles.errorTitle}
        >
          {displayTitle}
        </Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity
          style={type === "success" ? styles.oButton : styles.kButton}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#BB271A",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#75F94C",
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  kButton: {
    backgroundColor: "#FF3A7C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  oButton: {
    backgroundColor: "#75F94C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  image: {
    width: 136,
    height: 136,
    marginBottom: 10,
  },
});

export default CustomModals;
