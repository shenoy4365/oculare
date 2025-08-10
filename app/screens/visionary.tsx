import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

const VisionaryScreen = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [userId, setUserId] = useState<string>("");
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [userDiagnosis, setUserDiagnosis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingApiKey, setFetchingApiKey] = useState(true);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hi there! I'm Visionary AI, your personalized assistant for all things eye-related — from symptoms and conditions to care tips and specialist guidance.",
    },
    {
      sender: "ai",
      text: "Feel free to ask me anything about your vision or eye health, and I'll do my best to help you out!",
    },
  ]);
  const [input, setInput] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    setFetchingApiKey(true);
    try {
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }
      
      if (user) {
        setUserId(user.id);
        
        // Fetch the user's API key and diagnosis from the users table
        const { data, error } = await supabase
          .from("users")
          .select("api_key, diagnoses")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          setMessages(prevMessages => [
            ...prevMessages,
            { 
              sender: "ai", 
              text: "Hmm, it seems that you didn't input a valid API key into your user settings. Please update your settings with your Gemini API Key." 
            }
          ]);
        } else {
          if (data && data.api_key) {
            setGeminiApiKey(data.api_key);
          } else {
            setMessages(prevMessages => [
              ...prevMessages,
              { 
                sender: "ai", 
                text: "Hmm, it seems that you didn't input a valid API key into your user settings. Please update your settings with your Gemini API Key." 
              }
            ]);
          }
          
          // Set user diagnosis if available, but don't mention it
          if (data && data.diagnoses) {
            setUserDiagnosis(data.diagnoses);
            // We don't show a welcome message mentioning their diagnosis now
          }
        }
      }
    } catch (error) {
      console.error("Error in fetchCurrentUser:", error);
      setMessages(prevMessages => [
        ...prevMessages,
        { 
          sender: "ai", 
          text: "An error occurred while setting up Visionary AI. Please try again later." 
        }
      ]);
    } finally {
      setFetchingApiKey(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
      scrollToBottom();
    });

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage = { sender: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);

    // Add diagnosis context to the prompt if available
    let diagnosisContext = "";
    if (userDiagnosis && userDiagnosis !== "NULL") {
      diagnosisContext = `Note that the user has been diagnosed with: ${userDiagnosis}. Consider this diagnosis when providing advice. `;
    }

    const formattedPrompt = `${diagnosisContext}Please respond to the following question in exactly 2 well-thought-out but concise sentences:\n\n${input}`;

    if (!geminiApiKey) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "ai", text: "Hmm, it seems that you didn't input a valid API key into your user settings. Please update your settings with your Gemini API Key." },
      ]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: formattedPrompt }] }],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response format from Gemini API");
      }
      
      const reply = data.candidates[0].content.parts[0].text.trim();
      setMessages((prevMessages) => [...prevMessages, { sender: "ai", text: reply }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "ai", text: "Oops! I ran into a problem with the AI service. Please check your API key or try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // We're no longer showing a diagnosis badge

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image source={require("@/assets/images/oculare-logo.png")} style={styles.logo} />
          <Text style={styles.appTitle}>
            <Text style={styles.bold}>Ocu</Text>lare
          </Text>
        </View>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.sectionTitle}>Visionary AI Assistant</Text>
        <Text style={styles.subText}>
          Converse with Visionary AI with any specific or general eye-related queries below.
        </Text>
      </View>

      {fetchingApiKey && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#52796F" />
          <Text style={styles.loadingText}>Setting up Visionary AI...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContentContainer}
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                msg.sender === "ai" ? styles.aiBubble : styles.userBubble,
                msg.text.length > 60 && msg.sender === "ai" ? styles.largeAIBubble : null,
              ]}
            >
              <Text style={styles.messageText}>{msg.text}</Text>
            </View>
          ))}
          <View style={[styles.scrollSpacer, { height: keyboardVisible ? 100 : 20 }]} />
        </ScrollView>

        <View style={styles.inputBarContainer}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Send a message to Visionary AI"
              placeholderTextColor="#FFFFFF"
              value={input}
              onChangeText={setInput}
              multiline
              onFocus={scrollToBottom}
              editable={!fetchingApiKey}
            />
            <TouchableOpacity 
              onPress={handleSend} 
              disabled={loading || fetchingApiKey || !geminiApiKey} 
              style={[
                styles.sendButton,
                (!geminiApiKey || loading || fetchingApiKey) ? styles.disabledButton : null
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="arrow-up-circle"
                  size={30}
                  color={(!geminiApiKey || fetchingApiKey) ? "gray" : "#FFFFFF"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BFC7BA",
  },
  headerContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
    zIndex: 10,
    backgroundColor: "#BFC7BA",
  },
  backButton: {
    marginTop: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
  },
  logo: {
    width: 70,
    height: 70,
    marginRight: 10,
  },
  appTitle: {
    fontSize: 30,
    color: "#2F3E46",
    fontWeight: "bold",
  },
  bold: {
    color: "#52796F",
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#BFC7BA",
    zIndex: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2F3E46",
    textAlign: "left",
    marginTop: 10,
  },
  subText: {
    fontSize: 15,
    color: "#2F3E46",
    textAlign: "left",
    marginBottom: 10,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#2F3E46",
  },
  keyboardAvoidView: {
    flex: 1,
    width: "100%",
  },
  chatScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatContentContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  messageBubble: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    maxWidth: "90%",
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#52796F",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#8D9F87",
  },
  largeAIBubble: {
    width: "100%",
  },
  messageText: {
    color: "white",
    fontSize: 14,
  },
  inputBarContainer: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#BFC7BA",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#52796F",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 14,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    padding: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  scrollSpacer: {
    width: "100%",
  },
});

export default VisionaryScreen;