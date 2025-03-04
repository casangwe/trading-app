import pandas as pd
from sqlalchemy.orm import Session
from .crud import fetch_option_flow  
from datetime import datetime


def filter_stock_data(df, symbol: str):
    return df[df["symbol"] == symbol] if not df.empty else df


def contracts_flow(df):
    return {"total_contracts": int(df["size"].sum())} if not df.empty else {"total_contracts": 0}


def total_premium_flow(df):
    return {"total_premium": float(df["premium"].sum())} if not df.empty else {"total_premium": 0.0}


def total_calls(df):
    return {"total_calls": int(df[df["put_call"] == "call"]["size"].sum())} if not df.empty else {"total_calls": 0}


def total_puts(df):
    return {"total_puts": int(df[df["put_call"] == "put"]["size"].sum())} if not df.empty else {"total_puts": 0}


def put_call_ratio(df):
    if df.empty:
        return {"put_call_ratio": None}

    put_count = df[df["put_call"] == "put"]["size"].sum()
    call_count = df[df["put_call"] == "call"]["size"].sum()
    
    return {"put_call_ratio": round(put_count / call_count, 2) if call_count > 0 else None}

def highest_premium_trade(df):
    if df.empty or "premium" not in df.columns:
        return {"highest_premium": 0.0}

    df["premium"] = pd.to_numeric(df["premium"], errors="coerce") 
    df = df.dropna(subset=["premium"]) 

    if df.empty:
        return {"highest_premium": 0.0}

    highest_premium = df["premium"].max() 
    return {"highest_premium": float(highest_premium)} 

def largest_single_trade(df):
    if df.empty or "premium" not in df.columns:
        return {"largest_trade": None}

    df["premium"] = pd.to_numeric(df["premium"], errors="coerce")  
    df = df.dropna(subset=["premium"]) 

    if df.empty:
        return {"largest_trade": None}

    largest_trade = df.nlargest(1, "premium") 
    return largest_trade.to_dict(orient="records")[0] if not largest_trade.empty else {"largest_trade": None}


def unusual_volume(df):
    if df.empty or "volume" not in df.columns:
        return {"unusual_trades": []}

    volume_threshold = df["volume"].quantile(0.95)
    high_volume_trades = df[df["volume"] > volume_threshold]
    unusual_condition_trades = df[df["conds"].astype(str).str.contains("unusual", case=False, na=False)]
    
    unusual_trades = pd.concat([high_volume_trades, unusual_condition_trades]).drop_duplicates()
    return {"unusual_trades": unusual_trades.to_dict(orient="records")}


def most_active_expirations(df):
    if df.empty or "expiry" not in df.columns:
        return {"most_active_expirations": []}

    if not pd.api.types.is_datetime64_any_dtype(df["expiry"]):
        df["expiry"] = pd.to_datetime(df["expiry"], errors="coerce")

    df = df.dropna(subset=["expiry"])
    if df.empty:
        return {"most_active_expirations": []}

    today = pd.to_datetime(datetime.today().date())

    if "conds" in df.columns:
        df["is_opening"] = df["conds"].astype(str).str.contains("opening", case=False, na=False)
    else:
        df["is_opening"] = False 

    expirations = df.groupby("expiry", as_index=False).agg(
        total_contracts=("size", "sum"),
        total_premium=("premium", "sum"),
        total_calls=("put_call", lambda x: (x == "call").sum()),
        total_puts=("put_call", lambda x: (x == "put").sum()),
        opening_count=("is_opening", "sum"),
        opening_premium=("premium", lambda x: x[df["is_opening"]].sum()) 
    )

    expirations["expiry"] = expirations["expiry"].dt.date
    expirations["days_to_expiry"] = (pd.to_datetime(expirations["expiry"]) - today).dt.days

    expirations = expirations.sort_values(by="total_contracts", ascending=False).head(5)

    return {"most_active_expirations": expirations.to_dict(orient="records")}


def opening_contracts(df):
    if df.empty or "conds" not in df.columns:
        return {"opening_contracts": []}

    opening_trades = df[df["conds"].astype(str).str.contains("opening", case=False, na=False)].copy()

    if "expiry" in opening_trades.columns:
        opening_trades["expiry"] = pd.to_datetime(opening_trades["expiry"], errors="coerce").dt.strftime("%Y-%m-%d")

    return {"opening_contracts": opening_trades.to_dict(orient="records")}


def analyze_option_flow(db: Session, symbol: str = None, date_range: int = 30):
    df = fetch_option_flow(db, symbol, date_range)

    if df.empty:
        return {"message": "No data available for analysis"}

    return {
        "total_contracts": contracts_flow(df)["total_contracts"],
        "total_premium": total_premium_flow(df)["total_premium"],
        "total_calls": total_calls(df)["total_calls"], 
        "total_puts": total_puts(df)["total_puts"], 
        "put_call_ratio": put_call_ratio(df)["put_call_ratio"],
        "largest_trade": largest_single_trade(df),
        "unusual_volume": unusual_volume(df)["unusual_trades"],
        "most_active_expirations": most_active_expirations(df)["most_active_expirations"],
        "opening_contracts": opening_contracts(df)["opening_contracts"], 
        "overall_summary": {
        "total_trades_analyzed": len(df),
        "most_active_expiry": most_active_expirations(df)["most_active_expirations"][0]["expiry"] if most_active_expirations(df)["most_active_expirations"] else None,
        "largest_trade_premium": highest_premium_trade(df)["highest_premium"],
    }

    }
