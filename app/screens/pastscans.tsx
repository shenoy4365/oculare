import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

// Interface for scan object
interface ScanData {
  id: string | number;
  scanNumber: number | null;
  filename: string;
  date: string;
  diagnosis: string;
  disease: string;
  confidence: string;
  imageUrl: string;
  disease1: string;
  disease2: string;
  percent1: string;
  percent2: string;
  filenames: string[];
}

export default function PastScansScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");
  const [scans, setScans] = useState<ScanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedScanData, setSelectedScanData] = useState<ScanData | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Fetch the current user and their scans on component mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch the current authenticated user
  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchScans(user.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setLoading(false);
    }
  };

  // Helper function to expand disease abbreviations
  const expandDiseaseAbbreviation = (abbr: string): string => {
    const diseaseMap: Record<string, string> = {
      'C': 'Cataract',
      'DR': 'Diabetic Retinopathy',
      'G': 'Glaucoma',
    };
    return diseaseMap[abbr] || abbr;
  };

  // Fetch scans from Supabase storage and group by scan number
  const fetchScans = async (userId: string) => {
    setLoading(true);
    try {
      console.log("Fetching scans for user:", userId);
  
      // Retrieve the list of files from the user's folder in the 'retinal-scans' bucket
      const { data: files, error } = await supabase.storage
        .from('retinal-scans')
        .list(userId);
  
      if (error) {
        console.error("Error fetching images:", error);
        setLoading(false);
        return;
      }
  
      if (files && files.length > 0) {
        // Process each file to extract metadata and analysis results
        const scanObjects = await Promise.all(files.map(async (file) => {
          // Generate a signed URL for the image
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('retinal-scans')
            .createSignedUrl(`${userId}/${file.name}`, 60 * 60); // 1 hour expiry
  
          const imageUrl = signedUrlData?.signedUrl || "";
  
          // Parse filename to extract scan number and disease information
          // Expected format: scan_<number>_<disease1>:<confidence1>-<disease2>:<confidence2>.jpg
          const filenameMatch = file.name.match(/^scan_(\d+)_([\w:.-]+)\.jpg$/);
          if (!filenameMatch) {
            console.warn(`Filename does not match expected pattern: ${file.name}`);
            return null;
          }
  
          const scanNumber = parseInt(filenameMatch[1], 10);
          const diseasePart = filenameMatch[2]; // e.g., "C:41.4-DR:36.5"
  
          // Split the disease part into individual disease-confidence pairs
          const diseasePairs = diseasePart.split('-');
  
          // Parse each disease-confidence pair
          const parsedDiseases = diseasePairs.map(pair => {
            const [abbr, percent] = pair.split(':');
            return {
              abbr,
              name: expandDiseaseAbbreviation(abbr),
              percent
            };
          });
  
          // Build the diagnosis text
          let diagnosisText = "No specific diagnosis available.";
          if (parsedDiseases.length > 0) {
            const diseaseDescriptions = parsedDiseases.map(d => `${d.name} (${d.percent}%)`);
            const lastDisease = diseaseDescriptions.pop();
            const diseaseList = diseaseDescriptions.length > 0
              ? `${diseaseDescriptions.join(', ')} and ${lastDisease}`
              : lastDisease;
            diagnosisText = `The system detected potential signs of ${diseaseList}. Recommend comprehensive clinical examination to confirm diagnosis.`;
          }
  
          // Combine disease names for display
          const diseaseDisplay = parsedDiseases.map(d => d.name).join(' and ');
  
          return {
            id: scanNumber,
            scanNumber,
            filename: file.name,
            filenames: [file.name],
            date: new Date(file.created_at || Date.now()).toLocaleDateString(),
            diagnosis: diagnosisText,
            disease: diseaseDisplay,
            confidence: parsedDiseases[0]?.percent ? `${parsedDiseases[0].percent}%` : "N/A",
            imageUrl,
            // Store additional info for display
            disease1: parsedDiseases[0]?.name || "",
            percent1: parsedDiseases[0]?.percent || "",
            disease2: parsedDiseases[1]?.name || "",
            percent2: parsedDiseases[1]?.percent || ""
          };
        }));
  
        // Filter out any null entries resulting from filename mismatches
        const validScanObjects = scanObjects.filter(scan => scan !== null);
  
        // Group scans by scanNumber to consolidate multiple images for the same scan
        const groupedScans: Record<string, ScanData> = {};
  
        validScanObjects.forEach(scan => {
          const key = `scan_${scan.scanNumber}`;
          if (!groupedScans[key]) {
            groupedScans[key] = { ...scan };
          } else {
            const existingScan = groupedScans[key];
            existingScan.filenames.push(scan.filename);
  
            // Merge disease information
            const allDiseases = new Set<string>();
            if (existingScan.disease1) allDiseases.add(existingScan.disease1);
            if (existingScan.disease2) allDiseases.add(existingScan.disease2);
            if (scan.disease1) allDiseases.add(scan.disease1);
            if (scan.disease2) allDiseases.add(scan.disease2);
  
            const diseaseArr = Array.from(allDiseases);
            let updatedDiseaseDisplay = diseaseArr.join(" and ");
  
            // Build updated diagnosis text
            let updatedDiagnosis = "The system detected potential signs of ";
            const diseaseDescriptions = diseaseArr.map(disease => {
              let percent = "";
              if (disease === scan.disease1 && scan.percent1) percent = scan.percent1;
              else if (disease === scan.disease2 && scan.percent2) percent = scan.percent2;
              else if (disease === existingScan.disease1 && existingScan.percent1) percent = existingScan.percent1;
              else if (disease === existingScan.disease2 && existingScan.percent2) percent = existingScan.percent2;
              return percent ? `${disease} (${percent}%)` : disease;
            });
  
            const lastDisease = diseaseDescriptions.pop();
            const diseaseList = diseaseDescriptions.length > 0
              ? `${diseaseDescriptions.join(', ')} and ${lastDisease}`
              : lastDisease;
            updatedDiagnosis += `${diseaseList}. Recommend comprehensive clinical examination to confirm diagnosis.`;
  
            existingScan.disease = updatedDiseaseDisplay;
            existingScan.diagnosis = updatedDiagnosis;
  
            // Update the date if the new scan is more recent
            const existingDate = new Date(existingScan.date);
            const newDate = new Date(scan.date);
            if (newDate > existingDate) {
              existingScan.date = scan.date;
            }
  
            // Update the imageUrl if available
            if (scan.imageUrl) {
              existingScan.imageUrl = scan.imageUrl;
            }
          }
        });
  
        // Convert grouped scans back to an array and sort by scan number (newest first)
        const consolidatedScans = Object.values(groupedScans).sort(
          (a, b) => Number(b.scanNumber) - Number(a.scanNumber)
        );
  
        setScans(consolidatedScans);
        
        // After processing all scans, update the user's diagnoses in the database
        if (consolidatedScans.length > 0) {
          await updateUserDiagnoses(userId, consolidatedScans);
        }
      }
    } catch (error) {
      console.error("Error in fetchScans:", error);
    } finally {
      setLoading(false);
    }
  };

  // New function to update the user's diagnoses in the database
  const updateUserDiagnoses = async (userId: string, scans: ScanData[]) => {
    try {
      // Create a structured format of all diagnoses
      const diagnosesData = scans.map(scan => ({
        scanNumber: scan.scanNumber,
        date: scan.date,
        diagnosis: scan.diagnosis,
        disease: scan.disease,
        disease1: scan.disease1,
        percent1: scan.percent1,
        disease2: scan.disease2,
        percent2: scan.percent2
      }));
      
      // Save as JSON string
      const diagnosesToSave = JSON.stringify(diagnosesData);
      
      // Update the user's record in the 'users' table
      const { error } = await supabase
        .from('users')
        .update({ diagnoses: diagnosesToSave })
        .eq('id', userId);
      
      if (error) {
        console.error("Error updating user diagnoses:", error);
      } else {
        console.log("Successfully updated user diagnoses");
      }
    } catch (error) {
      console.error("Error in updateUserDiagnoses:", error);
    }
  };
  
  // Delete a scan (now deletes all files associated with a scan number)
  const deleteScan = async (scanData: ScanData) => {
    try {
      // Delete all files associated with this scan number
      const filePaths = scanData.filenames.map(filename => `${userId}/${filename}`);
      
      const { error } = await supabase.storage
        .from('retinal-scans')
        .remove(filePaths);
      
      if (error) {
        console.error("Error removing images:", error);
        return;
      }
      
      // Update the UI by removing the deleted scan
      const updatedScans = scans.filter(scan => scan.scanNumber !== scanData.scanNumber);
      setScans(updatedScans);
      
      // After deleting a scan, update the user's diagnoses in the database
      if (updatedScans.length > 0) {
        await updateUserDiagnoses(userId, updatedScans);
      } else {
        // If no scans are left, clear the diagnoses field
        await supabase
          .from('users')
          .update({ diagnoses: null })
          .eq('id', userId);
      }
    } catch (error) {
      console.error("Error in deleteScan:", error);
    }
  };

  // View scan image in modal
  const viewScanImage = (scan: ScanData) => {
    setSelectedScanData(scan);
    setModalVisible(true);
    
    // Only set the image when the modal is opened
    if (scan.imageUrl && scan.imageUrl.trim() !== "") {
      setImageLoading(true);
      setSelectedImage(scan.imageUrl);
    } else {
      setSelectedImage(null);
    }
  };
  
  // Handle image load completion
  const handleImageLoaded = () => {
    setImageLoading(false);
  };

  return (
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
      <Text style={styles.sectionTitle}>Past Retinal Scans</Text>
      <Text style={styles.subText}>Let's view your past retinal eye-disease scans you have had with Oculare below.</Text>

      {/* Loading State */}
      {loading && (
        <Text style={styles.loadingText}>Loading your past scans...</Text>
      )}

      {/* No Scans State */}
      {!loading && scans.length === 0 && (
        <View style={styles.noScansContainer}>
          <Ionicons name="images-outline" size={60} color="#52796F" />
          <Text style={styles.noScansText}>No retinal scans found</Text>
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={() => router.push('/screens/retinal')}
          >
            <Text style={styles.uploadButtonText}>Upload a new scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scan Cards */}
      {scans.map((scan) => (
        <View key={scan.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Diagnosis #{scan.scanNumber || "?"}</Text>
            <Text style={styles.cardDate}>{scan.date}</Text>
          </View>

          <Text style={styles.diseaseText}>{scan.disease}</Text>

          {/* Confidence levels - Show each disease separately */}
          <View style={styles.confidenceContainer}>
            {scan.disease1 && scan.percent1 && (
              <Text style={styles.confidenceText}>
                {scan.disease1}: {scan.percent1}% confidence
              </Text>
            )}
            {scan.disease2 && scan.percent2 && (
              <Text style={styles.confidenceText}>
                {scan.disease2}: {scan.percent2}% confidence
              </Text>
            )}
          </View>

          <Text style={styles.diagnosisTitle}>Diagnosis information:</Text>
          <Text style={styles.diagnosisText}>{scan.diagnosis}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={() => viewScanImage(scan)}
            >
              <Text style={styles.viewButtonText}>View scanned image</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.trashIcon}
              onPress={() => deleteScan(scan)}
            >
              <Ionicons name="trash-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Image Viewing Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
          setSelectedImage(null);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Diagnosis #{selectedScanData?.scanNumber || "?"}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedImage(null);
                }}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageContainer}>
              {imageLoading && (
                <ActivityIndicator size="large" color="#52796F" style={styles.imageLoader} />
              )}
              
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.modalImage}
                  resizeMode="contain"
                  onLoad={handleImageLoaded}
                  defaultSource={require("@/assets/images/oculare-logo.png")}
                />
              ) : (
                <View style={[styles.modalImage, styles.noImageContainer]}>
                  <Text style={styles.noImageText}>Image not available</Text>
                </View>
              )}
            </View>
            
            {selectedScanData && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalDate}>Date: {selectedScanData.date}</Text>
                <Text style={styles.modalDisease}>{selectedScanData.disease}</Text>
                
                {/* Display both disease confidences if available */}
                <View style={styles.modalConfidenceContainer}>
                  {selectedScanData.disease1 && selectedScanData.percent1 && (
                    <Text style={styles.modalConfidence}>
                      {selectedScanData.disease1}: {selectedScanData.percent1}% confidence
                    </Text>
                  )}
                  {selectedScanData.disease2 && selectedScanData.percent2 && (
                    <Text style={styles.modalConfidence}>
                      {selectedScanData.disease2}: {selectedScanData.percent2}% confidence
                    </Text>
                  )}
                </View>
                
                <Text style={styles.modalDiagnosis}>{selectedScanData.diagnosis}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BFC7BA",
    padding: 20,
    marginTop: -50,
  },
  backButton: {
    marginTop: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2F3E46",
  },
  subText: {
    fontSize: 16,
    color: "#2F3E46",
    marginTop: 5,
    marginBottom: 20,
  },
  headerWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2F3E46",
    textAlign: "left",
    marginBottom: 5,
    marginTop: -25,
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
  loadingText: {
    fontSize: 16,
    color: "#2F3E46",
    textAlign: "center",
    marginTop: 30,
  },
  noScansContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  noScansText: {
    fontSize: 18,
    color: "#2F3E46",
    marginTop: 10,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: "#52796F",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#D3D9CE",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2F3E46",
  },
  cardDate: {
    fontSize: 16,
    color: "#2F3E46",
  },
  diseaseText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2F3E46",
    marginBottom: 8,
  },
  confidenceContainer: {
    marginBottom: 10,
  },
  confidenceText: {
    fontSize: 14,
    color: "#52796F",
    fontWeight: "500",
  },
  diagnosisTitle: {
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginBottom: 5,
    color: "#2F3E46",
  },
  diagnosisText: {
    fontSize: 15,
    color: "#2F3E46",
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  viewButton: {
    backgroundColor: "#52796F",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  viewButtonText: {
    color: "white",
    fontWeight: "600",
  },
  trashIcon: {
    padding: 5,
  },
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalView: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#D3D9CE",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2F3E46",
  },
  closeButton: {
    padding: 5,
  },
  imageContainer: {
    position: 'relative',
    width: "100%",
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 15,
  },
  imageLoader: {
    position: 'absolute',
    zIndex: 1,
  },
  modalImage: {
    width: "100%",
    height: 300,
    borderRadius: 8,
  },
  noImageContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E5E5",
  },
  noImageText: {
    color: "#555",
    fontWeight: "500",
  },
  modalInfo: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#AAA",
  },
  modalDate: {
    fontSize: 16,
    color: "#2F3E46",
    marginBottom: 5,
  },
  modalDisease: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2F3E46",
    marginBottom: 8,
  },
  modalConfidenceContainer: {
    marginBottom: 10,
  },
  modalConfidence: {
    fontSize: 15,
    color: "#52796F",
    fontWeight: "500",
  },
  modalDiagnosis: {
    fontSize: 15,
    color: "#2F3E46",
    marginTop: 8,
  },
});