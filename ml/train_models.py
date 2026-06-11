from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.neighbors import NearestNeighbors
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "datasets" / "fitai_training_sample.csv"
MODEL_DIR = BASE_DIR / "models"

NUMERIC_FEATURES = ["age", "height_cm", "weight_kg", "workout_minutes"]
CATEGORICAL_FEATURES = ["gender", "goal", "activity_level", "diet_preference", "health_flag"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def build_preprocessor():
    return ColumnTransformer(
        transformers=[
            ("numeric", StandardScaler(), NUMERIC_FEATURES),
            ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )


def train_calorie_regressor(df):
    x_train, x_test, y_train, y_test = train_test_split(
        df[FEATURES], df["calories_burned"], test_size=0.25, random_state=42
    )

    model = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            ("regressor", RandomForestRegressor(n_estimators=160, random_state=42)),
        ]
    )
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    mae = mean_absolute_error(y_test, predictions)
    return model, {"mae": round(float(mae), 2)}


def train_bmi_classifier(df):
    x_train, x_test, y_train, y_test = train_test_split(
        df[FEATURES], df["bmi_category"], test_size=0.25, random_state=42, stratify=df["bmi_category"]
    )

    model = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            ("classifier", RandomForestClassifier(n_estimators=160, random_state=42)),
        ]
    )
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    accuracy = accuracy_score(y_test, predictions)
    return model, {"accuracy": round(float(accuracy), 2)}


def train_recommendation_engine(df):
    preprocessor = build_preprocessor()
    feature_matrix = preprocessor.fit_transform(df[FEATURES])
    recommender = NearestNeighbors(n_neighbors=5, metric="cosine")
    recommender.fit(feature_matrix)

    return {
        "preprocessor": preprocessor,
        "recommender": recommender,
        "records": df[FEATURES + ["exercise_category", "diet_plan"]].to_dict(orient="records"),
    }


def main():
    MODEL_DIR.mkdir(exist_ok=True)
    df = pd.read_csv(DATASET_PATH)

    calorie_model, calorie_metrics = train_calorie_regressor(df)
    bmi_model, bmi_metrics = train_bmi_classifier(df)
    recommendation_model = train_recommendation_engine(df)

    joblib.dump(calorie_model, MODEL_DIR / "calorie_burn_regressor.joblib")
    joblib.dump(bmi_model, MODEL_DIR / "bmi_classifier.joblib")
    joblib.dump(recommendation_model, MODEL_DIR / "recommendation_engine.joblib")

    print("FitAI ML models trained successfully.")
    print(f"Calorie burn regression MAE: {calorie_metrics['mae']} kcal")
    print(f"BMI classification accuracy: {bmi_metrics['accuracy']}")
    print(f"Saved models to: {MODEL_DIR}")


if __name__ == "__main__":
    main()
