import streamlit as st
import numpy as np
from PIL import Image
import tensorflow as tf
from io import BytesIO


st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
    </style>
""", unsafe_allow_html=True)


# # Custom CSS for styling
# with open('style.css') as f:
#     st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)


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





# import streamlit as st
# import numpy as np
# from PIL import Image
# import tensorflow as tf
# from streamlit_drag_and_drop_uploader import st_drag_and_drop_files

# # Hide Streamlit branding
# st.markdown("""
#     <style>
#         #MainMenu {visibility: hidden;}
#         footer {visibility: hidden;}
#         header {visibility: hidden;}
#     </style>
# """, unsafe_allow_html=True)

# # Load Model
# MODEL_PATH = "models/1.keras"
# CLASS_NAMES = ['Alternaria leaf spot', 'Brown spot', 'Gray spot', 'Healthy leaf', 'Rust']

# @st.cache_resource
# def load_model():
#     return tf.keras.models.load_model(MODEL_PATH, compile=False)

# model = load_model()

# st.title("🍏 Apple Leaf Disease Detection")
# st.write("Drag & drop an apple leaf image to analyze its health.")

# # **Dropzone for image upload**
# uploaded_files = st_drag_and_drop_files(label="Drag & drop your image here", file_types=[".jpg", ".jpeg", ".png"])

# if uploaded_files:
#     # Read the uploaded image
#     uploaded_file = uploaded_files[0]  # Only process the first file
#     image = Image.open(uploaded_file)
#     st.image(image, caption="Uploaded Image", use_container_width=True)

#     def preprocess_image(image):
#         image = image.convert("RGB").resize((256, 256))  
#         img_array = np.array(image) / 255.0  # Normalize
#         img_batch = np.expand_dims(img_array, axis=0).astype(np.float32)
#         return img_batch

#     def predict(image):
#         img_batch = preprocess_image(image)
#         predictions = model.predict(img_batch)
#         predicted_class = CLASS_NAMES[np.argmax(predictions[0])]
#         confidence = np.max(predictions[0])
#         return predicted_class, confidence

#     if st.button("Analyze Image"):
#         with st.spinner("🔍 Analyzing..."):
#             try:
#                 predicted_class, confidence = predict(image)
#                 st.success(f"**Diagnosis:** {predicted_class}")
#                 st.metric("Confidence", f"{confidence * 100:.2f}%")
                
#                 if predicted_class == "Healthy leaf":
#                     st.balloons()
#                     st.info("✅ This leaf appears healthy! No treatment needed.")
#                 else:
#                     st.warning(f"⚠️ **Treatment Suggested:** Consider fungicides for {predicted_class}")
                
#             except Exception as e:
#                 st.error(f"❌ Error: {e}")
