import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import colors from "@/styles/colors";
import { Image } from "react-native";
import { TouchableOpacity} from "react-native";

export default function IndexScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image source={require("@/assets/images/oculare-landing.png")} style={{ width: 300, height: 300 }} />
      <Text style={styles.text}>Welcome to Oculare</Text>
      <Text style={styles.paragraph}>
        Detect eye diseases early with Oculare's advanced AI mechanisms, which analyzes retinal scans to accurately detect conditions like cataracts and diabetic retinopathy
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/screens/signup")}>
        <Text style={styles.buttonText}>Get Started with Oculare</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.lowerbutton} onPress={() => router.push("/screens/login")}>
        <Text style={styles.buttonText}>Log Back into Oculare</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.defaultTextColor,
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 15,
    color: colors.defaultTextColor,
    marginBottom: 20,
    textAlign: "center",
    marginLeft: 20,
    marginRight: 20,
  },
  button: {
    backgroundColor: "#52796F", // Change to any color
    paddingVertical: 15, // Adjust height
    paddingHorizontal: 30, // Adjust width
    borderRadius: 10, // Rounded corners
    alignItems: "center", 
    justifyContent: "center",
    marginTop: 20, // Add spacing
    width: 300,
    height: 60,
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  lowerbutton: {
    backgroundColor: "#2F3E46",
    paddingVertical: 15, // Adjust height
    paddingHorizontal: 30, // Adjust width
    borderRadius: 10, // Rounded corners
    alignItems: "center", 
    justifyContent: "center",
    marginTop: 20, // Add spacing
    width: 300,
    height: 60,
  },
});