# app/routers/trades.py

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc


from ..database import get_db_connection
from ..models import User, Trades
from ..auth import get_current_user
from ..schema import TradeCreate, TradeUpdate, TradeResponse

router = APIRouter()


def is_admin(user: User) -> bool:
    """Temporary admin rule: treat user with id == 1 as admin."""
    return user.id == 1


# --- Helper: P/L calculations WITHOUT fees --- #

def _recalculate_metrics(trade: Trades) -> None:
    """
    Given a Trades ORM object with core fields set, compute:
    - principal
    - profit_loss
    - net
    - roi

    Assumes options are 100x multiplier.
    No commissions/fees included. Those can be modeled separately later.
    """
    # Initialize everything FIRST (this is the key fix)
    principal = None
    total = None
    profit_loss = None
    net = None
    roi = None

    # Guard: must have entry price and valid contracts
    if trade.entry_price is None or trade.contracts is None or trade.contracts <= 0:
        trade.principal = None
        trade.total = None
        trade.profit_loss = None
        trade.net = None
        trade.roi = None
        return

    contracts = int(trade.contracts)
    entry_price = float(trade.entry_price)

    principal = entry_price * contracts * 100

    # Closed trade logic
    if trade.exit_price is not None:
        exit_price = float(trade.exit_price)

        total = exit_price * contracts * 100
        profit_loss = (exit_price - entry_price) * contracts * 100
        net = profit_loss

        if principal > 0:
            roi = (profit_loss / principal) * 100.0

    # Assign safely
    trade.principal = round(principal, 2) if principal is not None else None
    trade.total = round(total, 2) if total is not None else None
    trade.profit_loss = round(profit_loss, 2) if profit_loss is not None else None
    trade.net = round(net, 2) if net is not None else None
    trade.roi = round(roi, 2) if roi is not None else None

# --- Routes --- #

@router.get("/", response_model=List[TradeResponse])
def list_trades(
    symbol: Optional[str] = Query(default=None, description="Filter by symbol (e.g. 'AAPL')"),
    from_date: Optional[date] = Query(default=None, description="Filter from this entry_date (inclusive)"),
    to_date: Optional[date] = Query(default=None, description="Filter up to this entry_date (inclusive)"),
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    List trades for the current user.

    Optional filters:
    - symbol
    - from_date (entry_date >=)
    - to_date (entry_date <=)
    """
    query = db.query(Trades).filter(Trades.user_id == current_user.id)

    if symbol is not None:
        query = query.filter(Trades.symbol == symbol.upper())

    if from_date is not None:
        query = query.filter(Trades.entry_date >= from_date)
    if to_date is not None:
        query = query.filter(Trades.entry_date <= to_date)

    # trades = query.order_by(Trades.entry_date.asc(), Trades.id.asc()).all()
    trades = (
        query
        .order_by(
            (Trades.close_date.is_(None)),  # NULLs last (MySQL-safe)
            desc(Trades.close_date),        # newest closed trades first
            desc(Trades.entry_date),        # then newest open trades
            desc(Trades.id),
        )
        .all()
    )

    return trades


@router.get("/{trade_id}", response_model=TradeResponse)
def get_trade_by_id(
    trade_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Get a single trade by ID.
    """
    trade = db.query(Trades).filter(Trades.id == trade_id).first()
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found.",
        )

    if trade.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this trade.",
        )

    return trade


@router.post("/", response_model=TradeResponse, status_code=status.HTTP_201_CREATED)
def create_trade(
    payload: TradeCreate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new trade for the current user.

    NewTrade.js sends:
    - symbol
    - option_type
    - strike_price
    - exp_date
    - entry_price
    - exit_price (optional)
    - contracts
    - entry_date
    - close_date (optional)
    """
    if payload.contracts <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contracts must be a positive integer.",
        )
    if payload.entry_price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entry price must be non-negative.",
        )
    if payload.exit_price is not None and payload.exit_price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exit price must be non-negative.",
        )

    symbol = payload.symbol.upper()

    db_trade = Trades(
        user_id=current_user.id,
        symbol=symbol,
        option_type=payload.option_type,
        strike_price=payload.strike_price,
        exp_date=payload.exp_date,
        entry_price=payload.entry_price,
        exit_price=payload.exit_price,
        contracts=payload.contracts,
        entry_date=payload.entry_date,
        close_date=payload.close_date,
        principal=None,
        net=None,
        profit_loss=None,
        roi=None,
    )

    _recalculate_metrics(db_trade)

    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)

    return db_trade


@router.put("/{trade_id}", response_model=TradeResponse)
def update_trade(
    trade_id: int,
    payload: TradeUpdate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing trade.

    - Normal user: only their own trades.
    - Admin: can update any trade.
    """
    trade = db.query(Trades).filter(Trades.id == trade_id).first()
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found.",
        )

    if trade.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this trade.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    if "contracts" in update_data and update_data["contracts"] is not None:
        if update_data["contracts"] <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contracts must be a positive integer.",
            )

    if "entry_price" in update_data and update_data["entry_price"] is not None:
        if update_data["entry_price"] < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entry price must be non-negative.",
            )

    if "exit_price" in update_data and update_data["exit_price"] is not None:
        if update_data["exit_price"] < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Exit price must be non-negative.",
            )

    if "symbol" in update_data and update_data["symbol"] is not None:
        update_data["symbol"] = update_data["symbol"].upper()

    for field, value in update_data.items():
        setattr(trade, field, value)

    _recalculate_metrics(trade)

    db.add(trade)
    db.commit()
    db.refresh(trade)

    return trade


@router.delete("/{trade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trade(
    trade_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a trade.

    - Normal users: can only delete their own trades.
    - Admin: can delete any.
    """
    trade = db.query(Trades).filter(Trades.id == trade_id).first()
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found.",
        )

    if trade.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this trade.",
        )

    db.delete(trade)
    db.commit()
    return  # 204

