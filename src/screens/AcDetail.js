import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { doc, setDoc } from "firebase/firestore";
import { FIRESTORE_DB, auth } from "../services/FirebaseConfig";
import TextInputField from "../components/TextInputField";
import CustomButton from "../components/CustomButton";
import CustomModals from "../components/CustomModal";
import { serverTimestamp } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";

const AcDetail = () => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgUri, setImgUri] = useState(null);
  const [gender, setGender] = useState("male");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");
  const [birthDate, setBirthDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const showAlert = (message, type = " error") => {
    setModalType(type);
    setModalVisible(true);
    setModalMessage(message);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      console.log("Date selected:", selectedDate);
      setBirthDate(selectedDate);
    }
  };

  //ภาพ Cloudinary
  const handleImageUpload = async (imgUri, type) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        showAlert("User not logged in. Please log in and try again.", "error");
        return null;
      }

      console.log("Preparing image upload for user:", userId);
      //กำหนดชื่อของไฟล์์จะโหลด
      const fileName =
        type === "profile"
          ? `profile_picture_${userId}.jpg`
          : `post_image_${userId}_${Date.now()}.jpg`;

      //กำหนดโฟลเดอร์ปลายทาง
      const folderPath =
        type === "profile" ? `/profiles/${userId}/` : `/posts/${userId}/`;

      console.log("Creating form data for upload...");
      const formData = new FormData();
      formData.append("file", {
        uri: imgUri,
        type: "image/jpeg",
        name: fileName,
      });
      formData.append("upload_preset", "Beluga");
      formData.append("cloud_name", "dsmf4sq2d");
      formData.append("folder", folderPath);

      console.log("Sending image to Cloudinary...");
      //ส่ง Cloudinary
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dsmf4sq2d/image/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Image uploaded successfully:", response.data.secure_url);
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      console.error(
        "Error details:",
        error.response ? error.response.data : "No response data"
      );
      showAlert("Error uploading image. Please try again.", "error");
      return null;
    }
  };

  const handleImagePicker = async () => {
    try {
      //ขอ์เข้าภาพ
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
      console.error("Error picking image:", error);
      showAlert("An error occurred while picking an image.", "error");
    }
  };

  const handleCreate = async () => {
    // Validate inputs
    if (!firstName || !lastName) {
      showAlert("Please enter both first and last name.", "error");
      return;
    }
    if (!imgUri) {
      showAlert("Please select a profile picture.", "error");
      return;
    }
    if (!birthDate) {
      showAlert("Please select your date of birth.", "error");
      return;
    }

    // Calculate age
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      showAlert(
        "You must be at least 18 years old to create an account.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      console.log("Starting profile image upload...");
      const imgUrl = await handleImageUpload(imgUri, "profile");
      console.log("Image uploaded successfully:", imgUrl);

      if (!imgUrl) {
        showAlert("Image upload failed. Please try again.", "error");
        setLoading(false);
        return;
      }

      const userId = auth.currentUser?.uid;
      if (!userId) {
        showAlert("Authentication Error", "error");
        setLoading(false);
        return;
      }

      console.log("Saving user data to Firestore...");
      // Save user data to Firestore
      await setDoc(doc(FIRESTORE_DB, "users", userId), {
        firstName,
        lastName,
        gender,
        profilePicture: imgUrl,
        birthDate: birthDate.toISOString(),
        timestamp: serverTimestamp(),
      });

      console.log("User data saved successfully!");
      showAlert("Account created successfully!", "success");

      setTimeout(() => {
        navigation.navigate("Home");
      }, 1500);
    } catch (error) {
      console.error("Error saving user data:", error);
      showAlert(
        "Error saving user data. Please check your permissions and try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/Beluga_minilogo.png")}
        style={styles.logo}
      />
      <TouchableOpacity style={styles.avatar} onPress={handleImagePicker}>
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.selectedImage} />
        ) : (
          <Ionicons name="add-outline" size={40} color="#000" />
        )}
      </TouchableOpacity>

      <Text style={styles.pictureText}>Choose profile picture</Text>

      <View style={styles.createAccountBox}>
        <Text style={styles.createAccountText}>Create account</Text>
        <TextInputField
          placeholder="First name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInputField
          placeholder="Last name"
          value={lastName}
          onChangeText={setLastName}
        />
        <View style={styles.pickerContainer}>
          <Text style={styles.inputLabel}>Gender</Text>
          <Picker
            selectedValue={gender}
            style={styles.picker}
            onValueChange={(itemValue) => setGender(itemValue)}
          >
            <Picker.Item label="Male" value="male" style={styles.item} />
            <Picker.Item label="Female" value="female" style={styles.item} />
            <Picker.Item label="Other" value="other" style={styles.item} />
          </Picker>
        </View>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerText}>
            {birthDate
              ? birthDate.toLocaleDateString()
              : "Select your date of birth"}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={birthDate || new Date()}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}
        <CustomButton title="Next" onPress={handleCreate} loading={loading} />
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
  logo: {
    width: 68,
    height: 64,
    marginBottom: 20,
    marginEnd: 30,
    alignSelf: "flex-end",
    position: "absolute",
    right: 10,
    top: 90,
  },
  avatar: {
    color: "#000",
    marginBottom: 50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E1E2E6",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  pictureText: {
    fontSize: 16,
    color: "#FF3A7C",
    marginBottom: 20,
  },
  pickerContainer: {
    width: "100%",
    marginVertical: 10,
  },
  inputLabel: {
    color: "#FFF",
    marginBottom: 5,
  },
  picker: {
    height: 47,
    backgroundColor: "#F5A3C7",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    color: "#FFF",
  },
  haveAccountText: {
    color: "#999999",
    fontSize: 14,
  },
  item: {
    fontSize: 14,
  },
  datePickerButton: {
    backgroundColor: "#F5A3C7",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  datePickerText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default AcDetail;
