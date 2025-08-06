import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../services/FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Logo from "../components/Logo";
import TextInputField from "../components/TextInputField";
import CustomButton from "../components/CustomButton";
import CustomModals from "../components/CustomModal";

const CreateAc = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");

  const showAlert = (message, type = "error") => {
    setModalType(type);
    setModalVisible(true);
    setModalMessage(message);
  };

  const handleSignup = async () => {
    if (!email.trim()) {
      showAlert("Please enter your email address.", "error");
      return;
    }

    if (!password) {
      showAlert("Please enter a password.", "error");
      return;
    }

    if (!confirmPassword) {
      showAlert("Please confirm your password.", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(
        "Please enter a valid email address (example@domain.com).",
        "error"
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Passwords do not match. Please check and try again.", "error");
      return;
    }

    if (password.length < 8) {
      showAlert("Password must be at least 8 characters long.", "error");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers) && password.length < 8) {
      showAlert(
        "Password is too weak. For better security, use at least 8 characters with uppercase, lowercase, and numbers.",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showAlert("Account created successfully!", "success");
      navigation.navigate("AcDetail");
    } catch (error) {
      console.error("Error creating account:", error);

      if (error.code === "auth/email-already-in-use") {
        showAlert(
          "This email is already in use. Please use a different email or sign in.",
          "error"
        );
      } else if (error.code === "auth/invalid-email") {
        showAlert(
          "Invalid email format. Please check your email and try again.",
          "error"
        );
      } else if (error.code === "auth/weak-password") {
        showAlert(
          "Password is too weak. Please use a stronger password with at least 6 characters.",
          "error"
        );
      } else if (error.code === "auth/network-request-failed") {
        showAlert(
          "Network error. Please check your internet connection and try again.",
          "error"
        );
      } else {
        showAlert("Error creating account. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Logo source={require("../../assets/Beluga_logo.png")} />

      <View style={styles.createAccountBox}>
        <Text style={styles.createAccountText}>Create account</Text>
        <TextInputField
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInputField
          placeholder="Password"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />
        <TextInputField
          placeholder="Confirm password"
          secureTextEntry={true}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <CustomButton title="Next" onPress={handleSignup} loading={loading} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.haveAccountText}>Already has an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
          <Text style={styles.signInText}>Sign in!</Text>
        </TouchableOpacity>
      </View>

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

  createAccountBox: {
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
  createAccountText: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  footer: {
    flexDirection: "row",
    marginTop: 20,
  },
  haveAccountText: {
    color: "#999999",
    fontSize: 14,
  },
  signInText: {
    color: "#FF5B99",
    fontSize: 14,
    marginLeft: 5,
  },
});

export default CreateAc;
