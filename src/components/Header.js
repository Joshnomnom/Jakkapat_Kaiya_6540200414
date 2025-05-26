import React from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const Header = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isCommentSection = route.name === "CommentSection";

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.header}>
      {isCommentSection ? (
        <View style={styles.commentHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/beluga_label.png")}
              style={styles.logo}
            />
          </View>
          <View style={styles.notiButton}>
            <Image
              source={require("../../assets/like_noti.png")}
              style={styles.notiIcon}
            />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/beluga_label.png")}
              style={styles.logo}
            />
          </View>
          <View style={styles.notiButton}>
            <Image
              source={require("../../assets/like_noti.png")}
              style={styles.notiIcon}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FF3A7C",
    paddingVertical: 15,
    paddingHorizontal: 10,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  logo: {
    height: 40,
    resizeMode: "contain",
  },
  notiButton: {
    position: "absolute",
    right: 10,
    top: 55,
  },
  notiIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    position: "relative",
    height: 40,
  },
  backButton: {
    position: "absolute",
    left: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  heartButton: {
    position: "absolute",
    right: 10,
  },
});

export default Header;
