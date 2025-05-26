import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { FIRESTORE_DB } from "../services/FirebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const FollowButton = ({ currentUserId, targetUserId }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followDocId, setFollowDocId] = useState(null);

  useEffect(() => {
    const checkFollowing = async () => {
      const q = query(
        collection(FIRESTORE_DB, "follows"),
        where("followerId", "==", currentUserId),
        where("followingId", "==", targetUserId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setIsFollowing(true);
        setFollowDocId(snapshot.docs[0].id);
      }
    };

    if (currentUserId && targetUserId) {
      checkFollowing();
    }
  }, [currentUserId, targetUserId]);

  const handlePress = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await deleteDoc(doc(FIRESTORE_DB, "follows", followDocId));
        setIsFollowing(false);
        setFollowDocId(null);
      } else {
        const docRef = await addDoc(collection(FIRESTORE_DB, "follows"), {
          followerId: currentUserId,
          followingId: targetUserId,
          followedAt: serverTimestamp(),
        });
        setIsFollowing(true);
        setFollowDocId(docRef.id);
      }
    } catch (error) {
      console.error("error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      style={[
        styles.container,
        { backgroundColor: isFollowing ? "#BA184E" : "#FF3A7C" },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text style={styles.text}>{isFollowing ? "Following" : "Follow"}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    width: 100,
    height: 40,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default FollowButton;
