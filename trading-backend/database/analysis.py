import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from datetime import datetime
from .crud import fetch_option_flow

#################################################################################################
# Helper Function 
#################################################################################################

def convert_numpy(obj):
    if isinstance(obj, np.generic):
        return obj.item()
    elif isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(item) for item in obj]
    else:
        return obj

#################################################################################################
# Data Analysis 
#################################################################################################

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


#################################################################################################
# Predictive Model / Analysis 
#################################################################################################

#################################################################################################
# Utility Function for Safe Float Conversion
#################################################################################################
def safe_float(value, default=0.0):
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

#################################################################################################
# Postitioning
#################################################################################################
def is_opening(row):
    size = safe_float(row.get("size"))
    open_int = safe_float(row.get("open_int"))
    conditions = (row.get("conds") or "").lower()
    return any(x in conditions for x in ["opening", "opening unusual", "opening highly_un"]) or size > open_int

def is_unusual(row):
    conditions = (row.get("conds") or "").lower()
    return any(x in conditions for x in ["unusual", "highly_un", "opening unusual", "opening highly_un"])

def is_adding(row):
       
    if is_opening(row) or is_profit_taking(row):        
        return False    
       
    size = safe_float(row.get("size"))
    open_int = safe_float(row.get("open_int"))
    volume = safe_float(row.get("volume"))
    put_call = (row.get("put_call") or "").lower().strip()
    side = (row.get("side") or "").lower().strip()
    
    condition_volume = (volume >= size or volume > open_int)
    condition_call = (put_call == "call" and side in ["ask", "mid"] and size < open_int)
    
    return condition_volume or condition_call


def is_profit_taking(row):
    if is_opening(row):
        return False

    size = safe_float(row.get("size"))
    open_int = safe_float(row.get("open_int"))
    volume = safe_float(row.get("volume"))
    put_call = (row.get("put_call") or "").lower().strip()
    side = (row.get("side") or "").lower().strip()


    basic_condition = size < open_int
    volume_condition = volume <= open_int

    if put_call == "call":
        side_condition = (side == "bid")
    elif put_call == "put":
        side_condition = (side == "ask")
    else:
        side_condition = side in ["bid", "ask"]

    return basic_condition and volume_condition and side_condition


def is_closing(row):

    size = safe_float(row.get("size"))
    open_int = safe_float(row.get("open_int"))
    volume = safe_float(row.get("volume"))

    if open_int == 0:
        return False

    return size == open_int or (size > 0.9 * open_int and volume <= open_int)

def sustained_openings(df, threshold=3):
    daily_openings = df.groupby("trade_date").apply(lambda x: x.apply(is_opening, axis=1).sum())
    sustained_days = (daily_openings >= threshold).sum()
    avg_daily_openings = daily_openings.mean()
    return sustained_days, avg_daily_openings

#################################################################################################
# Rules Dictionary
#################################################################################################
RULES = {
    "call": {
        "above": {"order_action": "buy-to-open", "sentiment": "bullish", "description": "Buying to Open Calls. Aggressive execution above the asking price demonstrates strong conviction among buyers."},
        "ask": {"order_action": "buy-to-open", "sentiment": "bullish", "description": "Buying to Open Calls. Initiating a position by buying call options at the ask price, indicating bullish sentiment."},
        "mid": {"order_action": "passive", "sentiment": "neutral", "description": "Passive execution at the midpoint, typically used by institutions."},
        "bid": {
            True: {"order_action": "sell-to-open", "sentiment": "neutral", "description": "Selling to Open Calls. Significant call-selling volume often indicates a neutral-to-bearish market outlook."},
            False: {"order_action": "sell-to-close", "sentiment": "bearish", "description": "Selling to Close Calls. Closing long call positions through selling, reducing bullish exposure or adjusting to bearish market conditions."}
        },
        "below": {"order_action": "sell-to-close", "sentiment": "bearish", "description": "Selling to Close Calls. Urgently closing long call positions through selling, reflecting a bearish sentiment and expectations of limited upside potential."}
    },
    "put": {
        "below": {
            True: {"order_action": "buy-to-open", "sentiment": "bearish", "description": "Buying to Open Puts. Aggressively buying put options below the bid price reflects strong bearish sentiment and high conviction in further downside potential."},
            False: {"order_action": "sell-to-close", "sentiment": "bullish", "description": "Selling to Close Puts. Traders exiting long puts by selling below the bid, signaling a reduction in bearish sentiment as traders anticipate a potential market reversal."}
        },
        "bid": {
            True: {"order_action": "sell-to-open", "sentiment": "bullish", "description": "Initiating a position by selling put options at the bid. High-volume put selling often signals bullish sentiment, with expectations that the stock will stay above the strike price."},
            False: {"order_action": "sell-to-close", "sentiment": "bearish", "description": "Selling to Close Puts. Closing long put positions by selling at the bid. Often reflects profit-taking or a reduction in downside conviction as market sentiment turns less bearish."}
        },
        "mid": {"order_action": "passive", "sentiment": "neutral", "description": "Passive execution at the midpoint and often used by traders for puts."},
        "ask": {"order_action": "buy-to-open", "sentiment": "bearish", "description": "Buying to Open Puts. Initiating a position by buying put options at the asking price, reflecting a bearish outlook and an expectation of a price decline in the underlying asset."},
        "above": {"order_action": "buy-to-open", "sentiment": "bearish", "description": "Buying to Open Puts. Aggressive purchase above ask and initiating a position by buying put options above the asking price, signaling strong bearish conviction and urgency in anticipating downside potential."}
    }
}

#################################################################################################
# Categorization Function
#################################################################################################
def categorize_trade(row):
    option = (row.get('put_call') or '').lower().strip()
    side = (row.get('side') or '').lower().strip()

    if option not in RULES or side not in RULES[option]:
        return {
            "option_type": option,
            "order_action": "unknown",
            "sentiment": "neutral",
            "description": "Trade does not fit any known pattern."
        }

    opening = is_opening(row)
    unusual = is_unusual(row)
    adding = is_adding(row)
    profit_taking = is_profit_taking(row)
    closing = is_closing(row)

    rule = RULES[option][side]

    if isinstance(rule, dict) and all(isinstance(k, bool) for k in rule.keys()):
        rule = rule[opening]

    order_action = rule["order_action"]
    sentiment = rule["sentiment"]
    description = rule["description"]

    if opening:
        description += " Opening trade."
    if unusual:
        description += " Unusual volume detected."
    if adding:
        description += " Adding to existing position."
    if profit_taking:
        description += " Profit-taking activity."
    if closing:
        description += " Full position closure detected."

    return {
        "option_type": option,
        "order_action": order_action,
        "sentiment": sentiment,
        "description": description
    }

def compute_sentiment(df):

    df["size"] = pd.to_numeric(df["size"], errors="coerce")
    df["premium"] = pd.to_numeric(df["premium"], errors="coerce")
    
    call_open = df[(df["option_type"] == "call") & (df["order_action"] == "buy-to-open")]
    put_open = df[(df["option_type"] == "put") & (df["order_action"] == "buy-to-open")]
    call_close = df[(df["option_type"] == "call") & (df["order_action"] == "sell-to-close")]
    put_close = df[(df["option_type"] == "put") & (df["order_action"] == "sell-to-close")]
    call_sto = df[(df["option_type"] == "call") & (df["order_action"] == "sell-to-open")]
    put_sto = df[(df["option_type"] == "put") & (df["order_action"] == "sell-to-open")]
    call_mid = df[(df["option_type"] == "call") & (df["order_action"] == "passive")]
    put_mid = df[(df["option_type"] == "put") & (df["order_action"] == "passive")]
    
    call_open_premium = call_open["premium"].sum()
    put_open_premium = put_open["premium"].sum()
    call_close_premium = call_close["premium"].sum()
    put_close_premium = put_close["premium"].sum()
    total_call_premium = df[df["option_type"] == "call"]["premium"].sum()
    total_put_premium = df[df["option_type"] == "put"]["premium"].sum() 
    call_sto_premium = call_sto["premium"].sum()
    put_sto_premium = put_sto["premium"].sum()
    call_mid_premium = call_mid["premium"].sum()
    put_mid_premium = put_mid["premium"].sum()
    
    bullish_trades = df[df["sentiment"] == "bullish"].shape[0]
    bearish_trades = df[df["sentiment"] == "bearish"].shape[0]
    neutral_trades = df[df["sentiment"] == "neutral"].shape[0]
    
    bullish_trades_premium = df[df["sentiment"] == "bullish"]["premium"].sum()
    bearish_trades_premium = df[df["sentiment"] == "bearish"]["premium"].sum()
    neutral_trades_premium = df[df["sentiment"] == "neutral"]["premium"].sum()

    opening_count = df.apply(is_opening, axis=1).sum()
    call_accumulation_count = call_open.shape[0] + df[(df["option_type"] == "call") & (df["order_action"] == "passive")].shape[0]

    bullish_open = df[(df.apply(is_opening, axis=1)) & (df["sentiment"].str.contains("bullish", case=False, na=False))]
    bearish_open = df[(df.apply(is_opening, axis=1)) & (df["sentiment"].str.contains("bearish", case=False, na=False))]
    call_mid_open = df[(df["option_type"] == "call") & (df["order_action"] == "passive") & (df.apply(is_opening, axis=1))]
    put_mid_open = df[(df["option_type"] == "put") & (df["order_action"] == "passive") & (df.apply(is_opening, axis=1))]

    bullish_open_count = bullish_open.shape[0]
    bearish_open_count = bearish_open.shape[0]
    bullish_mid_open_count = call_mid_open.shape[0]
    bearish_mid_open_count = put_mid_open.shape[0]

    bullish_open_premium = bullish_open["premium"].sum()
    bearish_open_premium = bearish_open["premium"].sum()
    call_mid_open_premium = call_mid_open["premium"].sum()
    put_mid_open_premium = put_mid_open["premium"].sum()


    net_bullish_premium = call_open_premium + put_sto_premium + put_close_premium + call_mid_open_premium
    net_bearish_premium = put_open_premium + call_close_premium + put_mid_open_premium
    
    weight_open = 1.0
    weight_close = 1.2
    weight_sto = 1.1  
    weight_mid = 0.5  
    weight_sentiment = 50000 
    
    sentiment_score = (
        (call_open_premium - put_open_premium * weight_open) +
        (put_close_premium - call_close_premium * weight_close) +
        (total_call_premium - total_put_premium) +
        ((put_sto_premium - call_sto_premium) * weight_sto) +
        ((call_mid_premium - put_mid_premium) * weight_mid) +
        ((bullish_trades - bearish_trades) * weight_sentiment)
    )
    
    
    scenario = "Neutral"
    details = None

    if sentiment_score > 0:
        if (
            total_call_premium > total_put_premium and
            call_open_premium + put_sto_premium > put_open_premium and
            call_mid_open_premium > put_mid_open_premium and
            net_bullish_premium > net_bearish_premium and
            call_open_premium > call_close_premium and
            (bullish_open_count + bullish_mid_open_count) > (bearish_open_count + bearish_mid_open_count) and 
            (bullish_open_premium + call_mid_open_premium) > (bearish_open_premium + put_mid_open_premium) and
            put_close_premium > call_close_premium  # key for bullish strength. Puts are being closed more than calls are closed

        ):
            scenario = "Strong Bullish Flow"
            details = {
                "message": (
                    f"Bullish conditions: The bullish initiation premium (calls buy-to-open + puts sell-to-open) is "
                    f"(${call_open_premium + put_sto_premium:,.2f}), which exceeds the bearish initiation premium of "
                    f"(${put_open_premium:,.2f}). Additionally, the puts closing premium is (${put_close_premium:,.2f}) "
                    f"—higher than the calls closing premium of (${call_close_premium:,.2f}). Overall, the net bullish flow "
                    f"(calls open + puts sell-to-open + puts close + mid calls) totals (${net_bullish_premium:,.2f}) compared to a net "
                    f"bearish flow of (${net_bearish_premium:,.2f}), and total call premium (${total_call_premium:,.2f}) exceeds "
                    f"total put premium (${total_put_premium:,.2f}). Furthermore, of the bullish trades, "
                    f"{bullish_open_count + bullish_mid_open_count} are opening trades (with a premium of ${bullish_open_premium + call_mid_open_premium:,.2f}) "
                    f"compared to {bearish_open_count + bearish_mid_open_count } bearish opening trades (with ${bearish_open_premium + put_mid_open_premium:,.2f})."
                )
            }
        elif (
            total_call_premium > total_put_premium and
            call_open_premium + put_sto_premium > put_open_premium and
            call_mid_open_premium > put_mid_open_premium and
            net_bullish_premium > net_bearish_premium and
            call_open_premium > call_close_premium and # key to bullish continuation 
            (bullish_open_count + bullish_mid_open_count) > (bearish_open_count + bearish_mid_open_count) and # key to bullish continuation 
            (bullish_open_premium + call_mid_open_premium) > (bearish_open_premium + put_mid_open_premium)  # key to bullish continuation 
        ):
            scenario = "Bullish Continuation"
            details = {
                "message": (
                    f"Bullish continuation: Bullish continuation is seen when bullish initiation premium is "
                    f"(${call_open_premium + put_sto_premium:,.2f}), which exceeds the bearish initiation premium of "
                    f"(${put_open_premium:,.2f}), and the total call premium (${total_call_premium:,.2f}) exceeds the total put "
                    f"premium (${total_put_premium:,.2f}). This suggests sustained bullish demand, with a higher frequency of call open "
                    f"trades at (${call_open_premium:,.2f}) compared to call closing trades at (${call_close_premium:,.2f}), indicating that market participants are "
                    f"maintaining their bullish positions. Furthermore, of the bullish trades, "
                    f"{bullish_open_count + bullish_mid_open_count} are opening trades (with a premium of ${bullish_open_premium + call_mid_open_premium:,.2f}) "
                    f"compared to {bearish_open_count + bearish_mid_open_count } bearish opening trades (with ${bearish_open_premium + put_mid_open_premium:,.2f})."
                )
            }

        elif (
            total_call_premium > total_put_premium and
            call_open_premium + put_sto_premium > put_open_premium and
            call_mid_open_premium > put_mid_open_premium and
            net_bullish_premium > net_bearish_premium and           
            bullish_trades > bearish_trades and
            call_mid_premium > put_mid_premium
        ):
            scenario = "Institutional Bullish Accumulation"
            details = {
                "message": (
                    f"Institutional Accumulation: The combined count of call buy-to-open and passive call orders is "
                    f"{call_accumulation_count}, which exceeds the put buy-to-open count of {put_open.shape[0]}. "
                    f"Additionally, the mid premium for calls (${call_mid_premium:,.2f}) exceeds that of puts "
                    f"(${put_mid_premium:,.2f}), further supporting sustained accumulation by institutions. "
                    f"Moreover, the call open premium is ${call_open_premium:,.2f}, indicating strong accumulation."
                )
            }

        elif (
            bullish_trades_premium > bearish_trades_premium + neutral_trades_premium and
            total_call_premium > total_put_premium
            ):
            scenario = "Bullish"
            details = {
                "message": (
                    f"Bullish Sentiment: Total bullish trades premium (${bullish_trades_premium:,.2f}) exceeds bearish plus neutral "
                    f"trades premium (${bearish_trades_premium + neutral_trades_premium:,.2f}), with total call premium (${total_call_premium:,.2f}) "
                    f"exceeding total put premium (${total_put_premium:,.2f})."
                )
            }

        else:
            scenario = "Mildly Bullish"
            details = {
                "message": (
                    f"Mildy Bullish: Mildly bullish sentiment score, but needs accumulation."
                )
            }
    elif sentiment_score < 0:
        if (
            put_open_premium + call_sto_premium > call_open_premium and
            call_close_premium > put_close_premium and
            net_bearish_premium > net_bullish_premium and
            total_put_premium > total_call_premium
        ):
            scenario = "Strong Bearish Flow"
            details = {
                "message": (
                    f"Bearish conditions: The bearish initiation premium (puts buy-to-open + calls sell-to-open) is "
                    f"${put_open_premium + call_sto_premium:,.2f}, which exceeds the bullish initiation premium of "
                    f"${call_open_premium:,.2f}. Additionally, the calls closing premium is ${call_close_premium:,.2f} "
                    f"—higher than the puts closing premium of ${put_close_premium:,.2f}. Overall, the net bearish flow "
                    f"(puts open + calls sell-to-open + calls close) totals ${net_bearish_premium:,.2f} compared to a net "
                    f"bullish flow of ${net_bullish_premium:,.2f}, and total put premium (${total_put_premium:,.2f}) exceeds "
                    f"total call premium (${total_call_premium:,.2f})."
                )
            }
        elif ( 
            put_open_premium + call_sto_premium > call_open_premium and
            call_close_premium > call_open_premium and
            put_open_premium > call_open_premium and 
            call_close_premium > put_close_premium and total_put_premium > total_call_premium
            
            ):
            scenario = "Bullish Unwinding"
            details = {
                "message": (
                    f"Bearish conditions: The bearish initiation premium (puts buy-to-open + calls sell-to-open) is "
                    f"${put_open_premium + call_sto_premium:,.2f}, which exceeds the bullish initiation premium of "
                    f"${call_open_premium:,.2f}. and the total call premium (${total_call_premium:,.2f}) is less than the total put "
                    f"premium (${total_put_premium:,.2f}). This suggests less bullish demand, with a lower frequency of call open "
                    f"trades compared to put open trades, and robust call closing flows $ {call_close_premium:,.2f} indicating that market participants are "
                    f"exiting their bullish positions."
                )
            }
        elif ( 
            put_open_premium + call_sto_premium > call_open_premium and
            total_put_premium > total_call_premium and 
            put_mid_premium > call_mid_premium
            ):
            scenario = "Distribution & Bearish Positioning"
            details = {
                "message": (
                    f"Distribution: Calls are being closed than they are openend. The combined count of call buy-to-open and passive call orders is "
                    f"{call_accumulation_count}, which exceeds the put buy-to-open count of {put_open.shape[0]}. "
                    f"Additionally, the mid premium for calls (${call_mid_premium:,.2f}) exceeds that of puts "
                    f"(${put_mid_premium:,.2f}), further supporting sustained accumulation by institutions. "
                    f"Moreover, the call open premium is ${call_open_premium:,.2f}, indicating strong accumulation."
                )
            }
        else:
            scenario = "Mildly Bearish"
    else:
        scenario = "Neutral"


    sentiment_report = {
        "sentiment_score": sentiment_score,
        "scenario": scenario,
        "details": details,

    }
    
    return sentiment_report


#################################################################################################
# Results Analysis Function
#################################################################################################
def analyze_option_flow(db: Session, symbol: str = None, date_range: int = 30):
    df = fetch_option_flow(db, symbol, date_range)
    if df.empty:
        return {"message": "No data available for analysis"}
    
    df.columns = df.columns.str.lower()
    
    df['analysis'] = df.apply(lambda row: categorize_trade(row), axis=1)
    analysis_df = pd.json_normalize(df['analysis'])
    
    for col in analysis_df.columns:
        if col in df.columns:
            df = df.drop(columns=[col])
    
    df = df.join(analysis_df)
    df = df.drop(columns=['analysis'])
    
    most_active = most_active_expirations(df)["most_active_expirations"]
    
    sentiment_results = compute_sentiment(df)
    
    result = {
        "market_sentiment": sentiment_results,
        "total_contracts": contracts_flow(df)["total_contracts"],
        "total_premium": total_premium_flow(df)["total_premium"],
        "total_calls": total_calls(df)["total_calls"],
        "total_puts": total_puts(df)["total_puts"],
        "put_call_ratio": put_call_ratio(df)["put_call_ratio"],
        "largest_trade": largest_single_trade(df),
        "most_active_expirations": most_active,
        # "categories": df.to_dict(orient='records'),
        "overall_summary": {
            "total_trades_analyzed": len(df),
            "most_active_expiry": most_active[0]["expiry"] if most_active else None,
            "largest_trade_premium": highest_premium_trade(df)["highest_premium"],
        },
    }
    
    return convert_numpy(result)


