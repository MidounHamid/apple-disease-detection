import streamlit as st
import numpy as np
from PIL import Image
import tensorflow as tf
from io import BytesIO

# Load model (update path if needed)
MODEL_PATH = "models/1.keras"  # Replace with your model path
CLASS_NAMES = ['Alternaria leaf spot', 'Brown spot', 'Gray spot', 'Healthy leaf', 'Rust']

@st.cache_resource  # Cache the model for performance
def load_model():
    return tf.keras.models.load_model(MODEL_PATH, compile=False)

model = load_model()

# Streamlit UI
st.title("🍏 Apple Leaf Disease Detection")
st.write("Upload an image of an apple leaf to check for diseases.")

# Image upload
uploaded_file = st.file_uploader(
    "Choose an image...",
    type=["jpg", "jpeg", "png"],
    help="Upload a clear image of an apple leaf."
)

if uploaded_file is not None:
    # Display image
    image = Image.open(uploaded_file)
    st.image(image, caption="Uploaded Image", use_container_width=True)  # Updated parameter

    # Preprocess and predict
    def predict(image):
        img_array = np.array(image.resize((256, 256)))  # Resize to match model input
        img_batch = np.expand_dims(img_array, 0)
        predictions = model.predict(img_batch)
        predicted_class = CLASS_NAMES[np.argmax(predictions[0])]
        confidence = np.max(predictions[0])
        return predicted_class, confidence

    # Predict on button click
    if st.button("Analyze Image"):
        with st.spinner("🔍 Analyzing..."):
            try:
                predicted_class, confidence = predict(image)
                st.success(f"**Diagnosis:** {predicted_class}")
                st.metric("Confidence", f"{confidence * 100:.2f}%")
                
                # Show advice based on prediction
                if predicted_class == "Healthy leaf":
                    st.balloons()
                    st.info("✅ This leaf appears healthy! No treatment needed.")
                else:
                    st.warning(f"⚠️ **Treatment Suggested:** Consider fungicides for {predicted_class}")
                
            except Exception as e:
                st.error(f"❌ Error: {e}")

# # Add a footer
# st.markdown("---")
# st.caption("Built with 🍏 + TensorFlow + Streamlit")