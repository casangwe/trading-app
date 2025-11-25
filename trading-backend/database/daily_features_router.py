# trading-backend/database/daily_features_router.py

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db_connection
from database import crud, schema
from database.daily_features import (
    preview_derived_for_ticker,
    validate_row_math,
    load_ticker_from_excel_to_db,
)

router = APIRouter(prefix="/daily-features", tags=["daily-features"])


def get_db():
    db = next(get_db_connection())
    try:
        yield db
    finally:
        db.close()


class PushDailyFeaturesRequest(BaseModel):
    user_id: int
    ticker: str


@router.post("/push")
def push_daily_features(
    payload: PushDailyFeaturesRequest,
    db: Session = Depends(get_db),
):
    try:
        rows = load_ticker_from_excel_to_db(
            db=db,
            user_id=payload.user_id,
            ticker=payload.ticker,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "status": "ok",
        "ticker": payload.ticker,
        "rows_upserted": rows,
    }


@router.get("/preview")
def preview_daily_features(
    ticker: str,
    limit: int = 30,
):
    try:
        return preview_derived_for_ticker(ticker=ticker, limit=limit)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/validate")
def validate_daily_feature_row(
    ticker: str,
    index_from_end: int = 1,
):
    try:
        return validate_row_math(ticker=ticker, index_from_end=index_from_end)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{ticker}", response_model=List[schema.DailyFeatureResponse])
def get_daily_features_for_ticker(
    ticker: str,
    user_id: int,
    last_n: int = 20,
    db: Session = Depends(get_db),
):
    """
    Fetch the most recent N derived daily_features rows for a ticker+user.
    Returns rows sorted by session_date ascending.
    """
    rows = crud.get_daily_features(
        db=db,
        user_id=user_id,
        ticker=ticker,
        limit=last_n   # limit already returns newest first in CRUD
    )

    # We want chronological order for charting, so reverse it
    rows = list(reversed(rows))
    return rows
