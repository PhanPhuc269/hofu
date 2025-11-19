import { Bot, Send, Sparkles, User } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

export default function AIChatScreen() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Xin chào! Tôi là trợ lý AI của bạn. Bạn cần giúp gì hôm nay?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = () => {
    if (inputText.trim().length === 0) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponses = [
        "Tôi hiểu câu hỏi của bạn. Đây là câu trả lời mẫu từ AI để minh họa chức năng chat.",
        "Cảm ơn bạn đã chia sẻ! Tôi sẽ cố gắng giúp bạn với vấn đề này.",
        "Đây là phản hồi mẫu từ hệ thống AI. Trong phiên bản thực tế, đây sẽ là kết nối với API AI.",
        "Tôi đã nhận được tin nhắn của bạn. Hãy để tôi suy nghĩ kỹ hơn về vấn đề này.",
        "Rất vui được trò chuyện với bạn! Tôi đang xử lý yêu cầu của bạn.",
      ];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const [quickOpen, setQuickOpen] = useState(false);
  const handleQuickSelect = (type: "suggest" | "image" | "doc") => {
    // simple behavior: populate input with a template and close popup
    if (type === "suggest")
      setInputText((t) => (t ? t + " " : "") + "💡 Gợi ý: ");
    if (type === "image")
      setInputText((t) => (t ? t + " " : "") + "📸 Yêu cầu hình ảnh: ");
    if (type === "doc")
      setInputText((t) => (t ? t + " " : "") + "📎 Đính kèm tài liệu: ");
    setQuickOpen(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-green-600 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Sparkles color="white" size={24} />
          <Text className="text-white text-xl font-bold ml-2">Trợ lý AI</Text>
        </View>
        <TouchableOpacity className="bg-green-700 px-3 py-1 rounded-full">
          <Text className="text-white text-sm">Cao cấp</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-3"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              className={`mb-4 ${message.isUser ? "items-end" : "items-start"}`}
            >
              <View className="flex-row items-end mb-1">
                {!message.isUser && (
                  <View className="bg-green-100 p-2 rounded-full mr-2">
                    <Bot size={16} color="#34C759" />
                  </View>
                )}
                <View
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.isUser
                      ? "bg-green-600 rounded-tr-none"
                      : "bg-white border border-gray-200 rounded-tl-none"
                  }`}
                >
                  <Text
                    className={`text-base ${message.isUser ? "text-white" : "text-gray-800"}`}
                  >
                    {message.text}
                  </Text>
                </View>
                {message.isUser && (
                  <View className="bg-green-100 p-2 rounded-full ml-2">
                    <User size={16} color="#34C759" />
                  </View>
                )}
              </View>
              <Text
                className={`text-xs text-gray-500 ${message.isUser ? "text-right" : "text-left"}`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setQuickOpen((v) => !v)}
              className="mr-3 p-2 rounded-full bg-gray-100"
              accessibilityLabel="Quick actions"
            >
              <Sparkles size={18} color="#374151" />
            </TouchableOpacity>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-base"
              multiline
              maxLength={500}
              onFocus={() => setQuickOpen(false)}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={inputText.trim().length === 0}
              className={`ml-3 p-3 rounded-full ${
                inputText.trim().length === 0 ? "bg-gray-300" : "bg-green-600"
              }`}
            >
              <Send
                size={20}
                color={inputText.trim().length === 0 ? "#9CA3AF" : "white"}
              />
            </TouchableOpacity>
          </View>

          {/* Quick Actions (hidden popup) */}
          {quickOpen ? (
            <>
              <Pressable
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                }}
                onPress={() => setQuickOpen(false)}
              />
              <View
                style={{
                  position: "absolute",
                  left: 20,
                  right: 20,
                  bottom: 80,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    padding: 8,
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 10,
                    elevation: 8,
                    width: "100%",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleQuickSelect("suggest")}
                    className="flex-row items-center px-3 py-3"
                  >
                    <Text className="text-lg mr-3">💡</Text>
                    <Text className="text-gray-800">Gợi ý</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleQuickSelect("image")}
                    className="flex-row items-center px-3 py-3"
                  >
                    <Text className="text-lg mr-3">📸</Text>
                    <Text className="text-gray-800">Hình ảnh</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleQuickSelect("doc")}
                    className="flex-row items-center px-3 py-3"
                  >
                    <Text className="text-lg mr-3">📎</Text>
                    <Text className="text-gray-800">Tài liệu</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
