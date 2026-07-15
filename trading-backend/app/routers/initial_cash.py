# app/routers/initial_cash.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db_connection
from ..auth import get_current_user
from ..models import User, InitialCash, Portfolio
from ..schema import (
    InitialCashCreate,
    InitialCashUpdate,
    InitialCashResponse,
)

router = APIRouter()

def _sync_initial_portfolio_row(
    db: Session,
    user_id: int,
    entry_date,
    initial_cash,
) -> Portfolio:
    """
    Initial cash is also the first portfolio balance.

    This keeps new-user dashboards, profile KPIs, and charts populated as soon
    as the user enters initial cash, without requiring a separate manual
    portfolio entry.
    """
    portfolio_row = (
        db.query(Portfolio)
        .filter(
            Portfolio.user_id == user_id,
            Portfolio.entry_date == entry_date,
        )
        .first()
    )

    if portfolio_row:
        portfolio_row.balance = initial_cash
        return portfolio_row

    portfolio_row = Portfolio(
        user_id=user_id,
        entry_date=entry_date,
        balance=initial_cash,
    )
    db.add(portfolio_row)
    return portfolio_row

@router.get("/", response_model=InitialCashResponse | None)
def get_initial_cash(
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(InitialCash)
        .filter(InitialCash.user_id == current_user.id)
        .first()
    )
    return row


@router.post("/", response_model=InitialCashResponse, status_code=status.HTTP_201_CREATED)
def create_initial_cash(
    payload: InitialCashCreate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    if payload.initial_cash < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Initial cash must be non-negative.",
        )

    exists = (
        db.query(InitialCash)
        .filter(InitialCash.user_id == current_user.id)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Initial cash already exists.",
        )

    row = InitialCash(
        user_id=current_user.id,
        entry_date=payload.entry_date,
        initial_cash=payload.initial_cash,
    )

    db.add(row)

    _sync_initial_portfolio_row(
        db=db,
        user_id=current_user.id,
        entry_date=payload.entry_date,
        initial_cash=payload.initial_cash,
    )

    db.commit()
    db.refresh(row)
    return row


@router.put("/", response_model=InitialCashResponse)
def update_initial_cash(
    payload: InitialCashUpdate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(InitialCash)
        .filter(InitialCash.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Initial cash not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    if "initial_cash" in update_data and update_data["initial_cash"] is not None:
        if update_data["initial_cash"] < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Initial cash must be non-negative.",
            )

    for field, value in update_data.items():
        setattr(row, field, value)

    _sync_initial_portfolio_row(
        db=db,
        user_id=current_user.id,
        entry_date=row.entry_date,
        initial_cash=row.initial_cash,
    )

    db.commit()
    db.refresh(row)
    return row


@router.delete("/", status_code=status.HTTP_200_OK)
def delete_initial_cash(
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(InitialCash)
        .filter(InitialCash.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Initial cash not found.",
        )

    db.delete(row)
    db.commit()

    return {"message": "Initial cash deleted successfully."}