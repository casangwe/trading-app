# app/routers/transactions.py

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db_connection
from ..models import User, Transactions
from ..auth import get_current_user
from ..schema import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
)

router = APIRouter()


def is_admin(user: User) -> bool:
    """Temporary admin rule: treat user with id == 1 as admin."""
    return user.id == 1


@router.get("/", response_model=List[TransactionResponse])
def list_transactions(
    from_date: Optional[date] = Query(default=None, description="Filter from this date (inclusive)"),
    to_date: Optional[date] = Query(default=None, description="Filter up to this date (inclusive)"),
    transaction_type: Optional[str] = Query(
        default=None,
        description="Filter by transaction_type: 'deposit' or 'withdrawal'",
    ),
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    List transactions for the current user.

    Optional filters:
    - from_date
    - to_date
    - transaction_type ('deposit' or 'withdrawal')
    """
    query = db.query(Transactions).filter(Transactions.user_id == current_user.id)

    if from_date is not None:
        query = query.filter(Transactions.transaction_date >= from_date)
    if to_date is not None:
        query = query.filter(Transactions.transaction_date <= to_date)
    if transaction_type is not None:
        tx_type_lower = transaction_type.lower()
        if tx_type_lower not in ("deposit", "withdrawal"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="transaction_type must be 'deposit' or 'withdrawal'",
            )
        query = query.filter(Transactions.transaction_type == tx_type_lower)

    txs = (
        query
        .order_by(
            Transactions.transaction_date.desc(),
            Transactions.id.desc(),
        )
        .all()
    )
    return txs


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction_by_id(
    transaction_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Get a single transaction by ID.
    """
    tx = db.query(Transactions).filter(Transactions.id == transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    if tx.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this transaction.",
        )

    return tx


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new transaction for the current user.

    - transaction_type: 'deposit' or 'withdrawal'
    - amount: non-negative number
    - timing defaults:
        deposit -> pre_open
        withdrawal -> after_close
    """
    if payload.amount < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be non-negative.",
        )

    timing = payload.timing or (
        "pre_open" if payload.transaction_type == "deposit" else "after_close"
    )

    if timing not in ("pre_open", "after_close"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="timing must be 'pre_open' or 'after_close'",
        )

    db_tx = Transactions(
        user_id=current_user.id,
        transaction_type=payload.transaction_type,
        transaction_date=payload.transaction_date,
        amount=payload.amount,
        transaction_summary=payload.transaction_summary,
        timing=timing,
    )

    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing transaction.

    - Normal users: only their own transactions
    - Admin: can update any transaction
    """
    tx = db.query(Transactions).filter(Transactions.id == transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    if tx.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    if "timing" in update_data and update_data["timing"] is not None:
        if update_data["timing"] not in ("pre_open", "after_close"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="timing must be 'pre_open' or 'after_close'",
            )

    if "transaction_type" in update_data and update_data["transaction_type"] is not None:
        tx_type = update_data["transaction_type"].lower()
        if tx_type not in ("deposit", "withdrawal"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="transaction_type must be 'deposit' or 'withdrawal'",
            )
        update_data["transaction_type"] = tx_type

    if "amount" in update_data and update_data["amount"] is not None:
        if update_data["amount"] < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount must be non-negative.",
            )

    for field, value in update_data.items():
        setattr(tx, field, value)

    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a transaction.

    - Normal users: can only delete their own
    - Admin: can delete any
    """
    tx = db.query(Transactions).filter(Transactions.id == transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    if tx.user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this transaction.",
        )

    db.delete(tx)
    db.commit()
    return


# # app/routers/transactions.py

# from datetime import date
# from typing import List, Optional

# from fastapi import APIRouter, Depends, HTTPException, Query, status
# from sqlalchemy.orm import Session

# from ..database import get_db_connection
# from ..models import User, Transactions
# from ..auth import get_current_user
# from ..schema import (
#     TransactionCreate,
#     TransactionUpdate,
#     TransactionResponse,
# )

# router = APIRouter()


# def is_admin(user: User) -> bool:
#     """Temporary admin rule: treat user with id == 1 as admin."""
#     return user.id == 1

# @router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
# def create_transaction(
#     payload: TransactionCreate,
#     db: Session = Depends(get_db_connection),
#     current_user: User = Depends(get_current_user),
# ):
#     if payload.amount < 0:
#         raise HTTPException(status_code=400, detail="Amount must be non-negative.")

#     timing = payload.timing or (
#         "pre_open" if payload.transaction_type == "deposit" else "after_close"
#     )

#     if timing not in ("pre_open", "after_close"):
#         raise HTTPException(status_code=400, detail="timing must be 'pre_open' or 'after_close'")

#     db_tx = Transactions(
#         user_id=current_user.id,
#         transaction_type=payload.transaction_type,
#         transaction_date=payload.transaction_date,
#         amount=payload.amount,
#         transaction_summary=payload.transaction_summary,
#         timing=timing,
#     )

#     db.add(db_tx)
#     db.commit()
#     db.refresh(db_tx)
#     return db_tx

# @router.get("/", response_model=List[TransactionResponse])
# def list_transactions(
#     from_date: Optional[date] = Query(default=None, description="Filter from this date (inclusive)"),
#     to_date: Optional[date] = Query(default=None, description="Filter up to this date (inclusive)"),
#     transaction_type: Optional[str] = Query(
#         default=None,
#         description="Filter by transaction_type: 'deposit' or 'withdrawal'",
#     ),
#     db: Session = Depends(get_db_connection),
#     current_user: User = Depends(get_current_user),
# ):
#     """
#     List transactions for the current user.

#     Optional filters:
#     - from_date
#     - to_date
#     - transaction_type ('deposit' or 'withdrawal')
#     """
#     query = db.query(Transactions).filter(Transactions.user_id == current_user.id)

#     if from_date is not None:
#         query = query.filter(Transactions.transaction_date >= from_date)
#     if to_date is not None:
#         query = query.filter(Transactions.transaction_date <= to_date)
#     if transaction_type is not None:
#         tx_type_lower = transaction_type.lower()
#         if tx_type_lower not in ("deposit", "withdrawal"):
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="transaction_type must be 'deposit' or 'withdrawal'",
#             )
#         query = query.filter(Transactions.transaction_type == tx_type_lower)

#     # txs = query.order_by(Transactions.transaction_date.desc(), Transactions.id.desc()).all()
#     txs = (
#         query
#         .order_by(
#             Transactions.transaction_date.desc(),
#             Transactions.id.desc()
#         )
#         .all()
#     )
#     return txs

#     # return txs


# @router.get("/{transaction_id}", response_model=TransactionResponse)
# def get_transaction_by_id(
#     transaction_id: int,
#     db: Session = Depends(get_db_connection),
#     current_user: User = Depends(get_current_user),
# ):
#     """
#     Get a single transaction by ID.
#     """
#     tx = db.query(Transactions).filter(Transactions.id == transaction_id).first()
#     if not tx:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Transaction not found.",
#         )

#     if tx.user_id != current_user.id and not is_admin(current_user):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Not authorized to view this transaction.",
#         )

#     return tx


# # @router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
# # def create_transaction(
# #     payload: TransactionCreate,
# #     db: Session = Depends(get_db_connection),
# #     current_user: User = Depends(get_current_user),
# # ):
# #     """
# #     Create a new transaction for the current user.

# #     - transaction_type: 'deposit' or 'withdrawal'
# #     - amount: positive number
# #     """
# #     if payload.amount < 0:
# #         raise HTTPException(
# #             status_code=status.HTTP_400_BAD_REQUEST,
# #             detail="Amount must be non-negative.",
# #         )
    
# #     timing = getattr(payload, "timing", None) or ("pre_open" if payload.transaction_type == "deposit" else "after_close")
# #     is_initial_cash = bool(getattr(payload, "is_initial_cash", False))

# #     # only deposits can be initial cash
# #     if is_initial_cash and payload.transaction_type != "deposit":
# #         raise HTTPException(status_code=400, detail="Initial cash must be a deposit.")

# #     # enforce only one initial cash row per user
# #     if is_initial_cash:
# #         exists = (
# #             db.query(Transactions)
# #             .filter(
# #                 Transactions.user_id == current_user.id,
# #                 Transactions.is_initial_cash == True,
# #             )
# #             .first()
# #         )
# #     if exists:
# #         raise HTTPException(status_code=400, detail="Initial cash already exists.")

# #     db_tx = Transactions(
# #         user_id=current_user.id,
# #         transaction_type=payload.transaction_type,
# #         transaction_date=payload.transaction_date,
# #         amount=payload.amount,
# #         transaction_summary=payload.transaction_summary,
# #         timing=payload.timing,
# #         is_initial_cash=payload.is_initial_cash,
# #     )

# #     db.add(db_tx)
# #     db.commit()
# #     db.refresh(db_tx)

# #     return db_tx

# @router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
# def create_transaction(
#     payload: TransactionCreate,
#     db: Session = Depends(get_db_connection),
#     current_user: User = Depends(get_current_user),
# ):
#     if payload.amount < 0:
#         raise HTTPException(status_code=400, detail="Amount must be non-negative.")

#     # Defaults
#     timing = payload.timing or ("pre_open" if payload.transaction_type == "deposit" else "after_close")
#     is_initial_cash = bool(payload.is_initial_cash)

#     if timing not in ("pre_open", "after_close"):
#         raise HTTPException(status_code=400, detail="timing must be 'pre_open' or 'after_close'")

#     # only deposits can be initial cash
#     if is_initial_cash and payload.transaction_type != "deposit":
#         raise HTTPException(status_code=400, detail="Initial cash must be a deposit.")

#     # enforce only one initial cash row per user
#     if is_initial_cash:
#         exists = (
#             db.query(Transactions)
#             .filter(
#                 Transactions.user_id == current_user.id,
#                 Transactions.is_initial_cash == False,
#             )
#             .first()
#         )
#         if exists:
#             raise HTTPException(status_code=400, detail="Initial cash already exists.")

#     db_tx = Transactions(
#         user_id=current_user.id,
#         transaction_type=payload.transaction_type,
#         transaction_date=payload.transaction_date,
#         amount=payload.amount,
#         transaction_summary=payload.transaction_summary,
#         timing=timing,
#         is_initial_cash=False,
#     )

#     db.add(db_tx)
#     db.commit()
#     db.refresh(db_tx)
#     return db_tx

# @router.put("/{transaction_id}", response_model=TransactionResponse)
# def update_transaction(transaction_id: int, payload: TransactionUpdate, db: Session = Depends(get_db_connection), current_user: User = Depends(get_current_user)):
#     tx = db.query(Transactions).filter(Transactions.id == transaction_id).first()
#     if not tx:
#         raise HTTPException(status_code=404, detail="Transaction not found.")
#     if tx.user_id != current_user.id and not is_admin(current_user):
#         raise HTTPException(status_code=403, detail="Not authorized.")

#     update_data = payload.model_dump(exclude_unset=True)

#     # validate timing if provided
#     if "timing" in update_data and update_data["timing"] is not None:
#         if update_data["timing"] not in ("pre_open", "after_close"):
#             raise HTTPException(status_code=400, detail="timing must be 'pre_open' or 'after_close'")

#     # normalize type
#     if "transaction_type" in update_data and update_data["transaction_type"] is not None:
#         tx_type = update_data["transaction_type"].lower()
#         if tx_type not in ("deposit", "withdrawal"):
#             raise HTTPException(status_code=400, detail="transaction_type must be 'deposit' or 'withdrawal'")
#         update_data["transaction_type"] = tx_type

#     # amount validation
#     if "amount" in update_data and update_data["amount"] is not None and update_data["amount"] < 0:
#         raise HTTPException(status_code=400, detail="Amount must be non-negative.")

#     for field, value in update_data.items():
#         setattr(tx, field, value)

#     db.commit()
#     db.refresh(tx)
#     return tx


# # @router.put("/{transaction_id}", response_model=TransactionResponse)
# # def update_transaction(
# #     transaction_id: int,
# #     payload: TransactionUpdate,
# #     db: Session = Depends(get_db_connection),
# #     current_user: User = Depends(get_current_user),
# # ):
# #     tx = db.query(Transactions).filter(Transactions.id == transaction_id).first()
# #     if not tx:
# #         raise HTTPException(status_code=404, detail="Transaction not found.")

# #     if tx.user_id != current_user.id and not is_admin(current_user):
# #         raise HTTPException(status_code=403, detail="Not authorized to update this transaction.")

# #     update_data = payload.model_dump(exclude_unset=True)

# #     # validate amount
# #     if "amount" in update_data and update_data["amount"] is not None and update_data["amount"] < 0:
# #         raise HTTPException(status_code=400, detail="Amount must be non-negative.")

# #     # normalize transaction_type if provided
# #     if "transaction_type" in update_data and update_data["transaction_type"] is not None:
# #         tx_type = update_data["transaction_type"].lower()
# #         if tx_type not in ("deposit", "withdrawal"):
# #             raise HTTPException(status_code=400, detail="transaction_type must be 'deposit' or 'withdrawal'")
# #         update_data["transaction_type"] = tx_type

# #     # validate timing if provided
# #     if "timing" in update_data and update_data["timing"] is not None:
# #         if update_data["timing"] not in ("pre_open", "after_close"):
# #             raise HTTPException(status_code=400, detail="timing must be 'pre_open' or 'after_close'")

# #     # validate is_initial_cash if provided
# #     if update_data.get("is_initial_cash") is True:
# #         # must be (or become) a deposit
# #         effective_type = update_data.get("transaction_type", tx.transaction_type)
# #         if effective_type != "deposit":
# #             raise HTTPException(status_code=400, detail="Initial cash must be a deposit.")

# #         exists = (
# #             db.query(Transactions)
# #             .filter(
# #                 Transactions.user_id == current_user.id,
# #                 Transactions.is_initial_cash == True,
# #                 Transactions.id != tx.id,
# #             )
# #             .first()
# #         )
# #         if exists:
# #             raise HTTPException(status_code=400, detail="Initial cash already exists.")

# #     # apply updates
# #     for field, value in update_data.items():
# #         setattr(tx, field, value)

# #     db.add(tx)
# #     db.commit()
# #     db.refresh(tx)
# #     return tx


# # @router.put("/{transaction_id}", response_model=TransactionResponse)
# # def update_transaction(
# #     transaction_id: int,
# #     payload: TransactionUpdate,
# #     db: Session = Depends(get_db_connection),
# #     current_user: User = Depends(get_current_user),
# # ):
# #     """
# #     Update an existing transaction.

# #     - Normal user: only their own transactions.
# #     - Admin: can update any transaction.
# #     """
# #     tx = db.query(Transactions).filter(Transactions.id == transaction_id).first()
# #     timing = getattr(payload, "timing", None) or ("pre_open" if payload.transaction_type == "deposit" else "after_close")
# #     is_initial_cash = bool(getattr(payload, "is_initial_cash", False))

# #     if is_initial_cash and payload.transaction_type != "deposit":
# #         raise HTTPException(status_code=400, detail="Initial cash must be a deposit.")

# #     # enforce only one initial cash row per user
# #     if is_initial_cash:
# #         exists = (
# #             db.query(Transactions)
# #             .filter(
# #                 Transactions.user_id == current_user.id,
# #                 Transactions.is_initial_cash == True,
# #             )
# #             .first()
# #         )
# #     if exists:
# #         raise HTTPException(status_code=400, detail="Initial cash already exists.")

# #     if not tx:
# #         raise HTTPException(
# #             status_code=status.HTTP_404_NOT_FOUND,
# #             detail="Transaction not found.",
# #         )

# #     if tx.user_id != current_user.id and not is_admin(current_user):
# #         raise HTTPException(
# #             status_code=status.HTTP_403_FORBIDDEN,
# #             detail="Not authorized to update this transaction.",
# #         )

# #     if "timing" in update_data and update_data["timing"] is not None:
# #         if update_data["timing"] not in ("pre_open", "after_close"):
# #             raise HTTPException(status_code=400, detail="timing must be 'pre_open' or 'after_close'")

# #     if update_data.get("is_initial_cash") is True:
# #         exists = (
# #             db.query(Transactions)
# #             .filter(
# #                 Transactions.user_id == current_user.id,
# #                 Transactions.is_initial_cash == True,
# #                 Transactions.id != tx.id,
# #             )
# #             .first()
# #         )
# #         if exists:
# #             raise HTTPException(status_code=400, detail="Initial cash already set.")


# #     update_data = payload.model_dump(exclude_unset=True)

# #     # Basic validation on updated fields
# #     if "amount" in update_data and update_data["amount"] is not None:
# #         if update_data["amount"] < 0:
# #             raise HTTPException(
# #                 status_code=status.HTTP_400_BAD_REQUEST,
# #                 detail="Amount must be non-negative.",
# #             )

# #     if "transaction_type" in update_data and update_data["transaction_type"] is not None:
# #         tx_type = update_data["transaction_type"].lower()
# #         if tx_type not in ("deposit", "withdrawal"):
# #             raise HTTPException(
# #                 status_code=status.HTTP_400_BAD_REQUEST,
# #                 detail="transaction_type must be 'deposit' or 'withdrawal'",
# #             )
# #         update_data["transaction_type"] = tx_type

# #     for field, value in update_data.items():
# #         setattr(tx, field, value)

# #     db.add(tx)
# #     db.commit()
# #     db.refresh(tx)

# #     return tx


# @router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_transaction(
#     transaction_id: int,
#     db: Session = Depends(get_db_connection),
#     current_user: User = Depends(get_current_user),
# ):
#     """
#     Delete a transaction.

#     - Normal users: can only delete their own.
#     - Admin: can delete any.
#     """
#     tx = db.query(Transactions).filter(Transactions.id == transaction_id).first()
#     if not tx:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Transaction not found.",
#         )

#     if tx.user_id != current_user.id and not is_admin(current_user):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Not authorized to delete this transaction.",
#         )

#     db.delete(tx)
#     db.commit()
#     return  # 204
