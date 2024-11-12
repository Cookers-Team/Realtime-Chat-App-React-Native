import React, { useEffect, useState } from "react";
import {
  MessageCircleMoreIcon,
  BookUserIcon,
  UserRoundIcon,
  NewspaperIcon,
  BellIcon,
} from "lucide-react-native";
import ChatList from "../chat/ChatList";
import Profile from "./Profile";
import { Tab } from "@/src/types/constant";
import TabIcon from "@/src/components/TabIcon";
import Friends from "./Friends";
import Post from "./Post";
import Notification from "./Notification";
import useDialog from "../../hooks/useDialog";
import useBackHandler from "../../hooks/useBackHandler";
import { ConfimationDialog } from "@/src/components/Dialog";
import { BackHandler, View } from "react-native";
import Toast from "react-native-toast-message";
import useFetch from "../../hooks/useFetch";
import { UserModel } from "@/src/models/user/UserModel";
import Chat from "./Chat";

const Home = () => {
  const {get, loading} = useFetch();
  const { isDialogVisible, showDialog, hideDialog } = useDialog();
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const [user, setUser] = useState<UserModel>();
  useBackHandler(showDialog);

  const fetchUserData = async () => {
    try {
      const res = await get("/v1/user/profile");
      console.log("User data:", res.data);
      setUser(res.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
    
  }, []);

  return (
    <>
     <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: isTabBarVisible ? {
            borderTopColor: "#ccc",
          } : { display: 'none' },
          
          tabBarActiveTintColor: "#059bf0",
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Chat"
          component={Chat}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                color={color}
                size={size}
                focused={focused}
                icon={MessageCircleMoreIcon}
                label="Tin nhắn"
                badge={user?.totalUnreadMessages}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Friends"
          component={Friends}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                color={color}
                size={size}
                focused={focused}
                icon={BookUserIcon}
                label="Bạn bè"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Post"
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                color={color}
                size={size}
                focused={focused}
                icon={NewspaperIcon}
                label="Bài đăng"
              />
            ),
          }}
        >
          {(props: any) => <Post {...props} setIsTabBarVisible={setIsTabBarVisible} />}
        </Tab.Screen>
       
        <Tab.Screen
          name="Notification"
          component={Notification}
          options={{
           
            tabBarIcon: ({ color, size, focused }) => {
              return (
                <TabIcon
                  color={color}
                  size={size}
                  focused={focused}
                  icon={BellIcon}
                  label="Thông báo"
                  badge={user?.totalUnreadNotifications}
                />
              );
            }
          }}
        />
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarLabel: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                color={color}
                size={size}
                focused={focused}
                icon={UserRoundIcon}
                label="Cá nhân"
              />
            ),
          }}
        />
      </Tab.Navigator>
      
      <Toast />
      <ConfimationDialog
        isVisible={isDialogVisible}
        title="Thoát ứng dụng"
        confirmText="Thoát"
        color="red"
        message="Bạn có muốn thoát ứng dụng không?"

        onConfirm={() => BackHandler.exitApp()}        onCancel={hideDialog}
      />
    </>
  );
};

export default Home;
