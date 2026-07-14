# app/auth.py

from datetime import datetime, timedelta
from typing import Optional

import bcrypt  # type: ignore
import jwt     # type: ignore
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .config import SECRET_KEY, ALGORITHM
from .database import get_db_connection
from .models import User
from .schema import UserCreate, UserResponse

router = APIRouter()

# This should point to the actual token endpoint path (/auth/token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


# -----------------------------
# Password hashing & verification
# -----------------------------

def get_password_hash(password: str) -> str:
    """
    Hash a plain-text password using bcrypt.

    We try the standard "bytes" API first (most common bcrypt),
    and if that fails (TypeError expecting str), we fall back to
    calling hashpw with the plain string to support environments
    where bcrypt is wrapped differently.
    """
    try:
        # Most common: bcrypt expects bytes
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    except TypeError:
        # Fallback: bcrypt in this environment expects str
        hashed = bcrypt.hashpw(password, bcrypt.gensalt())  # type: ignore[arg-type]

    # Normalize to str for DB storage
    if isinstance(hashed, bytes):
        return hashed.decode("utf-8")
    return hashed


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a stored bcrypt hash.

    Some bcrypt builds don’t expose bcrypt.checkpw, but we can verify by:
      bcrypt.hashpw(plain_password, stored_hash) == stored_hash
    """
    # Normalize stored hash
    if isinstance(hashed_password, str):
        stored = hashed_password.encode("utf-8")
    else:
        stored = hashed_password

    try:
        # Most common: bcrypt expects bytes
        candidate = bcrypt.hashpw(plain_password.encode("utf-8"), stored)
        return candidate == stored
    except TypeError:
        # Fallback: bcrypt in this environment expects str
        # (In that case, don't encode)
        candidate = bcrypt.hashpw(plain_password, hashed_password)  # type: ignore[arg-type]
        return candidate == hashed_password


# -----------------------------
# JWT helpers
# -----------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # default 15 minutes
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    db: Session = Depends(get_db_connection),
    token: str = Depends(oauth2_scheme),
) -> User:
    """
    Retrieve the current user from the JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise credentials_exception

        return user

    except jwt.PyJWTError:
        raise credentials_exception


# -----------------------------
# Routes
# -----------------------------

@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db_connection),
):
    """
    OAuth2-compatible login endpoint.

    Expects form fields:
    - username
    - password
    """
    if not form_data.username or not form_data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required.",
        )

    user = db.query(User).filter(User.username == form_data.username).first()

    if not user:
        print("User not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.password_hash):
        print("Password mismatch")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password mismatch",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Use user.id as the subject; it's fine to store as int
    access_token = create_access_token(data={"sub": user.id})

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/users/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db_connection),
):
    """
    Create a new user.
    """
    # Check for existing username or email
    existing_user = (
        db.query(User)
        .filter((User.username == user.username) | (User.email == user.email))
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )

    # Hash the password
    hashed_password = get_password_hash(user.password)

    # Create user record
    db_user = User(
        fname=user.fname,
        lname=user.lname,
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        phone_number=user.phone_number,
        account_type=user.account_type,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    user_response = UserResponse(
        id=db_user.id,
        fname=db_user.fname,
        lname=db_user.lname,
        username=db_user.username,
        email=db_user.email,
        phone_number=db_user.phone_number,
        account_type=db_user.account_type,
    )

    return user_response
