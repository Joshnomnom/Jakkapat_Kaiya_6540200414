import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/FirebaseConfig";
import TextInputField from "../components/TextInputField";
import CustomButton from "../components/CustomButton";
import CustomModals from "../components/CustomModal";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";

const ResetPassword = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");

  const showAlert = (message, type = "error") => {
    setModalType(type);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showAlert("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);

      showAlert(
        "Password reset email sent successfully! Please check your inbox.",
        "success"
      );

      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate("SignIn");
      }, 2000);
    } catch (error) {
      console.error("Error sending reset email:", error);

      let errorMessage = "Failed to send reset email. Please try again.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Check your connection.";
      }

      showAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.logoContainer}></View>
      </View>
      <Logo source={require("../../assets/Beluga_logo.png")} />

      <View style={styles.resetBox}>
        <Text style={styles.resetText}>Password Reset</Text>
        <Text style={styles.instructionText}>
          Enter your email address to receive a password reset link
        </Text>

        <TextInputField
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <CustomButton
          title="Reset Password"
          onPress={handleResetPassword}
          loading={loading}
          style={styles.resetButton}
        />
      </View>

      <CustomModals
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalType === "error" ? "Error" : "Success"}
        message={modalMessage}
        confirmText="OK"
        type={modalType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: "absolute",
    top: 60,
  },
  logoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 40,
  },
  resetBox: {
    backgroundColor: "#FF3A7C",
    padding: 30,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  resetText: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 10,
    fontWeight: "bold",
  },
  instructionText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "#2D1B81",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginTop: 20,
    alignSelf: "center",
    width: "80%",
  },
  // content: {
  //   flex: 1,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
});

export default ResetPassword;
