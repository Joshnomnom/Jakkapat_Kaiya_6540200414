import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Image,
  Text,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
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
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { auth } from "../services/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import CustomModals from "../components/CustomModal";
import { FIRESTORE_DB } from "../services/FirebaseConfig";
import Likes from "../components/Likes";
import FollowCount from "../components/FollowCount";
import Comments from "../components/Comments";
import EditProfile from "./EditProfile";

const Profile = ({ navigation }) => {
  // Get userId in a safe way
  const [userId, setUserId] = useState(null);
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
  const [showPostMenu, setShowPostMenu] = useState(null); // { postId: string, x: number, y: number }
  const [editingPost, setEditingPost] = useState(null); // { postId: string, text: string }
  const [editPostText, setEditPostText] = useState("");

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        showAlert("User not logged in. Please log in and try again.", "error");
        navigation.navigate("SignIn");
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("No current user found during refresh");
        setRefreshing(false);
        return;
      }

      const currentUserId = currentUser.uid;

      // Get user profile data
      const userDoc = await getDoc(doc(FIRESTORE_DB, "users", currentUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAvatarUrl(userData.profilePicture || null);
        setFirstName(userData.firstName || "Unknown");
        setLastName(userData.lastName || "Unknown");
      } else {
        console.log("User document does not exist");
      }

      // Get user posts
      const postsQuery = query(
        collection(FIRESTORE_DB, "post"),
        where("userId", "==", currentUserId)
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
      console.error("Error fetching user data:", error);
      console.log("Refresh error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, []);

  // Post menu handlers
  const handlePostMenuPress = (postId, event) => {
    const { pageX, pageY } = event.nativeEvent;
    setShowPostMenu({ postId, x: pageX, y: pageY });
  };

  const handleClosePostMenu = () => {
    setShowPostMenu(null);
  };

  const handleEditPost = (postId, currentText) => {
    setEditingPost({ postId });
    setEditPostText(currentText);
    setShowPostMenu(null);
  };

  const handleSavePostEdit = async () => {
    if (!editingPost || !editPostText.trim()) return;

    try {
      await updateDoc(doc(FIRESTORE_DB, "post", editingPost.postId), {
        post: editPostText.trim(),
        editedAt: new Date(),
      });

      setEditingPost(null);
      setEditPostText("");
      showAlert("Post updated successfully!", "success");
      fetchUserData(); // Refresh posts
    } catch (error) {
      console.error("Error updating post:", error);
      showAlert("Failed to update post. Please try again.", "error");
    }
  };

  const handleCancelPostEdit = () => {
    setEditingPost(null);
    setEditPostText("");
  };

  const handleDeletePost = async (postId) => {
    try {
      Alert.alert(
        "Delete Post",
        "Are you sure you want to delete this post? This will also delete all comments and replies.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              // Delete the post
              await deleteDoc(doc(FIRESTORE_DB, "post", postId));

              // Delete all comments for this post
              const commentsQuery = query(
                collection(FIRESTORE_DB, "comments"),
                where("postID", "==", postId)
              );
              const commentsSnapshot = await getDocs(commentsQuery);
              const deleteCommentPromises = commentsSnapshot.docs.map((doc) =>
                deleteDoc(doc.ref)
              );

              // Delete all replies for this post
              const repliesQuery = query(
                collection(FIRESTORE_DB, "replies"),
                where("postID", "==", postId)
              );
              const repliesSnapshot = await getDocs(repliesQuery);
              const deleteReplyPromises = repliesSnapshot.docs.map((doc) =>
                deleteDoc(doc.ref)
              );

              // Delete all likes for this post
              const likesQuery = query(
                collection(FIRESTORE_DB, "likes"),
                where("postID", "==", postId)
              );
              const likesSnapshot = await getDocs(likesQuery);
              const deleteLikePromises = likesSnapshot.docs.map((doc) =>
                deleteDoc(doc.ref)
              );

              await Promise.all([
                ...deleteCommentPromises,
                ...deleteReplyPromises,
                ...deleteLikePromises,
              ]);

              setShowPostMenu(null);
              showAlert("Post deleted successfully!", "success");
              fetchUserData(); // Refresh posts
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting post:", error);
      showAlert("Failed to delete post. Please try again.", "error");
    }
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
        <TouchableOpacity
          style={{ position: "absolute", top: 47, left: 350, zIndex: 100 }}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Ionicons name="menu" size={35} color="#000000" />
        </TouchableOpacity>
      </View>
      <View style={{ position: "absolute", top: 200, left: 140, zIndex: 100 }}>
        <FollowCount userId={userId} />
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
            renderItem={({ item }) => {
              const isEditing = editingPost?.postId === item.id;

              return (
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
                    <View style={styles.postHeaderContent}>
                      <Text style={styles.miniUserName}>
                        {firstName} {lastName}
                      </Text>
                      <TouchableOpacity
                        style={styles.postMenuButton}
                        onPress={(event) => handlePostMenuPress(item.id, event)}
                      >
                        <Ionicons
                          name="ellipsis-horizontal"
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isEditing ? (
                    <View style={styles.editPostContainer}>
                      <TextInput
                        style={styles.editPostInput}
                        value={editPostText}
                        onChangeText={setEditPostText}
                        multiline
                        autoFocus
                      />
                      <View style={styles.editPostActions}>
                        <TouchableOpacity
                          style={styles.editPostButton}
                          onPress={handleCancelPostEdit}
                        >
                          <Text style={styles.editPostButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.editPostButton, styles.savePostButton]}
                          onPress={handleSavePostEdit}
                        >
                          <Text
                            style={[
                              styles.editPostButtonText,
                              styles.savePostButtonText,
                            ]}
                          >
                            Save
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.postText}>{item.post}</Text>
                  )}

                  {/* Display post images */}
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
                    <Likes postID={item.id} userID={userId} />
                    <Comments postID={item.id} />
                  </View>
                </View>
              );
            }}
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

      {/* Post Menu Modal */}
      <Modal
        visible={showPostMenu !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePostMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClosePostMenu}
        >
          {showPostMenu && (
            <View
              style={[
                styles.postMenuContainer,
                {
                  position: "absolute",
                  top: Math.max(
                    10,
                    Math.min(
                      showPostMenu.y - 60,
                      Dimensions.get("window").height - 120
                    )
                  ),
                  left: Math.max(
                    10,
                    Math.min(
                      showPostMenu.x - 75,
                      Dimensions.get("window").width - 160
                    )
                  ),
                },
              ]}
            >
              <View style={styles.postMenuTriangle} />
              <TouchableOpacity
                style={styles.postMenuItem}
                onPress={() => {
                  const post = posts.find((p) => p.id === showPostMenu.postId);
                  handleEditPost(showPostMenu.postId, post?.post || "");
                }}
              >
                <Ionicons name="create-outline" size={20} color="#333" />
                <Text style={styles.postMenuText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.postMenuItem, styles.deletePostMenuItem]}
                onPress={() => handleDeletePost(showPostMenu.postId)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3A7C" />
                <Text style={[styles.postMenuText, styles.deletePostMenuText]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Modal>

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
  // Post header styles
  postHeaderContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postMenuButton: {
    padding: 5,
    borderRadius: 15,
  },
  // Post menu styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  postMenuContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postMenuTriangle: {
    position: "absolute",
    top: -5,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
  },
  postMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deletePostMenuItem: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  postMenuText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  deletePostMenuText: {
    color: "#FF3A7C",
  },
  // Post edit styles
  editPostContainer: {
    marginTop: 5,
    marginLeft: 60,
  },
  editPostInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  editPostActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  editPostButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  savePostButton: {
    backgroundColor: "#FF3A7C",
    borderColor: "#FF3A7C",
  },
  editPostButtonText: {
    fontSize: 14,
    color: "#666",
  },
  savePostButtonText: {
    color: "#FFFFFF",
  },
});

export default Profile;
