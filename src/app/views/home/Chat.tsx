import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import useFetch from "../../hooks/useFetch";
import { LoadingDialog } from "@/src/components/Dialog";
import SearchBar from "@/src/components/search/SearchBar";
import EmptyComponent from "@/src/components/empty/EmptyComponent";
import { MessageCircle } from "lucide-react-native";
import defaultUserImg from "../../../assets/user_icon.png";
import { ConversationModel } from "@/src/models/chat/ConversationModel";
import { MessageModel } from "@/src/models/chat/MessageModel";
import { UserModel } from "@/src/models/user/UserModel";
import { decrypt } from "@/src/types/utils";

const ChatContent = ({ navigation, setIsTabBarVisible }: any) => {
  const { get, loading } = useFetch();
  const [loadingDialog, setLoadingDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState<ConversationModel[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(0);
  const [user, setUser] = useState<UserModel>();
  const [secretKey, setSecretKey] = useState("");
  const size = 10;

  useEffect(() => {
    fetch();
  }, []);

  const fetch = async () => {
    const key = await fetchUserData();
    await getChatsFirst(0, "", key);
  };
  const fetchUserData = async () => {
    try {
      const res = await get("/v1/user/profile");
      setSecretKey(res.data.secretKey);
      setUser(res.data);
      return res.data.secretKey;
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSearch = async () => {
    setLoadingDialog(true);
    await getChats(0, searchQuery);
    setLoadingDialog(false);
  };

  const clearSearch = async () => {
    setLoadingDialog(true);
    setSearchQuery("");
    await getChats(0, "");
    setLoadingDialog(false);
  };

  async function getChats(pageNumber: number, content: string) {
    try {
      const res = await get(`/v1/conversation/list`, {
        page: pageNumber,
        size,
        name: content,
      });
      const newChats = res.data.content;
      console.log('secretKey in chat: ' +secretKey)
      if (secretKey){
        newChats.forEach((chat: ConversationModel) => {
          if (chat.lastMessage) {
            chat.lastMessage.content = decrypt(chat.lastMessage.content, secretKey) || "";
          }
        });
      }

      if (pageNumber === 0) {
        setChats(newChats);
      } else {
        setChats((prevChats) => [...prevChats, ...newChats]);
      }
      setHasMore(newChats.length === size);
      setPage(pageNumber);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoadingDialog(false);
    }
  }

  async function getChatsFirst(pageNumber: number, content: string, key: string) {
    try {
      const res = await get(`/v1/conversation/list`, {
        page: pageNumber,
        size,
        name: content,
      });
      const newChats = res.data.content;
      if (key){
        newChats.forEach((chat: ConversationModel) => {
          if (chat.lastMessage) {
            chat.lastMessage.content = decrypt(chat.lastMessage.content, key) || "";
          }
        });
      }

      if (pageNumber === 0) {
        setChats(newChats);
      } else {
        setChats((prevChats) => [...prevChats, ...newChats]);
      }
      setHasMore(newChats.length === size);
      setPage(pageNumber);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoadingDialog(false);
    }
  }

  const fetchData = useCallback(
    async (pageNumber: number) => {
      if (!hasMore && pageNumber !== 0) return;
      getChats(pageNumber, searchQuery);
    },
    [get, size]
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchQuery("");
    setPage(0);
    getChats(0, "").then(() => setRefreshing(false));
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchData(page + 1);
    }
  };

  const renderChatItem = ({ item }: { item: ConversationModel }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => {
        navigation.navigate("ChatDetail", {
          item: item,
          user: user,
        });
      }}
    >
      <Image
        source={
          item.avatarUrl ? { uri: item.avatarUrl } : defaultUserImg
        }
        style={styles.avatar}
      />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.timestamp}>
            {item.lastMessage?.createdAt || ""}
          </Text>
        </View>

        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {/* {decrypt(item.lastMessage?.content, user?.secretKey) || ""} */}
            {item.lastMessage?.content}
          </Text>

          {item.totalUnreadMessages > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.totalUnreadMessages > 99
                  ? "99+"
                  : item.totalUnreadMessages}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loadingDialog && <LoadingDialog isVisible={loadingDialog} />}

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        onSearch={handleSearch}
        placeholder="Tìm kiếm tin nhắn..."
        handleClear={clearSearch}
        additionalIcon="add"
        onAdditionalIconPress={() => navigation.navigate("ChatAdd")}
      />

      <FlatList
        data={chats}
        keyExtractor={(item, index) => `${item._id} - ${index}`}
        renderItem={renderChatItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyComponent message="Không có cuộc trò chuyện nào" />
        }
        ListFooterComponent={() =>
          loading && hasMore ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  newChatText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#059BF0",
    fontWeight: "500",
  },
  chatItem: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatContent: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: "#059BF0",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

const Chat = (props: any) => {
  return <ChatContent {...props} />;
};

export default Chat;
