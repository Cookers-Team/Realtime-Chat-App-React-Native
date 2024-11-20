import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FriendModel } from "@/src/models/friend/FriendModel";
import defaultUserImg from "../../../assets/user_icon.png";
import MenuClick from "@/src/components/post/MenuClick";
import Toast from "react-native-toast-message";
import { successToast } from "@/src/types/toast";
import useFetch from "../../hooks/useFetch";
import ModalUserDetail from "@/src/components/friend/ModalUserDetail";
import ModalConfirm from "@/src/components/post/ModalConfirm";

const FriendItem = ({ item, navigation, onItemUpdate, onItemDelete }: any) => {
  const { post, del, loading } = useFetch();
  const [showMenu, setShowMenu] = useState(false);
  const [showMenuDetail, setShowMenuDetail] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleMenuPress = () => {
    setShowMenu(!showMenu);
  };
  const [loadingDialog, setLoadingDialog] = useState(false);

  const handleDeletePress = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false);
    setLoadingDialog(true);
    try {
      const response = await del(`/v1/friendship/delete/${item._id}`);
      if (response.result) {
        onItemDelete(item._id);
        Toast.show(successToast("Xóa bạn thành công!"));
      } else {
        throw new Error("Failed to delete post");
      }
    } catch (error) {
      console.error("Lỗi xóa bạn:", error);
      Alert.alert("Lỗi xóa bạn. Vui lòng thử lại.");
    } finally {
      setLoadingDialog(false);
    }
  };

  return (
    <View style={styles.friendItem}>
      <Image
        source={
          item.friend && item.friend.avatarUrl
            ? { uri: item.friend.avatarUrl }
            : defaultUserImg
        }
        style={styles.avatar}
      />
      <View style={styles.friendInfo}>
        
        <Text style={styles.friendName}> {item.friend.displayName}</Text>
        <Text style={styles.friendLastLogin}>{item.friend.lastLogin}</Text>
      </View>

      <TouchableOpacity style={styles.menuIcon} onPress={handleMenuPress}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#7f8c8d" />
      </TouchableOpacity>

      <MenuClick
        titleUpdate={"Xem thông tin chi tiết"}
        titleDelete={"Xóa bạn"}
        isVisible={showMenu}
        onClose={() => setShowMenu(false)}
        onUpdate={() => {
          setShowMenuDetail(true);
          setShowMenu(false);
        }}
        onDelete={() => {
          handleDeletePress();
          setShowMenu(false);
        }}
      />

      <ModalConfirm
        isVisible={showDeleteModal}
        title="Xác nhận xóa người bạn này khỏi danh sách bạn bè?"
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
      />

      <ModalUserDetail
        isVisible={showMenuDetail}
        user={item.friend}
        onClose={() => setShowMenuDetail(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  friendLastLogin: {
    fontSize: 12,
    color: "#666",
  },
  menuIcon: {
    position: "absolute",
    top: 10,
    right: 0,
    zIndex: 1,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
});

export default FriendItem;
