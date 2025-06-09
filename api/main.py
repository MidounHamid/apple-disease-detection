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