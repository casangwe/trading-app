# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import router as auth_router
from .routers.users import router as users_router
from .routers.portfolio import router as portfolio_router
from .routers.initial_cash import router as initial_cash_router
from .routers.transactions import router as transactions_router
from .routers.trades import router as trades_router
from .routers.rules import router as rules_router
from .routers.financial import router as financial_router
from .routers.dashboard import router as dashboard_router


app = FastAPI(
    title="Trading Backend API",
    version="0.1.0",
    description="Backend for the Wealth Trade / trading app.",
)

# -----------------------------
# CORS CONFIGURATION
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# ROUTERS
# -----------------------------
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(portfolio_router, prefix="/portfolio", tags=["portfolio"])
app.include_router(initial_cash_router, prefix="/initial-cash", tags=["initial_cash"])
app.include_router(transactions_router, prefix="/transactions", tags=["transactions"])
app.include_router(trades_router, prefix="/trades", tags=["trades"])
app.include_router(rules_router, prefix="/rules", tags=["rules"])
app.include_router(financial_router, prefix="/financial", tags=["financial"])
app.include_router(dashboard_router, tags=["dashboard"])


@app.get("/health")
def health_check():
    return {"status": "ok"}