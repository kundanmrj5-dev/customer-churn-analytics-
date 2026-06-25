"""
Customer Churn Prediction - Machine Learning Pipeline

Dataset:
    data/WA_Fn-UseC_-Telco-Customer-Churn.csv

Models:
    Logistic Regression
    Random Forest
    XGBoost, if installed

Evaluation:
    Accuracy, Precision, Recall, F1 Score, ROC-AUC
"""

from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


DATA_PATH = Path("data") / "WA_Fn-UseC_-Telco-Customer-Churn.csv"
OUTPUT_DIR = Path("outputs")
RANDOM_STATE = 42


def load_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}\n"
            "Download it from Kaggle and place the CSV inside the data folder."
        )

    df = pd.read_csv(DATA_PATH)
    df.columns = df.columns.str.strip()

    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df["ChurnFlag"] = df["Churn"].map({"No": 0, "Yes": 1})

    return df


def build_preprocessor(df: pd.DataFrame) -> ColumnTransformer:
    feature_df = df.drop(columns=["customerID", "Churn", "ChurnFlag"])
    numeric_features = feature_df.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categorical_features = feature_df.select_dtypes(include=["object"]).columns.tolist()

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, numeric_features),
            ("categorical", categorical_pipeline, categorical_features),
        ]
    )


def get_models() -> dict:
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "Random Forest": RandomForestClassifier(
            n_estimators=300,
            max_depth=None,
            min_samples_split=10,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
    }

    try:
        from xgboost import XGBClassifier

        models["XGBoost"] = XGBClassifier(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=4,
            subsample=0.9,
            colsample_bytree=0.9,
            eval_metric="logloss",
            random_state=RANDOM_STATE,
        )
    except ImportError:
        print("XGBoost is not installed. Skipping optional XGBoost model.")

    return models


def evaluate_model(name: str, pipeline: Pipeline, x_test: pd.DataFrame, y_test: pd.Series) -> dict:
    predictions = pipeline.predict(x_test)
    probabilities = pipeline.predict_proba(x_test)[:, 1]

    return {
        "Model": name,
        "Accuracy": round(accuracy_score(y_test, predictions), 4),
        "Precision": round(precision_score(y_test, predictions), 4),
        "Recall": round(recall_score(y_test, predictions), 4),
        "F1 Score": round(f1_score(y_test, predictions), 4),
        "ROC-AUC": round(roc_auc_score(y_test, probabilities), 4),
    }


def create_high_risk_customer_file(best_model: Pipeline, df: pd.DataFrame) -> None:
    features = df.drop(columns=["customerID", "Churn", "ChurnFlag"])
    retained_customers = df[df["Churn"] == "No"].copy()
    retained_features = retained_customers.drop(columns=["customerID", "Churn", "ChurnFlag"])

    retained_customers["ChurnProbability"] = best_model.predict_proba(retained_features)[:, 1]
    retained_customers["RiskLevel"] = pd.cut(
        retained_customers["ChurnProbability"],
        bins=[0, 0.35, 0.65, 1.0],
        labels=["Low Risk", "Medium Risk", "High Risk"],
        include_lowest=True,
    )

    high_risk = retained_customers.sort_values("ChurnProbability", ascending=False)
    high_risk[
        [
            "customerID",
            "tenure",
            "Contract",
            "PaymentMethod",
            "InternetService",
            "TechSupport",
            "MonthlyCharges",
            "ChurnProbability",
            "RiskLevel",
        ]
    ].to_csv(OUTPUT_DIR / "high_risk_customers.csv", index=False)


def print_business_recommendations(df: pd.DataFrame) -> None:
    churned = df[df["Churn"] == "Yes"]

    churn_rate = df["ChurnFlag"].mean() * 100
    monthly_loss = churned["MonthlyCharges"].sum()
    short_tenure_churn = churned[churned["tenure"] < 6].shape[0]
    no_support_churn_rate = df[df["TechSupport"] == "No"]["ChurnFlag"].mean() * 100

    print("\nFinal Business Recommendations")
    print("-" * 32)
    print(f"Overall churn rate: {churn_rate:.2f}%")
    print(f"Estimated monthly revenue loss from churned customers: ${monthly_loss:,.2f}")
    print(f"Churned customers with tenure under 6 months: {short_tenure_churn}")
    print(f"Churn rate among customers without tech support: {no_support_churn_rate:.2f}%")
    print("Recommendations:")
    print("1. Offer onboarding discounts and proactive calls for customers with tenure under 6 months.")
    print("2. Encourage month-to-month customers to move to one-year or two-year contracts.")
    print("3. Improve technical support availability for customers without tech support.")
    print("4. Target high-risk retained customers with retention campaigns before they churn.")


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    df = load_data()
    x = df.drop(columns=["customerID", "Churn", "ChurnFlag"])
    y = df["ChurnFlag"]

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    preprocessor = build_preprocessor(df)
    results = []
    trained_models = {}

    for name, model in get_models().items():
        pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("model", model),
            ]
        )
        pipeline.fit(x_train, y_train)
        results.append(evaluate_model(name, pipeline, x_test, y_test))
        trained_models[name] = pipeline

    metrics = pd.DataFrame(results).sort_values("ROC-AUC", ascending=False)
    metrics.to_csv(OUTPUT_DIR / "model_metrics.csv", index=False)

    print("\nModel Evaluation Results")
    print("-" * 24)
    print(metrics.to_string(index=False))

    best_model_name = metrics.iloc[0]["Model"]
    best_model = trained_models[best_model_name]
    create_high_risk_customer_file(best_model, df)

    print(f"\nBest model by ROC-AUC: {best_model_name}")
    print(f"Saved model metrics to: {OUTPUT_DIR / 'model_metrics.csv'}")
    print(f"Saved high-risk customers to: {OUTPUT_DIR / 'high_risk_customers.csv'}")

    print_business_recommendations(df)


if __name__ == "__main__":
    main()
