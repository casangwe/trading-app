# schema.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import date, datetime
from decimal import Decimal

# Account Type Enum
class AccountType(str, Enum):
    personal = 'personal'
    business = 'business'

# Users
class UserCreate(BaseModel):
    fname: str
    lname: str
    username: str
    email: EmailStr
    password: str
    phone_number: Optional[str]
    account_type: AccountType

class UserUpdate(BaseModel):
    fname: Optional[str]
    lname: Optional[str]
    username: Optional[str]
    email: Optional[EmailStr]
    password: Optional[str]
    phone_number: Optional[str]
    account_type: Optional[AccountType]

class UserResponse(BaseModel):
    id: int
    fname: str
    lname: str
    username: str
    email: str
    phone_number: Optional[str]
    account_type: AccountType

    class Config:
        orm_mode = True

# Cash

class CashCreate(BaseModel):
    user_id: int
    entry_date: date
    initial_cash: Decimal

class CashUpdate(BaseModel):
    entry_date: Optional[date] = None
    initial_cash: Optional[Decimal] = None
    available_cash: Optional[Decimal] = None
    net_pnl: Optional[Decimal] = None
    cash_balance: Optional[Decimal] = None

class CashResponse(BaseModel):
    id: int
    user_id: int
    entry_date: date
    initial_cash: Decimal
    available_cash: Decimal
    net_pnl: Decimal
    cash_balance: Decimal

    class Config:
        orm_mode = True

# Transactions
class TransactionType(str, Enum):
    deposit = 'deposit'
    withdrawal = 'withdrawal'
    trade = 'trade'

class TransactionCreate(BaseModel):
    user_id: int
    transaction_type: TransactionType
    transaction_date: date
    amount: float
    transaction_summary: Optional[str] = None

class TransactionUpdate(BaseModel):
    transaction_type: Optional[TransactionType]
    transaction_date: Optional[date]
    amount: Optional[float]
    transaction_summary: Optional[str]

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    transaction_type: TransactionType
    transaction_date: date
    amount: float
    transaction_summary: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True

# Rules

class RuleCreate(BaseModel):
    user_id: int
    entry_date: date
    rule: Optional[str] = None

class RuleUpdate(BaseModel):
    entry_date: Optional[date] = None
    rule: Optional[str] = None

class RuleResponse(BaseModel):
    id: int
    user_id: int
    entry_date: date
    rule: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True


# Watchlist
class WatchlistBase(BaseModel):
    symbol: str
    price: float
    target_price: Optional[float] = None
    target_hit: bool = False
    exp_date: Optional[date] = None
    entry_date: date  
    plan: Optional[str] = None  

class WatchlistCreate(WatchlistBase):
    user_id: int

class WatchlistUpdate(BaseModel):
    symbol: Optional[str] = None
    price: Optional[float] = None
    target_price: Optional[float] = None
    target_hit: Optional[bool] = None
    exp_date: Optional[date] = None
    entry_date: Optional[date] = None 
    plan: Optional[str] = None  

class WatchlistResponse(WatchlistBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

# Trades
class OptionType(str, Enum):
    CALL = "CALL"
    PUT = "PUT"

class TradeBase(BaseModel):
    symbol: str
    option_type: OptionType
    strike_price: Decimal
    exp_date: date
    entry_price: Decimal
    exit_price: Optional[Decimal] = None
    contracts: int
    entry_date: date
    close_date: Optional[date] = None


class TradeCreate(TradeBase):
    user_id: int

class TradeUpdate(BaseModel):
    symbol: Optional[str]
    option_type: Optional[OptionType]
    strike_price: Optional[Decimal]
    exp_date: Optional[date]
    entry_price: Optional[Decimal]
    exit_price: Optional[Decimal]
    contracts: Optional[int]
    entry_date: Optional[date]
    close_date: Optional[date]


class TradeResponse(TradeBase):
    id: int
    user_id: int
    symbol: str
    option_type: OptionType
    strike_price: Decimal
    exp_date: date
    entry_price: Decimal
    exit_price: Optional[Decimal] = None
    contracts: int
    entry_date: date
    close_date: Optional[date] = None
    principal: Optional[Decimal]
    net: Optional[Decimal]
    profit_loss: Optional[Decimal]
    roi: Optional[Decimal]

    class Config:
        orm_mode = True
        from_attributes = True

# DailyPNL
class DailyPNLCreate(BaseModel):
    user_id: int
    entry_date: date
    open_cash: Decimal
    close_cash: Optional[Decimal] = None

class DailyPNLUpdate(BaseModel):
    entry_date: Optional[date] = None
    open_cash: Optional[Decimal] = None
    close_cash: Optional[Decimal] = None
    balance: Optional[Decimal] = None
    roi: Optional[Decimal] = None

class DailyPNLResponse(BaseModel):
    id: int
    user_id: int
    entry_date: date
    open_cash: Decimal
    close_cash: Optional[Decimal] = None
    balance: Optional[Decimal] = None
    roi: Optional[Decimal] = None

    class Config:
        orm_mode = True
        from_attributes = True


# Misc
class MiscCategory(str, Enum):
    plan = 'plan'
    summary = 'summary'
    metrics = 'metrics'
    rules = 'rules'

class MiscCreate(BaseModel):
    user_id: int
    category: MiscCategory
    entry_date: date
    description: Optional[str] = None

class MiscUpdate(BaseModel):
    category: Optional[MiscCategory] = None
    entry_date: Optional[date] = None
    description: Optional[str] = None

class MiscResponse(BaseModel):
    id: int
    user_id: int
    category: MiscCategory
    entry_date: date
    description: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True
        

# Financials 
class FinancialCreate(BaseModel):
    user_id: int
    entry_date: date 
    income: Decimal
    expenses: Optional[Decimal] = None
    NEC: Optional[Decimal] = None
    FFA: Optional[Decimal] = None
    PLAY: Optional[Decimal] = None
    LTSS: Optional[Decimal] = None
    GIVE: Optional[Decimal] = None
    networth: Optional[Decimal] = None
    comments: Optional[str] = None

class FinancialUpdate(BaseModel):
    entry_date: Optional[date] = None
    income: Optional[Decimal] = None
    expenses: Optional[Decimal] = None
    NEC: Optional[Decimal] = None
    FFA: Optional[Decimal] = None
    PLAY: Optional[Decimal] = None
    LTSS: Optional[Decimal] = None
    GIVE: Optional[Decimal] = None
    networth: Optional[Decimal] = None
    comments: Optional[str] = None

class FinancialResponse(BaseModel):
    id: int
    user_id: int
    entry_date: date
    income: Decimal
    expenses: Optional[Decimal] = None
    NEC: Optional[Decimal] = None
    FFA: Optional[Decimal] = None
    PLAY: Optional[Decimal] = None
    LTSS: Optional[Decimal] = None
    GIVE: Optional[Decimal] = None
    networth: Optional[Decimal] = None
    comments: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True