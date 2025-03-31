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

def safe_float(value, default=0.0):
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

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
    trade_dict = largest_trade.to_dict(orient="records")[0]

    if "trade_date" in trade_dict and isinstance(trade_dict["trade_date"], pd.Timestamp):
        trade_dict["trade_date"] = trade_dict["trade_date"].strftime("%Y-%m-%d")
    if "trade_time" in trade_dict and isinstance(trade_dict["trade_time"], pd.Timestamp):
        trade_dict["trade_time"] = trade_dict["trade_time"].strftime("%H:%M:%S")

    return trade_dict


#################################################################################################
# Conditioning & Postitioning
#################################################################################################
def is_opening(row):
    size = safe_float(row.get("size"))
    open_int = safe_float(row.get("open_int"))
    conditions = (row.get("conds") or "").lower()
    return bool(any(x in conditions for x in ["opening", "opening unusual", "opening highly_un"]) or size > open_int)

def is_unusual(row):
    conditions = (row.get("conds") or "").lower()
    return bool(any(x in conditions for x in ["unusual", "highly_un", "opening unusual", "opening highly_un"]))

def most_active_expirations(df):
    if df.empty or "expiry" not in df.columns:
        return {"most_active_expirations": []}
    
    df["expiry"] = pd.to_datetime(df["expiry"], errors="coerce")
    df = df.dropna(subset=["expiry"])
    today = pd.to_datetime(datetime.today().date())
    df = df[df["expiry"] >= today]
    if df.empty:
        return {"most_active_expirations": []}
    
    if "analysis" not in df.columns:
        df["analysis"] = df.apply(categorize_trade, axis=1)
        analysis_df = pd.json_normalize(df["analysis"])
        overlapping_cols = analysis_df.columns.intersection(df.columns)
        df.drop(columns=overlapping_cols, inplace=True, errors='ignore')
        df = df.join(analysis_df).drop(columns=["analysis"])

    
    results = []
    for expiry_date, group in df.groupby("expiry"):
        total_contracts = int(group["size"].sum())
        most_traded_strike = (
            group.groupby("strike")["size"].sum().idxmax()
            if "strike" in group and not group.groupby("strike")["size"].sum().empty
            else None
        )
        
        sentiment_result = compute_sentiment(group)
        scenario = sentiment_result.get("scenario", "Unknown")
        metrics = sentiment_result.get("vs_metrics", {})
        
        results.append({
            "expiry": expiry_date.date(),
            "days_to_expiry": (expiry_date - today).days,
            "total_contracts": total_contracts,
            "strike": float(most_traded_strike) if most_traded_strike is not None else None,
            "scenario": scenario,
            "metrics": metrics
        })
    
    results = sorted(results, key=lambda x: x["total_contracts"], reverse=True)[:5]
    return {"most_active_expirations": results}

#################################################################################################
# Rules Dictionary
#################################################################################################

RULES = {
    "call": {
        "above": {"order_action": "buy-to-open", "sentiment": "bullish", "description": "Buying to Open Calls. Aggressive execution above the asking price demonstrates strong conviction among buyers."},
        "ask": {"order_action": "buy-to-open", "sentiment": "bullish", "description": "Buying to Open Calls. Initiating a position by buying call options at the ask price, indicating bullish sentiment."},
        "mid": {"order_action": "passive", "sentiment": "neutral", "description": "Passive execution at the midpoint, typically used by institutions."},
        "bid": {
            True: {"order_action": "sell-to-open", "sentiment": "bearish", "description": "Selling to Open Calls. Significant call-selling volume often indicates a neutral-to-bearish market outlook."},
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


    return {
        "option_type": option,
        "order_action": order_action,
        "sentiment": sentiment,
        "description": description
    }


def compute_sentiment(df):

    def is_bullish_unwinding(call_open_premium, call_close_premium, put_open_premium):
        return put_open_premium > call_open_premium
        # return call_close_premium > call_open_premium and put_open_premium > put_close_premium
        # return call_close_premium + put_open_premium > call_open_premium 
    def is_bearish_unwinding(put_open_premium, put_close_premium, call_open_premium):
        return call_open_premium > put_open_premium
        # return put_close_premium > put_open_premium and call_open_premium > call_close_premium
        # return put_close_premium + call_open_premium > put_open_premium 


    df["size"] = pd.to_numeric(df["size"], errors="coerce")
    df["premium"] = pd.to_numeric(df["premium"], errors="coerce")
    df["sentiment"] = df["sentiment"].str.lower()
    df["is_opening"] = df.apply(is_opening, axis=1)
    df["is_unusual"] = df.apply(is_unusual, axis=1)

    
    call_open = df[(df["option_type"] == "call") & (df["order_action"] == "buy-to-open")]
    put_open = df[(df["option_type"] == "put") & (df["order_action"] == "buy-to-open")]
    call_close = df[(df["option_type"] == "call") & (df["order_action"] == "sell-to-close")]
    put_close = df[(df["option_type"] == "put") & (df["order_action"] == "sell-to-close")]
    call_sto = df[(df["option_type"] == "call") & (df["order_action"] == "sell-to-open")]
    put_sto = df[(df["option_type"] == "put") & (df["order_action"] == "sell-to-open")]

    
    call_open_premium = call_open["premium"].sum()
    put_open_premium = put_open["premium"].sum()
    call_close_premium = call_close["premium"].sum()
    put_close_premium = put_close["premium"].sum()
    call_sto_premium = call_sto["premium"].sum()
    put_sto_premium = put_sto["premium"].sum()

    total_call_premium = df[df["option_type"] == "call"]["premium"].sum()
    total_put_premium = df[df["option_type"] == "put"]["premium"].sum() 

    net_bullish_premium = call_open_premium + put_sto_premium
    net_bearish_premium = put_open_premium  + call_sto_premium
    

    weight_open = 1.0
    weight_close = 1.2
    weight_sto = 1.1  
    
    sentiment_score = (
        (call_open_premium - put_open_premium * weight_open) +
        (put_close_premium - call_close_premium * weight_close) +
        (total_call_premium - total_put_premium) +
        ((put_sto_premium - call_sto_premium) * weight_sto) 
    )


    scenario = "Neutral"
    details = None
    metrics= None
    score = 0

    if sentiment_score > 0:

        if (
            call_open_premium > call_close_premium + put_open_premium and
            put_close_premium > put_open_premium and
            call_open_premium > call_close_premium and
            call_open_premium > put_open_premium and 
            put_close_premium > call_close_premium and
            call_open_premium + put_sto_premium > put_open_premium + call_sto_premium
        ):
            scenario = "Strong Bullish Flow"
            score = 3
            details = {
                "message": (
                    f"Strong Bullish flow is evident as call opening (${call_open_premium:,.2f}) and put selling opening (${put_sto_premium:,.2f}) "
                    f"surpasses net bearish opening flow (${net_bearish_premium:,.2f}). Additionally, call opening premium exceeds call closing premium "
                    f"(${call_close_premium:,.2f}), signaling active accumulation. Meanwhile, bearish positions are being unwound, as put closing premium "
                    f"(${put_close_premium:,.2f}) is higher than Call Closing Premium (${call_close_premium:,.2f}). "
                    f"This flow reflects strong institutional bullish conviction and likely directional repositioning."
                )
            }
            metrics = {
                "left_label": "Bearish Metrics",
                "right_label": "Bullish Metrics",
                "left": {
                    "Call Closing Premium": float(call_close_premium),
                    "Put Opening Premium": float(put_open_premium),
                    "Net Bearish Premium": float(put_open_premium + call_close_premium)

                },
                "right": {
                    "Call Opening Premium": float(call_open_premium),
                    "Put Closing Premium": float(put_close_premium),
                    "Net Bullish Premium": float(call_open_premium + put_close_premium)

                }
            }

        elif (
            put_close_premium > put_open_premium and
            call_open_premium > call_close_premium and
            call_open_premium > put_open_premium and 
            put_close_premium > call_close_premium and
            call_open_premium + put_sto_premium > put_open_premium + call_sto_premium
        ):

            if is_bullish_unwinding(call_open_premium, call_close_premium, put_open_premium):
                scenario = "Bullish Profit-Taking & Unwinding"
                score = 2
                details = {
                    "message": (
                        f"Flow resembles accumulation but is distorted by profit-taking activity. "
                        f"Call closing premium (${call_close_premium:,.2f}) and put buying (${put_open_premium:,.2f}) "
                        f"exceed new call openings (${call_open_premium:,.2f}). Monitor for confirmation — flow may reverse."
                    )
                }
                metrics = {
                    "left_label": "Profit-Taking",
                    "right_label": "Bullish Flow",
                    "left": {
                        "Call Closing Premium": float(call_close_premium),
                        "Put Opening Premium": float(put_open_premium),
                        "Net Bearish Premium": float(call_close_premium + put_open_premium)
                    },
                    "right": {
                        "Call Opening Premium": float(call_open_premium),
                        "Put Closing Premium": float(put_close_premium),
                        "Net Bullish Premium": float(call_open_premium + put_close_premium)
                    }
                }
            else:
                scenario = "Bullish Accumulation"
                score = 2
                details = {
                    "message": (
                        f"Evidence of sustained bullish flow as Institutions are accumulating bullish exposure. "
                        f"Combined call opening premium and put selling is (${(call_open_premium + put_sto_premium):,.2f}) "
                        f"exceeding put openings (${put_open_premium:,.2f}). Additionally, more capital is entering "
                        f"call buying (${call_open_premium:,.2f}) than leaving (${call_close_premium:,.2f}), "
                        f"indicating conviction in upside. This is a strong setup for bullish continuation."
                    )
                }
                metrics = {
                    "left_label": "Bearish Metrics",
                    "right_label": "Bullish Metrics",
                    "left": {
                        "Call Closing Premium": float(call_close_premium),
                        "Put Opening Premium": float(put_open_premium),
                        "Net Bearish Premium": float(call_close_premium + put_open_premium)
                    },
                    "right": {
                        "Call Opening Premium": float(call_open_premium),
                        "Put Closing Premium": float(put_close_premium),
                        "Net Bullish Premium": float(call_open_premium + put_close_premium)
                    }
                }

        elif (
            call_open_premium > call_close_premium and
            call_open_premium > put_open_premium and
            put_close_premium > call_close_premium and
            call_open_premium + put_sto_premium > put_open_premium + call_sto_premium
        ):
            scenario = "Bullish Positioning"
            score = 1
            details = {
                "message": (
                    f"Bullish positioning is strongly indicated. The call opening premium (${call_open_premium:,.2f}) "
                    f"exceeds call closing premium (${call_close_premium:,.2f}), showing robust bullish initiations. "
                    f"Moreover, call openings dominate put openings (${put_open_premium:,.2f}), while put closings (${put_close_premium:,.2f}) "
                    f"are higher than call closings, suggesting that bearish positions are being actively unwound. "
                    f"Finally, the net bullish flow (call openings plus put sell-to-open) exceeds the net bearish flow, confirming a "
                    f"strong upward bias in the option flow."
                )
            }
            metrics = {
                "left_label": "Bearish Metrics",
                "right_label": "Bullish Metrics",
                "left": {
                    "Call Closing Premium": float(call_close_premium),
                    "Put Opening Premium": float(put_open_premium),
                    "Net Bearish Premium": float(call_close_premium + put_open_premium)
                },
                "right": {
                    "Call Opening Premium": float(call_open_premium),
                    "Put Closing Premium": float(put_close_premium),
                    "Net Bullish Premium": float(call_open_premium + put_close_premium)
                }
            }


        else:
            scenario = "Mildly Bullish"
            score = 0
            details = {
                "message": (
                    f"The sentiment score is positive ({sentiment_score:,.0f}), indicating a mild bullish tilt in the option flow. "
                    f"Call opening premium (${call_open_premium:,.2f}) exceeds call closing premium (${call_close_premium:,.2f}), "
                    f"suggesting some bullish commitment, although the overall flow does not decisively favor bullish positions."
                )
            }
            metrics = {
                "left_label": "Bearish Metrics",
                "right_label": "Bullish Metrics",
                "left": {
                    "Call Closing Premium": float(call_close_premium),
                    "Put Opening Premium": float(put_open_premium),
                    "Net Bearish Premium": float(call_close_premium + put_open_premium)
                },
                "right": {
                    "Call Opening Premium": float(call_open_premium),
                    "Put Closing Premium": float(put_close_premium),
                    "Net Bullish Premium": float(call_open_premium + put_close_premium)
                }
            }




    elif sentiment_score < 0:
        if (
            put_open_premium > put_close_premium + call_open_premium and
            call_close_premium > call_open_premium and
            put_open_premium > put_close_premium and
            put_open_premium > call_open_premium and
            call_close_premium > put_close_premium and
            put_open_premium + call_sto_premium > call_open_premium + put_sto_premium
        ):
            scenario = "Strong Bearish Flow"
            score = -3
            details = {
                "message": (
                    f"Bearish sentiment is dominant across all flow indicators. The combined put opening (${put_open_premium:,.2f}) "
                    f"and call selling (${call_sto_premium:,.2f}) adds up to (${net_bearish_premium:,.2f}), surpassing bullish initiation " 
                    f"flow (${call_open_premium:,.2f}). Additionally, call closing premium (${call_close_premium:,.2f}) is greater than " 
                    f"put closing premium (${put_close_premium:,.2f}), highlighting a broad retreat from bullish exposure. This pattern " 
                    f"suggests institutional conviction in downside risk or an emerging market correction scenario. Scan metrics to confirm " 
                    f"more calls are being closed than puts being opened. It doesn't have to be greater but it shows strong conviction." 

                )
            }
            metrics = {
                "left_label": "Bearish Metrics",
                "right_label": "Bullish Metrics",
                "left": {
                    "Put Opening Premium": float(put_open_premium),
                    "Call Closing Premium": float(call_close_premium),
                    "Net Bearish Premium": float(put_open_premium + call_close_premium),
                },
                "right": {
                    "Call Opening Premium": float(call_open_premium),
                    "Put Closing Premium": float(put_close_premium),
                    "Net Bullish Premium": float(call_open_premium + put_close_premium),
                }
            }


        elif (
            call_close_premium > call_open_premium and
            put_open_premium > put_close_premium and
            put_open_premium > call_open_premium and
            call_close_premium > put_close_premium and
            put_open_premium + call_sto_premium > call_open_premium + put_sto_premium
        ):
            if is_bearish_unwinding(put_open_premium, put_close_premium, call_open_premium):
                scenario = "Bearish Profit-Taking & Distribution "
                score = -2
                details = {
                    "message": (
                        f"Flow resembles bearish accumulation but is distorted by profit-taking activity. "
                        f"Put closing premium (${put_close_premium:,.2f}) and call buying (${call_open_premium:,.2f}) "
                        f"exceed new put openings (${put_open_premium:,.2f}). Monitor for confirmation — flow may reverse."
                    )
                }

                metrics = {
                    "left_label": "Profit-Taking",
                    "right_label": "Bearish Flow",
                    "left": {
                        "Put Closing Premium": float(put_close_premium),
                        "Call Opening Premium": float(call_open_premium),
                        "Net Bullish Premium": float(put_close_premium + call_open_premium),
                    },
                    "right": {
                        "Put Opening Premium": float(put_open_premium),
                        "Call Closing Premium": float(call_close_premium),
                        "Net Bearish Premium": float(put_open_premium + call_close_premium),
                    }
                }

            else:
                scenario = "Bearish Accumulation"
                score = -2
                details = {
                    "message": (
                        f"The flow indicates bearish positioning and accumulation across the broad. " 
                        f"Call closing premium (${call_close_premium:,.2f}) is greater than call opening premium " 
                        f"(${call_open_premium:,.2f}), indicating robust unwinding of bullish positions. Put opening premium " 
                        f"(${put_open_premium:,.2f}) exceeds put closing premium (${put_close_premium:,.2f}) suggesting aggressive " 
                        f"bearish bets are being opened. Scan metrics to see if put opening is more than "
                        f"net bullish premium. That shows strong downward conviction, otherwise, slight profit-taking, "
                        f"but not enough to reverse the flow. "
                    )
                }
                metrics = {
                    "left_label": "Bearish Metrics",
                    "right_label": "Bullish Metrics",
                    "left": {
                        "Call Closing Premium": float(call_close_premium),
                        "Put Opening Premium": float(put_open_premium),
                        "Net Bearish Premium": float(call_close_premium + put_open_premium)
                    },
                    "right": {
                        "Call Opening Premium": float(call_open_premium),
                        "Put Closing Premium": float(put_close_premium),
                        "Net Bullish Premium": float(call_open_premium + put_close_premium)
                    }
                }

        elif (
            put_open_premium > put_close_premium and
            put_open_premium > call_open_premium and
            call_close_premium > put_close_premium and
            put_open_premium + call_sto_premium > call_open_premium + put_sto_premium
            
        ):
            scenario = "Bearish Positioning"
            score = -1
            details = {
                "message": (
                    f"The flow reflects early signs of bearish sentiment. Put opening premium (${put_open_premium:,.2f}) "
                    f"surpasses put closing premium (${put_close_premium:,.2f}), and call opening (${call_open_premium:,.2f}), " 
                    f"suggesting a gradual shift toward downside exposure. Additionally, the call closing premium is " 
                    f"(${call_close_premium:,.2f}) more than the put closing premium (${put_close_premium:,.2f}) and " 
                    f"may represent early positioning ahead of potential weakness. Consider taking a position if " 
                    f"supported by broader market metrics and technical analysis."
                )
            }
            metrics = {
                "left_label": "Bearish Metrics",
                "right_label": "Bullish Metrics",
                "left": {
                    "Put Opening Premium": float(put_open_premium),
                    "Call Closing Premium": float(call_close_premium),
                    "Net Bearish Premium": float(put_open_premium + call_close_premium)
                },
                "right": {
                    "Put Closing Premium": float(put_close_premium),
                    "Call Opening Premium": float(call_open_premium),
                    "Net Bullish Premium": float(put_close_premium + call_open_premium)

                }
            }

        else:
            scenario = "Mildly Bearish"
            score = 0
            details = {
                "message": (
                    f"The sentiment score is negative, indicating a mild bearish tilt in the option flow "
                    f"but without strong evidence of bearish commitment. Put opening premium (${put_open_premium:,.2f}) while "
                    f"put closing premium (${put_close_premium:,.2f})."
                )
            }
            metrics = {
                "left_label": "Bearish Metrics",
                "right_label": "Bullish Metrics",
                "left": {
                    "Put Opening Premium": float(put_open_premium),
                    "Call Closing Premium": float(call_close_premium),
                    "Net Bearish Premium": float(put_open_premium + call_close_premium)
                },
                "right": {
                    "Put Closing Premium": float(put_close_premium),
                    "Call Opening Premium": float(call_open_premium),
                    "Net Bullish Premium": float(put_close_premium + call_open_premium)

                }
            }

    else:
        scenario = "Neutral"


    sentiment_report = {
        "sentiment_score": sentiment_score,
        "scenario": scenario,
        "score": score,
        "details": details,
        "vs_metrics": metrics
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
    
    last_trade = df.sort_values(by=["trade_date", "trade_time"], ascending=False).iloc[0]
    last_update_date = str(last_trade["trade_date"])
    last_update_time = str(last_trade["trade_time"])


    most_active = most_active_expirations(df)["most_active_expirations"]
    sentiment_results = compute_sentiment(df)

    result = {
        "last_update": {
            "date": last_update_date,
            "time": last_update_time
            },
        "market_sentiment": sentiment_results,
        "total_contracts": contracts_flow(df)["total_contracts"],
        "total_premium": total_premium_flow(df)["total_premium"],
        "total_calls": total_calls(df)["total_calls"],
        "total_puts": total_puts(df)["total_puts"],
        "put_call_ratio": put_call_ratio(df)["put_call_ratio"],
        "largest_trade": largest_single_trade(df),
        "most_active_expirations": most_active,
        "categories": df.to_dict(orient='records'),
        "overall_summary": {
            "total_trades_analyzed": len(df),
            "most_active_expiry": most_active[0]["expiry"] if most_active else None,
            "largest_trade_premium": highest_premium_trade(df)["highest_premium"],
        },
    }
    
    return convert_numpy(result)


