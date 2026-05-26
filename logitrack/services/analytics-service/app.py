import os

import pandas as pd
import psycopg
import streamlit as st


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://logitrack:logitrack@localhost:55432/logitrack")


@st.cache_data(ttl=30)
def query_dataframe(sql: str) -> pd.DataFrame:
    with psycopg.connect(DATABASE_URL) as conn:
      return pd.read_sql(sql, conn)


def load_data():
    deliveries = query_dataframe(
        """
        SELECT
          d.id,
          d.tracking_number,
          d.region,
          d.status,
          d.priority,
          d.delay_minutes,
          d.estimated_delivery_time,
          d.actual_delivery_time,
          drv.name AS driver_name,
          v.plate AS vehicle_plate,
          v.status AS vehicle_status
        FROM deliveries d
        JOIN drivers drv ON drv.id = d.driver_id
        JOIN vehicles v ON v.id = d.vehicle_id
        ORDER BY d.estimated_delivery_time DESC
        """
    )
    vehicles = query_dataframe(
        """
        SELECT id, plate, type, status, last_latitude, last_longitude, last_seen_at
        FROM vehicles
        ORDER BY plate
        """
    )
    return deliveries, vehicles


def metric_row(deliveries: pd.DataFrame):
    total = len(deliveries)
    delayed = int((deliveries["delay_minutes"] > 0).sum()) if total else 0
    avg_delay = float(deliveries["delay_minutes"].mean()) if total else 0.0
    on_time_rate = ((total - delayed) / total * 100) if total else 0.0

    columns = st.columns(4)
    columns[0].metric("Deliveries", f"{total:,}")
    columns[1].metric("Delayed", f"{delayed:,}")
    columns[2].metric("Avg delay", f"{avg_delay:.1f} min")
    columns[3].metric("On-time rate", f"{on_time_rate:.1f}%")


def data_quality_overview(deliveries: pd.DataFrame, vehicles: pd.DataFrame):
    st.subheader("Data quality overview")
    duplicate_tracking = int(deliveries["tracking_number"].duplicated().sum()) if not deliveries.empty else 0
    missing_region = int(deliveries["region"].isna().sum()) if not deliveries.empty else 0
    missing_vehicle_location = int(vehicles[["last_latitude", "last_longitude"]].isna().any(axis=1).sum()) if not vehicles.empty else 0

    quality = pd.DataFrame(
        [
            {"check": "Duplicate tracking numbers", "count": duplicate_tracking, "severity": "critical"},
            {"check": "Missing delivery region", "count": missing_region, "severity": "critical"},
            {"check": "Vehicles missing coordinates", "count": missing_vehicle_location, "severity": "warning"},
        ]
    )
    st.dataframe(quality, use_container_width=True, hide_index=True)


def delay_distribution(deliveries: pd.DataFrame):
    st.subheader("Delay distribution")
    if deliveries.empty:
        st.info("No delivery rows are available yet.")
        return
    st.bar_chart(deliveries["delay_minutes"].clip(lower=0).value_counts().sort_index())


def region_breakdown(deliveries: pd.DataFrame):
    st.subheader("Region breakdown")
    if deliveries.empty:
        st.info("No delivery rows are available yet.")
        return
    grouped = (
        deliveries.groupby("region", dropna=False)
        .agg(total=("id", "count"), delayed=("delay_minutes", lambda values: int((values > 0).sum())), avg_delay=("delay_minutes", "mean"))
        .reset_index()
        .sort_values("delayed", ascending=False)
    )
    st.dataframe(grouped, use_container_width=True, hide_index=True)


def rankings(deliveries: pd.DataFrame, group_field: str, title: str):
    st.subheader(title)
    if deliveries.empty:
        st.info("No delivery rows are available yet.")
        return
    grouped = (
        deliveries.groupby(group_field, dropna=False)
        .agg(total=("id", "count"), delayed=("delay_minutes", lambda values: int((values > 0).sum())), avg_delay=("delay_minutes", "mean"))
        .reset_index()
    )
    grouped["on_time_rate"] = ((grouped["total"] - grouped["delayed"]) / grouped["total"] * 100).round(1)
    st.dataframe(grouped.sort_values(["on_time_rate", "total"], ascending=[False, False]), use_container_width=True, hide_index=True)


def main():
    st.set_page_config(page_title="LogiTrack Internal Analytics", layout="wide")
    st.title("LogiTrack Internal Analytics")
    st.caption("Internal Streamlit service backed by the same PostgreSQL database as the control tower.")

    try:
        deliveries, vehicles = load_data()
    except Exception as exc:
        st.error(f"Could not connect to PostgreSQL: {exc}")
        st.stop()

    metric_row(deliveries)
    data_quality_overview(deliveries, vehicles)

    left, right = st.columns(2)
    with left:
        delay_distribution(deliveries)
        rankings(deliveries, "driver_name", "Driver rankings")
    with right:
        region_breakdown(deliveries)
        rankings(deliveries, "vehicle_plate", "Vehicle rankings")


if __name__ == "__main__":
    main()
