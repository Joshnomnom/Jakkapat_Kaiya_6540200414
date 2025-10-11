import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { FIRESTORE_DB, auth } from "../services/FirebaseConfig";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Likes from "../components/Likes";
import { Ionicons } from "@expo/vector-icons";
import Comments from "../components/Comments";
import { Modal } from "react-native";

const Home = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentUserId = auth.currentUser.uid;
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalVisible(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setIsImageModalVisible(false);
  };

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const followsQuery = query(
          collection(FIRESTORE_DB, "follows"),
          where("followerId", "==", currentUserId)
        );
        const followsSnapshot = await getDocs(followsQuery);
        const followingIds = followsSnapshot.docs.map(
          (doc) => doc.data().followingId
        );

        const allPostsPromises = followingIds.map(async (userId) => {
          const postsQuery = query(
            collection(FIRESTORE_DB, "post"),
            where("userId", "==", userId)
          );
          const postsSnapshot = await getDocs(postsQuery);
          const userDoc = await getDoc(doc(FIRESTORE_DB, "users", userId));
          const userData = userDoc.exists() ? userDoc.data() : {};

          return postsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            userId,
            firstName: userData.firstName || "Unknown",
            lastName: userData.lastName || "User",
            avatarUrl: userData.profilePicture || null,
          }));
        });

        const results = await Promise.all(allPostsPromises);
        const mergedPosts = results.flat();

        mergedPosts.sort((a, b) => {
          const dateA = a.timestamp?.toDate?.() ?? new Date(0);
          const dateB = b.timestamp?.toDate?.() ?? new Date(0);
          return dateB - dateA;
        });

        setPosts(mergedPosts);
      } catch (error) {
        console.error("Error loading feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const navigateToProfile = (userId) => {
    if (userId === currentUserId) {
      navigation.navigate("Profile");
    } else {
      navigation.navigate("FriendProfile", { friendId: userId });
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postItem}>
      <TouchableOpacity
        style={styles.postHeader}
        onPress={() => navigateToProfile(item.userId)}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.miniAvatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={45} color="#E1E2E6" />
        )}
        <Text style={styles.miniUserName}>
          {item.firstName} {item.lastName}
        </Text>
      </TouchableOpacity>
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
        <Likes postID={item.id} userID={currentUserId} />
        <Comments postID={item.id} />
      </View>
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
  );

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.postContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : posts.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No posts found, Follow someone to see their posts!{" "}
          </Text>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderPost}
          />
        )}
      </View>
      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  postContainer: {
    flex: 1,
    marginTop: 90,
    marginBottom: 65,
  },
  postItem: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  postText: {
    fontSize: 16,
    color: "#000000",
    marginLeft: 60,
    marginBottom: 10,
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
  postImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    margin: 2,
  },
  postImagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 60,
    marginBottom: 15,
  },
  footerPost: {
    flexDirection: "row",
    marginLeft: 60,
    marginTop: 10,
  },
  footerPostImage: {
    width: 22,
    height: 22,
    marginRight: 30,
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

export default Home;
