import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import SignIn from "./src/screens/Signin";
import CreateAc from "./src/screens/CreateAc";
import Home from "./src/screens/Home";
import AcDetail from "./src/screens/AcDetail";
import Search from "./src/screens/Search";
import Post from "./src/screens/Post";
import Profile from "./src/screens/Profile";
import FriendProfile from "./src/screens/FriendProfile";
import CommentSection from "./src/screens/CommentSection";
import EditProfile from "./src/screens/EditProfile";
import ChangePassword from "./src/screens/ChangePassword";
import ResetPassword from "./src/screens/ResetPassword";

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        <Stack.Screen
          name="SignIn"
          component={SignIn}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateAc"
          component={CreateAc}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Search"
          component={Search}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Post"
          component={Post}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AcDetail"
          component={AcDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FriendProfile"
          component={FriendProfile}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CommentSection"
          component={CommentSection}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfile}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePassword}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPassword}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
