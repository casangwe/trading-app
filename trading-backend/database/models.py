# models.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric, Enum, Date, DECIMAL, ForeignKey, Index, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()

class AccountType(enum.Enum):
    personal = "personal"
    business = "business"

class TransactionType(enum.Enum):
    deposit = "deposit"
    withdrawal = "withdrawal"
    trade = "trade"

class OptionType(enum.Enum):
    CALL = "CALL"
    PUT = "PUT"

class User(Base):
    __tablename__ = "Users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fname = Column(String(50), nullable=False)
    lname = Column(String(50), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    account_type = Column(Enum(AccountType), nullable=False)

    rules = relationship("Rule", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    cash = relationship("Cash", back_populates="user", cascade="all, delete-orphan")
    watchlists = relationship("Watchlist", back_populates="user")
    trades = relationship("Trade", back_populates="user", cascade="all, delete-orphan")
    daily_pnls = relationship("DailyPNL", back_populates="user", cascade="all, delete-orphan")
    misc_entries = relationship("Misc", back_populates="user", cascade="all, delete-orphan")
    financial_entries = relationship("Financial", back_populates="user", cascade="all, delete-orphan")





    __table_args__ = (
        Index('idx_username', 'username'),
        Index('idx_email', 'email')
    )

class Rule(Base):
    __tablename__ = "Rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)
    entry_date = Column(Date, nullable=False)
    rule = Column(Text, nullable=True)

    user = relationship("User", back_populates="rules")

    __table_args__ = (
        Index('idx_user_id', 'user_id'),
        Index('idx_entry_date', 'entry_date')
    )


class Cash(Base):
    __tablename__ = "Cash"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('Users.id', ondelete="CASCADE"), nullable=False)
    entry_date = Column(Date, nullable=False)
    initial_cash = Column(DECIMAL(12, 2), nullable=False)
    available_cash = Column(DECIMAL(12, 2), default=0.00)
    net_pnl = Column(DECIMAL(12, 2), default=0.00)
    cash_balance = Column(DECIMAL(12, 2), default=0.00)

    user = relationship("User", back_populates="cash")

    __table_args__ = (
        Index('idx_user_id', 'user_id'),
    )

class Watchlist(Base):
    __tablename__ = "Watchlist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)  
    symbol = Column(String(15), nullable=False)
    price = Column(DECIMAL(12, 2), nullable=False)
    target_price = Column(DECIMAL(12, 2), default=None)
    target_hit = Column(Boolean, default=False)
    exp_date = Column(Date, default=None)
    entry_date = Column(Date, nullable=False) 
    plan = Column(Text, default=None) 

    user = relationship("User", back_populates="watchlists")

    __table_args__ = (
        Index('idx_user_id', 'user_id'),
        Index('idx_symbol', 'symbol')
    )

class Trade(Base):
    __tablename__ = "Trades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    symbol = Column(String(15), nullable=False)
    option_type = Column(Enum(OptionType), nullable=False)
    strike_price = Column(DECIMAL(12, 2), nullable=False)
    exp_date = Column(Date, nullable=False)
    entry_price = Column(DECIMAL(12, 2), nullable=False)
    exit_price = Column(DECIMAL(12, 2), default=None)
    contracts = Column(Integer, nullable=False)
    entry_date = Column(Date, nullable=False)
    close_date = Column(Date, default=None)
    principal = Column(DECIMAL(12, 2), default=None)
    net = Column(DECIMAL(12, 2), default=None)
    profit_loss = Column(DECIMAL(12, 2), default=None)
    roi = Column(DECIMAL(12, 2), default=None)

    user = relationship("User", back_populates="trades")




    __table_args__ = (
        Index('idx_user_id', 'user_id'),
        Index('idx_symbol', 'symbol'),
        Index('idx_entry_date', 'entry_date'),
        Index('idx_close_date', 'close_date')
    )

class Transaction(Base):
    __tablename__ = "Transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('Users.id', ondelete="CASCADE"), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    transaction_date = Column(Date, nullable=False)
    amount = Column(DECIMAL(12, 2), nullable=False)
    transaction_summary = Column(String(225), nullable=True)

    user = relationship("User", back_populates="transactions")

    __table_args__ = (
        Index('idx_user_id', 'user_id'),
        Index('idx_transaction_date', 'transaction_date'),
        Index('idx_transaction_type', 'transaction_type')
    )


class DailyPNL(Base):
    __tablename__ = "DailyPNL"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('Users.id', ondelete="CASCADE"), nullable=False)
    entry_date = Column(Date, nullable=False)
    open_cash = Column(DECIMAL(12, 2), nullable=False)
    close_cash = Column(DECIMAL(12, 2), nullable=True)
    balance = Column(DECIMAL(12, 2), nullable=True)
    roi = Column(DECIMAL(5, 2), nullable=True)

    user = relationship("User", back_populates="daily_pnls")

    __table_args__ = (
        Index('idx_user_id', 'user_id'),
        Index('idx_entry_date', 'entry_date')
    )


class MiscCategory(enum.Enum):
    plan = "plan"
    summary = "summary"
    metrics = "metrics"
    rules = "rules"

class Misc(Base):
    __tablename__ = "Misc"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('Users.id', ondelete="CASCADE"), nullable=False)
    category = Column(Enum(MiscCategory), nullable=False)
    entry_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)

    user = relationship("User", back_populates="misc_entries")

    __table_args__ = (
        Index('idx_user_id', 'user_id'),
        Index('idx_entry_date', 'entry_date'),
        Index('idx_category', 'category')
    )


# Financials
class Financial(Base):
    __tablename__ = "Financial"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)
    entry_date = Column(Date, nullable=False)
    income = Column(DECIMAL(12, 2), nullable=False)
    expenses = Column(DECIMAL(12, 2), default=None)
    NEC = Column(DECIMAL(12, 2), default=None)
    FFA = Column(DECIMAL(12, 2), default=None)
    PLAY = Column(DECIMAL(12, 2), default=None)
    LTSS = Column(DECIMAL(12, 2), default=None)
    GIVE = Column(DECIMAL(12, 2), default=None)
    networth = Column(DECIMAL(12, 2), default=None)
    comments = Column(Text, default=None)
    
    user = relationship("User", back_populates="financial_entries")

    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_entry_date", "entry_date"),
    )