import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; 
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system";
import uuid from "react-native-uuid";

export const getUserData = async (userId:string) => {
    try {
        const {data, error} = await supabase
        .from('users')
        .select()
        .eq('id', userId)
        .single();

        if (error) {
            return {success: false, msg: error.message};
        }
        return {success: true, data};
    }
    catch (error: any) {
        // console.log('got error: ', error);
        return {success: false, msg: error.message};
    }
}

export default function RetinalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showGoodCard, setShowGoodCard] = useState(false);
  const [showPoorCard, setShowPoorCard] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [analysisTriggered, setAnalysisTriggered] = useState(false);
  
  // Status indicators
  const [backendUploadComplete, setBackendUploadComplete] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [supabaseUploadComplete, setSupabaseUploadComplete] = useState(false);

  // Replace the processImage function with this improved version
  const processImage = async (uri: string) => {
    setLoading(true);
    setBackendUploadComplete(false);
    setAnalysisComplete(false);
    setSupabaseUploadComplete(false);
    setAnalysisTriggered(true);
  
    try {
      // Step 1: Upload image to backend for analysis
      let formData = new FormData();
      formData.append("file", {
        uri,
        name: "image.jpg",
        type: "image/jpeg",
      } as any);
  
      const response = await fetch("your-python-flask-ip-address/upload", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setBackendUploadComplete(true);
  
      const data = await response.json();
  
      // Format the disease probabilities for the filename
      let diseasePercentString = "";
      if (data?.analysis_result?.disease_probabilities) {
        // Get the top two diseases with their probabilities
        const diseaseEntries = Object.entries(data.analysis_result.disease_probabilities)
          .map(([disease, probability]) => ({
            disease,
            probability: probability as number
          }))
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 2); // Take top 2 diseases
        
        // Create abbreviated disease names with percentages
        diseasePercentString = diseaseEntries.map(entry => {
          // Create abbreviation (e.g., Diabetic Retinopathy -> DR)
          const abbr = entry.disease
            .split(' ')
            .map(word => word[0].toUpperCase())
            .join('');
            
          // Format percentage with one decimal place
          const percent = (entry.probability * 100).toFixed(1);
          
          return `${abbr}:${percent}`;
        }).join('-');
      } else {
        // Fallback if no disease probabilities
        diseasePercentString = "Unknown";
      }
      
      // Store the full analysis result for display purposes
      setAnalysisResult(data.analysis_result);
      setAnalysisComplete(true);
      
      // Step 3: Determine the next scan number
      const { data: files, error } = await supabase.storage
        .from("retinal-scans")
        .list(`${user?.id}`);
  
      let scanNumber = 1;
      if (files && files.length > 0) {
        const scanNumbers = files
          .map((file) => {
            const match = file.name.match(/scan_(\d+)_/);
            return match ? parseInt(match[1], 10) : null;
          })
          .filter((num) => num !== null) as number[];
        if (scanNumbers.length > 0) {
          scanNumber = Math.max(...scanNumbers) + 1;
        }
      }
  
      const fileExt = uri.split(".").pop();
      // Create filename with disease abbreviations and percentages
      const fileName = `scan_${scanNumber}_${diseasePercentString}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;
  
      //console.log("Filename created:", fileName);
  
      // Step 4: Read file and convert to base64
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Step 5: Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from("retinal-scans")
        .upload(filePath, Buffer.from(fileContent, "base64"), {
          contentType: "image/jpeg",
          upsert: false,
        });
  
      if (uploadError) {
        //console.error("Upload error:", uploadError);
        throw uploadError;
      }
  
      setSupabaseUploadComplete(true);
      setImageUploaded(true);
    } catch (error) {
      //console.error("Process error:", error);
      alert("An error occurred during the process. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (fromCamera = false) => {
    let result;
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Camera permission is required to take a photo.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
    }

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      setImageUploaded(false);
      setAnalysisTriggered(false);
      setAnalysisResult(null);
      setBackendUploadComplete(false);
      setAnalysisComplete(false);
      setSupabaseUploadComplete(false);
    }
  };

  const startProcessFromCamera = async () => {
    let result;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission is required to take a photo.");
      return;
    }
    
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      await processImage(uri);
    }
  };

  const startProcessFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      await processImage(uri);
    }
  };
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: 40 }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Image
          source={require("@/assets/images/oculare-logo.png")}
          style={styles.logo}
        />
        <Text style={styles.appTitle}>
          <Text style={styles.bold}>Ocu</Text>lare
        </Text>
      </View>

      <View style={styles.upperPadding}>
        <Text style={styles.title}>Retinal Scans Capture</Text>
        <Text style={styles.subtitle}>
          Please read the following information regarding Oculare's retinal procedure:{"\n\n"}
          {"\u2022"} Review the provided examples of correct and incorrect image uploads{"\n"}
          {"\u2022"} For optimal results, ensure the uploaded retinal scan is clear and well-lit. Low-quality or blurred images may reduce the accuracy of the analysis{"\n"}
          {"\u2022"} To access detailed results, visit the Past Retinal Scans page. Your uploaded image will be stored there for future reference and can be deleted at any time{"\n\n"}
          <Text style={{ fontWeight: "bold" }}>Note</Text>: By uploading an image, you consent to its temporary AI-based analysis, which provides insights but is not a substitute for professional medical advice.
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.properUploadsButton}
          onPress={() => {
            setShowGoodCard(!showGoodCard);
            setShowPoorCard(false);
          }}
        >
          <Text style={styles.uploadText}>
            {showGoodCard ? "Hide Good Scan" : "Good Retinal Scan"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.properUploadsButton}
          onPress={() => {
            setShowPoorCard(!showPoorCard);
            setShowGoodCard(false);
          }}
        >
          <Text style={styles.uploadText}>
            {showPoorCard ? "Hide Poor Scan" : "Poor Retinal Scan"}
          </Text>
        </TouchableOpacity>
      </View>

      {showGoodCard && (
        <View style={styles.exampleCard}>
          <Text style={styles.cardTitle}>Good Retinal Scan Example</Text>
          <Image
            source={require("@/assets/images/good-retinal-sample.jpg")}
            style={styles.cardImage}
          />
          <Text style={styles.cardText}>
            This image shows a high-quality retinal scan with clear vessel visibility.
          </Text>
          <Text style={styles.cardText}>
            Uploading similar quality scans will help maximize diagnostic accuracy.
          </Text>
        </View>
      )}

      {showPoorCard && (
        <View style={styles.exampleCard}>
          <Text style={styles.cardTitle}>Poor Retinal Scan Example</Text>
          <Image
            source={require("@/assets/images/poor-retinal-sample.jpg")}
            style={styles.cardImage}
          />
          <Text style={styles.cardText}>
            This scan is blurry and lacks clarity of retinal vessels.
          </Text>
          <Text style={styles.cardText}>
            Avoid low lighting, motion blur, and poor focus for reliable analysis.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.uploadButton} onPress={startProcessFromCamera}>
        <View style={styles.buttonContent}>
          <FontAwesome name="camera" size={20} color="white" style={styles.icon} />
          <Text style={styles.uploadText}>Capture & analyze retinal image</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.uploadButton} onPress={startProcessFromGallery}>
        <View style={styles.buttonContent}>
          <FontAwesome name="upload" size={20} color="white" style={styles.icon} />
          <Text style={styles.uploadText}>Upload & analyze retinal image</Text>
        </View>
      </TouchableOpacity>


      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Processing your image...</Text>
        </View>
      )}

      {/* Status indicators */}
      {!loading && backendUploadComplete && (
        <View style={styles.statusIndicator}>
          <FontAwesome name="check-circle" size={16} color="green" style={styles.statusIcon} />
          <Text style={styles.statusText}>Image uploaded to analysis server</Text>
        </View>
      )}
      
      {!loading && analysisComplete && (
        <View style={styles.statusIndicator}>
          <FontAwesome name="check-circle" size={16} color="green" style={styles.statusIcon} />
          <Text style={styles.statusText}>Retinal analysis completed</Text>
        </View>
      )}
      
      {!loading && supabaseUploadComplete && (
        <View style={styles.statusIndicator}>
          <FontAwesome name="check-circle" size={16} color="green" style={styles.statusIcon} />
          <Text style={styles.statusText}>Image saved to your records</Text>
        </View>
      )}

      {analysisTriggered && analysisResult && (
        <View style={styles.exampleCard}>
          <Text style={styles.cardTitle}>Eye Disease Analysis Results</Text>
          <Image source={{ uri: selectedImage! }} style={styles.cardImage} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Analysis Summary</Text>
            <Text style={styles.summaryText}>
              {analysisResult.diagnosis?.summary || "Analysis completed."}{" "}
              {analysisResult.diagnosis?.details ||
                `The scan indicates ${analysisResult.disease_detected ? "presence" : "absence"} of eye conditions with ${(analysisResult.confidence * 100).toFixed(1)}% confidence.`}{" "}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Disease Detection</Text>
            <View
              style={[
                styles.resultBadge,
                {
                  backgroundColor: analysisResult.uncertain_prediction
                    ? "#fff9c4"
                    : analysisResult.disease_detected
                    ? "#ffcdd2"
                    : "#c8e6c9",
                },
              ]}
            >
              <Text style={styles.resultText}>
                {analysisResult.most_likely_disease}
                {analysisResult.disease_detected &&
                  ` (${(analysisResult.confidence * 100).toFixed(1)}%)`}
                {analysisResult.uncertain_prediction && " - Uncertain"}
              </Text>
            </View>
            {analysisResult.model_version && (
              <Text style={styles.modelInfo}>Oculare Analysis Model v{analysisResult.model_version}</Text>
            )}
          </View>

          {analysisResult.disease_probabilities && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Condition Probabilities</Text>
              {Object.entries(analysisResult.disease_probabilities).map(
                ([disease, probability]) => (
                  <View key={disease} style={styles.probabilityRow}>
                    <Text style={styles.diseaseLabel}>{disease}:</Text>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${(probability as number) * 100}%`,
                            backgroundColor:
                              disease === analysisResult.most_likely_disease
                                ? "#1e88e5"
                                : "#90caf9",
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.probabilityText}>
                      {((probability as number) * 100).toFixed(1)}%
                    </Text>
                  </View>
                )
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BFC7BA",
    padding: 20,
  },
  contentContainer: {
    alignItems: "center",
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
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 8,
    textAlign: 'justify',
  },
  modelInfo: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    fontStyle: 'italic',
  },
  icon: {
    marginRight: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 20,
    width: "100%",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    paddingLeft: 10,
  },
  upperPadding: {
    width: "100%",
    marginTop: 20,
  },
  logo: {
    width: 70,
    height: 70,
    marginRight: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  appTitle: {
    fontSize: 30,
    color: "#2F3E46",
    fontWeight: "bold",
  },
  bold: {
    color: "#52796F",
  },
  subText: {
    fontSize: 16,
    color: "#2F3E46",
    marginTop: 5,
    marginBottom: 20,
    textAlign: "center",
  },
  uploadButton: {
    backgroundColor: "#2F3E46",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    width: "100%",
  },
  uploadText: {
    color: "white",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: -10,
  },
  properUploadsButton: {
    backgroundColor: "#52796F",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 10,
    marginTop: 20,
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#EAEAEA",
    borderRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2F3E46",
    textAlign: "left",
    marginBottom: 5,
    marginTop: -30,
    alignSelf: "flex-start",
  },
  subtitle: {
    fontSize: 15,
    color: "#2F3E46",
    textAlign: "left",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  exampleCard: {
    marginTop: 15,
    backgroundColor: "#A9B3A4",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: "100%",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2F3E46",
  },
  cardImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    resizeMode: "cover",
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: "#2F3E46",
    marginBottom: 5,
  },
  // Status indicators
  loadingContainer: {
    marginTop: 15,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#333",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#e8f5e9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: "#2e7d32",
  },
  // Analysis results styles
  infoSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  resultBadge: {
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
    alignSelf: 'flex-start',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  diseaseLabel: {
    fontSize: 15,
    color: '#444',
    width: 150,
  },
  progressBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#eee',
    borderRadius: 6,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1e88e5',
  },
  probabilityText: {
    fontSize: 14,
    color: '#555',
    width: 50,
    textAlign: 'right',
  },
});