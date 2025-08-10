import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";

// Interface for physician data
interface Physician {
  name: string;
  location: string;
  disease: string;
  experience: string;
  biography: string;
}

const SpecialistsScreen: React.FC = () => {
  const router = useRouter();

  const [openState, setOpenState] = useState(false);
  const [valueState, setValueState] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState([
    { label: "Alabama", value: "Alabama" },
    { label: "Alaska", value: "Alaska" },
    { label: "Arizona", value: "Arizona" },
    { label: "Arkansas", value: "Arkansas" },
    { label: "California", value: "California" },
    { label: "Colorado", value: "Colorado" },
    { label: "Connecticut", value: "Connecticut" },
    { label: "Delaware", value: "Delaware" },
    { label: "Florida", value: "Florida" },
    { label: "Georgia", value: "Georgia" },
    { label: "Hawaii", value: "Hawaii" },
    { label: "Idaho", value: "Idaho" },
    { label: "Illinois", value: "Illinois" },
    { label: "Indiana", value: "Indiana" },
    { label: "Iowa", value: "Iowa" },
    { label: "Kansas", value: "Kansas" },
    { label: "Kentucky", value: "Kentucky" },
    { label: "Louisiana", value: "Louisiana" },
    { label: "Maine", value: "Maine" },
    { label: "Maryland", value: "Maryland" },
    { label: "Massachusetts", value: "Massachusetts" },
    { label: "Michigan", value: "Michigan" },
    { label: "Minnesota", value: "Minnesota" },
    { label: "Mississippi", value: "Mississippi" },
    { label: "Missouri", value: "Missouri" },
    { label: "Montana", value: "Montana" },
    { label: "Nebraska", value: "Nebraska" },
    { label: "Nevada", value: "Nevada" },
    { label: "New Hampshire", value: "New Hampshire" },
    { label: "New Jersey", value: "New Jersey" },
    { label: "New Mexico", value: "New Mexico" },
    { label: "New York", value: "New York" },
    { label: "North Carolina", value: "North Carolina" },
    { label: "North Dakota", value: "North Dakota" },
    { label: "Ohio", value: "Ohio" },
    { label: "Oklahoma", value: "Oklahoma" },
    { label: "Oregon", value: "Oregon" },
    { label: "Pennsylvania", value: "Pennsylvania" },
    { label: "Rhode Island", value: "Rhode Island" },
    { label: "South Carolina", value: "South Carolina" },
    { label: "South Dakota", value: "South Dakota" },
    { label: "Tennessee", value: "Tennessee" },
    { label: "Texas", value: "Texas" },
    { label: "Utah", value: "Utah" },
    { label: "Vermont", value: "Vermont" },
    { label: "Virginia", value: "Virginia" },
    { label: "Washington", value: "Washington" },
    { label: "West Virginia", value: "West Virginia" },
    { label: "Wisconsin", value: "Wisconsin" },
    { label: "Wyoming", value: "Wyoming" },
  ]);

  const [openDisease, setOpenDisease] = useState(false);
  const [valueDisease, setValueDisease] = useState<string | null>(null);
  
  // planning to add 3 diseases total
  // planning to do 4 doctors for each disease for each state (so 3 * 4 * 50 = 600 doctors total)
  const [currentDisease, setCurrentDisease] = useState([
    { label: "Diabetic Retinopathy", value: "Diabetic Retinopathy" },
    { label: "Cataracts", value: "Cataracts" },
    { label: "Glaucoma", value: "Glaucoma" },
  ]);

  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [hasSearched, setHasSearched] = useState(false); // NEW STATE

  const fetchPhysicians = async () => {
    if (!valueState || !valueDisease) {
      alert("Please select both a state and a disease.");
      return;
    }

    setHasSearched(true); // Trigger showing of results

    try {
      const url = `http://192.168.68.102:5000/physicians?disease=${valueDisease}&state=${valueState}`;
      console.log("Requesting:", url);

      const response = await fetch(url);
      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      const data = await response.json();
      console.log("Fetched physicians:", data);

      if (data && Array.isArray(data)) {
        setPhysicians(data);
      } else if (data.physicians && Array.isArray(data.physicians)) {
        setPhysicians(data.physicians);
      } else {
        alert("No physician data available.");
        setPhysicians([]);
      }
    } catch (error) {
      console.error("Error fetching physicians:", error);
      alert("There was an error fetching results.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/oculare-logo.png")}
            style={styles.logo}
          />
          <Text style={styles.appTitle}>
            <Text style={styles.bold}>Ocu</Text>lare
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Eye Specialist Database</Text>
      <Text style={styles.subText}>
        Oculare can help you connect with renowned eye physicians in your region.
        Filter by your state and condition below.
      </Text>

      <Text style={styles.firstdroplabel}>Select your Desired State</Text>
      <View style={{ zIndex: 1000 }}>
        <DropDownPicker
          open={openState}
          value={valueState}
          items={currentState}
          setOpen={() => {
            setOpenState(!openState);
            setOpenDisease(false);
          }}
          setValue={setValueState}
          setItems={setCurrentState}
          placeholder="Select State"
          dropDownDirection="AUTO"
          style={dropDownStyles}
          dropDownContainerStyle={dropDownContainerStyles}
          listItemContainerStyle={listItemStyles}
          textStyle={textStyles}
        />
      </View>

      <Text style={styles.seconddroplabel}>Select your Eye Disease</Text>
      <View style={{ zIndex: 999 }}>
        <DropDownPicker
          open={openDisease}
          value={valueDisease}
          items={currentDisease}
          setOpen={() => {
            setOpenDisease(!openDisease);
            setOpenState(false);
          }}
          setValue={setValueDisease}
          setItems={setCurrentDisease}
          placeholder="Select Eye Disease"
          dropDownDirection="AUTO"
          style={dropDownStyles}
          dropDownContainerStyle={dropDownContainerStyles}
          listItemContainerStyle={listItemStyles}
          textStyle={textStyles}
        />
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: 20 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.button} onPress={fetchPhysicians}>
          <Text style={styles.buttonText}>Find an Eye Specialist</Text>
        </TouchableOpacity>

        {hasSearched && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#2F3E46" }}>
              Results:
            </Text>
            {physicians.length === 0 ? (
              <Text style={{ color: "#2F3E46" }}>No results found.</Text>
            ) : (
              physicians.map((doc, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: "#E1E5DD",
                    padding: 15,
                    borderRadius: 10,
                    marginBottom: 15,
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>Name: {doc.name}</Text>
                  <Text>Location: {doc.location}</Text>
                  <Text>Disease(s): {doc.disease}</Text>
                  <Text>Experience: {doc.experience}</Text>
                  <Text
                    style={{ color: "blue", marginTop: 5 }}
                    onPress={() => {
                      if (doc.biography) {
                        Linking.openURL(doc.biography);
                      }
                    }}
                  >
                    View Biography
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Styling for dropdowns
const dropDownStyles = {
  backgroundColor: "#A9B3A4",
  borderColor: "#A9B3A4",
  borderRadius: 8,
  paddingHorizontal: 10,
};

const dropDownContainerStyles = {
  backgroundColor: "#A9B3A4",
  borderColor: "#A9B3A4",
};

const listItemStyles = {
  borderBottomWidth: 1,
  borderBottomColor: "#2F3E46",
};

const textStyles = {
  color: "#2F3E46",
  fontSize: 16,
};

// Main styling
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
  button: {
    backgroundColor: "#52796F",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 60,
    marginTop: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
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
  firstdroplabel: {
    fontSize: 15,
    color: "#2F3E46",
    textAlign: "left",
    marginBottom: 15,
    fontWeight: "bold",
  },
  seconddroplabel: {
    marginTop: 22,
    fontSize: 15,
    color: "#2F3E46",
    textAlign: "left",
    marginBottom: 15,
    fontWeight: "bold",
  },
});

export default SpecialistsScreen;