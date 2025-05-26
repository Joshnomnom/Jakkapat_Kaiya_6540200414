import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  doc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { FIRESTORE_DB, auth } from "../services/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import Likes from "../components/Likes";
import CustomModals from "../components/CustomModal";
import FollowButton from "../components/FollowButton";
import FollowCount from "../components/FollowCount";
import Comments from "../components/Comments";
import { Modal } from "react-native";

const FriendProfile = ({ route, navigation }) => {
  const { friendId } = route.params;
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  const showAlert = (message, type = "error") => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };
  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalVisible(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setIsImageModalVisible(false);
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(FIRESTORE_DB, "users", friendId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAvatarUrl(userData.profilePicture || null);
        setFirstName(userData.firstName || "Unknown");
        setLastName(userData.lastName || "Unknown");
      } else {
        showAlert("Friend data not found.", "error");
      }

      const postsQuery = query(
        collection(FIRESTORE_DB, "post"),
        where("userId", "==", friendId)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const userPosts = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      userPosts.sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || new Date(0);
        const dateB = b.timestamp?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setPosts(userPosts);
    } catch (error) {
      console.error("Error fetching friend data:", error);
      showAlert("Failed to load friend data.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.profileBox}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={100} color="#E1E2E6" />
        )}
        <Text style={styles.userName}>
          {firstName} {lastName}
        </Text>
        <View style={{ position: "absolute", top: 70, left: 150, zIndex: 100 }}>
          <FollowCount userId={friendId} />
        </View>
        {currentUserId && currentUserId !== friendId && (
          <View
            style={{ position: "absolute", top: 160, left: 160, zIndex: 100 }}
          >
            <FollowButton
              currentUserId={currentUserId}
              targetUserId={friendId}
            />
          </View>
        )}
      </View>
      <View style={styles.postBox}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : posts.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No posts found.
          </Text>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <View style={styles.postItem}>
                <View style={styles.postHeader}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.miniAvatar}
                    />
                  ) : (
                    <Ionicons
                      name="person-circle-outline"
                      size={45}
                      color="#E1E2E6"
                    />
                  )}
                  <Text style={styles.miniUserName}>
                    {firstName} {lastName}
                  </Text>
                </View>
                <Text style={styles.postText}>{item.post}</Text>
                {item.images && item.images.length > 0 && (
                  <View style={styles.postImagesContainer}>
                    {item.images.map((imageUrl, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => openImageModal(imageUrl)}
                      >
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.postImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.footerPost}>
                  <Likes postID={item.id} userID={friendId} />
                  <Comments postID={item.id} />
                </View>
              </View>
            )}
          />
        )}
        {selectedImage && (
          <Modal visible={isImageModalVisible} transparent={true}>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeImageModal}
              >
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>
          </Modal>
        )}
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
  profileBox: {
    width: "100%",
    height: 230,
    backgroundColor: "#D9D9D9",
    marginVertical: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 70,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E1E2E6",
    position: "absolute",
    left: 40,
    top: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    position: "absolute",
    top: 50,
    left: 160,
  },
  postItem: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    // marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  postText: {
    fontSize: 16,
    color: "#000000",
    marginLeft: 60,
    marginBottom: 20,
  },
  miniAvatar: {
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: "#E1E2E6",
    marginRight: 15,
  },
  miniUserName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  postBox: {
    width: "100%",
    flex: 1,
    marginTop: 310,
    marginBottom: 65,
  },
  footerPost: {
    flexDirection: "row",
    marginLeft: 60,
  },
  footerPostImage: {
    width: 22,
    height: 22,
    marginRight: 30,
  },
  postImagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 60,
    marginBottom: 15,
  },
  postImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    margin: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
});

export default FriendProfile;
