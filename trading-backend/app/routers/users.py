# app/routers/users.py

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db_connection
from app.models import User
from app.schema import UserResponse, UserUpdate
from app.auth import get_current_user

router = APIRouter()


def is_admin(user: User) -> bool:
    """
    Temporary admin rule:
    - Treat user with id == 1 as "admin".

    This is just a placeholder until you add proper role support.
    Change this logic later when you introduce roles/permissions.
    """
    return user.id == 1


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Get a single user by ID.

    - Normal users: can only access their own record.
    - Admin (id == 1 for now): can access any user.
    """
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Update a user by ID.

    - Normal users: can only update their own record.
    - Admin (id == 1 for now): can update any user.

    Does NOT handle password changes here; that should be a separate endpoint.
    """
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Uniqueness checks for username / email if they are being updated
    if user_update.username and user_update.username != user.username:
        existing_username = (
            db.query(User)
            .filter(User.username == user_update.username, User.id != user_id)
            .first()
        )
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already in use.",
            )

    if user_update.email and user_update.email != user.email:
        existing_email = (
            db.query(User)
            .filter(User.email == user_update.email, User.id != user_id)
            .first()
        )
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use.",
            )

    # Apply updates only for fields that are not None
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a user by ID.

    - Normal users: can only delete their own record.
    - Admin (id == 1 for now): can delete any user.
    """
    if current_user.id != user_id and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this user.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    db.delete(user)
    db.commit()
    return  # 204 NO CONTENT


@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    """
    List all users.

    - Admin only (id == 1 for now).
    - Pagination can be added later.
    """
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to list all users.",
        )

    users = db.query(User).all()
    return users
