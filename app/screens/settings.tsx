import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, ScrollView, Image, Alert, ActivityIndicator, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile, updateUserEmail, updateUserPassword, logoutUser, getUserData } from "@/services/userService";

// have to change the logout function so that the user can't go back to the previous page

const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const { user: authUser, setAuth, setUserData } = useAuth();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [showCard, setShowCard] = useState(false);

  // api card handling
  const handleButtonPress = () => {
    setShowCard(!showCard);
  };
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser?.id) {
        setIsLoading(true);
        const response = await getUserData(authUser.id);
        setIsLoading(false);
        
        if (response.success && response.data) {
          setName(response.data.name || "");
          setEmail(authUser.email || "");
          setApiKey(response.data.api_key || "");
        }
      }
    };
    
    fetchUserData();
  }, [authUser]);
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create an array to hold all our update operations
      const updateOperations = [];
      
      // Update profile in our users table
      if (authUser?.id) {
        updateOperations.push(
          updateUserProfile(authUser.id, { name, apiKey })
        );
      }
      
      // Update email if changed
      if (email !== authUser?.email) {
        updateOperations.push(updateUserEmail(email));
      }
      
      // Update password if provided
      if (password && password.length >= 6) {
        updateOperations.push(updateUserPassword(password));
      }
      
      // Execute all update operations
      const results = await Promise.all(updateOperations);
      
      // Check if any operation failed
      const anyFailed = results.some(result => !result.success);
      
      if (anyFailed) {
        const errorMsg = results.find(r => !r.success)?.msg || "Update failed";
        Alert.alert("Error", errorMsg);
      } else {
        // Update local user data
        if (authUser) {
          const updatedUser = {
            ...authUser,
            name,
            email,
            apiKey
          };
          setUserData(updatedUser);
        }
        
        Alert.alert("Success", "Your settings have been updated");
        setPassword(""); // Clear password field after successful update
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      Alert.alert("Error", "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const result = await logoutUser();
      
      if (result.success) {
        setAuth(null);
        router.replace("../../welcome");
      } else {
        Alert.alert("Error", result.msg || "Failed to log out");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to log out");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <Image source={require("@/assets/images/oculare-logo.png")} style={styles.logo} />
            <Text style={styles.appTitle}>
              <Text style={styles.bold}>Ocu</Text>lare
            </Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Manage your Settings</Text>
        <Text style={styles.subText}>Manage all of your Oculare settings below.</Text>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <SettingInput 
            label="Profile Name" 
            value={name} 
            onChangeText={setName} 
            placeholder="Enter your name" 
          />
          <SettingInput 
            label="Email Address" 
            value={email} 
            onChangeText={setEmail} 
            placeholder="Enter your email" 
          />
          <SettingInput 
            label="Password" 
            value={password} 
            onChangeText={setPassword} 
            placeholder="Enter new password (leave empty to keep current)" 
            secureTextEntry 
          />
          <SettingInput 
            label="Gemini 2.0 Flash API Key" 
            value={apiKey} 
            onChangeText={setApiKey} 
            placeholder="Enter API Key" 
          />
          
          {/* API Key Help */}
          <TouchableOpacity onPress={handleButtonPress} style={styles.cardButton}>
            <Text style={styles.apiButtonText}>
              {showCard ? "Hide Gemini API Key Info" : "Show Gemini API Key Info"}
            </Text>
          </TouchableOpacity>

          {/* Conditionally render the card */}
          {showCard && (
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Gemini API Key</Text>
              <Text style={styles.cardText}>
                Log into your{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
                >
                  Google AI Studio
                </Text>
                {" "}account to access your Gemini API key
              </Text>
            </View>
          )}
        </View>

        {/* Update Button */}
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Update your Settings</Text>
          )}
        </TouchableOpacity>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.lowerbutton, isLoading && styles.disabledButton]} 
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text style={styles.lowerbuttonText}>Log out of your account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Reusable Input Component with TypeScript Props
type SettingInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
};

const SettingInput: React.FC<SettingInputProps> = ({ label, value, onChangeText, placeholder, secureTextEntry = false }) => (
  <>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#556b6b"
      secureTextEntry={secureTextEntry}
      value={value}
      onChangeText={onChangeText}
    />
  </>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BFC7BA",
    padding: 20,
  },
  backButton: {
    marginTop: 50,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: -60,
  },
  logo: {
    width: 70,
    height: 70,
    marginRight: 10,
    marginLeft: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2F3E46",
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#BFC7BA",
  },
  bold: {
    color: "#52796F",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2F3E46",
    textAlign: "left",
    marginBottom: 5,
    marginTop: -25,
  },
  subText: {
    fontSize: 15,
    color: "#2F3E46",
    textAlign: "left",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2F3E46",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#A8B5A1",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: "#2F3E46",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#52796F",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 60,
  },
  lowerbutton: {
    backgroundColor: "#2F3E46",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 60,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  apiButtonText: {
    color: "#2F3E46",
    fontSize: 12,
    fontWeight: "bold",
  },
  lowerbuttonText: {
    color: "#ff7474",
    fontSize: 12,
    fontWeight: "bold",
  },
  headerWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 30,
    color: "#2F3E46",
    fontWeight: "bold",
    marginLeft: -6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  helpLink: {
    marginTop: -10,
    marginBottom: 15,
  },
  helpText: {
    color: "#2F3E46",
    textDecorationLine: "underline",
    fontSize: 14,
  },
  cardButton: {
    backgroundColor: '#BFC7BA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    marginLeft: -15,
    marginTop: -10,
  },
  cardContainer: {
    backgroundColor: '#A9B3A4',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    width: '100%',
    maxWidth: 350,
    marginTop: -20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: "#2F3E46",
  },
  cardText: {
    fontSize: 16,
    color: '#333',
  },
  linkText: {
    color: '#007bff',
  },
});

export default SettingsScreen;