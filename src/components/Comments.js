import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FIRESTORE_DB } from "../services/FirebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const Comments = ({ postID }) => {
  const [commentsCount, setCommentsCount] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    const q = query(
      collection(FIRESTORE_DB, "comments"),
      where("postID", "==", postID)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCommentsCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [postID]);

  const handlePress = () => {
    navigation.navigate("CommentSection", { postID: postID });
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <TouchableOpacity onPress={handlePress}>
        <Image
          source={require("../../assets/comment_button.png")}
          style={styles.commentButton}
        />
      </TouchableOpacity>
      <Text style={styles.text}>{commentsCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  commentButton: {
    width: 24,
    height: 24,
    marginRight: 5,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 20,
  },
});

export default Comments;
