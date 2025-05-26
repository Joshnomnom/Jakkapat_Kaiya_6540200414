import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FIRESTORE_DB } from "../services/FirebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import CustomModals from "../components/CustomModal";
import { useNavigation } from "@react-navigation/native";

const Search = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");

  const showAlert = (message, type = "error") => {
    setModalVisible(true);
    setModalType(type);
    setModalMessage(message);
  };

  const handleSearch = async (searchText) => {
    setSearchQuery(searchText);
    if (searchText.trim().length === 0) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const usersRef = collection(FIRESTORE_DB, "users");
      const q = query(
        usersRef,
        where("firstName", ">=", searchText),
        where("firstName", "<=", searchText + "\uf8ff")
      );

      const snapShot = await getDocs(q);
      const users = snapShot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setResults(users);
    } catch (error) {
      console.error("Error searching users:", error);
      showAlert("Failed to search users. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() =>
        navigation.navigate("FriendProfile", { friendId: item.id })
      }
    >
      {item.profilePicture ? (
        <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
      ) : (
        <Ionicons name="person-circle-outline" size={50} color="#E1E2E6" />
      )}
      <Text style={styles.resultName}>
        {item.firstName} {item.lastName}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />
      <TextInput
        style={styles.search}
        placeholder="Search"
        placeholderTextColor="#F3F3F3"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF3A7C" style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.noResults}>No results found</Text>
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <Footer navigation={navigation} />
      <CustomModals
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalType}
        confirmText="OK"
        message={modalMessage}
        type={modalType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    // alignItems: "center",
  },
  search: {
    borderWidth: 1,
    borderColor: "#FFF",
    borderRadius: 8,
    padding: 10,
    marginVertical: 16,
    backgroundColor: "#FF3A7C",
    color: "#FFF",
    width: "90%",
    marginTop: 120,
    alignSelf: "center",
  },
  loader: {
    marginTop: 20,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#f0f0f0",
    borderRadius: 0,
    width: "100%",
  },

  resultName: {
    fontSize: 18,
    color: "#000",
    marginLeft: 15,
  },
  noResults: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginTop: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E1E2E6",
  },
});

export default Search;
