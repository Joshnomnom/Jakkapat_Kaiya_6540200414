import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, View, Image } from "react-native";
import { FIRESTORE_DB, auth } from "../services/FirebaseConfig";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

const Likes = ({ postID, userID }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const likeDocRef = doc(FIRESTORE_DB, "likes", `${postID}_${userID}`);
  const likeCollectionRef = collection(FIRESTORE_DB, "likes");

  useEffect(() => {
    const checkLikeStatus = async () => {
      const docSnap = await getDoc(likeDocRef);
      if (docSnap.exists()) {
        setLiked(true);
      }
    };

    // จำนวนไลค์แบบลไทม์
    const q = query(likeCollectionRef, where("postID", "==", postID));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLikeCount(snapshot.size);
    });

    checkLikeStatus();

    return () => unsubscribe();
  }, [postID]);

  const toggleLike = async () => {
    if (liked) {
      await deleteDoc(likeDocRef);
    } else {
      await setDoc(likeDocRef, {
        postID: postID,
        userID: userID,
        timestamp: serverTimestamp(),
      });
    }
    setLiked(!liked);
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
