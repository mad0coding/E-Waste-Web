import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.efficientnet_v2 import preprocess_input

def decode_predictions_custom(preds, class_names, top=5):
    """
    Implements the same functionality as tensorflow.keras.applications.efficientnet_v2.decode_predictions, but for a custom (non-ImageNet) model.
    """
    decoded = []
    for sample in preds:
        top_idx = sample.argsort()[-top:][::-1]
        sample_decoded = []
        for i in top_idx:
            id_str = f"<unknown>" # dummy ID for features (not used anywhere - just put it there so that output has the required shape)
            label = class_names[i]
            score = sample[i]
            sample_decoded.append((id_str, label, score))
        decoded.append(sample_decoded)
    return decoded

class ImageClassifier:
    def __init__(self, model_path, class_names):
        self.model = tf.keras.models.load_model(model_path)
        self.class_names = class_names

    def predict_class(self, img_path):
        # Load and preprocess image
        x = image.load_img(img_path, target_size=(384, 384))
        x = image.img_to_array(x)
        x = np.expand_dims(x, axis=0)  # batch dimension
        x = preprocess_input(x)

        # Prediction step
        preds = self.model.predict(x, verbose=0)

        # Find top-1 class and the associated confidence
        decoded_preds = decode_predictions_custom(preds, self.class_names, top=1)
        predicted_class = decoded_preds[0][0][1]
        conf = decoded_preds[0][0][2]

        return predicted_class, conf