import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../services/FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import Logo from "../components/Logo";
import TextInputField from "../components/TextInputField";
import CustomButton from "../components/CustomButton";
import CustomModals from "../components/CustomModal";

const SignIn = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");

  const showAlert = (message, type = "error") => {
    setModalType(type);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleSignIn = () => {
    // Check for empty email
    if (!email.trim()) {
      showAlert("Please enter your email address.", "error");
      return;
    }

    // Check for empty password
    if (!password) {
      showAlert("Please enter your password.", "error");
      return;
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(
        "Please enter a valid email address (example@domain.com).",
        "error"
      );
      return;
    }

    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Sign In Successful", userCredential.user.email);
        setLoading(false);
        navigation.navigate("Home");
      })
      .catch((error) => {
        console.error("Error during Sign In", error.message);
        setLoading(false);

        // Handle specific Firebase auth errors
        if (error.code === "auth/user-not-found") {
          showAlert(
            "No account found with this email. Please check your email or create an account.",
            "error"
          );
        } else if (
          error.code === "auth/wrong-password" ||
          error.code === "auth/invalid-credential"
        ) {
          showAlert(
            "Incorrect password. Please try again or use 'Forget Password' to reset your password.",
            "error"
          );
        } else if (error.code === "auth/too-many-requests") {
          showAlert(
            "Too many failed login attempts. Please try again later or use 'Forget Password' to reset your password.",
            "error"
          );
        } else if (error.code === "auth/network-request-failed") {
          showAlert(
            "Network error. Please check your internet connection and try again.",
            "error"
          );
        } else if (error.code === "auth/invalid-email") {
          showAlert(
            "Invalid email format. Please check your email and try again.",
            "error"
          );
        } else {
          showAlert("Sign in failed. Please try again.", "error");
        }
      });
  };

  return (
    <View style={styles.container}>
      <Logo source={require("../../assets/Beluga_logo.png")} />
      <View style={styles.signInBox}>
        <Text style={styles.signInText}>Sign in</Text>
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
        <TouchableOpacity
          style={styles.resetbutton}
          onPress={() => navigation.navigate("ResetPassword")}
        >
          <Text style={styles.resetbuttonText}>Forget Password?</Text>
        </TouchableOpacity>
        <CustomButton title="Next" onPress={handleSignIn} loading={loading} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.noAccountText}>No account ?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("CreateAc")}>
          <Text style={styles.createAccountText}>Create one!</Text>
        </TouchableOpacity>

        <CustomModals
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={modalType}
          message={modalMessage}
          confirmText="OK"
          type={modalType}
        />
      </View>
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
  signInBox: {
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
  signInText: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  resetbutton: {
    backgroundColor: "#FF3A7C",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 1,
    alignSelf: "flex-start",
  },
  resetbuttonText: {
    color: "#2D1B81",
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    marginTop: 20,
  },
  noAccountText: {
    color: "#999999",
    fontSize: 14,
  },
  createAccountText: {
    color: "#FF3A7C",
    fontSize: 14,
    marginLeft: 5,
  },
});

export default SignIn;
