import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PostField from "../components/PostField";
import CustomButton from "../components/CustomButton";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FIRESTORE_DB, auth } from "../services/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import CustomModals from "../components/CustomModal";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

const Post = ({ navigation }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [post, setPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  const [images, setImages] = useState([]);

  const showAlert = (message, type) => {
    setModalVisible(true);
    setModalMessage(message);
    setModalType(type);
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
          setAvatarUrl(userData.profilePicture || null);
          setFirstName(userData.firstName || "Unknown");
          setLastName(userData.lastName || "Unknown");
        } else {
          showAlert("User data not found.", "error");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        showAlert("Failed to load user data.", "error");
      }
    };

    fetchUserData();
  }, []);

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
        type === "post"
          ? `profile_picture_${userId}.jpg`
          : `post_image_${userId}_${Date.now()}.jpg`;

      //กำหนดโฟลเดอร์ปลายทาง
      const folderPath =
        type === "post" ? `/profiles/${userId}/` : `/posts/${userId}/`;

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
        allowsMultipleSelection: true,
        selectionLimit: 4,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const selectedUris = result.assets.map((asset) => asset.uri);
        if (images.length + selectedUris.length > 4) {
          showAlert("You can only upload up to 4 images", "error");
          return;
        }
        setImages([...images, ...selectedUris]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showAlert("An error occurred while picking images.", "error");
    }
  };

  const handlePost = async () => {
    if (!post.trim()) {
      showAlert("Post cannot be empty.", "error");
      return;
    }

    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        showAlert("User not logged in.", "error");
        setLoading(false);
        return;
      }

      // Upload all images and store URLs
      const uploadedUrls = [];
      for (const uri of images) {
        const url = await handleImageUpload(uri, "post");
        if (url) uploadedUrls.push(url);
      }

      const postRef = doc(
        FIRESTORE_DB,
        "post",
        new Date().getTime().toString()
      );
      await setDoc(postRef, {
        userId,
        firstName,
        lastName,
        avatarUrl,
        post,
        images: uploadedUrls, // Save array of images
        timestamp: serverTimestamp(),
      });

      setPost("");
      setImages([]);
      showAlert("Post created successfully!", "success");
    } catch (error) {
      console.error("Error posting:", error);
      showAlert("Failed to post.", "error");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={100} color="#E1E2E6" />
        )}

        <Text style={styles.userName}>
          {firstName} {lastName}
        </Text>
        <View style={styles.postButton}>
          <CustomButton
            title={loading ? "Posting..." : "Post"}
            onPress={handlePost}
            disabled={loading}
          />
        </View>
        <PostField
          placeholder="Type Something... Use #hashtags to make your post discoverable!"
          value={post}
          onChangeText={setPost}
          style={styles.postField}
        />

        {/* Hashtag helper */}
        <View style={styles.hashtagHelper}>
          <Text style={styles.hashtagHelperText}>
            Add hashtags like #travel #food #nature to help others find your
            post
          </Text>
        </View>

        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={handleImagePicker}
        >
          <Ionicons name="image" size={24} color="#FF3A7C" />
          <Text style={styles.imagePickerText}>Add Photos</Text>
        </TouchableOpacity>

        {/* Display selected images */}
        <View style={styles.imagePreviewContainer}>
          {images.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.imagePreview} />
          ))}
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
    backgroundColor: "#F9F9F9",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: "#E1E2E6",
    marginBottom: 15,
    position: "absolute",
    left: 30,
    top: 120,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    position: "absolute",
    top: 130,
    left: 120,
  },
  postButton: {
    position: "absolute",
    right: 20,
    top: 120,
  },
  postField: {
    position: "absolute",
    top: 160,
    marginTop: 20,
  },
  hashtagHelper: {
    position: "absolute",
    top: 370,
    left: 30,
    right: 30,
    backgroundColor: "#F8F9FA",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FF3A7C",
  },
  hashtagHelperText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 20,
    position: "absolute",
    top: 430,
    left: 30,
  },
  imagePickerText: {
    marginLeft: 5,
    color: "#FF3A7C",
    fontWeight: "bold",
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    position: "absolute",
    top: 500,
    left: 80,
    right: 30,
  },
  imagePreview: {
    width: 120,
    height: 120,
    margin: 5,
    borderRadius: 8,
  },
});

export default Post;
