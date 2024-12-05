# main.py
import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware

# Import CRUD functions and schema definitions
from database.auth import router as auth_router
from database.database import get_db_connection
from database.schema import *
from database.models import *
from database.crud import *
from database import crud, analysis

app = FastAPI()

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001","http://54.158.155.144:8000","http://54.158.155.144", "http://174.129.175.116:3000" ],  
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include authentication router
app.include_router(auth_router, prefix="/auth")

# Dependency to get the database session
def get_db():
    db = next(get_db_connection())
    try:
        yield db
    finally:
        db.close()

# Root

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Trading App API!"}

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

# Financial Endpoints

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