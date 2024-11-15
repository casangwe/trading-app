from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date
from database.models import Trade, Transaction, TransactionType, Cash
from sqlalchemy import desc

def calculate_metrics(trades, deposits, withdrawals, starting_cash):
    total_trades = len(trades)

    # Calculate total profit/loss
    total_profit_loss = sum(float(trade.profit_loss * 100) for trade in trades if trade.profit_loss is not None)

    # Calculate ending cash balance
    ending_cash_balance = starting_cash + total_profit_loss + sum(float(deposit.amount) for deposit in deposits) - sum(float(withdrawal.amount) for withdrawal in withdrawals)
    
    # Calculate ROI based on initial cash and ending cash balance
    total_roi = ((ending_cash_balance - starting_cash) / starting_cash * 100) if starting_cash > 0 else 0
    
    # Calculate total deposits and withdrawals
    total_deposits = sum(float(deposit.amount) for deposit in deposits)
    total_withdrawals = sum(float(withdrawal.amount) for withdrawal in withdrawals)

    # Calculate ending cash balance
    ending_cash_balance = starting_cash + total_deposits - total_withdrawals + total_profit_loss
    
    # Calculate average trade size
    average_trade_size = sum(float(trade.contracts) for trade in trades if trade.contracts is not None) / total_trades if total_trades > 0 else 0
    
    # Calculate average trade duration in days
    average_trade_duration = sum((trade.close_date - trade.entry_date).days for trade in trades if trade.close_date) / total_trades if total_trades > 0 else 0
    
    # Calculate profit factor
    profit_factor_numerator = sum(float(trade.profit_loss) for trade in trades if trade.profit_loss > 0)
    profit_factor_denominator = abs(sum(float(trade.profit_loss) for trade in trades if trade.profit_loss < 0))
    profit_factor = profit_factor_numerator / profit_factor_denominator if profit_factor_denominator != 0 else float('inf')
    
    # Calculate max drawdown
    max_drawdown = max(0, starting_cash + total_deposits + total_profit_loss - (starting_cash + total_deposits - total_withdrawals))
    
    # Calculate win rate
    win_count = sum(1 for trade in trades if trade.profit_loss > 0)
    win_rate = win_count / total_trades if total_trades > 0 else 0
    loss_count = sum(1 for trade in trades if trade.profit_loss < 0)

    # Calculate Win-Loss Ratio
    win_loss_ratio = win_count / loss_count if loss_count > 0 else float('inf')

    # Calculate Risk-to-Reward Ratio
    total_risk = sum(abs(trade.loss) for trade in trades if trade.profit_loss < 0)
    total_reward = sum(trade.profit_loss for trade in trades if trade.profit_loss > 0)
    risk_to_reward_ratio = total_risk / total_reward if total_reward > 0 else float('inf')
    
    # Determine largest win and largest loss
    largest_win = max(float(trade.profit_loss) for trade in trades) if trades else 0
    # largest_loss = min(float(trade.profit_loss) for trade in trades) if trades else 0
    largest_loss_trades = [trade for trade in trades if trade.profit_loss < 0]
    largest_loss = min(float(trade.profit_loss) for trade in largest_loss_trades) if largest_loss_trades else 0
    
    # Calculate average profit/loss per trade
    average_profit_loss_per_trade = total_profit_loss / total_trades if total_trades > 0 else 0
    
    # Calculate cumulative return as a percentage
    cumulative_return = (ending_cash_balance - starting_cash) / starting_cash * 100 if starting_cash > 0 else 0
    
    return {
        'total_trades': total_trades,
        'total_profit_loss': f"{total_profit_loss:.2f}",
        'total_roi': f"{total_roi:.2f}",
        'total_deposits': f"{total_deposits:.2f}",
        'total_withdrawals': f"{total_withdrawals:.2f}",
        'starting_cash': f"{starting_cash:.2f}",
        'ending_cash_balance': f"{ending_cash_balance:.2f}",
        'average_trade_size': f"{average_trade_size:.2f}",
        'average_trade_duration': average_trade_duration,
        'profit_factor': f"{profit_factor:.2f}" if profit_factor != float('inf') else "undefined or infinite",
        'max_drawdown': f"{max_drawdown:.2f}",
        'win_rate': f"{win_rate * 100:.2f}",
        'largest_win': f"{largest_win:.2f}",
        'largest_loss': f"{largest_loss:.2f}",
        'average_profit_loss_per_trade': f"{average_profit_loss_per_trade:.2f}",
        'cumulative_return': f"{cumulative_return:.2f}"
    }
