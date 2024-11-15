from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound
from sqlalchemy import text, desc
from . import models, schema
from .schema import *
from .auth import *
from .models import *


# User
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        fname=user.fname,
        lname=user.lname,
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        phone_number=user.phone_number,
        account_type=user.account_type
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    db.delete(db_user)
    db.commit()
    return db_user


# Cash
def get_cash(db: Session, user_id: int) -> Optional[models.Cash]:
    return db.query(models.Cash).filter(models.Cash.user_id == user_id).first()

def create_cash(db: Session, cash: schema.CashCreate):
    db_cash = models.Cash(
        user_id=cash.user_id,
        entry_date=cash.entry_date,
        initial_cash=cash.initial_cash,
        available_cash=cash.initial_cash, 
        cash_balance=cash.initial_cash 
    )
    db.add(db_cash)
    db.commit()
    db.refresh(db_cash)
    return db_cash

# Rules

def create_rule(db: Session, rule_create: schema.RuleCreate) -> schema.RuleResponse:
    # Create a new Rule instance
    db_rule = models.Rule(
        user_id=rule_create.user_id,
        entry_date=rule_create.entry_date,
        rule=rule_create.rule
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return schema.RuleResponse.from_orm(db_rule)

def get_rules(db: Session, user_id: int) -> List[schema.RuleResponse]:
    # Retrieve all rules for a specific user
    rules = db.query(models.Rule).filter(models.Rule.user_id == user_id).all()
    return [schema.RuleResponse.from_orm(rule) for rule in rules]

def get_rule(db: Session, user_id: int, rule_id: int) -> Optional[schema.RuleResponse]:
    # Retrieve a single rule by user ID and rule ID
    rule = db.query(models.Rule).filter(models.Rule.user_id == user_id, models.Rule.id == rule_id).first()
    return schema.RuleResponse.from_orm(rule) if rule else None

def update_rule(db: Session, user_id: int, rule_id: int, rule_update: schema.RuleUpdate) -> Optional[schema.RuleResponse]:
    # Find the rule to update
    rule = db.query(models.Rule).filter(models.Rule.user_id == user_id, models.Rule.id == rule_id).first()
    if not rule:
        return None

    # Apply updates from the RuleUpdate model
    for key, value in rule_update.dict(exclude_unset=True).items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    return schema.RuleResponse.from_orm(rule)

def delete_rule(db: Session, user_id: int, rule_id: int) -> Optional[schema.RuleResponse]:
    # Find the rule to delete
    rule = db.query(models.Rule).filter(models.Rule.user_id == user_id, models.Rule.id == rule_id).first()
    if not rule:
        return None

    db.delete(rule)
    db.commit()
    return schema.RuleResponse.from_orm(rule)


# Transactions
def create_transaction(db: Session, transaction_create: schema.TransactionCreate) -> schema.TransactionResponse:
    # Create a new Transaction instance
    db_transaction = models.Transaction(
        user_id=transaction_create.user_id,
        transaction_type=transaction_create.transaction_type,
        transaction_date=transaction_create.transaction_date,
        amount=transaction_create.amount,
        transaction_summary=transaction_create.transaction_summary
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    #update Cash records on Transactions
    cash_record = get_cash(db, transaction_create.user_id)
    if not cash_record:
        raise HTTPException(status_code=404, detail="Cash record not found for user")
    
    if transaction_create.transaction_type == models.TransactionType.deposit:
        cash_record.cash_balance += transaction_create.amount
    elif transaction_create.transaction_type == models.TransactionType.withdrawal:
        cash_record.cash_balance -= transaction_create.amount
    elif transaction_create.transaction_type == models.TransactionType.trade:
        cash_record.net_pnl += transaction_create.amount
        cash_record.cash_balance += transaction_create.amount
        
    db.commit()
    db.refresh(cash_record)

    return schema.TransactionResponse.from_orm(db_transaction)

def get_transactions(db: Session, user_id: int) -> List[schema.TransactionResponse]:
    transactions = db.query(models.Transaction).filter(models.Transaction.user_id == user_id).all()
    return [schema.TransactionResponse.from_orm(transaction) for transaction in transactions]

def get_transaction(db: Session, user_id: int, transaction_id: int) -> Optional[schema.TransactionResponse]:
    transaction = db.query(models.Transaction).filter(models.Transaction.user_id == user_id, models.Transaction.id == transaction_id).first()
    return schema.TransactionResponse.from_orm(transaction) if transaction else None

def update_transaction(db: Session, user_id: int, transaction_id: int, transaction_update: schema.TransactionUpdate) -> Optional[schema.TransactionResponse]:
    transaction = db.query(models.Transaction).filter(models.Transaction.user_id == user_id, models.Transaction.id == transaction_id).first()

    if not transaction:
        return None

    for var, value in vars(transaction_update).items():
        if value is not None:
            setattr(transaction, var, value)

    db.commit()
    db.refresh(transaction)
    return schema.TransactionResponse.from_orm(transaction)

def delete_transaction(db: Session, user_id: int, transaction_id: int) -> Optional[schema.TransactionResponse]:
    transaction = db.query(models.Transaction).filter(models.Transaction.user_id == user_id, models.Transaction.id == transaction_id).first()

    if not transaction:
        return None

    db.delete(transaction)
    db.commit()
    return schema.TransactionResponse.from_orm(transaction)

# Watchlist
def get_watchlist(db: Session, user_id: int, watchlist_id: int):
    return db.query(models.Watchlist).filter(
        models.Watchlist.id == watchlist_id,
        models.Watchlist.user_id == user_id
    ).first()

def get_watchlists(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Watchlist)
        .filter(models.Watchlist.user_id == user_id)
        .order_by(desc(models.Watchlist.id)) 
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_watchlist(db: Session, watchlist: schema.WatchlistCreate):
    db_watchlist = models.Watchlist(
        user_id=watchlist.user_id,
        symbol=watchlist.symbol,
        price=watchlist.price,
        target_price=watchlist.target_price,
        target_hit=watchlist.target_hit,
        exp_date=watchlist.exp_date,
        entry_date=watchlist.entry_date,
        plan=watchlist.plan
    )
    db.add(db_watchlist)
    db.commit()
    db.refresh(db_watchlist)
    return db_watchlist


def update_watchlist(db: Session, user_id: int, watchlist_id: int, watchlist: schema.WatchlistUpdate):
    db_watchlist = get_watchlist(db, user_id, watchlist_id)
    if not db_watchlist:
        return None

    for key, value in watchlist.dict(exclude_unset=True).items():
        setattr(db_watchlist, key, value)

    db.commit()
    db.refresh(db_watchlist)
    return db_watchlist

def delete_watchlist(db: Session, user_id: int, watchlist_id: int):
    db_watchlist = get_watchlist(db, user_id, watchlist_id)
    if not db_watchlist:
        return None

    db.delete(db_watchlist)
    db.commit()
    return db_watchlist

# Trades
def create_trade(db: Session, trade_create: TradeCreate, user_id: int) -> TradeResponse:
    principal = trade_create.entry_price * trade_create.contracts
    net = trade_create.exit_price * trade_create.contracts
    profit_loss = net - principal
    roi = (profit_loss / principal) if principal else 0

    # Create a new Trade instance
    db_trade = models.Trade(
        user_id=user_id,
        symbol=trade_create.symbol,
        option_type=trade_create.option_type,
        strike_price=trade_create.strike_price,
        exp_date=trade_create.exp_date,
        entry_price=trade_create.entry_price,
        exit_price=trade_create.exit_price,
        contracts=trade_create.contracts,
        entry_date=trade_create.entry_date,
        close_date=trade_create.close_date,
        principal=principal,
        net=net,
        profit_loss=profit_loss,
        roi=roi
    )

    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)

    return TradeResponse.from_orm(db_trade)

def get_trades(db: Session, user_id: int) -> List[schema.TradeResponse]:
    """Retrieve all trades for a specific user, sorted by most recent close date."""
    trades = db.query(models.Trade).filter(models.Trade.user_id == user_id).order_by(desc(models.Trade.close_date)).all()
    return [schema.TradeResponse.from_orm(trade) for trade in trades]


def get_trade(db: Session, user_id: int, trade_id: int) -> Optional[TradeResponse]:
    trade = db.query(models.Trade).filter(models.Trade.user_id == user_id, models.Trade.id == trade_id).first()
    return TradeResponse.from_orm(trade) if trade else None

def update_trade(db: Session, user_id: int, trade_id: int, trade_update: TradeUpdate) -> Optional[TradeResponse]:
    trade = db.query(models.Trade).filter(models.Trade.user_id == user_id, models.Trade.id == trade_id).first()

    if not trade:
        return None

    for var, value in vars(trade_update).items():
        if value is not None:
            setattr(trade, var, value)

    if trade_update.exit_price is not None or trade_update.close_date is not None:
        total_cost = trade.entry_price * trade.contracts 
        total_revenue = (trade_update.exit_price or trade.exit_price) * trade.contracts

        trade.net = total_revenue - total_cost
        trade.profit_loss = trade.net
        trade.roi = (trade.profit_loss / total_cost) if total_cost else 0

    db.commit()
    db.refresh(trade)
    return TradeResponse.from_orm(trade)

def delete_trade(db: Session, user_id: int, trade_id: int) -> Optional[TradeResponse]:
    trade = db.query(models.Trade).filter(models.Trade.user_id == user_id, models.Trade.id == trade_id).first()

    if not trade:
        return None

    db.delete(trade)
    db.commit()
    return TradeResponse.from_orm(trade)


# DailyPNL
def create_daily_pnl(db: Session, daily_pnl: schema.DailyPNLCreate) -> schema.DailyPNLResponse:
    balance = daily_pnl.close_cash - daily_pnl.open_cash if daily_pnl.close_cash else Decimal(0)
    roi = (balance / daily_pnl.open_cash * 100) if daily_pnl.open_cash != Decimal(0) else Decimal(0)
    
    db_daily_pnl = models.DailyPNL(
        user_id=daily_pnl.user_id,
        entry_date=daily_pnl.entry_date,
        open_cash=daily_pnl.open_cash,
        close_cash=daily_pnl.close_cash,
        balance=balance,
        roi=roi
    )
    
    db.add(db_daily_pnl)
    db.commit()
    db.refresh(db_daily_pnl)
    
    return schema.DailyPNLResponse.from_orm(db_daily_pnl)

def get_daily_pnls(db: Session, user_id: int) -> list[schema.DailyPNLResponse]:
    daily_pnls = db.query(models.DailyPNL).filter(models.DailyPNL.user_id == user_id).order_by(desc(models.DailyPNL.entry_date)).all()
    return [schema.DailyPNLResponse.from_orm(pnl) for pnl in daily_pnls]

def update_daily_pnl(db: Session, pnl_id: int, daily_pnl_update: schema.DailyPNLUpdate) -> schema.DailyPNLResponse:
    db_daily_pnl = db.query(models.DailyPNL).filter(models.DailyPNL.id == pnl_id).first()
    
    if db_daily_pnl is None:
        raise ValueError("Daily PNL entry not found")

    if daily_pnl_update.entry_date is not None:
        db_daily_pnl.entry_date = daily_pnl_update.entry_date
    if daily_pnl_update.open_cash is not None:
        db_daily_pnl.open_cash = daily_pnl_update.open_cash
    if daily_pnl_update.close_cash is not None:
        db_daily_pnl.close_cash = daily_pnl_update.close_cash

    db_daily_pnl.balance = db_daily_pnl.close_cash - db_daily_pnl.open_cash if db_daily_pnl.close_cash else Decimal(0)
    db_daily_pnl.roi = (db_daily_pnl.balance / db_daily_pnl.open_cash * 100) if db_daily_pnl.open_cash != Decimal(0) else Decimal(0)

    db.commit()
    db.refresh(db_daily_pnl)
    
    return schema.DailyPNLResponse.from_orm(db_daily_pnl)

def delete_daily_pnl(db: Session, pnl_id: int) -> bool:
    db_daily_pnl = db.query(models.DailyPNL).filter(models.DailyPNL.id == pnl_id).first()
    
    if db_daily_pnl is None:
        return False

    db.delete(db_daily_pnl)
    db.commit()
    
    return True

# Misc
def create_misc(db: Session, misc: MiscCreate, user_id: int):
    db_misc = Misc(
        user_id=user_id,
        category=misc.category,
        entry_date=misc.entry_date,
        description=misc.description
    )
    db.add(db_misc)
    db.commit()
    db.refresh(db_misc)
    return db_misc

def get_misc_entries(db: Session, user_id: int) -> List[Misc]:
    return db.query(Misc).filter(Misc.user_id == user_id).all()

def get_misc_by_id(db: Session, misc_id: int, user_id: int) -> Optional[Misc]:
    return db.query(Misc).filter(Misc.id == misc_id, Misc.user_id == user_id).first()

def update_misc(db: Session, misc_id: int, misc: MiscUpdate, user_id: int) -> Optional[Misc]:
    db_misc = get_misc_by_id(db, misc_id, user_id)
    if db_misc:
        db_misc.category = misc.category
        db_misc.entry_date = misc.entry_date
        db_misc.description = misc.description
        db.commit()
        db.refresh(db_misc)
    return db_misc

def delete_misc(db: Session, misc_id: int, user_id: int) -> bool:
    db_misc = get_misc_by_id(db, misc_id, user_id)
    if db_misc:
        db.delete(db_misc)
        db.commit()
        return True
    return False


# Financial

def get_latest_financial(db: Session, user_id: int):
    return db.query(models.Financial).filter(models.Financial.user_id == user_id).order_by(desc(models.Financial.entry_date)).first()


def create_financial(db: Session, financial: schema.FinancialCreate) -> schema.FinancialResponse:
    entry_date = datetime.fromisoformat(financial.entry_date) if isinstance(financial.entry_date, str) else financial.entry_date

    account_sum = sum([financial.NEC, financial.FFA, financial.PLAY, financial.LTSS, financial.GIVE])

    calculated_networth = account_sum

    last_entry = get_latest_financial(db, financial.user_id)
    if last_entry:
        previous_networth = last_entry.networth
        calculated_expenses = calculated_networth - previous_networth 
    else:
        calculated_expenses = financial.income - account_sum

    db_financial = models.Financial(
        user_id=financial.user_id,
        entry_date=entry_date,
        income=financial.income,
        expenses=calculated_expenses,
        NEC=financial.NEC,
        FFA=financial.FFA,
        PLAY=financial.PLAY,
        LTSS=financial.LTSS,
        GIVE=financial.GIVE,
        networth=calculated_networth,
        comments=financial.comments
    )
    db.add(db_financial)
    db.commit()
    db.refresh(db_financial)
    return schema.FinancialResponse.from_orm(db_financial)

def get_financials(db: Session, user_id: int) -> List[schema.FinancialResponse]:
    financials = db.query(models.Financial).filter(models.Financial.user_id == user_id).order_by(desc(models.Financial.entry_date)).all()
    return [schema.FinancialResponse.from_orm(financial) for financial in financials]

def get_financial(db: Session, user_id: int, financial_id: int) -> Optional[schema.FinancialResponse]:
    financial = db.query(models.Financial).filter(models.Financial.user_id == user_id, models.Financial.id == financial_id).first()
    return schema.FinancialResponse.from_orm(financial) if financial else None

def update_financial(db: Session, user_id: int, financial_id: int, financial_update: schema.FinancialUpdate) -> Optional[schema.FinancialResponse]:
    financial = db.query(models.Financial).filter(models.Financial.user_id == user_id, models.Financial.id == financial_id).first()
    if not financial:
        return None

    for key, value in financial_update.dict(exclude_unset=True).items():
        setattr(financial, key, value)

    db.commit()
    db.refresh(financial)
    return schema.FinancialResponse.from_orm(financial)

def delete_financial(db: Session, user_id: int, financial_id: int) -> Optional[schema.FinancialResponse]:
    financial = db.query(models.Financial).filter(models.Financial.user_id == user_id, models.Financial.id == financial_id).first()
    if not financial:
        return None

    db.delete(financial)
    db.commit()
    return schema.FinancialResponse.from_orm(financial)