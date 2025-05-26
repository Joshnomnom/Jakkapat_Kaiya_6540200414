import React, { useState, useEffect } from "react";
import { Text, StyleSheet, View } from "react-native";
import { FIRESTORE_DB } from "../services/FirebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const FollowCount = ({ userId }) => {
  const [followerCount, setFollowerCount] = useState("0");
  const [followingCount, setFollowingCount] = useState("0");
  const [postCount, setPostCount] = useState("0");

  useEffect(() => {
    if (!userId) return;

    const followersUnsub = onSnapshot(
      query(
        collection(FIRESTORE_DB, "follows"),
        where("followingId", "==", userId)
      ),
      (snapshot) => setFollowerCount(snapshot.size)
    );
    const followingUnsub = onSnapshot(
      query(
        collection(FIRESTORE_DB, "follows"),
        where("followerId", "==", userId)
      ),
      (snapshot) => setFollowingCount(snapshot.size)
    );
    const postUnsub = onSnapshot(
      query(collection(FIRESTORE_DB, "post"), where("userId", "==", userId)),
      (snapshot) => setPostCount(snapshot.size)
    );

    return () => {
      followersUnsub();
      followingUnsub();
      postUnsub();
    };
  }, [userId]);

  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.count}>{postCount}</Text>
        <Text style={styles.label}>Posts</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.count}>{followerCount}</Text>
        <Text style={styles.label}>Followers</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.count}>{followingCount}</Text>
        <Text style={styles.label}>Followings</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 26,
  },
  item: {
    alignItems: "center",
    marginLeft: 15,
  },
  count: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  label: {
    fontSize: 14,
    color: "#777",
  },
});

export default FollowCount;
