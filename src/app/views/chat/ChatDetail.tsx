import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Send, Plus } from 'lucide-react-native';
import useFetch from '../../hooks/useFetch';
import { LoadingDialog } from '@/src/components/Dialog';
import { MessageModel } from '@/src/models/chat/MessageModel';
import defaultUserImg from '../../../assets/user_icon.png';
import { ConversationModel } from '@/src/models/chat/ConversationModel';
import { UserModel } from '@/src/models/user/UserModel';
import { decrypt, encrypt } from '@/src/types/utils';
import HeaderLayout from '@/src/components/header/Header';
import { remoteUrl } from '@/src/types/constant';
import { io, Socket } from 'socket.io-client';
import MessageItem from './MessageItem';

const ChatDetail = ({ route, navigation }: any) => {
  const item: ConversationModel = route.params?.item;
  const user: UserModel = route.params?.user;
  const { get, post, loading } = useFetch();
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingDialog, setLoadingDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const size = 10;

  useEffect(() => {
    navigation.setOptions({
      title: item.name,
      headerRight: () => item.canAddMember && item.kind == 1 && (
        <TouchableOpacity 
          onPress={() => navigation.navigate('AddMember', {item})}
          style={styles.headerButton}
        >
          <Plus size={24} color="#059BF0" />
        </TouchableOpacity>
      ),
    });
    fetchMessages(0);

    initializeSocket();

    return () => {
      if (socketRef.current) {
        // Leave conversation before disconnecting
        socketRef.current.emit('LEAVE_CONVERSATION', item._id);
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchNewMessage = async (messageId: string) => {
    try {
      const res = await get(`/v1/message/get/${messageId}`);
      const newMessage = res.data;
      setMessages(prevMessages => [newMessage, ...prevMessages]);
      if (newMessage.isOwner) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (error) {
      console.error("Error fetching message data:", error);
    }
  };

  const fetchUpdateMessage = async (messageId : string) => {
    try {
      // Encrypt the updated message content
      const res = await get(`/v1/message/get/${messageId}`);
      const updatedMessage = res.data;
      
      // Update the messages state with the new message
      setMessages((prevMessages) => {
        const index = prevMessages.findIndex((msg) => msg._id === messageId);
        if (index !== -1) {
          const newMessages = [...prevMessages];
          newMessages[index] = updatedMessage;
          return newMessages;
        }
        return prevMessages;
      });
    } catch (error) {
      console.error('Lỗi mạng!', error);
    }
  };

  const fetchDeleteMessage = async (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.filter((message) => message._id !== messageId)
    );
  };

  const fetchMessages = async (pageNumber: number) => {
    try {
      const res = await get(`/v1/message/list/`, {
        page: pageNumber,
        size,
        conversation: item._id,
      });


      const newMessages = res.data.content;
      if (pageNumber === 0) {
        setMessages([...newMessages]);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
      }
      setHasMore(newMessages.length === size);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages(0).then(() => setRefreshing(false));
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchMessages(page + 1);
    }
  };

  const initializeSocket = () => {
    const socket = io(remoteUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000
    });

    socket.on('connect', () => {
      console.log('Socket.IO Connected');
      // Join conversation room on connect
      socket.emit('JOIN_CONVERSATION', item._id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO Disconnected:', reason);
    });

    socket.on('CREATE_MESSAGE', async (messageId: string) => {
      await fetchNewMessage(messageId)
    });

    socket.on('UPDATE_MESSAGE', async (messageId: string) => {
      console.log('UPDATE MESSAGE')
      await fetchUpdateMessage(messageId)
    });

    socket.on('DELETE_MESSAGE', (messageId: string) => {
      fetchDeleteMessage(messageId)
    });

    socketRef.current = socket;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    let messageEncrypt = encrypt(inputMessage.trim(), user.secretKey);
    const messageData = {
      content: messageEncrypt,
      conversation: item._id,
    };
    try {
      setInputMessage('');
      await post('/v1/message/create', messageData);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoadingDialog(false);
    }
  };

  const renderMessage = ({ item }: { item: MessageModel }) => {
    return (
      <MessageItem
        item={item}
        userSecretKey={user.secretKey}
        onItemUpdate={() => {}} //Socket
        onItemDelete={() => {}} //Socket
        navigation={navigation}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loadingDialog && <LoadingDialog isVisible={loadingDialog} />}

      <HeaderLayout 
        title={item.name}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        RightIcon={item.canAddMember && item.kind === 1 ? Plus : undefined}
        onRightIconPress={() => item.canAddMember && item.kind === 1 && navigation.navigate('AddMember', {item})}
        titleLeft={true}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        inverted={true}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          loading && hasMore ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : null
        }
        contentContainerStyle={styles.flatListContent}
      />

      {(item.canMessage == 1 && item.kind == 1) || (item.kind == 2) ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Nhập tin nhắn..."
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!inputMessage.trim()}
          >
            <Send 
              size={24} 
              color={inputMessage.trim() ? "#059BF0" : "#999"} 
            />
          </TouchableOpacity>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flatListContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  headerButton: {
    marginRight: 15,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: '#059BF0',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: 'black',
  },
  messageTime: {
    fontSize: 10,
    color: '#rgba(0, 0, 0, 0.5)',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatDetail;