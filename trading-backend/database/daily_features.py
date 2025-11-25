from pathlib import Path
from typing import List

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from database import schema, crud

WORKBOOK_PATH = Path("files/watchlist_tracking.xlsx")

EXPECTED_COLS = [
    "date", "open", "high", "low", "close", "adj close", "volume",
    "buy_sell_arrow", "sma5", "sma9", "mfi14", "rsi14", "macd_hist",
    "fast_vwap", "slow_vwap",
]


def norm_bsa(x):
    if pd.isna(x):
        return None
    s = str(x).strip().lower()
    if s in ("buy", "b"):
        return "Buy"
    if s in ("sell", "s"):
        return "Sell"
    if s in ("none", "", "0", "null", "na"):
        return "None"
    return str(x).strip().title()


def sma_cross_dir(s5, s9):
    if pd.isna(s5) or pd.isna(s9):
        return None
    if s5 > s9:
        return "up"
    if s5 < s9:
        return "down"
    return "none"


def sign_nonzero(x):
    if pd.isna(x):
        return None
    if x > 0:
        return 1
    if x < 0:
        return -1
    return None


def vwap_state_from(close, fast, slow):
    if any(pd.isna(v) for v in (close, fast, slow)):
        return None
    if close > fast and close > slow:
        return "above"
    if close < fast and close < slow:
        return "below"
    return "hold"


def derive_phase1_from_df(df_in: pd.DataFrame) -> pd.DataFrame:
    df = df_in.copy()
    df.columns = [str(c).strip().lower() for c in df.columns]

    missing = [c for c in EXPECTED_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in sheet: {missing}")

    df = df[EXPECTED_COLS].copy()

    df["date"] = pd.to_datetime(df["date"]).dt.date

    num_cols = [
        "open", "high", "low", "close", "adj close", "volume",
        "sma5", "sma9", "mfi14", "rsi14", "macd_hist",
        "fast_vwap", "slow_vwap",
    ]
    for c in num_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    df["buy_sell_arrow"] = df["buy_sell_arrow"].apply(norm_bsa)

    df = df.sort_values("date").reset_index(drop=True)
    df["row_index"] = np.arange(1, len(df) + 1)
    prev = df.shift(1)

    df["sma_delta"] = df["sma5"] - df["sma9"]

    # --- SMA cross direction: only label on actual cross days ---
    sma_sign = df["sma_delta"].apply(sign_nonzero)
    sma_cross_dir_list = []
    days_since_sma_list = []
    prev_sign = None
    last_cross_idx = None

    for i, s in enumerate(sma_sign):
        if s is None:
            sma_cross_dir_list.append(None)
            if last_cross_idx is None:
                days_since_sma_list.append(None)
            else:
                days_since_sma_list.append(i - last_cross_idx)
            continue

        if prev_sign is None:
            sma_cross_dir_list.append(None)
            if last_cross_idx is None:
                days_since_sma_list.append(None)
            else:
                days_since_sma_list.append(i - last_cross_idx)
            prev_sign = s
            continue

        if s != prev_sign:
            direction = "up" if s > prev_sign else "down"
            sma_cross_dir_list.append(direction)
            last_cross_idx = i
            days_since_sma_list.append(0)
            prev_sign = s
        else:
            sma_cross_dir_list.append(None)
            if last_cross_idx is None:
                days_since_sma_list.append(None)
            else:
                days_since_sma_list.append(i - last_cross_idx)

    df["sma_cross_dir_calc"] = sma_cross_dir_list
    df["days_since_sma_cross"] = days_since_sma_list

    df["slope5"] = df["sma5"] - prev["sma5"]
    df["slope9"] = df["sma9"] - prev["sma9"]

    # --- MACD days since sign flip (already similar to what you wanted) ---
    days_since_macd = []
    last_sign = None
    first_sign_idx = None
    last_flip_idx = None
    for i, v in enumerate(df["macd_hist"]):
        s = sign_nonzero(v)
        if s is None:
            days_since_macd.append(
                i - last_flip_idx if last_flip_idx is not None
                else (i - first_sign_idx if first_sign_idx is not None else None)
            )
            continue

        if last_sign is None:
            last_sign, first_sign_idx, last_flip_idx = s, i, i
            days_since_macd.append(0)
        else:
            if s != last_sign:
                last_sign, last_flip_idx = s, i
                days_since_macd.append(0)
            else:
                days_since_macd.append(
                    i - last_flip_idx if last_flip_idx is not None
                    else (i - first_sign_idx if first_sign_idx is not None else None)
                )
    df["days_since_macd_cross"] = days_since_macd

    df["daily_pct_change"] = (df["close"] - prev["close"]) / prev["close"]
    df["range_pct"] = (df["high"] - df["low"]) / df["close"]
    df["vol10_avg"] = df["volume"].rolling(window=10, min_periods=1).mean()

    # --- ATR(10) Wilder style ---
    prev_close = df["close"].shift(1)
    tr1 = df["high"] - df["low"]
    tr2 = (df["high"] - prev_close).abs()
    tr3 = (df["low"] - prev_close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

    n = 10
    atr = pd.Series(index=df.index, dtype="float64")
    atr.iloc[: n - 1] = np.nan
    if len(df) >= n:
        atr.iloc[n - 1] = tr.iloc[:n].mean()
        for i in range(n, len(df)):
            atr.iloc[i] = (atr.iloc[i - 1] * (n - 1) + tr.iloc[i]) / n
    df["atr10"] = atr

    df["vwap_state"] = [
        vwap_state_from(c, f, s)
        for c, f, s in zip(df["close"], df["fast_vwap"], df["slow_vwap"])
    ]
    df["vwap_delta_fast"] = df["close"] - df["fast_vwap"]
    df["vwap_delta_fast_pct"] = df["vwap_delta_fast"] / df["close"]

    # VWAP contact: treat 'hold' (at-band) as a contact day
    vwap_contact_flag = df["vwap_state"].apply(
        lambda s: 1 if (isinstance(s, str) and s == "hold") else 0
    )
    df["vwap_contacts_total"] = vwap_contact_flag.cumsum()

    df = df.rename(columns={"date": "session_date", "adj close": "adj_close"})

    return df


def preview_derived_for_ticker(
    ticker: str,
    workbook_path: Path = WORKBOOK_PATH,
    limit: int = 30,
) -> dict:
    if not workbook_path.exists():
        raise FileNotFoundError(f"Workbook not found at {workbook_path}")

    xls = pd.ExcelFile(workbook_path)
    if ticker not in xls.sheet_names:
        raise ValueError(f"Sheet '{ticker}' not found in {workbook_path.name}")

    raw_df = xls.parse(ticker)
    derived = derive_phase1_from_df(raw_df)

    cols = [
        "session_date", "row_index",
        "open", "high", "low", "close", "adj_close", "volume",
        "buy_sell_arrow",
        "sma5", "sma9", "sma_delta", "slope5", "slope9",
        "mfi14", "rsi14", "macd_hist",
        "days_since_sma_cross", "days_since_macd_cross",
        "fast_vwap", "slow_vwap", "vwap_state",
        "vwap_delta_fast", "vwap_delta_fast_pct",
        "daily_pct_change", "range_pct", "vol10_avg",
        "atr10", "vwap_contacts_total",
    ]
    derived = derived[cols].tail(limit)
    derived_for_json = derived.replace({np.nan: None})

    return {
        "ticker": ticker,
        "rows": derived_for_json.to_dict(orient="records"),
        "row_count": int(derived_for_json.shape[0]),
    }


def validate_row_math(
    ticker: str,
    index_from_end: int = 1,
    workbook_path: Path = WORKBOOK_PATH,
) -> dict:
    if not workbook_path.exists():
        raise FileNotFoundError(f"Workbook not found at {workbook_path}")

    xls = pd.ExcelFile(workbook_path)
    if ticker not in xls.sheet_names:
        raise ValueError(f"Sheet '{ticker}' not found in {workbook_path.name}")

    raw_df = xls.parse(ticker)
    df = derive_phase1_from_df(raw_df)

    if index_from_end < 1 or index_from_end > len(df):
        raise ValueError("index_from_end out of range")

    i = len(df) - index_from_end
    row = df.iloc[i]

    start = max(0, i - 9)
    vol_window = df["volume"].iloc[start:i + 1]
    vol10_manual = float(vol_window.mean()) if len(vol_window) else None
    vol10_calc = float(row["vol10_avg"]) if pd.notna(row["vol10_avg"]) else None

    slope5_manual = (
        float(df["sma5"].iloc[i] - df["sma5"].iloc[i - 1])
        if i > 0 and pd.notna(df["sma5"].iloc[i - 1]) else None
    )
    slope9_manual = (
        float(df["sma9"].iloc[i] - df["sma9"].iloc[i - 1])
        if i > 0 and pd.notna(df["sma9"].iloc[i - 1]) else None
    )

    sma_delta_manual = (
        float(df["sma5"].iloc[i] - df["sma9"].iloc[i])
        if pd.notna(df["sma5"].iloc[i]) and pd.notna(df["sma9"].iloc[i]) else None
    )
    if sma_delta_manual is None:
        sma_cross_manual = None
    elif sma_delta_manual > 0:
        sma_cross_manual = "up"
    elif sma_delta_manual < 0:
        sma_cross_manual = "down"
    else:
        sma_cross_manual = "none"

    vwap_state_manual = None
    c, f, s = row["close"], row["fast_vwap"], row["slow_vwap"]
    if pd.notna(c) and pd.notna(f) and pd.notna(s):
        if c > f and c > s:
            vwap_state_manual = "above"
        elif c < f and c < s:
            vwap_state_manual = "below"
        else:
            vwap_state_manual = "hold"

    match_vol = None
    if vol10_manual is None and vol10_calc is None:
        match_vol = True
    elif vol10_manual is not None and vol10_calc is not None:
        match_vol = abs(vol10_manual - vol10_calc) < 1e-9

    return {
        "ticker": ticker,
        "session_date": str(row["session_date"]),
        "row_index": int(row["row_index"]),
        "checks": {
            "vol10_avg": {
                "from_df": vol10_calc,
                "manual_mean_last_10": vol10_manual,
                "match": match_vol,
            },
            "slope5": {
                "from_df": float(row["slope5"]) if pd.notna(row["slope5"]) else None,
                "manual": slope5_manual,
            },
            "slope9": {
                "from_df": float(row["slope9"]) if pd.notna(row["slope9"]) else None,
                "manual": slope9_manual,
            },
            "sma_delta": {
                "from_df": float(row["sma_delta"]) if pd.notna(row["sma_delta"]) else None,
                "manual": sma_delta_manual,
            },
            "sma_cross_dir_calc": {
                "from_df": row["sma_cross_dir_calc"] if pd.notna(row["sma_cross_dir_calc"]) else None,
                "manual": sma_cross_manual,
            },
            "vwap_state": {
                "from_df": row["vwap_state"] if pd.notna(row["vwap_state"]) else None,
                "manual": vwap_state_manual,
            },
        },
    }


def load_ticker_from_excel_to_db(
    db: Session,
    user_id: int,
    ticker: str,
    workbook_path: Path = WORKBOOK_PATH,
    features_version: str = "v1",
) -> int:
    if not workbook_path.exists():
        raise FileNotFoundError(f"Workbook not found at {workbook_path}")

    xls = pd.ExcelFile(workbook_path)
    if ticker not in xls.sheet_names:
        raise ValueError(f"Sheet '{ticker}' not found in {workbook_path.name}")

    raw_df = xls.parse(ticker)
    derived = derive_phase1_from_df(raw_df)

    def nz(x):
        return None if pd.isna(x) else x

    def nz_int(x):
        return int(x) if not pd.isna(x) else None

    features: List[schema.DailyFeatureCreate] = []

    for _, row in derived.iterrows():
        features.append(
            schema.DailyFeatureCreate(
                user_id=user_id,
                ticker=ticker,
                session_date=row["session_date"],
                row_index=int(row["row_index"]),
                features_version=features_version,

                open=nz(row["open"]),
                high=nz(row["high"]),
                low=nz(row["low"]),
                close=nz(row["close"]),
                adj_close=nz(row.get("adj_close")),
                volume=nz_int(row["volume"]),

                buy_sell_arrow=row["buy_sell_arrow"] if pd.notna(row["buy_sell_arrow"]) else None,

                sma5=nz(row["sma5"]),
                sma9=nz(row["sma9"]),
                fast_vwap=nz(row["fast_vwap"]),
                slow_vwap=nz(row["slow_vwap"]),
                mfi14=nz(row["mfi14"]),
                rsi14=nz(row["rsi14"]),
                macd_hist=nz(row["macd_hist"]),

                catalyst=None,

                sma_delta=nz(row["sma_delta"]),
                sma_cross_dir_calc=row["sma_cross_dir_calc"] if pd.notna(row["sma_cross_dir_calc"]) else None,
                slope5=nz(row["slope5"]),
                slope9=nz(row["slope9"]),
                days_since_sma_cross=int(row["days_since_sma_cross"]) if not pd.isna(row["days_since_sma_cross"]) else None,
                days_since_macd_cross=int(row["days_since_macd_cross"]) if not pd.isna(row["days_since_macd_cross"]) else None,

                daily_pct_change=nz(row["daily_pct_change"]),
                range_pct=nz(row["range_pct"]),
                vol10_avg=nz_int(row["vol10_avg"]),

                atr10=nz(row["atr10"]),

                vwap_state=row["vwap_state"] if pd.notna(row["vwap_state"]) else None,
                vwap_delta_fast=nz(row["vwap_delta_fast"]),
                vwap_delta_fast_pct=nz(row["vwap_delta_fast_pct"]),
                vwap_contacts_total=nz_int(row["vwap_contacts_total"]),
            )
        )

    affected = crud.upsert_daily_features_bulk(db, features)
    return affected
