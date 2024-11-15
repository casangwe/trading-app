CREATE DATABASE IF NOT EXISTS trading_db;

USE trading_db;

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

-- Create Rules table
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

