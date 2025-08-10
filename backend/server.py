from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json  # Import json module to load JSON lines
import analysis

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)
    
    # Send image to analysis.py
    result = analysis.process_image(file_path)

    return jsonify({
        "message": "File uploaded successfully",
        "analysis_result": result
    })

@app.route('/physicians', methods=['GET'])
def get_physicians():
    disease = request.args.get('disease', '').lower()
    state = request.args.get('state', '').lower()

    file_path = os.path.join(os.path.dirname(__file__), 'physicians.txt')

    if not os.path.exists(file_path):
        return jsonify({"error": "physicians.txt file not found"}), 404

    with open(file_path, 'r') as f:
        raw_data = f.readlines()

    physicians = []
    for line in raw_data:
        try:
            # Parse the line as a JSON object
            physician = json.loads(line.strip())
            # Check if the disease and state match
            if (disease in physician["disease"].lower()) and (state in physician["state"].lower()):
                physicians.append({
                    'name': physician['name'],
                    'disease': physician['disease'],
                    'location': physician['location'],
                    'experience': physician['experience'],
                    'biography': physician['biography']
                })
        except json.JSONDecodeError:
            continue

    return jsonify(physicians)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)