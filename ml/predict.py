from collections import Counter
from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

SAMPLE_USER = {
    "age": 15,
    "gender": "male",
    "height_cm": 155,
    "weight_kg": 60,
    "goal": "muscle_gain",
    "activity_level": "moderate",
    "diet_preference": "balanced",
    "health_flag": "none",
    "workout_minutes": 40,
}


def load_models():
    return {
        "calorie_regressor": joblib.load(MODEL_DIR / "calorie_burn_regressor.joblib"),
        "bmi_classifier": joblib.load(MODEL_DIR / "bmi_classifier.joblib"),
        "recommendation_engine": joblib.load(MODEL_DIR / "recommendation_engine.joblib"),
    }


def recommend_from_neighbors(model_bundle, user_frame):
    preprocessor = model_bundle["preprocessor"]
    recommender = model_bundle["recommender"]
    records = model_bundle["records"]

    user_vector = preprocessor.transform(user_frame)
    distances, indices = recommender.kneighbors(user_vector)
    nearest_records = [records[index] for index in indices[0]]

    exercise = Counter(record["exercise_category"] for record in nearest_records).most_common(1)[0][0]
    diet = Counter(record["diet_plan"] for record in nearest_records).most_common(1)[0][0]

    return {
        "exercise_category": exercise,
        "diet_plan": diet,
        "neighbor_distance": round(float(distances[0][0]), 3),
    }


def main():
    models = load_models()
    user_frame = pd.DataFrame([SAMPLE_USER])

    calories = int(round(models["calorie_regressor"].predict(user_frame)[0]))
    bmi_category = models["bmi_classifier"].predict(user_frame)[0]
    recommendation = recommend_from_neighbors(models["recommendation_engine"], user_frame)

    print("FitAI prediction result")
    print(f"Predicted calorie burn: {calories} kcal")
    print(f"BMI category: {bmi_category}")
    print(f"Exercise recommendation: {recommendation['exercise_category']}")
    print(f"Diet recommendation: {recommendation['diet_plan']}")


if __name__ == "__main__":
    main()
