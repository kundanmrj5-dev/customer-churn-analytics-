import numpy as np
import tensorflow as tf


def build_model():
    return tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(5,)),
            tf.keras.layers.Dense(16, activation="relu"),
            tf.keras.layers.Dense(8, activation="relu"),
            tf.keras.layers.Dense(1, activation="sigmoid"),
        ]
    )


def main():
    model = build_model()
    sample = np.array([[15.0, 155.0, 60.0, 40.0, 0.65]], dtype=np.float32)
    normalized = sample / np.array([[100.0, 220.0, 180.0, 90.0, 1.0]], dtype=np.float32)
    score = float(model(normalized, training=False).numpy()[0][0])
    print(f"TensorFlow readiness demo score: {round(score * 100)}")


if __name__ == "__main__":
    main()
