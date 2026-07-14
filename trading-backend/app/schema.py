# app/schema.py

from datetime import date
from typing import Optional, Literal

from pydantic import BaseModel, EmailStr


# Users

class UserBase(BaseModel):
    fname: str
    lname: str
    username: str
    email: EmailStr
    phone_number: Optional[str] = None
    account_type: Literal["personal", "business"]


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    fname: Optional[str] = None
    lname: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    account_type: Optional[Literal["personal", "business"]] = None

    class Config:
        from_attributes = True


# Portfolio

class PortfolioBase(BaseModel):
    entry_date: date
    balance: float


class PortfolioCreate(PortfolioBase):
    pass


class PortfolioUpdate(BaseModel):
    entry_date: Optional[date] = None
    balance: Optional[float] = None

    class Config:
        from_attributes = True


class PortfolioResponse(PortfolioBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# Initial Cash

class InitialCashBase(BaseModel):
    entry_date: date
    initial_cash: float


class InitialCashCreate(InitialCashBase):
    pass


class InitialCashUpdate(BaseModel):
    entry_date: Optional[date] = None
    initial_cash: Optional[float] = None

    class Config:
        from_attributes = True


class InitialCashResponse(InitialCashBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# Transactions

class TransactionBase(BaseModel):
    transaction_type: Literal["deposit", "withdrawal"]
    transaction_date: date
    amount: float
    transaction_summary: Optional[str] = None
    timing: Literal["pre_open", "after_close"] = "after_close"


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    transaction_type: Optional[Literal["deposit", "withdrawal"]] = None
    transaction_date: Optional[date] = None
    amount: Optional[float] = None
    transaction_summary: Optional[str] = None
    timing: Optional[Literal["pre_open", "after_close"]] = None

    class Config:
        from_attributes = True


class TransactionResponse(TransactionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# Trades

class TradeBase(BaseModel):
    symbol: str
    option_type: Literal["CALL", "PUT"]
    strike_price: float
    exp_date: date

    entry_price: float
    exit_price: Optional[float] = None

    contracts: int

    entry_date: date
    close_date: Optional[date] = None


class TradeCreate(TradeBase):
    pass


class TradeUpdate(BaseModel):
    symbol: Optional[str] = None
    option_type: Optional[Literal["CALL", "PUT"]] = None
    strike_price: Optional[float] = None
    exp_date: Optional[date] = None

    entry_price: Optional[float] = None
    exit_price: Optional[float] = None

    contracts: Optional[int] = None

    entry_date: Optional[date] = None
    close_date: Optional[date] = None

    class Config:
        from_attributes = True


class TradeResponse(TradeBase):
    id: int
    user_id: int

    principal: Optional[float] = None
    total: Optional[float] = None
    net: Optional[float] = None
    profit_loss: Optional[float] = None
    roi: Optional[float] = None

    class Config:
        from_attributes = True


# Rules

class RuleBase(BaseModel):
    entry_date: date
    rule: Optional[str] = None


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    entry_date: Optional[date] = None
    rule: Optional[str] = None

    class Config:
        from_attributes = True


class RuleResponse(RuleBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# Financial

class FinancialBase(BaseModel):
    entry_date: date
    income: float = 0.0

    nec: float = 0.0
    ffa: float = 0.0
    play: float = 0.0
    ltss: float = 0.0
    give: float = 0.0

    expenses: Optional[float] = None
    gains: Optional[float] = None
    networth: Optional[float] = None

    comments: Optional[str] = None


class FinancialCreate(FinancialBase):
    pass


class FinancialUpdate(BaseModel):
    entry_date: Optional[date] = None
    income: Optional[float] = None

    nec: Optional[float] = None
    ffa: Optional[float] = None
    play: Optional[float] = None
    ltss: Optional[float] = None
    give: Optional[float] = None

    expenses: Optional[float] = None
    gains: Optional[float] = None
    networth: Optional[float] = None

    comments: Optional[str] = None

    class Config:
        from_attributes = True


class FinancialResponse(FinancialBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

        


# # app/schema.py

# from datetime import date
# from typing import Optional, Literal

# from pydantic import BaseModel, EmailStr

# # Users

# class UserBase(BaseModel):
#     fname: str
#     lname: str
#     username: str
#     email: EmailStr
#     phone_number: Optional[str] = None
#     account_type: Literal["personal", "business"]


# class UserCreate(UserBase):
#     password: str


# class UserResponse(UserBase):
#     id: int

#     class Config:
#         from_attributes = True  


# class UserUpdate(BaseModel):
#     fname: Optional[str] = None
#     lname: Optional[str] = None
#     username: Optional[str] = None
#     email: Optional[EmailStr] = None
#     phone_number: Optional[str] = None
#     account_type: Optional[Literal["personal", "business"]] = None

#     class Config:
#         from_attributes = True


# # Portfolio

# class PortfolioBase(BaseModel):
#     entry_date: date
#     balance: float 


# class PortfolioCreate(PortfolioBase):
#     """Create a new portfolio balance entry."""
#     pass


# class PortfolioUpdate(BaseModel):
#     """Partial update of a portfolio entry."""
#     entry_date: Optional[date] = None
#     balance: Optional[float] = None

#     class Config:
#         from_attributes = True


# class PortfolioResponse(PortfolioBase):
#     id: int
#     user_id: int

#     class Config:
#         from_attributes = True

# # Initial Cash
# class InitialCashBase(BaseModel):
#     entry_date: date
#     initial_cash: float


# class InitialCashCreate(InitialCashBase):
#     pass


# class InitialCashUpdate(BaseModel):
#     entry_date: Optional[date] = None
#     initial_cash: Optional[float] = None

#     class Config:
#         from_attributes = True


# class InitialCashResponse(InitialCashBase):
#     id: int
#     user_id: int

#     class Config:
#         from_attributes = True

# # Transactions

# # class TransactionBase(BaseModel):
# #     transaction_type: Literal["deposit", "withdrawal"]
# #     transaction_date: date
# #     amount: float
# #     transaction_summary: Optional[str] = None


# # class TransactionCreate(TransactionBase):
# #     """Create a new transaction (deposit or withdrawal)."""
# #     pass


# # class TransactionUpdate(BaseModel):
# #     """
# #     Partial update for a transaction.
# #     """
# #     transaction_type: Optional[Literal["deposit", "withdrawal"]] = None
# #     transaction_date: Optional[date] = None
# #     amount: Optional[float] = None
# #     transaction_summary: Optional[str] = None

# #     class Config:
# #         from_attributes = True


# # class TransactionResponse(TransactionBase):
# #     id: int
# #     user_id: int

# #     class Config:
# #         from_attributes = True


# # Transactions

# class TransactionBase(BaseModel):
#     transaction_type: Literal["deposit", "withdrawal"]
#     transaction_date: date
#     amount: float
#     transaction_summary: Optional[str] = None
#     timing: Literal["pre_open", "after_close"] = "after_close"   # ✅ add

# class TransactionCreate(TransactionBase):
#     pass

# class TransactionUpdate(BaseModel):
#     transaction_type: Optional[Literal["deposit", "withdrawal"]] = None
#     transaction_date: Optional[date] = None
#     amount: Optional[float] = None
#     transaction_summary: Optional[str] = None
#     timing: Optional[Literal["pre_open", "after_close"]] = None  # ✅ add

#     class Config:
#         from_attributes = True

# class TransactionResponse(TransactionBase):
#     id: int
#     user_id: int

#     class Config:
#         from_attributes = True

# # class TransactionBase(BaseModel):
# #     transaction_type: Literal["deposit", "withdrawal"]
# #     transaction_date: date
# #     amount: float
# #     transaction_summary: Optional[str] = None

# #     # ✅ NEW
# #     timing: Literal["pre_open", "after_close"] = "after_close"
# #     is_initial_cash: bool = False


# # class TransactionCreate(TransactionBase):
# #     pass


# # class TransactionUpdate(BaseModel):
# #     transaction_type: Optional[Literal["deposit", "withdrawal"]] = None
# #     transaction_date: Optional[date] = None
# #     amount: Optional[float] = None
# #     transaction_summary: Optional[str] = None

# #     # ✅ NEW (optional on update)
# #     timing: Optional[Literal["pre_open", "after_close"]] = None
# #     is_initial_cash: Optional[bool] = None

# #     class Config:
# #         from_attributes = True


# # class TransactionResponse(TransactionBase):
# #     id: int
# #     user_id: int

# #     class Config:
# #         from_attributes = True


# # Trades

# class TradeBase(BaseModel):
#     symbol: str
#     option_type: Literal["CALL", "PUT"]
#     strike_price: float
#     exp_date: date

#     entry_price: float
#     exit_price: Optional[float] = None

#     contracts: int

#     entry_date: date
#     close_date: Optional[date] = None


# class TradeCreate(TradeBase):
#     """
#     Schema for creating a new trade.

#     NewTrade.js sends exactly these fields.
#     Backend will calculate principal, net, profit_loss, roi.
#     """
#     pass


# class TradeUpdate(BaseModel):
#     """
#     Partial update for a trade.
#     All fields optional so you can update only what's needed.
#     """
#     symbol: Optional[str] = None
#     option_type: Optional[Literal["CALL", "PUT"]] = None
#     strike_price: Optional[float] = None
#     exp_date: Optional[date] = None

#     entry_price: Optional[float] = None
#     exit_price: Optional[float] = None

#     contracts: Optional[int] = None

#     entry_date: Optional[date] = None
#     close_date: Optional[date] = None

#     class Config:
#         from_attributes = True


# class TradeResponse(TradeBase):
#     """
#     What the backend returns for a trade:
#     - All core fields
#     - Plus calculated metrics
#     """
#     id: int
#     user_id: int

#     principal: Optional[float] = None
#     total: Optional[float] = None
#     net: Optional[float] = None
#     profit_loss: Optional[float] = None
#     roi: Optional[float] = None

#     class Config:
#         from_attributes = True


# # Rules
# class RuleBase(BaseModel):
#     entry_date: date
#     rule: Optional[str] = None


# class RuleCreate(RuleBase):
#     """Create a new trading rule / journal entry."""
#     pass


# class RuleUpdate(BaseModel):
#     """
#     Partial update for a rule entry.
#     """
#     entry_date: Optional[date] = None
#     rule: Optional[str] = None

#     class Config:
#         from_attributes = True


# class RuleResponse(RuleBase):
#     id: int
#     user_id: int

#     class Config:
#         from_attributes = True


# # financial
# class FinancialBase(BaseModel):
#     entry_date: date
#     income: float = 0.0

#     nec: float = 0.0
#     ffa: float = 0.0
#     play: float = 0.0
#     ltss: float = 0.0
#     give: float = 0.0

#     expenses: Optional[float] = None
#     gains: Optional[float] = None
#     networth: Optional[float] = None

#     comments: Optional[str] = None


# class FinancialCreate(FinancialBase):
#     """
#     Payload to create a new financial entry.

#     Typical usage:
#     - You send: entry_date, income, nec/ffa/play/ltss/give, comments
#     - You omit: expenses, gains, networth (backend computes them)
#     """
#     pass


# class FinancialUpdate(BaseModel):
#     entry_date: Optional[date] = None
#     income: Optional[float] = None

#     nec: Optional[float] = None
#     ffa: Optional[float] = None
#     play: Optional[float] = None
#     ltss: Optional[float] = None
#     give: Optional[float] = None

#     expenses: Optional[float] = None
#     gains: Optional[float] = None
#     networth: Optional[float] = None

#     comments: Optional[str] = None

#     class Config:
#         from_attributes = True


# class FinancialResponse(FinancialBase):
#     id: int
#     user_id: int

#     class Config:
#         from_attributes = True