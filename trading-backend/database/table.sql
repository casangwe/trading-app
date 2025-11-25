CREATE DATABASE IF NOT EXISTS trading_db;

USE trading_db;

-- Users
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fname VARCHAR(50) NOT NULL,
    lname VARCHAR(50) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,        
    email VARCHAR(100) UNIQUE NOT NULL,          
    password_hash VARCHAR(255) NOT NULL,         
    phone_number VARCHAR(20),                   
    account_type ENUM('personal', 'business') NOT NULL,  
    INDEX (username),
    INDEX (email)
);

-- Trading
CREATE TABLE IF NOT EXISTS Cash (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
	entry_date DATE NOT NULL,
    initial_cash DECIMAL(12, 2) NOT NULL,
    available_cash DECIMAL(12, 2) DEFAULT 0.00,
    net_pnl DECIMAL(12, 2) DEFAULT 0.00,
    cash_balance DECIMAL(12, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

CREATE TABLE IF NOT EXISTS Rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entry_date DATE NOT NULL,
    rule TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (entry_date)
);


CREATE TABLE IF NOT EXISTS Watchlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entry_date DATE NOT NULL,     
    symbol VARCHAR(15) NOT NULL,              
    price DECIMAL(12, 2) NOT NULL, 
    target_price DECIMAL(12, 2),              
    target_hit BOOLEAN DEFAULT FALSE,         
    exp_date DATE,                            
    plan TEXT,                                
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE, 
    INDEX (user_id),
    INDEX (symbol)   
);

CREATE TABLE IF NOT EXISTS Trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                      
    symbol VARCHAR(15) NOT NULL,              
    option_type ENUM('CALL', 'PUT') NOT NULL,          
    strike_price DECIMAL(12, 2) NOT NULL CHECK (strike_price >= 0),
    exp_date DATE NOT NULL,
    entry_price DECIMAL(12, 2) NOT NULL CHECK (entry_price >= 0),  
    exit_price DECIMAL(12, 2) DEFAULT NULL,  
    contracts INT NOT NULL CHECK (contracts > 0),
    entry_date DATE NOT NULL,
    close_date DATE DEFAULT NULL, 
    principal DECIMAL(12, 2) DEFAULT NULL,
    net DECIMAL(12, 2) DEFAULT NULL,
    profit_loss DECIMAL(12, 2) DEFAULT NULL,
    roi DECIMAL(12, 2) DEFAULT NULL,  
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE, 
    INDEX (user_id),
    INDEX (symbol),
    INDEX (entry_date),
    INDEX (close_date)
);

CREATE TABLE IF NOT EXISTS Transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    transaction_type ENUM('deposit', 'withdrawal', 'trade') NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    transaction_summary VARCHAR(225),             
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (transaction_date),
    INDEX (transaction_type)
);

CREATE TABLE IF NOT EXISTS DailyPNL (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entry_date DATE NOT NULL,
    open_cash DECIMAL(12, 2) NOT NULL,
    close_cash DECIMAL(12, 2),
    balance DECIMAL(12, 2),
    roi DECIMAL(5, 2),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (entry_date)
);

CREATE TABLE IF NOT EXISTS Misc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('plan', 'summary', 'metrics') NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (entry_date),
    INDEX (category) 
);

-- Financial
CREATE TABLE IF NOT EXISTS Financial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entry_date DATE NOT NULL,
    income DECIMAL(12, 2) NOT NULL,
    expenses DECIMAL(12, 2) DEFAULT NULL,
    NEC DECIMAL(12, 2) DEFAULT NULL,
    FFA DECIMAL(12, 2) DEFAULT NULL,
    PLAY DECIMAL(12, 2) DEFAULT NULL,
    LTSS DECIMAL(12, 2) DEFAULT NULL,
    GIVE DECIMAL(12, 2) DEFAULT NULL,
    networth DECIMAL(12, 2) DEFAULT NULL,
    comments TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (entry_date)
);

-- Sentiment
CREATE TABLE IF NOT EXISTS Options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trade_date DATE NOT NULL,
    trade_time TIME NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    expiry DATE NOT NULL,
    strike DECIMAL(10,2) NOT NULL,
    put_call VARCHAR(4) CHECK (put_call IN ('call', 'put')) NOT NULL,
    side VARCHAR(10) NOT NULL,
    spot DECIMAL(10,2) NOT NULL,
    size INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    premium DECIMAL(10,2) NOT NULL,
    sweep_block_split VARCHAR(10) NOT NULL,
    volume INT NOT NULL,
    open_int INT NOT NULL,
    conds VARCHAR(50),
    UNIQUE (trade_date, trade_time, symbol, expiry, strike, put_call, side, spot, size, price, sweep_block_split),
    INDEX idx_symbol (symbol),
    INDEX idx_symbol_trade_date (symbol, trade_date),
    INDEX idx_expiry (expiry),
    INDEX idx_time (trade_time)
);

-- Indicators tables
CREATE TABLE IF NOT EXISTS daily_features (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    user_id              INT           NOT NULL,
    ticker               VARCHAR(15)   NOT NULL,
    session_date         DATE          NOT NULL,
    row_index            INT           NOT NULL,
    features_version     VARCHAR(8)    NOT NULL DEFAULT 'v1',

    open                 DECIMAL(12,6) NULL,
    high                 DECIMAL(12,6) NULL,
    low                  DECIMAL(12,6) NULL,
    close                DECIMAL(12,6) NULL,
    adj_close            DECIMAL(12,6) NULL,
    volume               BIGINT        NULL,

    buy_sell_arrow       ENUM('Buy','Sell','None') NULL,

    sma5                 DECIMAL(12,6) NULL,
    sma9                 DECIMAL(12,6) NULL,
    fast_vwap            DECIMAL(12,6) NULL,
    slow_vwap            DECIMAL(12,6) NULL,
    mfi14                DECIMAL(6,2)  NULL,
    rsi14                DECIMAL(6,2)  NULL,
    macd_hist            DECIMAL(12,6) NULL,

    catalyst             VARCHAR(255)  NULL,  

    sma_delta            DECIMAL(12,6) NULL,   
    sma_cross_dir_calc   ENUM('up','down','none') NULL,
    slope5               DECIMAL(12,6) NULL,  
    slope9               DECIMAL(12,6) NULL,  
    days_since_sma_cross INT            NULL,
    days_since_macd_cross INT           NULL,

    daily_pct_change     DECIMAL(10,6) NULL,   
    range_pct            DECIMAL(10,6) NULL,   
    vol10_avg            BIGINT        NULL,   
    atr10                DECIMAL(12,6) NULL,   

    vwap_state           ENUM('above','below','hold') NULL,
    vwap_delta_fast      DECIMAL(12,6) NULL,  
    vwap_delta_fast_pct  DECIMAL(10,6) NULL,   
    vwap_contacts_total  INT            NULL, 

    CONSTRAINT uq_daily_features UNIQUE (user_id, ticker, session_date, features_version),

    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,

    INDEX idx_user_ticker_date (user_id, ticker, session_date),
    INDEX idx_ticker_date (ticker, session_date),
    INDEX idx_user_date (user_id, session_date),
    INDEX idx_features_version (features_version),
    INDEX idx_cross_dir (sma_cross_dir_calc),
    INDEX idx_vwap_state (vwap_state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Options Contract tables
CREATE TABLE IF NOT EXISTS OptionDaily (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id        INT         NOT NULL,
    ticker         VARCHAR(15) NOT NULL,   
    session_date   DATE        NOT NULL,   
    expiry         DATE        NOT NULL,  
    strike         DECIMAL(12, 2) NOT NULL CHECK (strike >= 0),
    put_call       ENUM('CALL', 'PUT') NOT NULL,

    underlying_price DECIMAL(12, 4) DEFAULT NULL,

    bid            DECIMAL(12, 4) DEFAULT NULL,
    ask            DECIMAL(12, 4) DEFAULT NULL,
    mark           DECIMAL(12, 4) DEFAULT NULL,
    last_trade     DECIMAL(12, 4) DEFAULT NULL,
    prev_close     DECIMAL(12, 4) DEFAULT NULL,
    high           DECIMAL(12, 4) DEFAULT NULL,
    low            DECIMAL(12, 4) DEFAULT NULL,

    iv             DECIMAL(6, 2)  DEFAULT NULL,

    volume         INT DEFAULT NULL,
    open_interest  INT DEFAULT NULL,

    delta          DECIMAL(8, 4) DEFAULT NULL,

    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,

    CONSTRAINT uq_optiondaily UNIQUE (
        user_id, ticker, session_date, expiry, strike, put_call
    ),

    INDEX idx_optiondaily_user_ticker_date (user_id, ticker, session_date),
    INDEX idx_optiondaily_ticker_date (ticker, session_date),
    INDEX idx_optiondaily_expiry (expiry),
    INDEX idx_optiondaily_liquidity (volume, open_interest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
