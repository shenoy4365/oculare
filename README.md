# Oculare AI: Machine Learning for Eye Disease Detection

Oculare is an advanced AI-powered application designed to detect eye diseases by analyzing retinal images using state-of-the-art convolutional neural network (CNN) architectures. The platform also integrates a healthcare chatbot capable of generating AI-driven insights from past scan reports and addressing general medical inquiries.

The application provides an interactive vision test, personalized eye health recommendations, comprehensive scan history tracking, and secure authentication via Supabase — all within a modern, responsive interface optimized for iOS devices.

---

## 📸 Screenshots & Demo

| App Screen      | Preview |
|-----------------|---------|
| Home Screen     | ![Home Screen](wireframe%20imgs/home.png) |
| Scan Upload     | ![Scan Upload](wireframe%20imgs/upload.png) |
| AI Results      | ![AI Results](wireframe%20imgs/results.png) |
| Chatbot         | ![Chatbot](wireframe%20imgs/chatbot.png) |

**📄 Presentation:** [Google Slides](https://docs.google.com/presentation/d/1apQXFQC1iqTHku9HJvzu5db5Kw4137jawZ9bPMif8uk/edit?slide=id.p1#slide=id.p1)  
**🎥 Video Demo:** [Watch on Google Drive](https://drive.google.com/file/d/1W6F79Vc4QsYAoKDrFLudB-CkWcgjs3w3/view?usp=drive_link)

---

## 🚀 Features

- **AI-powered retinal disease detection** using advanced CNN computer vision architectures
- **Healthcare chatbot** delivering AI-driven insights from prior scan reports and answering general eye health questions
- **Interactive vision test** with the option to upload or capture retinal images
- **Personalized recommendations** based on AI scan analysis
- **Scan history tracking** to monitor long-term changes
- **Secure authentication & account management** with Supabase
- **Modern, responsive UI** optimized for iOS devices
- **Efficient data storage & retrieval** for both images and text using Supabase Storage

---

## 🛠 Tech Stack

- [React Native (Expo)](https://expo.dev/) — Cross-platform mobile app development framework
- [Supabase](https://supabase.com/) — Open-source backend with PostgreSQL and authentication
- [Python](https://www.python.org/) — Backend, AI model integration, and scripting
- [Flask](https://flask.palletsprojects.com/) — Lightweight Python API framework
- [OpenCV](https://opencv.org/) — Image processing and computer vision
- [Google Gemini Flash AI API](https://ai.google.dev/) — Multimodal generative AI for text, image, and video analysis

---

## 📦 Getting Started

### 1. Clone the repository

   ```bash
   git clone https://github.com/shenoy4365/oculare.git
   cd oculare
   ```

### 2. Install dependencies:

   ```bash
   npm install
   ```

### 3. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory.

### 4. Set up environment and IP address variables:


   ```
   supabaseUrl=your_supabase_url_key
   supabaseAnonKey=your_supabase_anon_key
   ```

Note that the Google Gemini API Key is synced and saved in the user’s authentication and database table (and can be updated accordingly when the user is signed into the application). Therefore, the user must provide their Google Gemini API Key in order to use Visionary AI’s functionalities and capabilites. To learn more about getting your Google Gemini API Key to use Oculare, please visit [Google AI Studio](https://aistudio.google.com/app/apikey) for instructions and API usages.

###  5. Run the development server:

   ```bash
   npm start
   ```

### 6. Scan the Expo React Native QR Code with your iPhone or open on the web with Expo React Native shortcuts (found in the active terminal) to see the result.

## Deployment

Oculare has not been officially deployed to any mobile or online platforms as of the current date. Any updates to deployment will be reflected in this README file.

## Contributing and Contact

Contributions are welcome! Please feel free to submit a Pull Request if you have any suggestions or improvements that you feel Oculare could use.

## License
All source code, AI models, and implementation logic in this repository were developed exclusively by the repository owner. Unauthorized reproduction, distribution, or modification of this code is prohibited without prior written permission.
