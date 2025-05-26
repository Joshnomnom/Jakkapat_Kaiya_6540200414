import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { FIRESTORE_DB, auth } from "../services/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CommentInput from "../components/CommentInput";

const CommentSection = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { postID } = route.params;
  const [comments, setComments] = useState([]);
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState({});
  const flatListRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [error, setError] = useState(null);

  // Function to fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      // Check if we already have this user's profile
      if (userProfiles[userId]) {
        return userProfiles[userId];
      }

      const userDoc = await getDoc(doc(FIRESTORE_DB, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          name: `${userData.firstName} ${userData.lastName}`,
          avatar: userData.profilePicture || null,
        };
      } else {
        return {
          name: "Unknown User",
          avatar: null,
        };
      }
    } catch (error) {
      console.error(`Error fetching user ${userId} data:`, error);
      return {
        name: "Unknown User",
        avatar: null,
      };
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    try {
      // Query comments for this post
      const q = query(
        collection(FIRESTORE_DB, "comments"),
        where("postID", "==", postID),
        orderBy("timestamp", "desc")
      );

      // Set up real-time listener for comments
      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          if (!isMounted) return;

          try {
            const commentsList = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Get unique user IDs from comments
            const userIds = [
              ...new Set(commentsList.map((comment) => comment.userID)),
            ];
            const updatedUserProfiles = { ...userProfiles };

            // Fetch user profiles in parallel
            const userProfilePromises = userIds.map(async (userId) => {
              const profile = await fetchUserProfile(userId);
              return { userId, profile };
            });

            const userProfileResults = await Promise.all(userProfilePromises);
            userProfileResults.forEach(({ userId, profile }) => {
              updatedUserProfiles[userId] = profile;
            });

            if (isMounted) {
              setUserProfiles(updatedUserProfiles);
              setComments(commentsList);

              // Now fetch replies for each comment
              const repliesPromises = commentsList.map(async (comment) => {
                try {
                  const repliesQuery = query(
                    collection(FIRESTORE_DB, "replies"),
                    where("commentId", "==", comment.id),
                    orderBy("timestamp", "asc")
                  );

                  const repliesSnapshot = await getDocs(repliesQuery);
                  const commentReplies = repliesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }));

                  return { commentId: comment.id, replies: commentReplies };
                } catch (error) {
                  console.error(
                    `Error fetching replies for comment ${comment.id}:`,
                    error
                  );
                  return { commentId: comment.id, replies: [] };
                }
              });

              const repliesResults = await Promise.all(repliesPromises);
              const repliesObj = {};

              // Process replies and get user profiles for reply authors
              const replyUserIds = new Set();

              repliesResults.forEach(({ commentId, replies }) => {
                if (replies.length > 0) {
                  repliesObj[commentId] = replies;
                  replies.forEach((reply) => {
                    replyUserIds.add(reply.userId);
                  });
                }
              });

              // Fetch profiles for reply authors
              if (replyUserIds.size > 0) {
                const replyUserProfilePromises = Array.from(replyUserIds)
                  .map(async (userId) => {
                    if (!updatedUserProfiles[userId]) {
                      const profile = await fetchUserProfile(userId);
                      return { userId, profile };
                    }
                    return null;
                  })
                  .filter(Boolean);

                const replyUserProfileResults = await Promise.all(
                  replyUserProfilePromises
                );
                replyUserProfileResults.forEach((result) => {
                  if (result) {
                    updatedUserProfiles[result.userId] = result.profile;
                  }
                });
              }

              if (isMounted) {
                setReplies(repliesObj);
                setUserProfiles(updatedUserProfiles);
                setLoading(false);
              }
            }
          } catch (error) {
            console.error("Error processing comments data:", error);
            if (isMounted) {
              setError("Failed to load comments. Please try again.");
              setLoading(false);
            }
          }
        },
        (error) => {
          console.error("Error in comments snapshot listener:", error);
          if (isMounted) {
            setError("Failed to load comments. Please try again.");
            setLoading(false);
          }
        }
      );

      // Clean up listener on unmount
      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up comments listener:", error);
      if (isMounted) {
        setError("Failed to load comments. Please try again.");
        setLoading(false);
      }
    }
  }, [postID]);

  // Set up a separate listener for replies to update in real-time
  useEffect(() => {
    if (comments.length === 0) return;

    let isMounted = true;

    // Create a listener for the replies collection
    const repliesQuery = query(
      collection(FIRESTORE_DB, "replies"),
      where("postID", "==", postID)
    );

    const unsubscribe = onSnapshot(
      repliesQuery,
      async (snapshot) => {
        if (!isMounted) return;

        try {
          // Group replies by commentId
          const repliesObj = {};
          const replyUserIds = new Set();

          snapshot.docs.forEach((doc) => {
            const reply = { id: doc.id, ...doc.data() };
            const commentId = reply.commentId;

            if (!repliesObj[commentId]) {
              repliesObj[commentId] = [];
            }

            repliesObj[commentId].push(reply);
            replyUserIds.add(reply.userId);
          });

          // Sort replies by timestamp
          Object.keys(repliesObj).forEach((commentId) => {
            repliesObj[commentId].sort((a, b) => {
              const timeA = a.timestamp?.toDate?.() || new Date(0);
              const timeB = b.timestamp?.toDate?.() || new Date(0);
              return timeA - timeB;
            });
          });

          // Fetch any missing user profiles
          const updatedUserProfiles = { ...userProfiles };
          const missingUserIds = Array.from(replyUserIds).filter(
            (userId) => !updatedUserProfiles[userId]
          );

          if (missingUserIds.length > 0) {
            const userProfilePromises = missingUserIds.map(async (userId) => {
              const profile = await fetchUserProfile(userId);
              return { userId, profile };
            });

            const userProfileResults = await Promise.all(userProfilePromises);
            userProfileResults.forEach(({ userId, profile }) => {
              updatedUserProfiles[userId] = profile;
            });

            if (isMounted) {
              setUserProfiles(updatedUserProfiles);
            }
          }

          if (isMounted) {
            setReplies(repliesObj);
          }
        } catch (error) {
          console.error("Error processing replies update:", error);
        }
      },
      (error) => {
        console.error("Error in replies snapshot listener:", error);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [postID, comments.length]);

  const handleReply = (comment) => {
    const userProfile = userProfiles[comment.userID];
    const userName = userProfile ? userProfile.name : "Unknown User";

    setReplyingTo({
      commentId: comment.id,
      userName: userName,
    });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleCommentAdded = () => {
    // Clear reply state after comment is added
    setReplyingTo(null);

    // Scroll to top to show the new comment
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const renderReply = (reply, commentId) => {
    const userProfile = userProfiles[reply.userId] || {
      name: "Loading...",
      avatar: null,
    };
    const isCurrentUser = reply.userId === auth.currentUser?.uid;

    return (
      <View key={reply.id} style={styles.replyItem}>
        <View style={styles.replyHeader}>
          {userProfile.avatar ? (
            <Image
              source={{ uri: userProfile.avatar }}
              style={styles.replyAvatar}
            />
          ) : (
            <View style={styles.replyAvatarPlaceholder}>
              <Ionicons name="person-outline" size={16} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.replyContent}>
            <Text style={styles.replyUserName}>
              {isCurrentUser ? "You" : userProfile.name}
            </Text>
            <Text style={styles.replyText}>{reply.reply}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderComment = ({ item }) => {
    const userProfile = userProfiles[item.userID] || {
      name: "Loading...",
      avatar: null,
    };
    const isCurrentUser = item.userID === auth.currentUser?.uid;
    const commentReplies = replies[item.id] || [];
    const hasReplies = commentReplies.length > 0;
    const isExpanded = expandedComments[item.id] || false;

    return (
      <View style={styles.commentItem}>
        <View style={styles.commentHeader}>
          {userProfile.avatar ? (
            <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={20} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.commentContent}>
            <Text style={styles.userName}>
              {isCurrentUser ? "You" : userProfile.name}
            </Text>
            <Text style={styles.commentText}>{item.comment}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleReply(item)}
              >
                <Text style={styles.actionText}>Reply</Text>
              </TouchableOpacity>
              {hasReplies && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleReplies(item.id)}
                >
                  <Text style={styles.actionText}>
                    {isExpanded
                      ? "Hide replies"
                      : `View ${commentReplies.length} ${
                          commentReplies.length === 1 ? "reply" : "replies"
                        }`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Render replies if expanded */}
        {isExpanded && hasReplies && (
          <View style={styles.repliesContainer}>
            {commentReplies.map((reply) => renderReply(reply, item.id))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF3A7C" />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                setError(null);
                // The useEffect will re-run and retry fetching
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No comments yet. Be the first to comment!
              </Text>
            }
            contentContainerStyle={styles.commentsList}
            // Add bottom padding to ensure content isn't hidden behind the input
            contentInset={{ bottom: 120 }}
            contentInsetAdjustmentBehavior="automatic"
          />
        )}
      </View>

      <CommentInput
        postID={postID}
        onCommentAdded={handleCommentAdded}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />
      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    marginTop: 110,
    marginBottom: 130,
  },
  commentsList: {
    padding: 10,
  },
  commentItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 10,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  userName: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  commentText: {
    fontSize: 14,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    paddingVertical: 5,
  },
  actionText: {
    color: "#666666",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 20,
    color: "#666",
  },
  repliesContainer: {
    marginLeft: 50,
    marginTop: 5,
  },
  replyItem: {
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  replyAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  replyAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyUserName: {
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 3,
  },
  replyText: {
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#FF3A7C",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#FF3A7C",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default CommentSection;
