import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, View, Image } from "react-native";
import { FIRESTORE_DB } from "../services/FirebaseConfig";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

const Likes = ({ postID, userID }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (!postID || !userID) return;

    const likeCollectionRef = collection(FIRESTORE_DB, "post", postID, "likes");

    // Listen to like count and check if current user has liked
    const unsubscribe = onSnapshot(likeCollectionRef, (snapshot) => {
      setLikeCount(snapshot.size);
      setLiked(snapshot.docs.some((doc) => doc.id === userID));
    });

    return () => unsubscribe();
  }, [postID, userID]);

  const toggleLike = async () => {
    if (!postID || !userID) return;

    const likeDocRef = doc(FIRESTORE_DB, "post", postID, "likes", userID);

    try {
      if (liked) {
        await deleteDoc(likeDocRef);
      } else {
        await setDoc(likeDocRef, {
          userID,
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <TouchableOpacity onPress={toggleLike}>
        <Image
          source={
            liked
              ? require("../../assets/liked_button.png")
              : require("../../assets/like_button.png")
          }
          style={styles.likeButton}
        />
      </TouchableOpacity>
      <Text style={styles.text}>{likeCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 20,
  },
  likeButton: {
    width: 24,
    height: 24,
    marginRight: 5,
  },
});

export default Likes;
