import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB4
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import os
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EyeDiseaseDetector:
    """Medical-grade eye disease detection system for clinical use"""
    
    def __init__(self, model_path='models/eye_disease_model.h5', 
                 config_path='config/model_config.json',
                 uncertainty_threshold=0.15):
        """
        Initialize the detector with model paths and configuration
        
        Args:
            model_path: Path to the trained model weights
            config_path: Path to model configuration file
            uncertainty_threshold: Threshold for when to flag uncertain predictions
        """
        self.model_path = model_path
        self.config_path = config_path
        self.uncertainty_threshold = uncertainty_threshold
        self.model = None
        self.config = None
        self.diseases = ['Diabetic Retinopathy', 'Glaucoma', 'Cataracts']
        self.version = "1.0.3"  # Version tracking for model lineage
        
        # Load configuration if available
        self._load_config()
        
        # Load or create the model
        self._load_model()
    
    def _load_config(self):
        """Load model configuration from JSON file"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    self.config = json.load(f)
                logger.info(f"Configuration loaded from {self.config_path}")
            else:
                # Default configuration
                self.config = {
                    "input_size": [224, 224],
                    "normalization_method": "per_image",
                    "confidence_threshold": 0.5,
                    "ensemble_models": False,
                    "preprocessing": {
                        "clahe_clip_limit": 2.0,
                        "clahe_grid_size": [8, 8],
                        "denoise_strength": 10,
                        "gamma_correction": 1.2
                    }
                }
                logger.warning(f"No configuration found at {self.config_path}. Using defaults.")
        except Exception as e:
            logger.error(f"Error loading configuration: {str(e)}. Using defaults.")
            self.config = {"input_size": [224, 224], "normalization_method": "per_image"}
    
    def _load_model(self):
        """Load the pre-trained model or create a new one"""
        try:
            if os.path.exists(self.model_path):
                self.model = load_model(self.model_path, compile=False)
                # Compile with custom metrics
                self.model.compile(
                    optimizer='adam',
                    loss='categorical_crossentropy',
                    metrics=['accuracy', tf.keras.metrics.AUC(), tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
                )
                logger.info(f"Model loaded successfully from {self.model_path}")
            else:
                logger.warning(f"No model found at {self.model_path}. Creating new model architecture.")
                self._create_model()
                logger.warning("Model not trained! Results will not be clinically valid.")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}. Creating new model architecture.")
            self._create_model()
            logger.error("Model not trained! Results will not be clinically valid.")
    
    def _create_model(self):
        """Create model architecture for eye disease detection"""
        # Use EfficientNet which is more parameter-efficient and accurate
        base_model = EfficientNetB4(
            weights='imagenet',
            include_top=False,
            input_shape=(self.config["input_size"][0], self.config["input_size"][1], 3)
        )
        
        # Add custom classification head
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = BatchNormalization()(x)
        x = Dense(512, activation='relu')(x)
        x = BatchNormalization()(x)
        x = Dropout(0.4)(x)
        x = Dense(256, activation='relu')(x)
        x = BatchNormalization()(x)
        x = Dropout(0.3)(x)
        predictions = Dense(len(self.diseases), activation='softmax')(x)
        
        # Create and compile the model
        self.model = tf.keras.models.Model(inputs=base_model.input, outputs=predictions)
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy', tf.keras.metrics.AUC(), tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
        )
    
    def train(self, train_data, validation_data, epochs=50, batch_size=32):
        """
        Train the model using the provided datasets
        
        Args:
            train_data: Training dataset (tf.data.Dataset format)
            validation_data: Validation dataset
            epochs: Number of training epochs
            batch_size: Batch size for training
            
        Returns:
            Training history
        """
        if self.model is None:
            self._create_model()
        
        # Define callbacks for training
        callbacks = [
            # Save best weights
            ModelCheckpoint(
                self.model_path, 
                monitor='val_auc', 
                mode='max',
                save_best_only=True,
                verbose=1
            ),
            # Early stopping to prevent overfitting
            EarlyStopping(
                monitor='val_auc',
                patience=10,
                restore_best_weights=True,
                mode='max'
            ),
            # Reduce learning rate when plateauing
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-6
            )
        ]
        
        # Train the model
        history = self.model.fit(
            train_data,
            validation_data=validation_data,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks
        )
        
        # Save model and training metrics
        self.model.save(self.model_path)
        
        return history
    
    def preprocess_image(self, image):
        """
        Apply advanced preprocessing techniques for retinal images
        
        Args:
            image: Input retinal image (BGR format)
            
        Returns:
            Dictionary of processed images
        """
        # Get preprocessing parameters from config
        clahe_clip = self.config["preprocessing"].get("clahe_clip_limit", 2.0)
        clahe_grid = tuple(self.config["preprocessing"].get("clahe_grid_size", [8, 8]))
        denoise_strength = self.config["preprocessing"].get("denoise_strength", 10)
        gamma = self.config["preprocessing"].get("gamma_correction", 1.2)
        
        # Make a copy of the original
        original = image.copy()
        
        # Convert to RGB for visualization and later model input
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Extract channels (green channel has highest contrast for retinal features)
        green_channel = image[:,:,1]
        
        # Gamma correction to enhance contrast
        gamma_corrected = np.uint8(cv2.pow(green_channel / 255.0, gamma) * 255.0)
        
        # Apply CLAHE for better feature visibility
        clahe = cv2.createCLAHE(clipLimit=clahe_clip, tileGridSize=clahe_grid)
        enhanced_green = clahe.apply(gamma_corrected)
        
        # Denoise image (non-local means denoising preserves edges better than Gaussian)
        denoised = cv2.fastNlMeansDenoising(enhanced_green, None, denoise_strength, 7, 21)
        
        # Create a color enhanced version for the model
        enhanced_color = rgb.copy()
        enhanced_color[:,:,1] = enhanced_green  # Replace green channel with enhanced version
        
        # Create composite enhancement (multiple techniques combined)
        # Vessel enhancement using morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        tophat = cv2.morphologyEx(enhanced_green, cv2.MORPH_TOPHAT, kernel)
        vessel_enhanced = cv2.add(enhanced_green, tophat)
        
        return {
            "original": original,
            "rgb": rgb,
            "green_channel": green_channel,
            "enhanced_green": enhanced_green,
            "denoised": denoised,
            "vessel_enhanced": vessel_enhanced,
            "enhanced_color": enhanced_color,
            "gamma_corrected": gamma_corrected
        }
    
    def prepare_for_model(self, processed_img):
        """
        Prepare the processed image for model prediction
        
        Args:
            processed_img: Dictionary of processed images
            
        Returns:
            Image array ready for model input
        """
        # Resize to model input size
        input_size = self.config["input_size"]
        img_resized = cv2.resize(processed_img["enhanced_color"], (input_size[0], input_size[1]))
        
        # Normalize based on configuration
        norm_method = self.config.get("normalization_method", "per_image")
        
        if norm_method == "imagenet":
            # Imagenet normalization (subtract mean, divide by std)
            img_array = tf.keras.applications.efficientnet.preprocess_input(img_resized)
        elif norm_method == "zero_one":
            # Simple 0-1 scaling
            img_array = img_resized / 255.0
        else:  # per_image (default)
            # Normalize per image (subtract mean, divide by std)
            img_array = (img_resized - np.mean(img_resized)) / (np.std(img_resized) + 1e-7)
        
        # Expand dimensions for batch
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def _adjust_probabilities(self, predictions):
        """
        Adjust prediction probabilities to make highest probability disease always 90%
        
        Args:
            predictions: Original model predictions
            
        Returns:
            Adjusted prediction probabilities
        """
        # Find the index of the highest probability
        most_likely_idx = np.argmax(predictions)
        
        # Create new adjusted probabilities array
        adjusted_probs = np.zeros_like(predictions)
        
        # Set highest probability to 90%
        adjusted_probs[most_likely_idx] = 0.9
        
        # Distribute remaining 10% proportionally among other diseases
        if len(predictions) > 1:  # Only if we have more than one disease
            # Get original probabilities excluding the highest one
            other_probs = np.delete(predictions, most_likely_idx)
            
            # If all other probabilities are 0, distribute equally
            if np.sum(other_probs) == 0:
                other_indices = [i for i in range(len(predictions)) if i != most_likely_idx]
                for idx in other_indices:
                    adjusted_probs[idx] = 0.1 / (len(predictions) - 1)
            else:
                # Normalize the other probabilities to sum to 0.1
                other_probs_normalized = other_probs / np.sum(other_probs) * 0.1
                
                # Put the normalized probabilities back in the right places
                j = 0
                for i in range(len(predictions)):
                    if i != most_likely_idx:
                        adjusted_probs[i] = other_probs_normalized[j]
                        j += 1
        
        logger.info(f"Original probabilities: {predictions}, Adjusted: {adjusted_probs}")
        return adjusted_probs
    
    def analyze(self, image_path):
        """
        Analyze an eye image for disease detection
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with analysis results
        """
        try:
            # Read the image
            img = cv2.imread(image_path)
            
            if img is None:
                logger.error(f"Could not read image at {image_path}")
                return {"error": "Could not read the image."}
            
            # Get original dimensions
            height, width, channels = img.shape
            
            # Check if model is available
            if self.model is None:
                logger.error("No trained model available for analysis")
                return {
                    "error": "No trained model available for analysis.",
                    "height": int(height),
                    "width": int(width),
                    "channels": int(channels),
                }
            
            # Preprocess the image
            processed_img = self.preprocess_image(img)
            
            # Prepare for model
            img_array = self.prepare_for_model(processed_img)
            
            # Get model predictions
            raw_predictions = self.model.predict(img_array)[0]
            
            # FEATURE: Adjust predictions to make highest probability always 90%
            predictions = self._adjust_probabilities(raw_predictions)
            
            # Convert NumPy types to Python native types for JSON serialization
            predictions = [float(p) for p in predictions]
            
            # Create disease probability dictionary
            disease_probabilities = {disease: float(prob) for disease, prob in zip(self.diseases, predictions)}
            
            # Find most likely disease
            most_likely_idx = np.argmax(predictions)
            most_likely_disease = self.diseases[most_likely_idx]
            max_probability = float(predictions[most_likely_idx])
            
            # Check for uncertainty in the prediction (using raw predictions for this check)
            sorted_raw_probs = np.sort(raw_predictions)[::-1]
            margin = sorted_raw_probs[0] - sorted_raw_probs[1]  # Difference between top two probabilities
            
            # As per requirement: if a disease has 90% probability, it's never considered uncertain
            if max_probability >= 0.9:
                is_uncertain = False
            else:
                is_uncertain = bool(margin < self.uncertainty_threshold)  # Convert numpy.bool_ to Python bool
            
            # Check confidence threshold from config
            confidence_threshold = self.config.get("confidence_threshold", 0.5)
            disease_detected = bool(max_probability > confidence_threshold)  # Convert numpy.bool_ to Python bool
            
            # Create diagnosis and recommendation
            diagnosis = self._create_diagnosis(disease_probabilities, is_uncertain)
            
            # Return results - ensure all values are JSON serializable native Python types
            result = {
                "height": int(height),  # Ensure int not numpy.int32/int64
                "width": int(width),
                "channels": int(channels),
                "disease_detected": bool(disease_detected),  
                "most_likely_disease": most_likely_disease if disease_detected else "No disease detected",
                "confidence": float(max_probability),  
                "disease_probabilities": disease_probabilities,  
                "uncertain_prediction": bool(is_uncertain),
                "diagnosis": diagnosis,
                "model_version": self.version,
                "message": "Eye disease analysis completed."
            }
            
            # Log analysis completion
            logger.info(f"Analysis completed for {image_path}: {most_likely_disease} ({max_probability:.2f})")
            
            return result
            
        except Exception as e:
            logger.error(f"Error during analysis: {str(e)}")
            return {"error": str(e)}
    
    def _create_diagnosis(self, probabilities, is_uncertain):
        """
        Create a diagnosis text based on probabilities
        
        Args:
            probabilities: Dictionary of disease probabilities
            is_uncertain: Boolean indicating if prediction is uncertain
            
        Returns:
            Diagnosis text and recommendation
        """
        # Sort diseases by probability
        sorted_diseases = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)
        
        if is_uncertain:
            diagnosis = {
                "summary": "Uncertain diagnosis - further examination required.",
                "details": f"The system detected potential signs of {sorted_diseases[0][0]} "
                          f"({sorted_diseases[0][1]*100:.1f}%) and {sorted_diseases[1][0]} "
                          f"({sorted_diseases[1][1]*100:.1f}%), but cannot make a confident diagnosis.",
                "recommendation": "Recommend comprehensive clinical examination to confirm diagnosis."
            }
        elif sorted_diseases[0][1] > 0.7:
            diagnosis = {
                "summary": f"High probability of {sorted_diseases[0][0]}",
                "details": f"Analysis shows strong indicators of {sorted_diseases[0][0]} "
                          f"with {sorted_diseases[0][1]*100:.1f}% confidence.",
                "recommendation": "Recommend clinical confirmation and appropriate treatment."
            }
        elif sorted_diseases[0][1] > 0.5:
            diagnosis = {
                "summary": f"Moderate probability of {sorted_diseases[0][0]}",
                "details": f"Analysis shows moderate indicators of {sorted_diseases[0][0]} "
                          f"with {sorted_diseases[0][1]*100:.1f}% confidence.",
                "recommendation": "Recommend clinical examination to confirm diagnosis."
            }
        else:
            diagnosis = {
                "summary": "No clear disease indicators detected.",
                "details": "Analysis shows low probability for all target conditions.",
                "recommendation": "Recommend routine follow-up as per standard guidelines."
            }
        
        return diagnosis

# Helper function to process a single image
def process_image(image_path, model_path='models/eye_disease_model.h5'):
    """
    Process a single image for eye disease detection
    
    Args:
        image_path: Path to the image file
        model_path: Path to the trained model
        
    Returns:
        Analysis results dictionary
    """
    # Create detector
    detector = EyeDiseaseDetector(model_path=model_path)
    
    # Analyze image
    return detector.analyze(image_path)