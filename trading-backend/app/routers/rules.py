# app/routers/rules.py

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db_connection
from ..models import User, Rules
from ..auth import get_current_user
from ..schema import RuleCreate, RuleUpdate, RuleResponse

router = APIRouter()


def is_admin(user: User) -> bool:
    """Temporary admin rule: treat user with id == 1 as admin."""
    return user.id == 1


@router.get("/", response_model=List[RuleResponse])
def list_rules(
    from_date: Optional[date] = Query(default=None, description="Filter from this date (inclusive)"),
    to_date: Optional[date] = Query(default=None, description="Filter up to this date (inclusive)"),
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    List rule entries (trading rules / notes) for the current user.
    """
    query = db.query(Rules).filter(Rules.user_id == current_user.id)

    if from_date is not None:
        query = query.filter(Rules.entry_date >= from_date)
    if to_date is not None:
        query = query.filter(Rules.entry_date <= to_date)

    rules = query.order_by(Rules.entry_date.asc(), Rules.id.asc()).all()
    return rules


@router.get("/{rule_id}", response_model=RuleResponse)
def get_rule_by_id(
    rule_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Get a single rule entry by ID.
    """
    rule = db.query(Rules).filter(Rules.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found.",
        )

    if rule.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this rule.",
        )

    return rule


@router.post("/", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
def create_rule(
    payload: RuleCreate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new rule / trading note for the current user.
    """
    db_rule = Rules(
        user_id=current_user.id,
        entry_date=payload.entry_date,
        rule=payload.rule,
    )

    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)

    return db_rule


@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(
    rule_id: int,
    payload: RuleUpdate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing rule entry.
    """
    rule = db.query(Rules).filter(Rules.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found.",
        )

    if rule.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this rule.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(rule, field, value)

    db.add(rule)
    db.commit()
    db.refresh(rule)

    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a rule entry.
    """
    rule = db.query(Rules).filter(Rules.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found.",
        )

    if rule.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this rule.",
        )

    db.delete(rule)
    db.commit()
    return  # 204
