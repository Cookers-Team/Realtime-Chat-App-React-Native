import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const EmailPattern =
  /^(?!.*[.]{2,})[a-zA-Z0-9.%]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const PhonePattern = /^0[35789][0-9]{8}$/;

const StudentIdPattern = /^[1-9][0-9]{7}$/;

// const remoteUrl = "https://realtime-chat-app-api-tbaf.onrender.com";
const remoteUrl = "http://192.168.1.11:7979";
const Stack = createNativeStackNavigator<{
  Loading: any;
  Login: any;
  Register: any;
  Home: any;
  ForgotPassword: any;
  ResetPassword: any;
  Verify: any;
  Profile: any;
  EditProfile: any;
  ChangePassword: any;
  PostDetail: any;
  Post: any;
  PostCreateUpdate: any;
  PostComment: any;
  RequestKeyChange: any;
  VerifyKeyChange: any;
  CommentUpdate: any;
  FriendRequest: any;
  FriendSendRequest: any;
  FriendAdd: any;
  ChatDetail:any
}>();

const Tab = createBottomTabNavigator();
const emptyBox = require("../assets/empty_box.png");
const avatarDefault = require("../assets/user_icon.png");

export {
  Tab,
  Stack,
  EmailPattern,
  PhonePattern,
  remoteUrl,
  emptyBox,
  StudentIdPattern,
  avatarDefault
};
