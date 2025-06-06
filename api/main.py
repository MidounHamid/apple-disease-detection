from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf

app = FastAPI()
print("FastAPI server is starting...")

origins = [
    "http://localhost",
    "http://localhost:3000",
    # "http://localhost:5173",  #this is line for Vite

]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all domains temporarily
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Load your trained model


# Load your trained model
MODEL_PATH = "../models/1.keras"  # Update with the correct absolute path
# MODEL_PATH = "../models/2.keras"
try:
    MODEL = tf.keras.models.load_model(MODEL_PATH, compile=False)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    raise

CLASS_NAMES = ['Alternaria leaf spot', 'Brown spot', 'Gray spot', 'Healthy leaf', 'Rust']# Update with your actual classes
# CLASS_NAMES=['Apple___Apple_scab',
#     'Apple___Black_rot',
#     'Apple___Cedar_apple_rust',
#     'Apple___healthy',
#     'Blueberry___healthy',
#     'Cherry_(including_sour)___Powdery_mildew',
#     'Cherry_(including_sour)___healthy',
#     'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
#     'Corn_(maize)___Common_rust_',
#     'Corn_(maize)___Northern_Leaf_Blight',
#     'Corn_(maize)___healthy',
#     'Grape___Black_rot',
#     'Grape___Esca_(Black_Measles)',
#     'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
#     'Grape___healthy',
#     'Orange___Haunglongbing_(Citrus_greening)',
#     'Peach___Bacterial_spot',
#     'Peach___healthy',
#     'Pepper,_bell___Bacterial_spot',
#     'Pepper,_bell___healthy',
#     'Potato___Early_blight',
#     'Potato___Late_blight',
#     'Potato___healthy',
#     'Raspberry___healthy',
#     'Soybean___healthy',
#     'Squash___Powdery_mildew',
#     'Strawberry___Leaf_scorch',
#     'Strawberry___healthy',
#     'Tomato___Bacterial_spot',
#     'Tomato___Early_blight',
#     'Tomato___Late_blight',
#     'Tomato___Leaf_Mold',
#     'Tomato___Septoria_leaf_spot',
#     'Tomato___Spider_mites Two-spotted_spider_mite',
#     'Tomato___Target_Spot',
#     'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
#     'Tomato___Tomato_mosaic_virus',
#     'Tomato___healthy']

# CLASS_NAMES = ['Rust','Brown spot','Healt','Gray spot']

@app.get("/")
async def home():
    return {"message": "Welcome to Apple Disease Detection API"}



@app.get("/ping")
async def ping():
    return "Hello, I am alive"

def read_file_as_image(data) -> np.ndarray:
    image = np.array(Image.open(BytesIO(data)))
    return image

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):
    image = read_file_as_image(await file.read())
    img_batch = np.expand_dims(image, 0)
    
    predictions = MODEL.predict(img_batch)

    predicted_class = CLASS_NAMES[np.argmax(predictions[0])]
    confidence = np.max(predictions[0])
    return {
        'class': predicted_class,
        'confidence': float(confidence)
    }

if __name__ == "__main__":
    uvicorn.run(app, host='localhost', port=8000)