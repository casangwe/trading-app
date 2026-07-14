# # app/routers/portfolio.py

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db_connection
from ..models import User, Portfolio
from ..auth import get_current_user
from ..schema import PortfolioCreate, PortfolioUpdate, PortfolioResponse

router = APIRouter()


def is_admin(user: User) -> bool:
    """Temporary admin rule: treat user with id == 1 as admin."""
    return user.id == 1


@router.get("/", response_model=List[PortfolioResponse])
def list_portfolio_entries(
    from_date: Optional[date] = Query(default=None, description="Filter from this date (inclusive)"),
    to_date: Optional[date] = Query(default=None, description="Filter up to this date (inclusive)"),
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    List portfolio entries (balances) for the current user.
    """
    query = db.query(Portfolio).filter(Portfolio.user_id == current_user.id)

    if from_date is not None:
        query = query.filter(Portfolio.entry_date >= from_date)
    if to_date is not None:
        query = query.filter(Portfolio.entry_date <= to_date)

    entries = query.order_by(Portfolio.entry_date.asc()).all()
    return entries


@router.get("/latest", response_model=PortfolioResponse)
def get_latest_portfolio_entry(
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Get the most recent portfolio entry (latest balance) for the current user.
    """
    entry = (
        db.query(Portfolio)
        .filter(Portfolio.user_id == current_user.id)
        .order_by(Portfolio.entry_date.desc())
        .first()
    )

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No portfolio entries found for this user.",
        )

    return entry


@router.post("/", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
def create_portfolio_entry(
    payload: PortfolioCreate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new portfolio entry for the current user.

    Enforces one entry per (user_id, entry_date).
    """
    existing = (
        db.query(Portfolio)
        .filter(
            Portfolio.user_id == current_user.id,
            Portfolio.entry_date == payload.entry_date,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Portfolio entry already exists for this date.",
        )

    db_entry = Portfolio(
        user_id=current_user.id,
        entry_date=payload.entry_date,
        balance=payload.balance,
    )

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    return db_entry


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
def get_portfolio_entry_by_id(
    portfolio_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Get a single portfolio entry by ID.
    """
    entry = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio entry not found.",
        )

    if entry.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this portfolio entry.",
        )

    return entry


@router.put("/{portfolio_id}", response_model=PortfolioResponse)
def update_portfolio_entry(
    portfolio_id: int,
    payload: PortfolioUpdate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Update a portfolio entry by ID.
    """
    entry = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio entry not found.",
        )

    if entry.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this portfolio entry.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    new_entry_date = update_data.get("entry_date")
    if new_entry_date and new_entry_date != entry.entry_date:
        conflict = (
            db.query(Portfolio)
            .filter(
                Portfolio.user_id == entry.user_id,
                Portfolio.entry_date == new_entry_date,
                Portfolio.id != entry.id,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another portfolio entry already exists for this date.",
            )

    for field, value in update_data.items():
        setattr(entry, field, value)

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_entry(
    portfolio_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a portfolio entry by ID.
    """
    entry = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio entry not found.",
        )

    if entry.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this portfolio entry.",
        )

    db.delete(entry)
    db.commit()
    return  # 204
