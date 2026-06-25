from pathlib import Path

import pandas as pd
import streamlit as st


SAMPLE_DATA_PATH = Path("data") / "WA_Fn-UseC_-Telco-Customer-Churn.csv"


st.set_page_config(page_title="Customer Churn Analytics", page_icon="CH", layout="wide")


def first_value(row: pd.Series, names: list[str], default=""):
    for name in names:
        if name in row and pd.notna(row[name]) and str(row[name]).strip() != "":
            return row[name]
    return default


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = df.columns.str.strip().str.replace("\ufeff", "", regex=False)

    normalized = pd.DataFrame(index=df.index)
    normalized["customerID"] = df.apply(
        lambda row: first_value(row, ["customerID", "CustomerID", "Customer ID", "customer_id"], f"ROW-{row.name + 1}"),
        axis=1,
    )
    normalized["Gender"] = df.apply(lambda row: first_value(row, ["gender", "Gender"]), axis=1)
    normalized["Age"] = pd.to_numeric(df.apply(lambda row: first_value(row, ["Age", "age"]), axis=1), errors="coerce")
    normalized["SeniorCitizen"] = df.apply(
        lambda row: first_value(row, ["SeniorCitizen", "Senior Citizen", "senior_citizen"]),
        axis=1,
    )
    normalized["Dependents"] = df.apply(lambda row: first_value(row, ["Dependents", "dependents"]), axis=1)
    normalized["tenure"] = pd.to_numeric(
        df.apply(lambda row: first_value(row, ["tenure", "Tenure"]), axis=1),
        errors="coerce",
    )
    normalized["Contract"] = df.apply(lambda row: first_value(row, ["Contract", "ContractType", "contract_type"]), axis=1)
    normalized["PaymentMethod"] = df.apply(
        lambda row: first_value(row, ["PaymentMethod", "Payment Method", "payment_method"]),
        axis=1,
    )
    normalized["TechSupport"] = df.apply(lambda row: first_value(row, ["TechSupport", "tech_support"]), axis=1)
    normalized["InternetService"] = df.apply(
        lambda row: first_value(row, ["InternetService", "Internet Service", "internet_service"]),
        axis=1,
    )
    normalized["MonthlyCharges"] = pd.to_numeric(
        df.apply(lambda row: first_value(row, ["MonthlyCharges", "Monthly Charges", "monthly_charges"]), axis=1),
        errors="coerce",
    )
    normalized["TotalCharges"] = pd.to_numeric(
        df.apply(lambda row: first_value(row, ["TotalCharges", "Total Charges", "total_charges"]), axis=1),
        errors="coerce",
    )
    normalized["Churn"] = df.apply(lambda row: first_value(row, ["Churn", "churn"]), axis=1)
    return normalized


def read_uploaded_file(uploaded_file) -> pd.DataFrame:
    name = uploaded_file.name.lower()
    if name.endswith((".xlsx", ".xls")):
        return pd.read_excel(uploaded_file)
    return pd.read_csv(uploaded_file)


def has_column_data(df: pd.DataFrame, column: str) -> bool:
    return column in df and df[column].notna().any() and df[column].astype(str).str.strip().ne("").any()


def tenure_band(value) -> str:
    if pd.isna(value):
        return "Unknown"
    if value < 6:
        return "0-5 months"
    if value <= 12:
        return "6-12 months"
    if value <= 36:
        return "1-3 years"
    return "3+ years"


def charge_band(value) -> str:
    if pd.isna(value):
        return "Unknown"
    if value < 35:
        return "Low: < 35"
    if value <= 70:
        return "Medium: 35-70"
    return "High: > 70"


def age_band(value) -> str:
    if pd.isna(value):
        return "Unknown"
    if value < 30:
        return "Under 30"
    if value <= 45:
        return "30-45"
    if value <= 60:
        return "46-60"
    return "60+"


def churn_rate_table(df: pd.DataFrame, column: str) -> pd.DataFrame:
    summary = (
        df.groupby(column, dropna=False)
        .agg(
            TotalCustomers=("customerID", "count"),
            ChurnedCustomers=("ChurnFlag", "sum"),
            ChurnRate=("ChurnFlag", "mean"),
        )
        .reset_index()
        .rename(columns={column: "Segment"})
        .sort_values("ChurnRate", ascending=False)
    )
    summary["ChurnRatePercent"] = (summary["ChurnRate"] * 100).round(2)
    return summary


def risk_score(row: pd.Series) -> int:
    score = 0
    tenure = row.get("tenure", 0) if pd.notna(row.get("tenure", 0)) else 0
    charge = row.get("MonthlyCharges", 0) if pd.notna(row.get("MonthlyCharges", 0)) else 0

    if tenure < 6:
        score += 30
    elif tenure < 12:
        score += 22
    elif tenure < 24:
        score += 12

    if row.get("Contract") == "Month-to-month":
        score += 24
    if charge > 80:
        score += 18
    elif charge > 65:
        score += 12
    if row.get("TechSupport") == "No":
        score += 12
    if row.get("PaymentMethod") == "Electronic check":
        score += 10

    return min(score, 100)


def show_churn_dashboard(df: pd.DataFrame):
    df = df.copy()
    df["ChurnFlag"] = df["Churn"].astype(str).str.strip().str.lower().eq("yes").astype(int)
    df["TenureBand"] = df["tenure"].apply(tenure_band)
    df["ChargeBand"] = df["MonthlyCharges"].apply(charge_band)

    churned = df[df["ChurnFlag"] == 1]
    retained = df[df["ChurnFlag"] == 0]
    revenue_lost = churned["MonthlyCharges"].sum()

    st.subheader("Executive Summary")
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Customers", f"{len(df):,}")
    col2.metric("Churn Rate", f"{df['ChurnFlag'].mean() * 100:.2f}%")
    col3.metric("Retained Customers", f"{len(retained):,}")
    col4.metric("Monthly Revenue Lost", f"${revenue_lost:,.0f}")

    st.subheader("Churn Analysis")
    c1, c2 = st.columns(2)
    with c1:
        contract = churn_rate_table(df, "Contract")
        st.write("Churn by Contract")
        st.bar_chart(contract.set_index("Segment")["ChurnRatePercent"])
    with c2:
        tenure = churn_rate_table(df, "TenureBand")
        st.write("Churn by Tenure")
        st.bar_chart(tenure.set_index("Segment")["ChurnRatePercent"])

    c3, c4 = st.columns(2)
    with c3:
        payment = churn_rate_table(df, "PaymentMethod")
        st.write("Churn by Payment Method")
        st.bar_chart(payment.set_index("Segment")["ChurnRatePercent"])
    with c4:
        charges = churn_rate_table(df, "ChargeBand")
        st.write("Churn by Monthly Charges")
        st.bar_chart(charges.set_index("Segment")["ChurnRatePercent"])

    st.subheader("High-Risk Retained Customers")
    retained = retained.copy()
    retained["RiskScore"] = retained.apply(risk_score, axis=1)
    high_risk = retained.sort_values("RiskScore", ascending=False)[
        ["customerID", "tenure", "Contract", "PaymentMethod", "InternetService", "MonthlyCharges", "RiskScore"]
    ].head(15)
    st.dataframe(high_risk, use_container_width=True)

    top_contract = contract.iloc[0]
    top_payment = payment.iloc[0]
    top_tenure = tenure.iloc[0]

    st.subheader("Business Recommendations")
    st.markdown(
        f"""
        - Prioritize retention campaigns for **{top_contract['Segment']}** customers because this group has the highest churn rate at **{top_contract['ChurnRatePercent']}%**.
        - Create payment-specific save offers for **{top_payment['Segment']}** customers.
        - Add onboarding check-ins for the **{top_tenure['Segment']}** tenure group.
        - Contact high-risk retained customers before they churn.
        - Track monthly revenue lost, currently estimated at **${revenue_lost:,.0f}** for this uploaded dataset.
        """
    )


def show_demographics_dashboard(df: pd.DataFrame):
    df = df.copy()
    df["AgeBand"] = df["Age"].apply(age_band)

    st.warning("This file has demographics data only. Upload a file with Churn and MonthlyCharges for full churn analytics.")
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Customers", f"{len(df):,}")
    col2.metric("Average Age", f"{df['Age'].mean():.1f}" if df["Age"].notna().any() else "N/A")
    col3.metric("Mode", "Demographics Only")

    c1, c2 = st.columns(2)
    with c1:
        st.write("Gender Distribution")
        st.bar_chart(df["Gender"].fillna("Unknown").value_counts())
    with c2:
        st.write("Age Segments")
        st.bar_chart(df["AgeBand"].value_counts())

    st.subheader("Sample Customers")
    st.dataframe(df[["customerID", "Gender", "Age", "SeniorCitizen", "Dependents"]].head(20), use_container_width=True)


st.title("Customer Churn Prediction & Analytics")
st.caption("SQL analytics project with a Streamlit dashboard and optional machine learning extension.")

uploaded_file = st.file_uploader("Upload Telco churn CSV or Excel file", type=["csv", "xlsx", "xls"])

if uploaded_file:
    raw_df = read_uploaded_file(uploaded_file)
    df = normalize_dataframe(raw_df)
    st.success(f"Loaded {uploaded_file.name} with {len(df):,} rows and {len(raw_df.columns):,} original columns.")

    if has_column_data(df, "Churn") and has_column_data(df, "MonthlyCharges"):
        show_churn_dashboard(df)
    elif has_column_data(df, "Age") or has_column_data(df, "Gender"):
        show_demographics_dashboard(df)
    else:
        st.error("Unsupported file. Please upload the Telco churn CSV or demographics workbook.")
else:
    st.info("Upload a dataset to start analysis.")
    if SAMPLE_DATA_PATH.exists():
        st.caption(f"Sample dataset available locally: {SAMPLE_DATA_PATH}")
