# main.py
import pandas as pd
import math
from fastapi import FastAPI, Depends, Query, HTTPException, File, UploadFile, Depends
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from database.auth import router as auth_router
from database.database import get_db_connection
from database.analysis import analyze_option_flow
from database.schema import *
from database.models import *
from database.crud import *
from database import crud
import yfinance as yf
from functools import lru_cache



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://54.209.237.174:3000" ],  # this needs to be private.
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")

def get_db():
    db = next(get_db_connection())
    try:
        yield db
    finally:
        db.close()

def sanitize(val):
    if isinstance(val, (pd.DataFrame, pd.Series)):
        val = val.iloc[-1] 
        if isinstance(val, pd.Series): 
            val = val.iloc[-1]
    try:
        return round(float(val), 2) if pd.notna(val) and not math.isinf(val) else None
    except:
        return None

@lru_cache(maxsize=256)
def price_action(symbol: str, offset: int = 0):

    ticker = yf.Ticker(symbol)
    historical_data = ticker.history(period="7d")

    if historical_data.empty or len(historical_data) <= offset:
        return None

    row = historical_data.iloc[-1 - offset]
    date_str = row.name.strftime("%A, %B %d, %Y")
    percent_change = ((row["Close"] - row["Open"]) / row["Open"]) * 100

    return {
        "date": date_str,  
        "close": round(row["Close"], 2),
        "open": round(row["Open"], 2),
        "high": round(row["High"], 2),
        "low": round(row["Low"], 2),
        "volume": int(row["Volume"]),
        "percent_change": round(percent_change, 2)
    }


@lru_cache(maxsize=256)
def get_indicators(symbol: str, interval: str = "1d", period: str = "10d", day_offset: int = 0):
    try:
        data = yf.download(tickers=symbol, interval=interval, period="30d", progress=False)

        if data.empty or len(data) < (day_offset + 2):
            return None

        idx = -1 - day_offset  

        delta = data["Close"].diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.rolling(14).mean()
        avg_loss = loss.rolling(14).mean()
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))

        ema12 = data["Close"].ewm(span=12, adjust=False).mean()
        ema26 = data["Close"].ewm(span=26, adjust=False).mean()
        macd = ema12 - ema26

        typical_price = (data["High"] + data["Low"] + data["Close"]) / 3
        money_flow = typical_price * data["Volume"]
        pos_flow = money_flow.where(typical_price.diff() > 0, 0)
        neg_flow = money_flow.where(typical_price.diff() < 0, 0)
        mfi_ratio = pos_flow.rolling(14).sum() / neg_flow.rolling(14).sum()
        mfi = 100 - (100 / (1 + mfi_ratio))

        ma_5 = data["Close"].rolling(5).mean()
        ma_9 = data["Close"].rolling(9).mean()

        return {
            "mfi": sanitize(mfi.iloc[idx]),
            "ma_5": sanitize(ma_5.iloc[idx]),
            "ma_9": sanitize(ma_9.iloc[idx]),
        }


    except Exception as e:
        print("Indicator Error:", e)
        return None

def build_block(analysis, indicators, price_info):
    sentiment = analysis.get("market_sentiment", {})
    return {
        "scenario": sentiment.get("scenario"),
        "score": sentiment.get("score"),
        # "last_update": analysis.get("last_update", {}),
        "indicators": indicators or {
            "mfi": None, "ma_5": None, "ma_9": None
        },
        "price_action": price_info or {
            "date": None, "close": None, "open": None, "high": None, "low": None, "volume": None
        }
    }

# Root
@app.get("/")
async def read_root():
    return {"message": "Welcome to the Trading App API!"}

####################################################################
# Trading Tracker App
####################################################################

# Users Endpoints
@app.get("/users/", response_model=List[UserResponse])
async def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve a list of all users."""
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@app.get("/users/{user_id}", response_model=UserResponse)
async def read_user(user_id: int, db: Session = Depends(get_db)):
    """Retrieve a user by ID."""
    user = crud.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user: UserResponse, db: Session = Depends(get_db)):
    """Update user information."""
    updated_user = crud.update_user(db, user_id, user)
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@app.delete("/users/{user_id}", response_model=UserResponse)
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user by ID."""
    deleted_user = crud.delete_user(db, user_id)
    if deleted_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return deleted_user

# Cash Endpoints
@app.post("/cash/", response_model=schema.CashResponse)
async def create_cash(cash: schema.CashCreate, db: Session = Depends(get_db)):
    db_cash = crud.create_cash(db, cash)
    return db_cash

@app.get("/cash/{user_id}", response_model=schema.CashResponse)
async def read_cash(user_id: int, db: Session = Depends(get_db)):
    cash = crud.get_cash(db, user_id)
    if cash is None:
        raise HTTPException(status_code=404, detail="Cash record not found")
    return cash

# Rules Endpoints
@app.post("/rules/", response_model=schema.RuleResponse)
async def create_rule(rule: schema.RuleCreate, db: Session = Depends(get_db)):
    """Create a new rule for a user."""
    db_rule = crud.create_rule(db, rule_create=rule)
    return db_rule

@app.get("/rules/", response_model=List[schema.RuleResponse])
async def read_rules(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all rules for a specific user."""
    rules = crud.get_rules(db, user_id=user_id)
    return rules

@app.get("/rules/{rule_id}", response_model=schema.RuleResponse)
async def read_rule(user_id: int, rule_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific rule by ID for the specified user."""
    rule = crud.get_rule(db, user_id=user_id, rule_id=rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@app.put("/rules/{rule_id}", response_model=schema.RuleResponse)
async def update_rule(user_id: int, rule_id: int, rule_update: schema.RuleUpdate, db: Session = Depends(get_db)):
    """Update an existing rule for a specific user."""
    updated_rule = crud.update_rule(db, user_id=user_id, rule_id=rule_id, rule_update=rule_update)
    if updated_rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    return updated_rule

@app.delete("/rules/{rule_id}", response_model=schema.RuleResponse)
async def delete_rule(user_id: int, rule_id: int, db: Session = Depends(get_db)):
    """Delete a rule by ID for the specified user."""
    deleted_rule = crud.delete_rule(db, user_id=user_id, rule_id=rule_id)
    if deleted_rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    return deleted_rule


# Trades Endpoints
@app.get("/trades/", response_model=List[TradeResponse])
async def read_trades(user_id: int, db: Session = Depends(get_db)):
    trades = crud.get_trades(db, user_id=user_id)
    return trades

@app.get("/trades/{trade_id}", response_model=TradeResponse)
async def read_trade(user_id: int, trade_id: int, db: Session = Depends(get_db)):
    trade = crud.get_trade(db, user_id=user_id, trade_id=trade_id)
    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade

@app.post("/trades/", response_model=TradeResponse)
async def create_trade(trade: TradeCreate, user_id: int, db: Session = Depends(get_db)):
    db_trade = crud.create_trade(db, trade, user_id=user_id)
    return db_trade

@app.put("/trades/{trade_id}", response_model=TradeResponse)
async def update_trade(user_id: int, trade_id: int, trade: TradeUpdate, db: Session = Depends(get_db)):
    updated_trade = crud.update_trade(db, user_id=user_id, trade_id=trade_id, trade_update=trade)
    if updated_trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    return updated_trade

@app.delete("/trades/{trade_id}", response_model=TradeResponse)
async def delete_trade(user_id: int, trade_id: int, db: Session = Depends(get_db)):
    deleted_trade = crud.delete_trade(db, user_id=user_id, trade_id=trade_id)
    if deleted_trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    return deleted_trade

# Watchlist Endpoints
@app.get("/watchlists/", response_model=List[schema.WatchlistResponse])
async def read_watchlists(
    user_id: int,
    db: Session = Depends(get_db)
):
    watchlists = crud.get_watchlists(db, user_id=user_id)
    return watchlists

@app.get("/watchlists/setups")
def get_watchlist_setups(
    user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):

    SIGNAL_SCENARIOS = {
        "Strong Bullish Flow",
        "Bullish Accumulation",
        "Bullish Positioning",
        "Bearish Positioning",
        "Bearish Accumulation",
        "Strong Bearish Flow"
    }

    results = []
    seen_symbols = set()
    cutoff_date = datetime.utcnow().date() - timedelta(days=14)
    watchlist = crud.get_watchlists(db, user_id=user_id)

    for item in watchlist:
        symbol = item.symbol.upper()
        if symbol in seen_symbols:
            continue

        try:
            data = analyze_option_flow(db, symbol=symbol, date_range=3)
            sentiment = data.get("market_sentiment", {})
            scenario = sentiment.get("scenario")
            score = sentiment.get("score")
            last_update = data.get("last_update")

            last_update_date = None
            if isinstance(last_update, str):
                last_update_date = datetime.strptime(last_update, "%Y-%m-%d").date()
            elif isinstance(last_update, dict) and "date" in last_update:
                last_update_date = datetime.strptime(last_update["date"], "%Y-%m-%d").date()
            elif isinstance(last_update, datetime):
                last_update_date = last_update.date()

            if not scenario or scenario not in SIGNAL_SCENARIOS:
                continue
            if last_update_date and last_update_date < cutoff_date:
                continue

            results.append({
                "symbol": symbol,
                "scenario": scenario,
                "score": score,
                "last_update": last_update_date.isoformat() if last_update_date else None
            })

            seen_symbols.add(symbol)

        except Exception as e:
            print(f"[Setup Detection Error] {symbol}: {e}")
            continue

        results = sorted(results, key=lambda r: abs(r["score"] or 0), reverse=True)
        # results = sorted(results, key=lambda r: r["last_update"], reverse=True) 

    return results[:limit]



@app.get("/watchlists/{watchlist_id}", response_model=schema.WatchlistResponse)
async def read_watchlist(
    user_id: int,
    watchlist_id: int,
    db: Session = Depends(get_db)
):
    watchlist = crud.get_watchlist(db, user_id=user_id, watchlist_id=watchlist_id)
    if watchlist is None:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return watchlist

@app.post("/watchlists/", response_model=schema.WatchlistResponse)
async def create_watchlist(
    user_id: int,
    watchlist: schema.WatchlistCreate,
    db: Session = Depends(get_db)
):
    watchlist.user_id = user_id
    db_watchlist = crud.create_watchlist(db, watchlist=watchlist)
    return db_watchlist

@app.put("/watchlists/{watchlist_id}", response_model=schema.WatchlistResponse)
async def update_watchlist(
    user_id: int,
    watchlist_id: int,
    watchlist: schema.WatchlistUpdate,
    db: Session = Depends(get_db)
):
    updated_watchlist = crud.update_watchlist(db, user_id=user_id, watchlist_id=watchlist_id, watchlist=watchlist)
    if updated_watchlist is None:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return updated_watchlist

@app.delete("/watchlists/{watchlist_id}", response_model=schema.WatchlistResponse)
async def delete_watchlist(
    user_id: int,
    watchlist_id: int,
    db: Session = Depends(get_db)
):
    """Delete a watchlist by ID for the specified user."""
    deleted_watchlist = crud.delete_watchlist(db, user_id=user_id, watchlist_id=watchlist_id)
    if deleted_watchlist is None:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return deleted_watchlist

# Transactions Endpoints
@app.post("/transactions/", response_model=schema.TransactionResponse)
def create_transaction(transaction: schema.TransactionCreate, db: Session = Depends(get_db)):
    return crud.create_transaction(db, transaction)

@app.get("/transactions/", response_model=List[schema.TransactionResponse])
def read_transactions(user_id: int, db: Session = Depends(get_db)):
    return crud.get_transactions(db, user_id)

@app.get("/transactions/{transaction_id}", response_model=Optional[schema.TransactionResponse])
def read_transaction(user_id: int, transaction_id: int, db: Session = Depends(get_db)):
    transaction = crud.get_transaction(db, user_id, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@app.put("/transactions/{transaction_id}", response_model=Optional[schema.TransactionResponse])
def update_transaction(user_id: int, transaction_id: int, transaction_update: schema.TransactionUpdate, db: Session = Depends(get_db)):
    transaction = crud.update_transaction(db, user_id, transaction_id, transaction_update)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@app.delete("/transactions/{transaction_id}", response_model=Optional[schema.TransactionResponse])
def delete_transaction(user_id: int, transaction_id: int, db: Session = Depends(get_db)):
    transaction = crud.delete_transaction(db, user_id, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


# DailyPNL Endpoints

@app.post("/dailypnls/", response_model=schema.DailyPNLResponse)
async def create_daily_pnl(daily_pnl: schema.DailyPNLCreate, db: Session = Depends(get_db)):
    """Create a new daily PNL entry."""
    return crud.create_daily_pnl(db, daily_pnl)

@app.get("/dailypnls/", response_model=List[schema.DailyPNLResponse])
async def read_daily_pnls(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all daily PNL entries for a specific user."""
    return crud.get_daily_pnls(db, user_id=user_id)

@app.get("/dailypnls/{pnl_id}", response_model=Optional[schema.DailyPNLResponse])
async def read_daily_pnl(pnl_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific daily PNL entry by ID."""
    pnl = db.query(models.DailyPNL).filter(models.DailyPNL.id == pnl_id).first()
    if pnl is None:
        raise HTTPException(status_code=404, detail="Daily PNL entry not found")
    return schema.DailyPNLResponse.from_orm(pnl)

@app.put("/dailypnls/{pnl_id}", response_model=schema.DailyPNLResponse)
async def update_daily_pnl(pnl_id: int, daily_pnl_update: schema.DailyPNLUpdate, db: Session = Depends(get_db)):
    """Update an existing daily PNL entry."""
    updated_pnl = crud.update_daily_pnl(db, pnl_id, daily_pnl_update)
    if updated_pnl is None:
        raise HTTPException(status_code=404, detail="Daily PNL entry not found")
    return updated_pnl

@app.delete("/dailypnls/{pnl_id}", response_model=Optional[schema.DailyPNLResponse])
async def delete_daily_pnl(pnl_id: int, db: Session = Depends(get_db)):
    """Delete a daily PNL entry by ID."""
    success = crud.delete_daily_pnl(db, pnl_id)
    if not success:
        raise HTTPException(status_code=404, detail="Daily PNL entry not found")
    return {"detail": "Daily PNL entry deleted"}

# Misc Endpoints
@app.post("/misc/", response_model=schema.MiscResponse)
async def create_misc_entry(misc: schema.MiscCreate, user_id: int, db: Session = Depends(get_db)):
    """Create a new misc entry."""
    db_misc = crud.create_misc(db, misc, user_id=user_id)
    return db_misc

@app.get("/misc/", response_model=List[schema.MiscResponse])
async def read_misc_entries(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all misc entries for a specific user."""
    misc_entries = crud.get_misc_entries(db, user_id=user_id)
    return misc_entries

@app.get("/misc/{misc_id}", response_model=schema.MiscResponse)
async def read_misc_entry(misc_id: int, user_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific misc entry by ID."""
    misc_entry = crud.get_misc_by_id(db, misc_id=misc_id, user_id=user_id)
    if misc_entry is None:
        raise HTTPException(status_code=404, detail="Misc entry not found")
    return misc_entry

@app.put("/misc/{misc_id}", response_model=schema.MiscResponse)
async def update_misc_entry(misc_id: int, user_id: int, misc: schema.MiscUpdate, db: Session = Depends(get_db)):
    """Update an existing misc entry."""
    updated_misc = crud.update_misc(db, misc_id=misc_id, misc=misc, user_id=user_id)
    if updated_misc is None:
        raise HTTPException(status_code=404, detail="Misc entry not found")
    return updated_misc

@app.delete("/misc/{misc_id}", response_model=Optional[schema.MiscResponse])
async def delete_misc_entry(misc_id: int, user_id: int, db: Session = Depends(get_db)):
    """Delete a misc entry by ID."""
    success = crud.delete_misc(db, misc_id=misc_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Misc entry not found")
    return {"detail": "Misc entry deleted"}

####################################################################
# Networth Endpoints
####################################################################

@app.post("/financials/", response_model=schema.FinancialResponse)
async def create_financial(financial: schema.FinancialCreate, db: Session = Depends(get_db)):
    """Create a new financial entry for a user."""
    db_financial = crud.create_financial(db, financial)
    return db_financial

@app.get("/financials/", response_model=List[schema.FinancialResponse])
async def read_financials(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all financial entries for a specific user."""
    financials = crud.get_financials(db, user_id=user_id)
    return financials

@app.get("/financials/{financial_id}", response_model=schema.FinancialResponse)
async def read_financial(user_id: int, financial_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific financial entry by ID for the specified user."""
    financial = crud.get_financial(db, user_id=user_id, financial_id=financial_id)
    if financial is None:
        raise HTTPException(status_code=404, detail="Financial entry not found")
    return financial

@app.put("/financials/{financial_id}", response_model=schema.FinancialResponse)
async def update_financial(user_id: int, financial_id: int, financial_update: schema.FinancialUpdate, db: Session = Depends(get_db)):
    """Update an existing financial entry for a specific user."""
    updated_financial = crud.update_financial(db, user_id=user_id, financial_id=financial_id, financial_update=financial_update)
    if updated_financial is None:
        raise HTTPException(status_code=404, detail="Financial entry not found")
    return updated_financial

@app.delete("/financials/{financial_id}", response_model=schema.FinancialResponse)
async def delete_financial(user_id: int, financial_id: int, db: Session = Depends(get_db)):
    """Delete a financial entry by ID for the specified user."""
    deleted_financial = crud.delete_financial(db, user_id=user_id, financial_id=financial_id)
    if deleted_financial is None:
        raise HTTPException(status_code=404, detail="Financial entry not found")
    return deleted_financial

####################################################################
# Flow Endpoints
####################################################################

# Upload option flow
@app.post("/upload-option-flow/")
async def upload_option_flow(file: UploadFile = File(...), db: Session = Depends(get_db_connection)):
    contents = await file.read()  
    response = process_option_flow_csv(contents, db) 
    return response

# Option Flow Analysis 
@app.get("/analysis/")
async def get_option_flow_analysis(
    symbol: str = Query(None, description="Stock symbol (e.g., AAPL, MSFT)"),
    date_range: int = Query(30, description="Number of days to look back"),
    db: Session = Depends(get_db_connection),
):    
    results = analyze_option_flow(db, symbol, date_range)
    if "message" in results:
        raise HTTPException(status_code=404, detail=results["message"])
    return results



@app.get("/watchlists/{symbol}/analysis")
async def get_watchlist_analysis(symbol: str, db: Session = Depends(get_db)):
    try:
        analysis_2d = analyze_option_flow(db, symbol=symbol, date_range=2)
        analysis_1d = analyze_option_flow(db, symbol=symbol, date_range=1)
        analysis_live = analyze_option_flow(db, symbol=symbol, date_range=0)

        indicators_2d = get_indicators(symbol, day_offset=2)
        indicators_1d = get_indicators(symbol, day_offset=1)
        indicators_live = get_indicators(symbol, day_offset=0)

        price_2d = price_action(symbol, offset=2)
        price_1d = price_action(symbol, offset=1)
        price_live = price_action(symbol, offset=0)

        result = {
            "symbol": symbol.upper(),
            "2D": build_block(analysis_2d, indicators_2d, price_2d),
            "1D": build_block(analysis_1d, indicators_1d, price_1d),
            "Live": build_block(analysis_live, indicators_live, price_live)
        }

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/clear-cache/")
def clear_cache(symbol: str):
    price_action.cache_clear()
    get_indicators.cache_clear()
    return {"message": f"Cache cleared for {symbol}"}

