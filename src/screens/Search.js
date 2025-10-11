import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FIRESTORE_DB, auth } from "../services/FirebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import CustomModals from "../components/CustomModal";
import { useNavigation } from "@react-navigation/native";
import Likes from "../components/Likes";
import Comments from "../components/Comments";

const Search = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");
  const [searchType, setSearchType] = useState("users");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const searchTimeoutRef = useRef(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const currentUserId = auth.currentUser?.uid;

  const showAlert = (message, type = "error") => {
    setModalVisible(true);
    setModalType(type);
    setModalMessage(message);
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalVisible(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setIsImageModalVisible(false);
  };

  const extractHashtags = (text) => {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex) || [];
  };

  const fetchSuggestedUsers = async () => {
    try {
      setLoadingSuggestions(true);

      const currentUserId = auth.currentUser?.uid;

      const postsRef = collection(FIRESTORE_DB, "post");
      const postsSnapshot = await getDocs(postsRef);

      const userPostCounts = {};
      postsSnapshot.docs.forEach((doc) => {
        const postData = doc.data();
        const userId = postData.userId;
        if (userId) {
          userPostCounts[userId] = (userPostCounts[userId] || 0) + 1;
        }
      });

      const usersRef = collection(FIRESTORE_DB, "users");
      const usersSnapshot = await getDocs(usersRef);

      const usersWithPostCounts = [];
      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        const userId = doc.id;
        const postCount = userPostCounts[userId] || 0;

        if (postCount > 0 && userId !== currentUserId) {
          usersWithPostCounts.push({
            id: userId,
            ...userData,
            postCount,
          });
        }
      });

      const topUsers = usersWithPostCounts
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, 5);

      setSuggestedUsers(topUsers);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSearch = (searchText) => {
    setSearchQuery(searchText);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchText.trim().length === 0) {
      setUserResults([]);
      setPostResults([]);
      setSearchType("users");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (searchText.startsWith("#")) {
          setSearchType("posts");
          await searchPostsByHashtag(searchText);
        } else {
          setSearchType("users");
          await searchUsers(searchText);
        }
      } catch (error) {
        console.error("Error searching:", error);
        showAlert("Search failed. Please try again.", "error");
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const searchUsers = async (searchText) => {
    try {
      const usersRef = collection(FIRESTORE_DB, "users");
      const searchLower = searchText.toLowerCase();

      const allUsersSnapshot = await getDocs(usersRef);
      const allUsers = allUsersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const filteredUsers = allUsers.filter((user) => {
        const firstName = (user.firstName || "").toLowerCase();
        const lastName = (user.lastName || "").toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();

        return (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          fullName.includes(searchLower) ||
          firstName.startsWith(searchLower) ||
          lastName.startsWith(searchLower) ||
          fullName.startsWith(searchLower)
        );
      });

      const sortedUsers = filteredUsers.sort((a, b) => {
        const aFirstName = (a.firstName || "").toLowerCase();
        const aLastName = (a.lastName || "").toLowerCase();
        const aFullName = `${aFirstName} ${aLastName}`.trim();

        const bFirstName = (b.firstName || "").toLowerCase();
        const bLastName = (b.lastName || "").toLowerCase();
        const bFullName = `${bFirstName} ${bLastName}`.trim();

        const getScore = (firstName, lastName, fullName) => {
          if (
            firstName === searchLower ||
            lastName === searchLower ||
            fullName === searchLower
          )
            return 1;
          if (
            firstName.startsWith(searchLower) ||
            lastName.startsWith(searchLower) ||
            fullName.startsWith(searchLower)
          )
            return 2;
          return 3;
        };

        return (
          getScore(aFirstName, aLastName, aFullName) -
          getScore(bFirstName, bLastName, bFullName)
        );
      });

      setUserResults(sortedUsers);
      setPostResults([]);
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  };

  const searchPostsByHashtag = async (hashtag) => {
    try {
      const postsRef = collection(FIRESTORE_DB, "post");
      const postsSnapshot = await getDocs(postsRef);

      const matchingPosts = [];

      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        const postText = postData.post || "";

        const postHashtags = extractHashtags(postText);

        if (
          postHashtags.some(
            (tag) => tag.toLowerCase() === hashtag.toLowerCase()
          )
        ) {
          const userDoc = await getDoc(
            doc(FIRESTORE_DB, "users", postData.userId)
          );
          const userData = userDoc.exists() ? userDoc.data() : {};

          matchingPosts.push({
            id: postDoc.id,
            ...postData,
            firstName: userData.firstName || "Unknown",
            lastName: userData.lastName || "User",
            avatarUrl: userData.profilePicture || null,
          });
        }
      }

      matchingPosts.sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || new Date(0);
        const dateB = b.timestamp?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setPostResults(matchingPosts);
      setUserResults([]);
    } catch (error) {
      console.error("Error searching posts by hashtag:", error);
      throw error;
    }
  };

  const renderUserItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() =>
          navigation.navigate("FriendProfile", { friendId: item.id })
        }
      >
        <View style={styles.userItemContent}>
          {item.profilePicture ? (
            <Image
              source={{ uri: item.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons
                name="person-circle-outline"
                size={50}
                color="#E1E2E6"
              />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.resultName}>
              {item.firstName} {item.lastName}
            </Text>
            {item.gender && (
              <Text style={styles.userDetails}>
                {item.gender.charAt(0).toUpperCase() + item.gender.slice(1)}
              </Text>
            )}
            <Text style={styles.userJoinDate}>
              Joined{" "}
              {item.timestamp?.toDate?.()?.toLocaleDateString() || "Recently"}
            </Text>
          </View>
          <View style={styles.userActions}>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSuggestedUserItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.suggestedUserItem}
        onPress={() =>
          navigation.navigate("FriendProfile", { friendId: item.id })
        }
      >
        <View style={styles.suggestedUserContent}>
          {item.profilePicture ? (
            <Image
              source={{ uri: item.profilePicture }}
              style={styles.suggestedAvatar}
            />
          ) : (
            <View style={styles.suggestedAvatarPlaceholder}>
              <Ionicons
                name="person-circle-outline"
                size={40}
                color="#E1E2E6"
              />
            </View>
          )}
          <View style={styles.suggestedUserInfo}>
            <Text style={styles.suggestedUserName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.suggestedUserPosts}>
              {item.postCount} post{item.postCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const navigateToProfile = (userId) => {
    if (userId === currentUserId) {
      navigation.navigate("Profile");
    } else {
      navigation.navigate("FriendProfile", { friendId: userId });
    }
  };

  const renderPostItem = ({ item }) => (
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
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Search by name or #hashtags"
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {searchQuery.length > 0 && (
        <View style={styles.searchTypeIndicator}>
          <Text style={styles.searchTypeText}>
            {searchType === "users"
              ? `👤 ${userResults.length} user${
                  userResults.length !== 1 ? "s" : ""
                } found`
              : `🏷️ ${postResults.length} post${
                  postResults.length !== 1 ? "s" : ""
                } with hashtag`}
          </Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#FF3A7C" style={styles.loader} />
      ) : searchQuery.length > 0 ? (
        <View style={styles.searchResultsContainer}>
          <FlatList
            data={searchType === "users" ? userResults : postResults}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.noResults}>
                {searchType === "users"
                  ? "No users found"
                  : "No posts found with this hashtag"}
              </Text>
            }
            renderItem={
              searchType === "users" ? renderUserItem : renderPostItem
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      ) : (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggested Users</Text>
          <Text style={styles.suggestionsSubtitle}>
            Most active users on the platform
          </Text>
          {loadingSuggestions ? (
            <ActivityIndicator
              size="small"
              color="#FF3A7C"
              style={styles.suggestionsLoader}
            />
          ) : (
            <FlatList
              data={suggestedUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderSuggestedUserItem}
              ListEmptyComponent={
                <Text style={styles.noSuggestions}>No active users found</Text>
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
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

      <Footer navigation={navigation} />
      <CustomModals
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalType}
        confirmText="OK"
        message={modalMessage}
        type={modalType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchContainer: {
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
    position: "absolute",
    top: 90,
    width: "100%",
    paddingBottom: 15,
  },
  searchResultsContainer: {
    flex: 1,
    position: "absolute",
    top: 180,
    width: "100%",
    bottom: 0,
  },
  search: {
    backgroundColor: "#E1E2E6",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    fontSize: 16,
    color: "#000000",
    height: 50,
    borderWidth: 1,
    borderColor: "#D0D0D0",
  },
  loader: {
    position: "absolute",
    top: 200,
    alignSelf: "center",
    width: "100%",
  },
  noResults: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginTop: 30,
    paddingHorizontal: 20,
  },
  resultItem: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  resultName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E1E2E6",
  },
  searchTypeIndicator: {
    backgroundColor: "#F0F0F0",
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    borderRadius: 15,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  searchTypeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  userItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  userJoinDate: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  userActions: {
    paddingLeft: 10,
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    position: "absolute",
    top: 180,
    width: "100%",
    bottom: 0,
  },
  suggestionsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    alignItems: "center",
  },
  suggestionsSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  suggestionsLoader: {
    marginTop: 20,
  },
  noSuggestions: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginTop: 50,
  },
  suggestedUserItem: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestedUserContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  suggestedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E1E2E6",
    marginRight: 12,
  },
  suggestedAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  suggestedUserInfo: {
    flex: 1,
  },
  suggestedUserName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  suggestedUserPosts: {
    fontSize: 12,
    color: "#FF3A7C",
    fontWeight: "500",
  },
  postItem: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  miniAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#E1E2E6",
    marginRight: 15,
  },
  miniUserName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  postText: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 15,
    lineHeight: 22,
  },
  postImagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  postImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    margin: 2,
  },
  footerPost: {
    flexDirection: "row",
    alignItems: "center",
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

export default Search;
