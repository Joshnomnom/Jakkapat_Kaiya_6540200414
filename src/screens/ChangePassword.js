import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../services/FirebaseConfig";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
} from "firebase/auth";
import TextInputField from "../components/TextInputField";
import CustomButton from "../components/CustomButton";
import CustomModals from "../components/CustomModal";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ChangePassword = () => {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");

  const showAlert = (message, type = "error") => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      showAlert("Please enter your current password.", "error");
      return;
    }

    if (!newPassword.trim()) {
      showAlert("Please enter a new password.", "error");
      return;
    }

    if (!confirmPassword.trim()) {
      showAlert("Please confirm your new password.", "error");
      return;
    }

    if (newPassword === currentPassword) {
      showAlert(
        "New password must be different from your current password.",
        "error"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("New passwords do not match.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showAlert("New password must be at least 6 characters long.", "error");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (
      !(hasUpperCase && hasLowerCase && hasNumbers) &&
      newPassword.length < 8
    ) {
      showAlert(
        "Password is too weak. For better security, use at least 8 characters with uppercase, lowercase, and numbers.",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showAlert("User not logged in. Please log in and try again.", "error");
        setLoading(false);
        navigation.navigate("SignIn");
        return;
      }

      const email = user.email;
      if (!email) {
        showAlert("User email not found.", "error");
        setLoading(false);
        return;
      }

      try {
        const credential = EmailAuthProvider.credential(email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        await updatePassword(user, newPassword);
        showAlert("Password updated successfully!", "success");

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          setModalVisible(false);
          navigation.navigate("Profile");
        }, 1500);
      } catch (error) {
        console.error("Authentication error:", error);

        if (error.code === "auth/wrong-password") {
          showAlert("Current password is incorrect.", "error");
        } else if (error.code === "auth/too-many-requests") {
          showAlert(
            "Too many failed attempts. Please try again later.",
            "error"
          );
        } else if (error.code === "auth/user-mismatch") {
          showAlert("The provided credentials do not match the user.", "error");
        } else if (error.code === "auth/invalid-credential") {
          showAlert(
            "Invalid credentials. Please check your current password and try again.",
            "error"
          );
        } else if (error.code === "auth/requires-recent-login") {
          showAlert(
            "For security reasons, please log in again before changing your password.",
            "error"
          );

          setTimeout(async () => {
            await signOut(auth);
            navigation.navigate("SignIn");
          }, 1500);
        } else {
          showAlert(`Error: ${error.message}`, "error");
        }
      }
    } catch (error) {
      console.error("Error changing password:", error);
      showAlert(`An unexpected error occurred: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.changePasswordBox}>
        <Text style={styles.changePasswordText}>Change Password</Text>

        <TextInputField
          placeholder="Current Password"
          secureTextEntry={true}
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <TextInputField
          placeholder="New Password"
          secureTextEntry={true}
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TextInputField
          placeholder="Confirm New Password"
          secureTextEntry={true}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <CustomButton
          title={loading ? "Updating..." : "Update Password"}
          onPress={handleChangePassword}
          loading={loading}
        />
      </View>

      <Footer navigation={navigation} />

      <CustomModals
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalType}
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
  changePasswordBox: {
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
    marginTop: 100,
    marginBottom: 20,
  },
  changePasswordText: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 20,
    fontWeight: "bold",
  },
  updateButton: {
    backgroundColor: "#2D1B81",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 20,
    alignSelf: "center",
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChangePassword;
