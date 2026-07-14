# app/routers/financial.py

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db_connection
from ..models import User, Financial
from ..auth import get_current_user
from ..schema import FinancialCreate, FinancialUpdate, FinancialResponse

router = APIRouter()


def is_admin(user: User):
    return user.id == 1

def compute_financial_values(
    user_id: int,
    entry_date: date,
    income: float,
    nec: float,
    ffa: float,
    play: float,
    ltss: float,
    give: float,
    db: Session
):
    curr_total = nec + ffa + play + ltss + give

    prev_entry = (
        db.query(Financial)
        .filter(
            Financial.user_id == user_id,
            Financial.entry_date < entry_date
        )
        .order_by(Financial.entry_date.desc())
        .first()
    )

    if not prev_entry:
        # Baseline entry
        return 0.0, 0.0, round(curr_total, 2)

    prev_total = (
        float(prev_entry.nec or 0)
        + float(prev_entry.ffa or 0)
        + float(prev_entry.play or 0)
        + float(prev_entry.ltss or 0)
        + float(prev_entry.give or 0)
    )

    delta = round(curr_total - prev_total, 2)

    if delta > 0:
        gains = delta
        expenses = 0.0
    else:
        gains = 0.0
        expenses = abs(delta)

    return expenses, gains, round(curr_total, 2)




@router.get("/", response_model=List[FinancialResponse])
def list_financial_entries(
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Financial).filter(Financial.user_id == current_user.id)

    if from_date:
        query = query.filter(Financial.entry_date >= from_date)
    if to_date:
        query = query.filter(Financial.entry_date <= to_date)

    return query.order_by(Financial.entry_date.desc()).all()


@router.get("/latest", response_model=FinancialResponse)
def get_latest_financial(
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    entry = (
        db.query(Financial)
        .filter(Financial.user_id == current_user.id)
        .order_by(Financial.entry_date.desc())
        .first()
    )

    if not entry:
        raise HTTPException(404, "No financial entries found.")

    return entry


@router.get("/{financial_id}", response_model=FinancialResponse)
def get_financial_by_id(
    financial_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(Financial).filter(Financial.id == financial_id).first()
    if not entry:
        raise HTTPException(404, "Entry not found.")

    if entry.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(403, "Not authorized.")

    return entry

@router.post("/", response_model=FinancialResponse, status_code=201)
def create_financial(
    payload: FinancialCreate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(Financial)
        .filter(
            Financial.user_id == current_user.id,
            Financial.entry_date == payload.entry_date,
        )
        .first()
    )

    if existing:
        raise HTTPException(400, "Entry for this date already exists.")

    income = float(payload.income or 0.0)
    nec = float(payload.nec or 0.0)
    ffa = float(payload.ffa or 0.0)
    play = float(payload.play or 0.0)
    ltss = float(payload.ltss or 0.0)
    give = float(payload.give or 0.0)

    expenses, gains, networth = compute_financial_values(
        user_id=current_user.id,
        entry_date=payload.entry_date,
        income=income,
        nec=nec,
        ffa=ffa,
        play=play,
        ltss=ltss,
        give=give,
        db=db,
    )

    entry = Financial(
        user_id=current_user.id,
        entry_date=payload.entry_date,
        income=income,
        nec=nec,
        ffa=ffa,
        play=play,
        ltss=ltss,
        give=give,
        expenses=expenses,
        gains=gains,
        networth=networth,  # ✅ ALWAYS explicitly set
        comments=payload.comments,
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry

@router.put("/{financial_id}", response_model=FinancialResponse)
def update_financial(
    financial_id: int,
    payload: FinancialUpdate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(Financial).filter(Financial.id == financial_id).first()
    if not entry:
        raise HTTPException(404, "Entry not found.")

    if entry.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(403, "Not authorized.")

    update_data = payload.model_dump(exclude_unset=True)

    # If entry_date changes, enforce uniqueness
    if "entry_date" in update_data:
        conflict = (
            db.query(Financial)
            .filter(
                Financial.user_id == current_user.id,
                Financial.entry_date == update_data["entry_date"],
                Financial.id != financial_id,
            )
            .first()
        )
        if conflict:
            raise HTTPException(400, "Another entry already exists for this date.")

    # Apply updates
    for key, value in update_data.items():
        setattr(entry, key, value)

    # Recompute if any value that affects calculations changed
    affecting_fields = {"income", "nec", "ffa", "play", "ltss", "give", "entry_date"}

    if affecting_fields.intersection(update_data.keys()):
        expenses, gains, networth = compute_financial_values(
            user_id=current_user.id,
            entry_date=entry.entry_date,
            income=float(entry.income or 0),
            nec=float(entry.nec or 0),
            ffa=float(entry.ffa or 0),
            play=float(entry.play or 0),
            ltss=float(entry.ltss or 0),
            give=float(entry.give or 0),
            db=db
        )

        entry.expenses = expenses
        entry.gains = gains
        entry.networth = networth

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry
    

@router.delete("/{financial_id}", status_code=204)
def delete_financial(
    financial_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(Financial).filter(Financial.id == financial_id).first()
    if not entry:
        raise HTTPException(404, "Entry not found.")

    if entry.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(403, "Not authorized.")

    db.delete(entry)
    db.commit()


# @router.post("/recompute", status_code=200)
# def recompute_financial_entries(
#     db: Session = Depends(get_db_connection),
#     current_user: User = Depends(get_current_user),
# ):
#     entries = (
#         db.query(Financial)
#         .filter(Financial.user_id == current_user.id)
#         .order_by(Financial.entry_date.asc())
#         .all()
#     )

#     if not entries:
#         raise HTTPException(404, "No financial entries found.")

#     prev_total = None

#     for entry in entries:
#         curr_total = (
#             float(entry.nec or 0)
#             + float(entry.ffa or 0)
#             + float(entry.play or 0)
#             + float(entry.ltss or 0)
#             + float(entry.give or 0)
#         )

#         if prev_total is None:
#             entry.expenses = 0.0
#             entry.gains = 0.0
#             entry.networth = round(curr_total, 2)
#         else:
#             delta = round(curr_total - prev_total, 2)

#             if delta > 0:
#                 entry.gains = delta
#                 entry.expenses = 0.0
#             else:
#                 entry.gains = 0.0
#                 entry.expenses = abs(delta)

#             entry.networth = round(curr_total, 2)

#         prev_total = curr_total

#     db.commit()

#     return {
#         "message": "Financial entries recomputed correctly.",
#         "entries_updated": len(entries),
#     }
