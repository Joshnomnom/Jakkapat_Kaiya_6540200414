import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { FIRESTORE_DB, auth } from "../services/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const CommentInput = ({
  postID,
  onCommentAdded,
  replyingTo,
  onCancelReply,
}) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDoc = await getDoc(
            doc(FIRESTORE_DB, "users", currentUser.uid)
          );
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(`${userData.firstName} ${userData.lastName}`);
            setUserAvatar(userData.profilePicture || null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to comment");
      return;
    }

    setIsSubmitting(true);
    try {
      if (replyingTo) {
        await addDoc(collection(FIRESTORE_DB, "replies"), {
          commentId: replyingTo.commentId,
          userId: currentUser.uid,
          reply: comment.trim(),
          timestamp: serverTimestamp(),
          postID: postID,
        });
        console.log("Reply added successfully");
      } else {
        await addDoc(collection(FIRESTORE_DB, "comments"), {
          postID: postID,
          userID: currentUser.uid,
          comment: comment.trim(),
          timestamp: serverTimestamp(),
        });
        console.log("Comment added successfully");
      }

      setComment("");
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error("Error adding comment/reply:", error);
      Alert.alert("Error", "Failed to post your comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <View style={styles.container}>
        {replyingTo && (
          <View style={styles.replyingToContainer}>
            <Text style={styles.replyingToText}>
              Replying to{" "}
              <Text style={styles.replyingToName}>{replyingTo.userName}</Text>
            </Text>
            <TouchableOpacity
              onPress={onCancelReply}
              style={styles.cancelReplyButton}
            >
              <Ionicons name="close-circle" size={18} color="#666666" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.userInfo}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={20} color="#FFFFFF" />
            </View>
          )}
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={
              replyingTo
                ? `Reply to ${replyingTo.userName}...`
                : "Type something"
            }
            value={comment}
            onChangeText={setComment}
            multiline={true}
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!comment.trim() || isSubmitting) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !comment.trim()}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    position: "absolute",
    bottom: 65,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  container: {
    padding: 10,
  },
  replyingToContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F8F8",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: "#666666",
  },
  replyingToName: {
    fontWeight: "bold",
    color: "#FF3A7C",
  },
  cancelReplyButton: {
    padding: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  userName: {
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#FF3A7C",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
});

export default CommentInput;
