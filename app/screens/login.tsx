import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import colors from "@/styles/colors";
import { supabase } from "../../lib/supabase";

export default function IndexScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const onSubmit = async ()=> {
    if (email.length < 0 || password.length < 0) {
      Alert.alert("Sign up", "please fill all the fields!");
      return;
    }

    const {error} = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      Alert.alert("Login", error.message)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          {/* Logo and Banner */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/oculare-logo.png")}
              style={styles.logo}
            />
            <Text style={styles.appTitle}>
              <Text style={styles.bold}>Ocu</Text>lare
            </Text>
          </View>

          {/* Sign up text and paragraph */}
          <Text style={styles.header}>Log back into Oculare</Text>
          <Text style={styles.paragraph}>
            Let’s get your information so that we can get started with your
            retinal scan analysis
          </Text>

          <Text style={styles.boxTexts}>Email Address</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="Enter your email here"
            placeholderTextColor="#5F6F52"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.boxTexts}>Password</Text>
          <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
            <TextInput
              style={styles.inputPassword}
              placeholder="Enter your password here"
              placeholderTextColor="#5F6F52"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.icon}>
              <Ionicons name={passwordVisible ? "eye" : "eye-off"} size={20} color="#5F6F52" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={onSubmit}>
            <Text style={styles.buttonText}>Log back into Oculare</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#BFC7BA",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  contentContainer: {
    width: "100%",
    paddingHorizontal: 30,
    alignSelf: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.defaultTextColor,
    marginTop: 20,
    textAlign: "left",
  },
  paragraph: {
    fontSize: 15,
    color: "#2F3E46",
    textAlign: "left",
    marginTop: 10,
    marginBottom: 20,
  },
  boxTexts: {
    fontSize: 16,
    color: "#2F3E46",
    textAlign: "left",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    backgroundColor: "#A8B5A1",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: "#2F3E46",
    marginBottom: 10,
  },
  inputError: {
    borderWidth: 2,
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A8B5A1",
    borderRadius: 8,
    marginBottom: 20,
  },
  inputPassword: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#2F3E46",
  },
  icon: {
    paddingRight: 10,
  },
  button: {
    backgroundColor: "#52796F",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    width: "100%",
    height: 60,
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 110,
    height: 110,
    marginRight: 10,
  },
  appTitle: {
    fontSize: 45,
    color: "#2F3E46",
    fontWeight: "bold",
  },
  bold: {
    color: "#52796F",
  },
});