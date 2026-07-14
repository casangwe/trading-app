# app/routers/initial_cash.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db_connection
from ..auth import get_current_user
from ..models import User, InitialCash
from ..schema import (
    InitialCashCreate,
    InitialCashUpdate,
    InitialCashResponse,
)

router = APIRouter()


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