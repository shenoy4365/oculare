import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function HomeScreen() {
  const router = useRouter();
  const {user, setAuth} = useAuth();

  const onLogout = async () => {
    //setAuth(null);
    const {error} = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Sign out', 'Error signing out')
    }
  };

  // Get the user name, or use a default if not available
  const userName = user?.name || "Guest User";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <Image source={require("@/assets/images/oculare-logo.png")} style={styles.logo} />
          <Text style={styles.appTitle}>
            <Text style={styles.bold}>Ocu</Text>lare
          </Text>
        </View>
        <TouchableOpacity onPress={onLogout}>
          <Ionicons name="log-out-outline" size={28} color="black" />
        </TouchableOpacity>
      </View>

      {/* Welcome Message */}
      <Text style={styles.welcomeText}>Welcome, {userName}</Text>
      <Text style={styles.subText}>
        Oculare provides you with accurate retinal scan analysis, ensuring eye helpful health monitoring and specialist connections.
      </Text>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <View style={styles.actionsHeader}>
          <Text style={styles.sectionTitle}>Quick actions control</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionBox} 
            onPress={() => router.push("/screens/retinal")}
          >
            <Ionicons name="camera-outline" size={32} color="black" style={styles.actionIcon} />
            <Text style={styles.actionTitle}>Retinal Capture</Text>
            <Text style={styles.actionSubText}>Capture a retinal eye disease image for classification</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBox} 
            onPress={() => router.push("/screens/specialists")}
          >
            <Ionicons name="clipboard-outline" size={32} color="black" style={styles.actionIcon} />
            <Text style={styles.actionTitle}>Eye Specialists</Text>
            <Text style={styles.actionSubText}>Connect with renowned ophthalmologists</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBox} 
            onPress={() => router.push("/screens/visionary")}
          >
            <Ionicons name="person-outline" size={32} color="black" style={styles.actionIcon} />
            <Text style={styles.actionTitle}>Visionary AI</Text>
            <Text style={styles.actionSubText}>Converse with an AI regarding your eye-specific questions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBox} 
            onPress={() => router.push("/screens/settings")}
          >
            <Ionicons name="settings-outline" size={32} color="black" style={styles.actionIcon} />
            <Text style={styles.actionTitle}>Settings</Text>
            <Text style={styles.actionSubText}>Manage all of your personal settings in Oculare</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Past Retinal Scans */}
      <View style={styles.pastScans}>
        <Text style={styles.sectionScan}>Past retinal scans</Text>
        <View style={styles.scanItem}>
          <Text style={styles.scanText}>Retinal Diagnosis #1</Text>
          <Text style={styles.scanDate}>2/22/2025</Text>
        </View>
        <View style={styles.scanItem}>
          <Text style={styles.scanText}>Retinal Diagnosis #2</Text>
          <Text style={styles.scanDate}>2/21/2025</Text>
        </View>

        {/* View All Button */}
        <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push("/screens/pastscans")}>
          <Text style={styles.viewAllText}>View all of your past retinal captures</Text>
          <Ionicons name="arrow-forward-circle-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BFC7BA",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 70,
    height: 70,
    marginRight: 10,
    marginLeft: 60,
  },
  appTitle: {
    fontSize: 30,
    color: "#2F3E46",
    fontWeight: "bold",
    marginLeft: -6,
  },
  bold: {
    color: "#52796F",
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2F3E46",
    marginBottom: 8,
    marginTop: -10,
  },
  subText: {
    fontSize: 15,
    color: "#2F3E46",
    marginBottom: 25,
  },
  quickActions: {
    marginBottom: 20,
  },
  actionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2F3E46",
    marginTop: -10,
  },
  sectionScan: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2F3E46",
    marginBottom: 8,
    marginTop: -10,
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionBox: {
    backgroundColor: "#5C887D",
    width: "48%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  actionIcon: {
    marginBottom: 5,
  },
  actionTitle: {
    fontWeight: "bold",
    color: "#FFFFFF",
    alignSelf: "flex-start",
  },
  actionSubText: {
    fontSize: 12,
    color: "#FFFFFF",
    alignSelf: "flex-start",
    marginTop: 3,
  },
  pastScans: {
    marginBottom: 20,
  },
  scanItem: {
    backgroundColor: "#A8B5A1",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  scanText: {
    fontSize: 16,
    color: "#2F3E46",
  },
  scanDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2F3E46",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginLeft: 10,
  },
  viewAllText: {
    fontSize: 14,
    color: "#2F3E46",
    marginRight: 32,
  },
});