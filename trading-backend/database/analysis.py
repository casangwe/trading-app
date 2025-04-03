import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from datetime import datetime
from .crud import fetch_option_flow
import yfinance as yf


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

    def is_bullish_unwinding(call_open_premium, call_close_premium, put_sto_premium):
        return call_close_premium > call_open_premium + put_sto_premium

    def is_bearish_unwinding(put_open_premium, put_close_premium, call_open_premium):
        return put_close_premium + call_open_premium > put_open_premium  



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


    

    # weight_open = 1.0
    # weight_close = 1.2
    # weight_sto = 1.1  
    
    # sentiment_score = (
    #     (call_open_premium - put_open_premium * weight_open) +
    #     (put_close_premium - call_close_premium * weight_close) +
    #     (total_call_premium - total_put_premium) +
    #     ((put_sto_premium - call_sto_premium) * weight_sto) 
    # )

    weight_open = 1.2
    weight_close = 1.1
    weight_sto = 1.1

    bullish_score = (
        (call_open_premium + put_sto_premium) * weight_open +
        put_close_premium * weight_close
    )

    bearish_score = (
        (put_open_premium + call_sto_premium) * weight_open +
        call_close_premium * weight_close
    )

    sentiment_score = bullish_score - bearish_score



    scenario = "Neutral"
    details = None
    metrics= None
    score = 0

    if sentiment_score > 0:

        if (
            
            put_close_premium > put_open_premium and # key
            call_open_premium > call_close_premium and
            put_close_premium > call_close_premium + call_sto_premium and 
            call_open_premium + put_sto_premium > put_open_premium and
            call_open_premium + put_sto_premium > call_close_premium + call_sto_premium


            # Original (save for testing)
            # put_close_premium > put_open_premium and
            # put_close_premium > call_close_premium and
            # call_open_premium > call_close_premium + put_open_premium and
            # call_open_premium + put_sto_premium > put_open_premium + call_sto_premium

        ):
            scenario = "Strong Bullish Flow"
            score = 3
            details = {
                "message": (
                    f"Strong Bullish flow is evident as call opening (${call_open_premium:,.2f}) and put selling opening (${put_sto_premium:,.2f}) "
                    f"surpasses net bearish opening flow. Additionally, call opening premium exceeds call closing premium "
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
                    "Call Selling Premium": float(call_sto_premium),
                    "Net Bearish Premium": float(call_close_premium + put_open_premium + call_sto_premium),
                },
                "right": {
                    "Call Opening Premium": float(call_open_premium),
                    "Put Closing Premium": float(put_close_premium),
                    "Put Selling Premium": float(put_sto_premium),
                    "Net Bullish Premium": float(call_open_premium + put_sto_premium),
                }
            }

        elif (
                call_open_premium > call_close_premium and
                put_close_premium > call_close_premium + call_sto_premium and #key
                call_open_premium + put_sto_premium > put_open_premium and
                call_open_premium + put_sto_premium > call_close_premium + call_sto_premium

                # Original (save for testing)
                # call_open_premium > call_close_premium and
                # put_close_premium > call_close_premium and
                # call_open_premium + put_sto_premium > put_open_premium + call_sto_premium 

        ):
            if  call_close_premium > call_open_premium + put_sto_premium:
                scenario = "Bullish Profit-Taking"
                score = 2  
                details = {
                    "message": (
                        f"Flow resembles accumulation but is distorted by profit-taking activity. "
                        f"Call closing premium (${call_close_premium:,.2f}) are more than call opening (${call_open_premium:,.2f}) "
                        f"and put selling (${put_sto_premium:,.2f}) which would have suggested bullish continuation if this wasn't " 
                        f"the case."
                    )
                }
                metrics = {
                    "left_label": "Profit-Taking",
                    "right_label": "Bullish Flow",
                    "left": {
                        "Call Closing Premium": float(call_close_premium),
                        "Put Opening Premium": float(put_open_premium),
                        "Call Selling Premium": float(call_sto_premium),
                        "Net Bearish Premium": float(call_close_premium + put_open_premium + call_sto_premium),
                    },
                    "right": {
                        "Call Opening Premium": float(call_open_premium),
                        "Put Closing Premium": float(put_close_premium),
                        "Put Selling Premium": float(put_sto_premium),
                        "Net Bullish Premium": float(call_open_premium + put_sto_premium),
                    }
                }
            else:
                scenario = "Bullish Accumulation"
                score = 2
                details = {
                    "message": (
                        f"Institutions appear to be accumulating bullish exposure. Call opening premium "
                        f"(${call_open_premium:,.2f}) exceeds call closing (${call_close_premium:,.2f}), "
                        f"and net positioning favors bulls as call buying and put selling "
                        f"(${call_open_premium + put_sto_premium:,.2f}) outweighs bearish flow (${call_close_premium + call_sto_premium:,.2f}). "
                        f"Put closing activity (${put_close_premium:,.2f}) also supports sentiment, suggesting "
                        f"a reduction in bearish conviction. This is a strong accumulation setup."
                    )
                }
                metrics = {
                    "left_label": "Bearish Flow",
                    "right_label": "Bullish Flow",
                    "left": {
                        "Call Closing Premium": float(call_close_premium),
                        "Put Opening Premium": float(put_open_premium),
                        "Call Selling Premium": float(call_sto_premium),
                        "Net Bearish Premium": float(call_close_premium + put_open_premium + call_sto_premium),
                    },
                    "right": {
                        "Call Opening Premium": float(call_open_premium),
                        "Put Closing Premium": float(put_close_premium),
                        "Put Selling Premium": float(put_sto_premium),
                        "Net Bullish Premium": float(call_open_premium + put_sto_premium),
                    }
                }



        elif (
                call_open_premium > call_close_premium and
                call_open_premium + put_sto_premium > put_open_premium and #key
                call_open_premium + put_sto_premium > call_close_premium + call_sto_premium


                # Original (save for testing)
                # call_open_premium > put_open_premium and
                # call_open_premium + put_sto_premium > call_sto_premium + put_open_premium
        ):
            scenario = "Bullish Positioning"
            score = 1
            details = {
                "message": (
                    f"Bullish positioning detected — institutions are opening more calls (${call_open_premium:,.2f}) "
                    f"than they’re closing (${call_close_premium:,.2f}), suggesting fresh upside exposure. "
                    f"Put selling (${put_sto_premium:,.2f}) adds confirmation as traders take on bullish risk. "
                    f"Bearish capital (${put_open_premium:,.2f}) is still present alonng with put closing (${put_close_premium:,.2f}), "
                    f"but net flow (${call_open_premium + put_sto_premium:,.2f}) favors upside continuation. "
                    f"This could be early accumulation and worth monitoring for stronger confirmation."
                )
            }
            metrics = {
                "left_label": "Bearish Flow",
                "right_label": "Bullish Flow",
                "left": {
                    "Call Closing Premium": float(call_close_premium),
                    "Put Opening Premium": float(put_open_premium),
                    "Call Selling Premium": float(call_sto_premium),
                    "Net Bearish Premium": float(call_close_premium + put_open_premium + call_sto_premium),
                },
                "right": {
                    "Call Opening Premium": float(call_open_premium),
                    "Put Closing Premium": float(put_close_premium),
                    "Put Selling Premium": float(put_sto_premium),
                    "Net Bullish Premium": float(call_open_premium + put_sto_premium),
                }
            }

        elif (
            call_close_premium + put_open_premium + call_sto_premium > call_open_premium + put_sto_premium
        ):
            scenario = "Bullish Unwinding & Bearish Positioning"
            score = 0  
            details = {
                "message": (
                    f"Flow is bullish, but is distorted by profit-taking activity. "
                    f"Call closing premium (${call_close_premium:,.2f}) and put opening (${put_open_premium:,.2f}) "
                    f"as well as call selling (${call_sto_premium:,.2f}) exceed new call openings (${call_open_premium:,.2f}) " 
                    f"and put selling (${put_sto_premium:,.2f}) For a combined comparison of bearish flow being " 
                    f"(${call_close_premium + put_open_premium + call_sto_premium:,.2f}) compared to " 
                    f"(${call_open_premium + put_sto_premium:,.2f}) bullish flow suggesting bullish unwinding. "
                    f"Monitor for confirmation — flow may reverse."
                )
            }
            metrics = {
                "left_label": "Bearish Flow",
                "right_label": "Bullish Flow",
                "left": {
                    "Call Closing Premium": float(call_close_premium),
                    "Put Opening Premium": float(put_open_premium),
                    "Call Selling Premium": float(call_sto_premium),
                    "Net Bearish Premium": float(call_close_premium + put_open_premium + call_sto_premium),
                },
                "right": {
                    "Call Opening Premium": float(call_open_premium),
                    "Put Closing Premium": float(put_close_premium),
                    "Put Selling Premium": float(put_sto_premium),
                    "Net Bullish Premium": float(call_open_premium + put_sto_premium),
                }
            }

        else:
            scenario = "Neutral"

    elif sentiment_score < 0:
        if (
            call_close_premium > call_open_premium and #key
            put_open_premium > put_close_premium and
            call_close_premium > put_close_premium + put_sto_premium and             
            put_open_premium + call_sto_premium > call_open_premium and
            put_open_premium + call_sto_premium > put_close_premium + put_sto_premium

        ):
            scenario = "Strong Bearish Flow"
            score = -3
            details = {
                "message": (
                    f"Bearish sentiment is dominant across all flow indicators. The combined put opening (${put_open_premium:,.2f}) "
                    f"and call selling (${call_sto_premium:,.2f}) adds up to surpassing bullish initiation " 
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

            put_open_premium > put_close_premium and
            call_close_premium > put_close_premium + put_sto_premium and #key            
            put_open_premium + call_sto_premium > call_open_premium and
            put_open_premium + call_sto_premium > put_close_premium + put_sto_premium

        ):
            if  put_close_premium > put_open_premium + put_sto_premium:
                scenario = "Bearish Profit-Taking"
                score = 2  
                details = {
                    "message": (
                        f"Flow resembles accumulation but is distorted by profit-taking activity. "
                        f"Put closing premium (${put_close_premium:,.2f}) are more than put opening (${put_open_premium:,.2f}) "
                        f"and put selling (${put_sto_premium:,.2f}) which would have suggested bullish continuation if this wasn't " 
                        f"the case."
                    )
                }
                metrics = {
                    "left_label": "Profit-Taking",
                    "right_label": "Bearish Flow",
                    "left": {
                        "Call Closing Premium": float(call_close_premium),
                        "Put Opening Premium": float(put_open_premium),
                        "Call Selling Premium": float(call_sto_premium),
                        "Net Bearish Premium": float(call_close_premium + put_open_premium + call_sto_premium),
                    },
                    "right": {
                        "Call Opening Premium": float(call_open_premium),
                        "Put Closing Premium": float(put_close_premium),
                        "Put Selling Premium": float(put_sto_premium),
                        "Net Bullish Premium": float(call_open_premium + put_sto_premium),
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
            put_open_premium + call_sto_premium > call_open_premium and #key
            put_open_premium + call_sto_premium > put_close_premium + put_sto_premium
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
                "left_label": "Bearish Flow",
                "right_label": "Bullish Flow",
                "left": {
                    "Call Closing Premium": float(call_close_premium),
                    "Put Opening Premium": float(put_open_premium),
                    "Call Selling Premium": float(call_sto_premium),
                    "Net Bearish Premium": float(call_close_premium + put_open_premium + call_sto_premium),
                },
                "right": {
                    "Call Opening Premium": float(call_open_premium),
                    "Put Closing Premium": float(put_close_premium),
                    "Put Selling Premium": float(put_sto_premium),
                    "Net Bullish Premium": float(call_open_premium + put_sto_premium),
                }
            }

        elif (
            put_close_premium + put_sto_premium + call_open_premium > put_open_premium  + call_sto_premium
        ):
            scenario = "Bearish Unwinding & Bullish Positioning"
            score = 0  
            details = {
                "message": (
                    f"Flow is bearish, but is distorted by profit-taking activity. "
                    f"Put closing premium (${put_close_premium:,.2f}) and call opening (${call_open_premium:,.2f}) "
                    f"as well as put selling (${put_sto_premium:,.2f}) exceed new put openings (${put_open_premium:,.2f}) " 
                    f"and call selling (${call_sto_premium:,.2f}) For a combined comparison of bearish flow being " 
                    f"(${put_open_premium + call_sto_premium:,.2f}) compared to " 
                    f"(${put_close_premium + put_sto_premium + call_open_premium:,.2f}) bullish flow suggesting bearish unwinding "
                    f"and bullish positioning. Monitor for confirmation — flow may reverse."
                )
            }
            metrics = {
                "left_label": "Bearish Flow",
                "right_label": "Bullish Flow",
                "left": {
                    "Call Closing Premium": float(call_close_premium),
                    "Put Opening Premium": float(put_open_premium),
                    "Call Selling Premium": float(call_sto_premium),
                    "Net Bearish Premium": float(call_close_premium + put_open_premium + call_sto_premium),
                },
                "right": {
                    "Call Opening Premium": float(call_open_premium),
                    "Put Closing Premium": float(put_close_premium),
                    "Put Selling Premium": float(put_sto_premium),
                    "Net Bullish Premium": float(call_open_premium + put_sto_premium),
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
# Price Action
#################################################################################################
def price_action(symbol):
    ticker = yf.Ticker(symbol)
    historical_data = ticker.history(period="7d")

    if not historical_data.empty:
        last_trading_session = historical_data.index[-1]  # The most recent available market day
        last_close_price = historical_data["Close"].iloc[-1]  # Closing price of the last session
        last_open_price = historical_data["Open"].iloc[-1]  # Opening price of the last session
        last_high_price = historical_data["High"].iloc[-1]  # High of the last session
        last_low_price = historical_data["Low"].iloc[-1]  # Low of the last session
        last_volume = historical_data["Volume"].iloc[-1]  # Volume of the last session

    last_trading_date = last_trading_session.strftime("%A, %B %d, %Y")
    price_action_report = {
        "date": last_trading_date,
        "close": last_close_price,
        "open": last_open_price,
        "high": last_high_price,
        "low": last_low_price,
        "volume": last_volume
    }

    return price_action_report

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
    # price = price_action(df)

    result = {
        "last_update": {
            "date": last_update_date,
            "time": last_update_time
            },
        "market_sentiment": sentiment_results,
        # "price_action": price,
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


