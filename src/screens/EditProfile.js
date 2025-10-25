import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@env";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FIRESTORE_DB, auth } from "../services/FirebaseConfig";
import TextInputField from "../components/TextInputField";
import CustomButton from "../components/CustomButton";
import CustomModals from "../components/CustomModal";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Picker } from "@react-native-picker/picker";
import SignOut from "../components/SignOut";

const EditProfile = () => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgUri, setImgUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userProfilePic, setUserProfilePic] = useState(null);
  const [gender, setGender] = useState("");

  const showAlert = (message, type = "error") => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleError = (error, message = "An unexpected error occurred.") => {
    console.error(`${message}\n`, error?.message || error);
    showAlert(message, "error");
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          showAlert(
            "User not logged in. Please log in and try again.",
            "error"
          );
          return;
        }

        const userDoc = await getDoc(doc(FIRESTORE_DB, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserFirstName(userData.firstName || "");
          setUserLastName(userData.lastName || "");
          setUserProfilePic(userData.profilePicture || null);
          setFirstName(userData.firstName || "");
          setLastName(userData.lastName || "");
          setImgUri(userData.profilePicture || null);
          setGender(userData.gender || "");
        }
      } catch (error) {
        handleError(error, "Failed to load user data.");
      }
    };

    fetchUserData();
  }, []);

  const handleImagePicker = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert(
          "Permission denied, You need to grant gallery permission",
          "error"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImgUri(result.assets[0].uri);
      }
    } catch (error) {
      handleError(error, "An error occurred while picking an image.");
    }
  };

  const handleImageUpload = async (imgUri, type) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        showAlert("User not logged in. Please log in and try again.", "error");
        return null;
      }

      if (imgUri === userProfilePic) {
        return imgUri;
      }

      const fileName = `profile_picture_${userId}.jpg`;
      const folderPath = `/profiles/${userId}/`;

      const formData = new FormData();
      formData.append("file", {
        uri: imgUri,
        type: "image/jpeg",
        name: fileName,
      });

      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);
      formData.append("folder", folderPath);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Image uploaded:", response.data.secure_url);
      return response.data.secure_url;
    } catch (error) {
      handleError(error, "Error uploading image. Please try again.");
      return null;
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      showAlert("First name cannot be empty.", "error");
      return;
    }

    if (!lastName.trim()) {
      showAlert("Last name cannot be empty.", "error");
      return;
    }

    setLoading(true);
    try {
      let imgUrl = imgUri;

      if (imgUri && imgUri !== userProfilePic) {
        imgUrl = await handleImageUpload(imgUri, "profile");

        if (!imgUrl) {
          showAlert("Image upload failed. Please try again.", "error");
          setLoading(false);
          return;
        }
      }

      const userId = auth.currentUser?.uid;
      if (!userId) {
        showAlert("Authentication Error", "error");
        setLoading(false);
        return;
      }

      await setDoc(
        doc(FIRESTORE_DB, "users", userId),
        {
          firstName,
          lastName,
          profilePicture: imgUrl,
          gender: gender || "not specified",
          timestamp: serverTimestamp(),
        },
        { merge: true }
      );

      showAlert("Profile updated successfully!", "success");
      setLoading(false);
      navigation.navigate("Profile");
    } catch (error) {
      handleError(error, "Failed to save user data. Please try again.");
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    navigation.navigate("ChangePassword");
  };

  return (
    <View style={styles.container}>
      <Header />

      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={handleImagePicker}
      >
        <View style={styles.avatar}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={styles.selectedImage} />
          ) : (
            <Ionicons name="add-outline" size={40} color="#000" />
          )}
        </View>
        <Text style={styles.headLabelOutside}>Edit Profile Picture</Text>
      </TouchableOpacity>

      <View style={styles.editProfileBox}>
        <Text style={styles.editProfileText}>Edit Profile</Text>
        <TextInputField
          placeholder="First name"
          value={firstName}
          onChangeText={(text) => setFirstName(text)}
        />
        <TextInputField
          placeholder="Last name"
          value={lastName}
          onChangeText={(text) => setLastName(text)}
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Gender</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={gender}
              style={styles.picker}
              onValueChange={(itemValue) => setGender(itemValue)}
              dropdownIconColor="#FFFFFF"
              mode="dropdown"
            >
              <Picker.Item label="Male" value="male" color="#000000" />
              <Picker.Item label="Female" value="female" color="#000000" />
              <Picker.Item label="Other" value="other" color="#000000" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={handleChangePassword}
        >
          <Text style={styles.changePasswordText}>Change Password</Text>
        </TouchableOpacity>
        <View>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
          <SignOut />
        </View>
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
  avatarContainer: {
    alignItems: "center",
    marginTop: 90,
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E1E2E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#FF3A7C",
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  headLabelOutside: {
    fontSize: 16,
    color: "#FF3A7C",
    marginBottom: 20,
  },
  editProfileBox: {
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
    marginBottom: 20,
  },
  editProfileText: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 20,
    fontWeight: "bold",
  },
  pickerContainer: {
    width: "100%",
    marginVertical: 10,
  },
  pickerLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 5,
  },
  pickerWrapper: {
    backgroundColor: "#F5A3C7",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#2D1B81",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 20,
    alignSelf: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  changePasswordButton: {
    alignSelf: "flex-start",
    marginTop: 15,
    marginBottom: 5,
  },
  changePasswordText: {
    color: "#2D1B81",
    fontSize: 16,
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
});

export default EditProfile;
