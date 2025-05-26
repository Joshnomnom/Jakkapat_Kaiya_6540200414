import React from "react";
import { View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigationState } from "@react-navigation/native";

const Footer = ({ navigation }) => {
  const activeTab = useNavigationState(
    (state) => state.routes[state.index].name
  );

  const handlePress = (tab) => {
    if (tab !== activeTab) {
      navigation.navigate(tab);
    }
  };

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity onPress={() => handlePress("Home")}>
        <Image
          source={
            activeTab === "Home"
              ? require("../../assets/home_hl_button.png")
              : require("../../assets/home_button.png")
          }
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handlePress("Search")}>
        <Image
          source={
            activeTab === "Search"
              ? require("../../assets/search_hl_button.png")
              : require("../../assets/search_button.png")
          }
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handlePress("Post")}>
        <Image
          source={
            activeTab === "Post"
              ? require("../../assets/post_hl_button.png")
              : require("../../assets/post_button.png")
          }
          style={styles.tabIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handlePress("Profile")}>
        <Image
          source={
            activeTab === "Profile"
              ? require("../../assets/profile_hl_button.png")
              : require("../../assets/profile_button.png")
          }
          style={styles.tabIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FF3A7C",
    paddingVertical: 17,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
});

export default Footer;
