import React from "react";
import { Image, StyleSheet } from "react-native";

const Logo = ({ source }) => {
  return <Image source={source} style={styles.logo} />;
};

const styles = StyleSheet.create({
  logo: {
    width: 243,
    height: 89,
    marginBottom: 60,
  },
});

export default Logo;
