# app/models.py

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Numeric,
    Text,
    Enum,
    ForeignKey,
    BigInteger,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "Users"

    id = Column(Integer, primary_key=True, index=True)
    fname = Column(String(50), nullable=False)
    lname = Column(String(50), nullable=False)
    username = Column(String(50), nullable=False, unique=True, index=True)
    email = Column(String(100), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    account_type = Column(
        Enum("personal", "business", name="account_type_enum"),
        nullable=False,
    )

    # Relationships
    portfolio_entries = relationship(
        "Portfolio",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    rules = relationship(
        "Rules",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    trades = relationship(
        "Trades",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    transactions = relationship(
        "Transactions",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    financial_entries = relationship(
        "Financial",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    features = relationship(
        "Features",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    options = relationship(
        "Options",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    initial_cash_entry = relationship(
        "InitialCash",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )


class Portfolio(Base):
    __tablename__ = "Portfolio"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)
    entry_date = Column(Date, nullable=False, index=True)
    balance = Column(Numeric(12, 2))

    __table_args__ = (
        UniqueConstraint("user_id", "entry_date", name="uq_portfolio_user_date"),
    )

    user = relationship("User", back_populates="portfolio_entries")


class Rules(Base):
    __tablename__ = "Rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)
    entry_date = Column(Date, nullable=False, index=True)
    rule = Column(Text, nullable=True)

    user = relationship("User", back_populates="rules")


class InitialCash(Base):
    __tablename__ = "InitialCash"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False, unique=True)
    entry_date = Column(Date, nullable=False, index=True)
    initial_cash = Column(Numeric(12, 2), nullable=False)

    user = relationship("User", back_populates="initial_cash_entry")


class Trades(Base):
    __tablename__ = "Trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)

    symbol = Column(String(15), nullable=False, index=True)
    option_type = Column(
        Enum("CALL", "PUT", name="option_type_enum"),
        nullable=False,
    )

    strike_price = Column(Numeric(12, 2), nullable=False)
    exp_date = Column(Date, nullable=False)

    entry_price = Column(Numeric(12, 2), nullable=False)
    exit_price = Column(Numeric(12, 2), nullable=True)

    contracts = Column(Integer, nullable=False)

    entry_date = Column(Date, nullable=False, index=True)
    close_date = Column(Date, nullable=True, index=True)

    principal = Column(Numeric(12, 2), nullable=True)
    total = Column(Numeric(12, 2), nullable=True)
    net = Column(Numeric(12, 2), nullable=True)
    profit_loss = Column(Numeric(12, 2), nullable=True)
    roi = Column(Numeric(12, 2), nullable=True)

    user = relationship("User", back_populates="trades")


class Transactions(Base):
    __tablename__ = "Transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)

    transaction_type = Column(
        Enum("deposit", "withdrawal", name="transaction_type_enum"),
        nullable=False,
        index=True,
    )

    transaction_date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    transaction_summary = Column(String(225), nullable=True)

    timing = Column(
        Enum("pre_open", "after_close", name="txn_timing_enum"),
        nullable=False,
        default="after_close",
    )

    user = relationship("User", back_populates="transactions")


class Financial(Base):
    __tablename__ = "Financial"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)

    entry_date = Column(Date, nullable=False, index=True)

    income = Column(Numeric(12, 2), nullable=False, default=0)

    nec = Column(Numeric(12, 2), nullable=False, default=0)
    ffa = Column(Numeric(12, 2), nullable=False, default=0)
    play = Column(Numeric(12, 2), nullable=False, default=0)
    ltss = Column(Numeric(12, 2), nullable=False, default=0)
    give = Column(Numeric(12, 2), nullable=False, default=0)

    expenses = Column(Numeric(12, 2), nullable=False, default=0)
    gains = Column(Numeric(12, 2), nullable=False, default=0)
    networth = Column(Numeric(12, 2), nullable=False, default=0)

    comments = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "entry_date", name="uq_financial_user_date"),
    )

    user = relationship("User", back_populates="financial_entries")


class Features(Base):
    __tablename__ = "Features"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)
    ticker = Column(String(15), nullable=False, index=True)
    session_date = Column(Date, nullable=False, index=True)

    row_index = Column(Integer, nullable=False)
    features_version = Column(String(8), nullable=False, default="v1")

    open = Column(Numeric(12, 6), nullable=True)
    high = Column(Numeric(12, 6), nullable=True)
    low = Column(Numeric(12, 6), nullable=True)
    close = Column(Numeric(12, 6), nullable=True)
    adj_close = Column(Numeric(12, 6), nullable=True)
    volume = Column(BigInteger, nullable=True)

    buy_sell_arrow = Column(
        Enum("Buy", "Sell", "None", name="buy_sell_arrow_enum"),
        nullable=True,
    )

    sma5 = Column(Numeric(12, 6), nullable=True)
    sma9 = Column(Numeric(12, 6), nullable=True)
    fast_vwap = Column(Numeric(12, 6), nullable=True)
    slow_vwap = Column(Numeric(12, 6), nullable=True)

    mfi14 = Column(Numeric(6, 2), nullable=True)
    rsi14 = Column(Numeric(6, 2), nullable=True)
    macd_hist = Column(Numeric(12, 6), nullable=True)

    catalyst = Column(String(255), nullable=True)

    sma_delta = Column(Numeric(12, 6), nullable=True)
    sma_cross_dir_calc = Column(
        Enum("up", "down", "none", name="sma_cross_dir_enum"),
        nullable=True,
    )

    slope5 = Column(Numeric(12, 6), nullable=True)
    slope9 = Column(Numeric(12, 6), nullable=True)

    days_since_sma_cross = Column(Integer, nullable=True)
    days_since_macd_cross = Column(Integer, nullable=True)

    daily_pct_change = Column(Numeric(10, 6), nullable=True)
    range_pct = Column(Numeric(10, 6), nullable=True)

    vol10_avg = Column(BigInteger, nullable=True)
    atr10 = Column(Numeric(12, 6), nullable=True)

    vwap_state = Column(
        Enum("above", "below", "hold", name="vwap_state_enum"),
        nullable=True,
    )
    vwap_delta_fast = Column(Numeric(12, 6), nullable=True)
    vwap_delta_fast_pct = Column(Numeric(10, 6), nullable=True)
    vwap_contacts_total = Column(Integer, nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "ticker",
            "session_date",
            "features_version",
            name="uq_daily_features",
        ),
    )

    user = relationship("User", back_populates="features")


class Options(Base):
    __tablename__ = "Options"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)
    ticker = Column(String(15), nullable=False, index=True)
    session_date = Column(Date, nullable=False, index=True)
    expiry = Column(Date, nullable=False, index=True)

    strike = Column(Numeric(12, 2), nullable=False)
    put_call = Column(
        Enum("CALL", "PUT", name="put_call_enum"),
        nullable=False,
    )

    underlying_price = Column(Numeric(12, 4), nullable=True)
    bid = Column(Numeric(12, 4), nullable=True)
    ask = Column(Numeric(12, 4), nullable=True)
    mark = Column(Numeric(12, 4), nullable=True)
    last_trade = Column(Numeric(12, 4), nullable=True)
    prev_close = Column(Numeric(12, 4), nullable=True)
    high = Column(Numeric(12, 4), nullable=True)
    low = Column(Numeric(12, 4), nullable=True)

    iv = Column(Numeric(6, 2), nullable=True)
    volume = Column(Integer, nullable=True)
    open_interest = Column(Integer, nullable=True)
    delta = Column(Numeric(8, 4), nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "ticker",
            "session_date",
            "expiry",
            "strike",
            "put_call",
            name="uq_optiondaily",
        ),
    )

    user = relationship("User", back_populates="options")


# # app/models.py

# from datetime import date
# from typing import Optional

# from sqlalchemy import (
#     Column,
#     Integer,
#     String,
#     Date,
#     Numeric,
#     Text,
#     Enum,
#     ForeignKey,
#     BigInteger,
#     UniqueConstraint,
#     Boolean
# )
# from sqlalchemy.orm import declarative_base, relationship

# Base = declarative_base()


# class User(Base):
#     __tablename__ = "Users"

#     id = Column(Integer, primary_key=True, index=True)
#     fname = Column(String(50), nullable=False)
#     lname = Column(String(50), nullable=False)
#     username = Column(String(50), nullable=False, unique=True, index=True)
#     email = Column(String(100), nullable=False, unique=True, index=True)
#     password_hash = Column(String(255), nullable=False)
#     phone_number = Column(String(20), nullable=True)
#     account_type = Column(
#         Enum("personal", "business", name="account_type_enum"),
#         nullable=False,
#     )

#     # Relationships
#     portfolio_entries = relationship(
#         "Portfolio",
#         back_populates="user",
#         cascade="all, delete-orphan",
#     )
#     rules = relationship(
#         "Rules",
#         back_populates="user",
#         cascade="all, delete-orphan",
#     )
#     trades = relationship(
#         "Trades",
#         back_populates="user",
#         cascade="all, delete-orphan",
#     )
#     transactions = relationship(
#         "Transactions",
#         back_populates="user",
#         cascade="all, delete-orphan",
#     )
#     financial_entries = relationship(
#         "Financial",
#         back_populates="user",
#         cascade="all, delete-orphan",
#     )
#     features = relationship(
#         "Features",
#         back_populates="user",
#         cascade="all, delete-orphan",
#     )
#     options = relationship(
#         "Options",
#         back_populates="user",
#         cascade="all, delete-orphan",
#     )

#     initial_cash_entries = relationship(
#         "InitialCash",
#         back_populates="user",
#         cascade="all, delete-orphan",
#     )

# class Portfolio(Base):
#     __tablename__ = "Portfolio"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)
#     entry_date = Column(Date, nullable=False, index=True)
#     balance = Column(Numeric(12, 2))

#     __table_args__ = (
#         UniqueConstraint("user_id", "entry_date", name="uq_portfolio_user_date"),
#     )

#     user = relationship("User", back_populates="portfolio_entries")


# class Rules(Base):
#     __tablename__ = "Rules"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)
#     entry_date = Column(Date, nullable=False, index=True)
#     rule = Column(Text, nullable=True)

#     user = relationship("User", back_populates="rules")

# class InitialCash(Base):
#     __tablename__ = "InitialCash"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False, unique=True)
#     entry_date = Column(Date, nullable=False, index=True)
#     initial_cash = Column(Numeric(12, 2), nullable=False)

#     user = relationship("User", back_populates="initial_cash_entries")


# class Trades(Base):
#     __tablename__ = "Trades"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)

#     symbol = Column(String(15), nullable=False, index=True)
#     option_type = Column(
#         Enum("CALL", "PUT", name="option_type_enum"),
#         nullable=False,
#     )

#     strike_price = Column(Numeric(12, 2), nullable=False)
#     exp_date = Column(Date, nullable=False)

#     entry_price = Column(Numeric(12, 2), nullable=False)
#     exit_price = Column(Numeric(12, 2), nullable=True)

#     contracts = Column(Integer, nullable=False)

#     entry_date = Column(Date, nullable=False, index=True)
#     close_date = Column(Date, nullable=True, index=True)

#     principal = Column(Numeric(12, 2), nullable=True)
#     total = Column(Numeric(12, 2), nullable=True)
#     net = Column(Numeric(12, 2), nullable=True)
#     profit_loss = Column(Numeric(12, 2), nullable=True)
#     roi = Column(Numeric(12, 2), nullable=True)

#     user = relationship("User", back_populates="trades")



# class Transactions(Base):
#     __tablename__ = "Transactions"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)

#     transaction_type = Column(
#         Enum("deposit", "withdrawal", name="transaction_type_enum"),
#         nullable=False,
#         index=True,
#     )

#     transaction_date = Column(Date, nullable=False, index=True)
#     amount = Column(Numeric(12, 2), nullable=False)
#     transaction_summary = Column(String(225), nullable=True)

#     timing = Column(
#         Enum("pre_open", "after_close", name="txn_timing_enum"),
#         nullable=False,
#         default="after_close",
#     )

#     user = relationship("User", back_populates="transactions")


# class Financial(Base):
#     __tablename__ = "Financial"  

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)

#     entry_date = Column(Date, nullable=False, index=True)

#     income = Column(Numeric(12, 2), nullable=False, default=0)

#     nec = Column(Numeric(12, 2), nullable=False, default=0)
#     ffa = Column(Numeric(12, 2), nullable=False, default=0)
#     play = Column(Numeric(12, 2), nullable=False, default=0)
#     ltss = Column(Numeric(12, 2), nullable=False, default=0)
#     give = Column(Numeric(12, 2), nullable=False, default=0)

#     expenses = Column(Numeric(12, 2), nullable=False, default=0)
#     gains = Column(Numeric(12, 2), nullable=False, default=0)
#     networth = Column(Numeric(12, 2), nullable=False, default=0)

#     comments = Column(Text, nullable=True)

#     __table_args__ = (
#         UniqueConstraint("user_id", "entry_date", name="uq_financial_user_date"),
#     )

#     user = relationship("User", back_populates="financial_entries")

# class Features(Base):
#     __tablename__ = "Features"

#     id = Column(Integer, primary_key=True, index=True)

#     user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)
#     ticker = Column(String(15), nullable=False, index=True)
#     session_date = Column(Date, nullable=False, index=True)

#     row_index = Column(Integer, nullable=False)
#     features_version = Column(String(8), nullable=False, default="v1")

#     open = Column(Numeric(12, 6), nullable=True)
#     high = Column(Numeric(12, 6), nullable=True)
#     low = Column(Numeric(12, 6), nullable=True)
#     close = Column(Numeric(12, 6), nullable=True)
#     adj_close = Column(Numeric(12, 6), nullable=True)
#     volume = Column(BigInteger, nullable=True)

#     buy_sell_arrow = Column(
#         Enum("Buy", "Sell", "None", name="buy_sell_arrow_enum"),
#         nullable=True,
#     )

#     sma5 = Column(Numeric(12, 6), nullable=True)
#     sma9 = Column(Numeric(12, 6), nullable=True)
#     fast_vwap = Column(Numeric(12, 6), nullable=True)
#     slow_vwap = Column(Numeric(12, 6), nullable=True)

#     mfi14 = Column(Numeric(6, 2), nullable=True)
#     rsi14 = Column(Numeric(6, 2), nullable=True)
#     macd_hist = Column(Numeric(12, 6), nullable=True)

#     catalyst = Column(String(255), nullable=True)

#     sma_delta = Column(Numeric(12, 6), nullable=True)
#     sma_cross_dir_calc = Column(
#         Enum("up", "down", "none", name="sma_cross_dir_enum"),
#         nullable=True,
#     )

#     slope5 = Column(Numeric(12, 6), nullable=True)
#     slope9 = Column(Numeric(12, 6), nullable=True)

#     days_since_sma_cross = Column(Integer, nullable=True)
#     days_since_macd_cross = Column(Integer, nullable=True)

#     daily_pct_change = Column(Numeric(10, 6), nullable=True)
#     range_pct = Column(Numeric(10, 6), nullable=True)

#     vol10_avg = Column(BigInteger, nullable=True)
#     atr10 = Column(Numeric(12, 6), nullable=True)

#     vwap_state = Column(
#         Enum("above", "below", "hold", name="vwap_state_enum"),
#         nullable=True,
#     )
#     vwap_delta_fast = Column(Numeric(12, 6), nullable=True)
#     vwap_delta_fast_pct = Column(Numeric(10, 6), nullable=True)
#     vwap_contacts_total = Column(Integer, nullable=True)

#     __table_args__ = (
#         UniqueConstraint(
#             "user_id",
#             "ticker",
#             "session_date",
#             "features_version",
#             name="uq_daily_features",
#         ),
#     )

#     user = relationship("User", back_populates="features")


# class Options(Base):
#     __tablename__ = "Options"

#     id = Column(Integer, primary_key=True, index=True)

#     user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)
#     ticker = Column(String(15), nullable=False, index=True)
#     session_date = Column(Date, nullable=False, index=True)
#     expiry = Column(Date, nullable=False, index=True)

#     strike = Column(Numeric(12, 2), nullable=False)
#     put_call = Column(
#         Enum("CALL", "PUT", name="put_call_enum"),
#         nullable=False,
#     )

#     underlying_price = Column(Numeric(12, 4), nullable=True)
#     bid = Column(Numeric(12, 4), nullable=True)
#     ask = Column(Numeric(12, 4), nullable=True)
#     mark = Column(Numeric(12, 4), nullable=True)
#     last_trade = Column(Numeric(12, 4), nullable=True)
#     prev_close = Column(Numeric(12, 4), nullable=True)
#     high = Column(Numeric(12, 4), nullable=True)
#     low = Column(Numeric(12, 4), nullable=True)

#     iv = Column(Numeric(6, 2), nullable=True)
#     volume = Column(Integer, nullable=True)
#     open_interest = Column(Integer, nullable=True)
#     delta = Column(Numeric(8, 4), nullable=True)

#     __table_args__ = (
#         UniqueConstraint(
#             "user_id",
#             "ticker",
#             "session_date",
#             "expiry",
#             "strike",
#             "put_call",
#             name="uq_optiondaily",
#         ),
#     )

#     user = relationship("User", back_populates="options")
