# app/routers/dashboard.py

from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db_connection
from ..auth import get_current_user
from ..models import User, Portfolio, Trades, Transactions, Financial, InitialCash

router = APIRouter()


# =========================================================
# Helper Functions
# =========================================================

def _sum_transactions_on_date(
    db: Session,
    user_id: int,
    txn_type: str,
    txn_date: date,
    timing: str | None = None,
) -> float:
    q = (
        db.query(func.sum(Transactions.amount))
        .filter(
            Transactions.user_id == user_id,
            Transactions.transaction_type == txn_type,
            Transactions.transaction_date == txn_date,
        )
    )

    if timing is not None:
        q = q.filter(Transactions.timing == timing)

    return float(q.scalar() or 0)


def _prepend_initial_cash_anchor(points, initial_cash_row):
    """
    Add a synthetic starting point so the chart can show initial cash separately
    from the first same-day portfolio close.

    Rules:
    - If first portfolio point is on the same date as initial cash, prepend
      previous day with initial_cash value.
    - If first portfolio point is after the initial cash date, prepend the
      actual initial cash date.
    - Otherwise return points unchanged.
    """
    if not points or not initial_cash_row:
        return points

    initial_date = initial_cash_row.entry_date
    initial_value = round(float(initial_cash_row.initial_cash), 2)

    first_date = points[0]["date"]
    first_value = round(float(points[0]["value"]), 2)

    if first_date == initial_date and first_value == initial_value:
        return points

    if first_date == initial_date:
        anchor_date = initial_date - timedelta(days=1)
    elif first_date > initial_date:
        anchor_date = initial_date
    else:
        return points

    # anchor = {"date": anchor_date, "value": initial_value}
    anchor = {
        "date": anchor_date,
        "value": initial_value,
        "actual_value": initial_value,
        "portfolio_close": initial_value,
        "deposits": 0.0,
        "withdrawals": 0.0,
        "net_flow": 0.0,
    }
    return [anchor] + points

def _prepend_home_initial_cash_anchor(points, initial_cash_row):
    """
    Home chart version of the initial cash anchor.

    The Home chart is rebased for deposits/withdrawals so cash movement does not
    create fake cliffs/spikes. The initial cash anchor must be rebased too.

    Example:
      initial cash = 550
      later withdrawal = 500

      regular anchor would be 550, then next point may be 50.
      home anchor should be 50 so the chart does not show a fake drop.
    """
    if not points or not initial_cash_row:
        return points

    initial_date = initial_cash_row.entry_date
    initial_value = round(float(initial_cash_row.initial_cash), 2)

    first_date = points[0]["date"]

    if first_date == initial_date:
        anchor_date = initial_date - timedelta(days=1)
    elif first_date > initial_date:
        anchor_date = initial_date
    else:
        return points

    total_future_net_flow = sum(float(p.get("net_flow", 0) or 0) for p in points)
    adjusted_initial_value = round(initial_value + total_future_net_flow, 2)

    anchor = {
        "date": anchor_date,
        "value": adjusted_initial_value,
        "actual_value": adjusted_initial_value,
        "portfolio_close": initial_value,
        "deposits": 0.0,
        "withdrawals": 0.0,
        "net_flow": 0.0,
    }

    return [anchor] + points


def _cash_flows_on_date(db: Session, user_id: int, txn_date: date) -> tuple[float, float]:
    """
    Returns all normal cash movement on a specific date.

    deposits = cash added to the trading account
    withdrawals = cash removed from the trading account

    Important:
    - InitialCash should live in the InitialCash table.
    - Do not count initial cash as a normal deposit here.
    """
    deposits = _sum_transactions_on_date(
        db=db,
        user_id=user_id,
        txn_type="deposit",
        txn_date=txn_date,
        timing=None,
    )

    withdrawals = _sum_transactions_on_date(
        db=db,
        user_id=user_id,
        txn_type="withdrawal",
        txn_date=txn_date,
        timing=None,
    )

    return float(deposits), float(withdrawals)


def _actual_equity_for_entry(db: Session, user_id: int, portfolio_entry) -> float:
    """
    Actual trading account value for Home page.

    This reflects what is actually in the broker/FFA account after same-day
    deposits and withdrawals are included.

    Example:
      portfolio balance = 599.72
      same-day deposit = 208.60
      same-day withdrawal = 198.33

      actual equity = 599.72 + 208.60 - 198.33 = 609.99
    """
    balance = float(portfolio_entry.balance)
    deposits, withdrawals = _cash_flows_on_date(
        db=db,
        user_id=user_id,
        txn_date=portfolio_entry.entry_date,
    )

    return balance + deposits - withdrawals

def _build_actual_equity_points(db: Session, user_id: int, portfolio_entries):
    """
    Actual account-value curve with cash-flow context.

    Used by Home page tooltip:
    - Portfolio close shows the trading close snapshot.
    - Deposits/withdrawals explain account-value movement.
    - Actual value reflects what is really in the broker/FFA account after cash movement.
    """
    points = []

    for p in portfolio_entries:
        deposits, withdrawals = _cash_flows_on_date(
            db=db,
            user_id=user_id,
            txn_date=p.entry_date,
        )

        portfolio_close = float(p.balance)
        actual_equity = portfolio_close + deposits - withdrawals
        net_flow = deposits - withdrawals

        points.append({
            "date": p.entry_date,
            "value": round(actual_equity, 2),
            "portfolio_close": round(portfolio_close, 2),
            "deposits": round(deposits, 2),
            "withdrawals": round(withdrawals, 2),
            "net_flow": round(net_flow, 2),
        })

    return points
# def _build_actual_equity_points(db: Session, user_id: int, portfolio_entries):
#     """
#     Sparse actual equity curve.

#     Used by Home page:
#     - Shows actual current FFA/broker account value.
#     - Deposits increase the value.
#     - Withdrawals decrease the value.
#     """
#     points = []

#     for p in portfolio_entries:
#         actual_equity = _actual_equity_for_entry(db, user_id, p)

#         points.append({
#             "date": p.entry_date,
#             "value": round(actual_equity, 2),
#         })

#     return points

def _build_home_equity_points(db: Session, user_id: int, portfolio_entries):
    """
    Broker-style Home equity curve.

    This curve rebases historical portfolio closes by cash flows that happened
    from each date through the latest date.

    Why:
    - Withdrawals should not create a fake cliff on the chart.
    - Deposits should not create a fake spike on the chart.
    - The Home chart should show account-value scale while preserving trading shape.

    Example:
      6/10 close = 1067.94
      6/11 close = 901.94
      6/11 withdrawal = 500
      6/12 close = 329.12

      Home values:
      6/10 = 1067.94 - 500 = 567.94
      6/11 = 901.94 - 500 = 401.94
      6/12 = 329.12
    """
    if not portfolio_entries:
        return []

    base_points = []

    for p in portfolio_entries:
        deposits, withdrawals = _cash_flows_on_date(
            db=db,
            user_id=user_id,
            txn_date=p.entry_date,
        )

        portfolio_close = float(p.balance)
        net_flow = deposits - withdrawals

        base_points.append({
            "date": p.entry_date,
            "portfolio_close": round(portfolio_close, 2),
            "deposits": round(deposits, 2),
            "withdrawals": round(withdrawals, 2),
            "net_flow": round(net_flow, 2),
        })

    adjusted_points = []
    future_net_flow = 0.0

    for point in reversed(base_points):
        future_net_flow += float(point["net_flow"])

        adjusted_value = float(point["portfolio_close"]) + future_net_flow

        adjusted_points.append({
            "date": point["date"],
            "value": round(adjusted_value, 2),
            "actual_value": round(adjusted_value, 2),
            "portfolio_close": point["portfolio_close"],
            "deposits": point["deposits"],
            "withdrawals": point["withdrawals"],
            "net_flow": point["net_flow"],
        })

    adjusted_points.reverse()
    return adjusted_points


def compute_daily_trading_summary(db: Session, user_id: int, portfolio_entries):
    """
    Daily trading performance for PortfolioSummary (normalized for cash flows):

    Base rule:
    1) Retrieve previous close equity (previous portfolio balance)
    2) Check transactions on that SAME previous date (deposit/withdrawal)
       - because you can withdraw AFTER the market close on the same day
    3) Apply net flow to previous balance to create the NEW OPEN
       open = prev_balance + deposits_on_prev_date - withdrawals_on_prev_date
    4) close = latest balance (current portfolio balance)
    5) pnl = close - open
    6) roi = pnl / open

    Special first-day rule:
    - If only one portfolio row exists and InitialCash exists, use InitialCash
      as the day's open and the portfolio balance as the day's close.
    """
    if not portfolio_entries:
        return None

    latest = portfolio_entries[-1]

    if len(portfolio_entries) == 1:
        initial_cash_row = (
            db.query(InitialCash)
            .filter(InitialCash.user_id == user_id)
            .first()
        )

        close_equity = float(latest.balance)

        if initial_cash_row:
            opening_balance = float(initial_cash_row.initial_cash)
            pnl = close_equity - opening_balance
            roi = (pnl / opening_balance) * 100 if opening_balance != 0 else 0

            return {
                "id": latest.id,
                "open": round(opening_balance, 2),
                "close": round(close_equity, 2),
                "pnl": round(pnl, 2),
                "roi": round(roi, 2),
                "date": latest.entry_date.strftime("%m/%d/%Y"),
            }

        return {
            "id": latest.id,
            "open": round(close_equity, 2),
            "close": round(close_equity, 2),
            "pnl": 0.0,
            "roi": 0.0,
            "date": latest.entry_date.strftime("%m/%d/%Y"),
        }

    previous = portfolio_entries[-2]

    prev_balance = float(previous.balance)
    prev_date = previous.entry_date

    deposits_on_prev = _sum_transactions_on_date(
        db, user_id, "deposit", prev_date, timing="after_close"
    )
    withdrawals_on_prev = _sum_transactions_on_date(
        db, user_id, "withdrawal", prev_date, timing="after_close"
    )
    net_flow_prev = deposits_on_prev - withdrawals_on_prev

    latest_date = latest.entry_date
    deposits_on_latest = _sum_transactions_on_date(
        db, user_id, "deposit", latest_date, timing="pre_open"
    )
    withdrawals_on_latest = _sum_transactions_on_date(
        db, user_id, "withdrawal", latest_date, timing="pre_open"
    )
    net_flow_latest = deposits_on_latest - withdrawals_on_latest

    normalized_open = prev_balance + net_flow_prev + net_flow_latest

    close_equity = float(latest.balance)
    pnl = close_equity - normalized_open
    roi = (pnl / normalized_open) * 100 if normalized_open != 0 else 0

    return {
        "id": latest.id,
        "open": round(normalized_open, 2),
        "close": round(close_equity, 2),
        "pnl": round(pnl, 2),
        "roi": round(roi, 2),
        "date": latest.entry_date.strftime("%m/%d/%Y"),

        # Optional debug fields
        "prev_close_equity": round(prev_balance, 2),
        "prev_date_net_flow": round(net_flow_prev, 2),
        "prev_date_deposits": round(deposits_on_prev, 2),
        "prev_date_withdrawals": round(withdrawals_on_prev, 2),

        "latest_date": latest_date.strftime("%m/%d/%Y"),
        "latest_pre_open_net_flow": round(net_flow_latest, 2),
        "prev_after_close_net_flow": round(net_flow_prev, 2),
    }


# def compute_account_summary(db: Session, user_id: int, portfolio_entries, deposits, withdrawals):
#     """
#     Lifetime account metrics (used by AccountKpi.jsx)

#     Rule:
#     - Principal comes from InitialCash if present
#     - If transactions happened on the latest portfolio entry_date, treat them as
#       after-close flows and adjust current_equity accordingly
#     """
#     if not portfolio_entries:
#         return None

#     initial_cash_row = (
#         db.query(InitialCash)
#         .filter(InitialCash.user_id == user_id)
#         .first()
#     )

#     principal = (
#         float(initial_cash_row.initial_cash)
#         if initial_cash_row
#         else float(portfolio_entries[0].balance)
#     )

#     latest = portfolio_entries[-1]
#     latest_balance = float(latest.balance)
#     latest_date = latest.entry_date

#     total_deposits = float(deposits)
#     total_withdrawals = float(withdrawals)

#     invested_capital = principal + total_deposits

#     deposits_on_latest = _sum_transactions_on_date(
#         db, user_id, "deposit", latest_date, timing="after_close"
#     )
#     withdrawals_on_latest = _sum_transactions_on_date(
#         db, user_id, "withdrawal", latest_date, timing="after_close"
#     )
#     net_flow_latest = deposits_on_latest - withdrawals_on_latest

#     current_equity = latest_balance - withdrawals_on_latest + deposits_on_latest

#     total_value = current_equity + total_withdrawals
#     net_pnl = total_value - invested_capital
#     roi = (net_pnl / invested_capital * 100) if invested_capital else 0.0

#     net_contributed = total_deposits - total_withdrawals

#     return {
#         "initial_capital": round(principal, 2),
#         "invested_capital": round(invested_capital, 2),

#         "current_equity": round(current_equity, 2),
#         "total_value": round(total_value, 2),

#         "net_pnl": round(net_pnl, 2),
#         "roi": round(roi, 2),

#         "total_deposits": round(total_deposits, 2),
#         "total_withdrawals": round(total_withdrawals, 2),
#         "net_contributed": round(net_contributed, 2),

#         # optional debug
#         "latest_portfolio_balance": round(latest_balance, 2),
#         "latest_date_net_flow": round(net_flow_latest, 2),
#         "latest_date_deposits": round(deposits_on_latest, 2),
#         "latest_date_withdrawals": round(withdrawals_on_latest, 2),
#     }

def compute_account_summary(db: Session, user_id: int, portfolio_entries, deposits, withdrawals):
    """
    Lifetime account metrics used by AccountKpi.jsx.

    Rules:
    - Principal comes from InitialCash.
    - Deposits are normal added cash after initial cash.
    - Withdrawals are cash removed from the trading account.
    - current_equity is the actual FFA/broker value.
    - total_value adds withdrawals back so withdrawals do not reduce full trading progress.
    """
    initial_cash_row = (
        db.query(InitialCash)
        .filter(InitialCash.user_id == user_id)
        .first()
    )

    if not portfolio_entries and not initial_cash_row:
        return {
            "initial_capital": 0.0,
            "invested_capital": 0.0,
            "current_equity": 0.0,
            "total_value": 0.0,
            "net_pnl": 0.0,
            "roi": 0.0,
            "total_deposits": 0.0,
            "total_withdrawals": 0.0,
            "net_contributed": 0.0,
            "latest_portfolio_balance": 0.0,
            "latest_date_net_flow": 0.0,
            "latest_date_deposits": 0.0,
            "latest_date_withdrawals": 0.0,
        }

    principal = (
        float(initial_cash_row.initial_cash)
        if initial_cash_row
        else float(portfolio_entries[0].balance)
    )

    total_deposits = float(deposits or 0)
    total_withdrawals = float(withdrawals or 0)

    invested_capital = principal + total_deposits

    latest_balance = 0.0
    latest_date = None
    deposits_on_latest = 0.0
    withdrawals_on_latest = 0.0
    current_equity = principal

    if portfolio_entries:
        latest = portfolio_entries[-1]
        latest_balance = float(latest.balance)
        latest_date = latest.entry_date

        deposits_on_latest, withdrawals_on_latest = _cash_flows_on_date(
            db=db,
            user_id=user_id,
            txn_date=latest_date,
        )

        current_equity = latest_balance + deposits_on_latest - withdrawals_on_latest

    total_value = current_equity + total_withdrawals
    net_pnl = total_value - invested_capital
    roi = (net_pnl / invested_capital * 100) if invested_capital else 0.0

    net_contributed = total_deposits - total_withdrawals
    latest_net_flow = deposits_on_latest - withdrawals_on_latest

    return {
        "initial_capital": round(principal, 2),
        "invested_capital": round(invested_capital, 2),

        "current_equity": round(current_equity, 2),
        "total_value": round(total_value, 2),

        "net_pnl": round(net_pnl, 2),
        "roi": round(roi, 2),

        "total_deposits": round(total_deposits, 2),
        "total_withdrawals": round(total_withdrawals, 2),
        "net_contributed": round(net_contributed, 2),

        # optional debug
        "latest_portfolio_balance": round(latest_balance, 2),
        "latest_date_net_flow": round(latest_net_flow, 2),
        "latest_date_deposits": round(deposits_on_latest, 2),
        "latest_date_withdrawals": round(withdrawals_on_latest, 2),
    }


def _fill_daily_curve(points):
    """
    Given sparse points sorted asc, fill missing days by carrying forward
    the latest full point.

    Important:
    Preserve extra fields such as:
    - actual_value
    - portfolio_close
    - deposits
    - withdrawals
    - net_flow

    This lets the Home chart plot one value while showing richer tooltip context.
    """
    if not points:
        return []

    start = points[0]["date"]
    end = points[-1]["date"]

    filled = []
    date_pointer = start
    index = 0

    last_point = dict(points[0])

    while date_pointer <= end:
        if index < len(points) and points[index]["date"] == date_pointer:
            last_point = dict(points[index])
            index += 1

        carried_point = dict(last_point)
        carried_point["date"] = date_pointer

        if "value" in carried_point:
            carried_point["value"] = round(float(carried_point["value"]), 2)

        if "actual_value" in carried_point:
            carried_point["actual_value"] = round(float(carried_point["actual_value"]), 2)

        if "portfolio_close" in carried_point:
            carried_point["portfolio_close"] = round(float(carried_point["portfolio_close"]), 2)

        if "deposits" in carried_point:
            carried_point["deposits"] = round(float(carried_point["deposits"]), 2)

        if "withdrawals" in carried_point:
            carried_point["withdrawals"] = round(float(carried_point["withdrawals"]), 2)

        if "net_flow" in carried_point:
            carried_point["net_flow"] = round(float(carried_point["net_flow"]), 2)

        filled.append(carried_point)
        date_pointer += timedelta(days=1)

    return filled

def _build_normalized_equity_points(db: Session, user_id: int, portfolio_entries):
    """
    Build a sparse normalized performance curve.

    Used by Profile page:
    - Deposits should not make performance look better.
    - Withdrawals should not make performance look worse.
    - This represents total trading progress.

    Formula:
      actual_equity = portfolio.balance + same_day_deposits - same_day_withdrawals

      normalized_equity =
          actual_equity
          + cumulative_withdrawals
          - cumulative_deposits
    """
    if not portfolio_entries:
        return []

    normalized = []

    cumulative_deposits = 0.0
    cumulative_withdrawals = 0.0

    for p in portfolio_entries:
        txn_date = p.entry_date

        deposits_on_date, withdrawals_on_date = _cash_flows_on_date(
            db=db,
            user_id=user_id,
            txn_date=txn_date,
        )

        cumulative_deposits += deposits_on_date
        cumulative_withdrawals += withdrawals_on_date

        actual_equity = float(p.balance) + deposits_on_date - withdrawals_on_date

        normalized_equity = (
            actual_equity
            + cumulative_withdrawals
            - cumulative_deposits
        )

        normalized.append({
            "date": txn_date,
            "value": round(normalized_equity, 2),
        })

    return normalized

# def _build_normalized_equity_points(db: Session, user_id: int, portfolio_entries):
#     """
#     Build a sparse normalized curve (only portfolio dates).
#     Removes cash flows so deposits/withdrawals don't inflate trading performance.

#     Rule:
#       trading_pnl = curr_close - (prev_close + net_flow_on_curr_date)
#     """
#     if not portfolio_entries:
#         return []

#     norm_value = float(portfolio_entries[0].balance)
#     normalized = [{"date": portfolio_entries[0].entry_date, "value": round(norm_value, 2)}]

#     for i in range(1, len(portfolio_entries)):
#         prev = portfolio_entries[i - 1]
#         curr = portfolio_entries[i]

#         prev_close = float(prev.balance)
#         curr_close = float(curr.balance)

#         prev_date = prev.entry_date
#         curr_date = curr.entry_date

#         # Match the same timing logic used by compute_daily_trading_summary:
#         # - previous date after_close flows affect the next day's open
#         # - current date pre_open flows affect the same day's open
#         deposits_on_prev = _sum_transactions_on_date(
#             db, user_id, "deposit", prev_date, timing="after_close"
#         )
#         withdrawals_on_prev = _sum_transactions_on_date(
#             db, user_id, "withdrawal", prev_date, timing="after_close"
#         )
#         net_flow_prev = deposits_on_prev - withdrawals_on_prev

#         deposits_on_curr = _sum_transactions_on_date(
#             db, user_id, "deposit", curr_date, timing="pre_open"
#         )
#         withdrawals_on_curr = _sum_transactions_on_date(
#             db, user_id, "withdrawal", curr_date, timing="pre_open"
#         )
#         net_flow_curr = deposits_on_curr - withdrawals_on_curr

#         normalized_open = prev_close + net_flow_prev + net_flow_curr
#         trading_pnl = curr_close - normalized_open
#         norm_value = norm_value + trading_pnl

#         normalized.append({"date": curr.entry_date, "value": round(norm_value, 2)})

#     return normalized
    
# def _build_normalized_equity_points(db: Session, user_id: int, portfolio_entries):
#     """
#     Build a sparse normalized curve (only portfolio dates).
#     Removes cash flows so deposits/withdrawals don't inflate trading performance.

#     Rule:
#       trading_pnl = curr_close - (prev_close + net_flow_on_curr_date)
#     """
#     if not portfolio_entries:
#         return []

#     norm_value = float(portfolio_entries[0].balance)
#     normalized = [{"date": portfolio_entries[0].entry_date, "value": round(norm_value, 2)}]

#     for i in range(1, len(portfolio_entries)):
#         prev = portfolio_entries[i - 1]
#         curr = portfolio_entries[i]

#         prev_close = float(prev.balance)
#         curr_close = float(curr.balance)

#         curr_date = curr.entry_date
#         deposits_on_curr = _sum_transactions_on_date(db, user_id, "deposit", curr_date)
#         withdrawals_on_curr = _sum_transactions_on_date(db, user_id, "withdrawal", curr_date)

#         net_flow_curr = deposits_on_curr - withdrawals_on_curr

#         trading_pnl = curr_close - (prev_close + net_flow_curr)
#         norm_value = norm_value + trading_pnl

#         normalized.append({"date": curr.entry_date, "value": round(norm_value, 2)})

#     return normalized


def _linear_regression_line(points):
    """
    points: [{date, value}] sorted asc
    Returns same-length [{date, value}] as the best-fit straight line.
    """
    if not points:
        return []

    n = len(points)
    ys = [float(p["value"]) for p in points]
    xs = list(range(n))

    x_mean = sum(xs) / n
    y_mean = sum(ys) / n

    denom = sum((x - x_mean) ** 2 for x in xs)
    if denom == 0:
        return [{"date": points[i]["date"], "value": round(y_mean, 2)} for i in range(n)]

    slope = sum((xs[i] - x_mean) * (ys[i] - y_mean) for i in range(n)) / denom
    intercept = y_mean - slope * x_mean

    line = []
    for i in range(n):
        yhat = intercept + slope * xs[i]
        line.append({"date": points[i]["date"], "value": round(float(yhat), 2)})

    return line


def _build_equity_deviation_bands(equity_points, ideal_points):
    """
    Returns:
      above: max(equity, ideal)
      below: min(equity, ideal)
    """
    if not equity_points or not ideal_points:
        return {"above": [], "below": []}

    n = min(len(equity_points), len(ideal_points))
    above = []
    below = []

    for i in range(n):
        eq = float(equity_points[i]["value"])
        idv = float(ideal_points[i]["value"])
        above.append({"date": equity_points[i]["date"], "value": round(max(eq, idv), 2)})
        below.append({"date": equity_points[i]["date"], "value": round(min(eq, idv), 2)})

    return {"above": above, "below": below}


def _percentile(sorted_vals, p: float) -> float:
    if not sorted_vals:
        return 0.0
    if len(sorted_vals) == 1:
        return float(sorted_vals[0])

    idx = (len(sorted_vals) - 1) * p
    lo = int(idx)
    hi = min(lo + 1, len(sorted_vals) - 1)
    frac = idx - lo
    return float(sorted_vals[lo]) * (1 - frac) + float(sorted_vals[hi]) * frac


def _hold_bucket_days(days: float) -> str:
    if days <= 1:
        return "0–1d"
    if days <= 3:
        return "1–3d"
    if days <= 7:
        return "3–7d"
    if days <= 14:
        return "7–14d"
    return "14d+"


# =========================================================
# MAIN DASHBOARD ENDPOINT
# =========================================================

@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id

    portfolio_entries = (
        db.query(Portfolio)
        .filter(Portfolio.user_id == user_id)
        .order_by(Portfolio.entry_date.asc())
        .all()
    )

    if not portfolio_entries:
        raise HTTPException(400, "No portfolio data available.")

    deposits = (
        db.query(func.sum(Transactions.amount))
        .filter(
            Transactions.user_id == user_id,
            Transactions.transaction_type == "deposit",
        )
        .scalar()
        or 0
    )

    withdrawals = (
        db.query(func.sum(Transactions.amount))
        .filter(
            Transactions.user_id == user_id,
            Transactions.transaction_type == "withdrawal",
        )
        .scalar()
        or 0
    )

    portfolio_daily_summary = compute_daily_trading_summary(db, user_id, portfolio_entries)
    account_summary = compute_account_summary(
        db,
        user_id,
        portfolio_entries,
        float(deposits),
        float(withdrawals),
    )

    initial_cash_row = (
        db.query(InitialCash)
        .filter(InitialCash.user_id == user_id)
        .first()
    )

    # equity_curve = [
    #     {
    #         "date": p.entry_date,
    #         "value": round(float(p.balance), 2),
    #     }
    #     for p in portfolio_entries
    # ]
    # equity_curve = _prepend_initial_cash_anchor(equity_curve, initial_cash_row)

    equity_curve = _build_home_equity_points(db, user_id, portfolio_entries)
    equity_curve = _prepend_home_initial_cash_anchor(equity_curve, initial_cash_row)

    trades = db.query(Trades).filter(Trades.user_id == user_id).all()
    realized = [float(t.profit_loss) for t in trades if t.profit_loss is not None]

    performance = {
        "total_trades": len(realized),
        "win_rate": round(
            (len([p for p in realized if p > 0]) / len(realized) * 100)
            if realized else 0,
            2,
        ),
        "total_realized_pnl": round(sum(realized), 2),
    }

    latest_financial = (
        db.query(Financial)
        .filter(Financial.user_id == user_id)
        .order_by(Financial.entry_date.desc())
        .first()
    )

    financial_summary = None
    if latest_financial:
        financial_summary = {
            "networth": float(latest_financial.networth or 0),
            "income": float(latest_financial.income or 0),
            "expenses": float(latest_financial.expenses or 0),
            "gains": float(latest_financial.gains or 0),
        }

    return {
        "account": account_summary,
        "portfolio_daily_summary": portfolio_daily_summary,
        "equity_curve": equity_curve,
        "performance": performance,
        "financial_summary": financial_summary,
    }


# ========================================================================
# DASHBOARD STATS
# ========================================================================

@router.get("/dashboard/stats")
def dashboard_stats(
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id

    trades = (
        db.query(Trades)
        .filter(Trades.user_id == user_id)
        .all()
    )

    if not trades:
        return {
            "total_trades": 0,
            "wins": 0,
            "losses": 0,
            "win_rate": 0,
            "profit_factor": 0,
            "expectancy": 0,
            "payoff_ratio": 0,
            "risk_reward": 0,
            "avg_hold_time_hours": 0,
            "max_drawdown_percent": 0,
            "pnl_by_weekday": {},
            "pnl_by_symbol": {},
            "gross_profit": 0,
            "gross_loss": 0,
            "net_pnl": 0,
            "avg_win": 0,
            "avg_loss": 0,
            "reward_per_dollar_risk": 0,
            "avg_hold_time_days": 0,
            "avg_hold_time_days_rounded": 0,
        }

    realized = [float(t.profit_loss) for t in trades if t.profit_loss is not None]
    wins_list = [p for p in realized if p > 0]
    losses_list = [p for p in realized if p < 0]

    wins = len(wins_list)
    losses = len(losses_list)

    gross_profit = sum(wins_list)
    gross_loss = abs(sum(losses_list)) if losses_list else 0.0
    net_pnl = gross_profit - gross_loss

    total_trades = len(realized)
    win_rate = (wins / total_trades) * 100 if total_trades else 0
    avg_win = (sum(wins_list) / wins) if wins else 0
    avg_loss = (sum(losses_list) / losses) if losses else 0

    expectancy = (
        (win_rate / 100) * avg_win +
        ((100 - win_rate) / 100) * avg_loss
    )

    payoff_ratio = (avg_win / abs(avg_loss)) if avg_loss else 0
    risk_reward = (abs(avg_loss) / avg_win) if avg_win else 0
    reward_per_dollar_risk = payoff_ratio
    profit_factor = (gross_profit / gross_loss) if gross_loss else 0

    hold_times = []
    for t in trades:
        if t.entry_date and t.close_date:
            delta_days = (t.close_date - t.entry_date).days
            hold_times.append(delta_days * 24)

    avg_hold_time_hours = sum(hold_times) / len(hold_times) if hold_times else 0.0
    avg_hold_time_days = avg_hold_time_hours / 24.0 if avg_hold_time_hours else 0.0
    avg_hold_time_days_rounded = int(avg_hold_time_days + 0.5)

    pnl_by_weekday = {}
    for t in trades:
        if t.profit_loss is not None and t.close_date:
            weekday = t.close_date.strftime("%A")
            pnl_by_weekday[weekday] = pnl_by_weekday.get(weekday, 0) + float(t.profit_loss)

    symbol_map = {}

    for t in trades:
        if t.profit_loss is None:
            continue

        sym = (t.symbol or "").upper().strip() or "UNKNOWN"
        pl = float(t.profit_loss)

        if sym not in symbol_map:
            symbol_map[sym] = {
                "symbol": sym,
                "trade_count": 0,
                "wins": 0,
                "losses": 0,
                "total_pnl": 0.0,
                "sum_win": 0.0,
                "sum_loss": 0.0,
            }

        s = symbol_map[sym]
        s["trade_count"] += 1
        s["total_pnl"] += pl

        if pl > 0:
            s["wins"] += 1
            s["sum_win"] += pl
        elif pl < 0:
            s["losses"] += 1
            s["sum_loss"] += pl

    pnl_by_symbol = {k: round(v["total_pnl"], 2) for k, v in symbol_map.items()}

    pnl_by_symbol_detail = []
    for sym, s in symbol_map.items():
        tc = s["trade_count"] or 0
        wins_sym = s["wins"]
        losses_sym = s["losses"]
        total_pnl = float(s["total_pnl"])

        win_rate_sym = (wins_sym / tc * 100) if tc else 0.0
        avg_pnl = (total_pnl / tc) if tc else 0.0
        avg_win_sym = (s["sum_win"] / wins_sym) if wins_sym else 0.0
        avg_loss_sym = (s["sum_loss"] / losses_sym) if losses_sym else 0.0

        pnl_by_symbol_detail.append({
            "symbol": sym,
            "trade_count": tc,
            "wins": wins_sym,
            "losses": losses_sym,
            "win_rate": round(win_rate_sym, 2),
            "total_pnl": round(total_pnl, 2),
            "avg_pnl": round(avg_pnl, 2),
            "avg_win": round(avg_win_sym, 2),
            "avg_loss": round(avg_loss_sym, 2),
        })

    pnl_by_symbol_detail.sort(key=lambda x: abs(float(x["total_pnl"])), reverse=True)

    bucket_order = ["0–1d", "1–3d", "3–7d", "7–14d", "14d+"]
    bucket_map = {b: [] for b in bucket_order}

    for t in trades:
        if t.profit_loss is None or not t.entry_date or not t.close_date:
            continue

        delta_days = (t.close_date - t.entry_date).days
        hold_days = float(delta_days)

        b = _hold_bucket_days(hold_days)
        bucket_map[b].append(float(t.profit_loss))

    pnl_by_hold_buckets = []
    for b in bucket_order:
        vals = sorted(bucket_map[b])
        n = len(vals)

        if n == 0:
            pnl_by_hold_buckets.append({
                "bucket": b,
                "count": 0,
                "p10": 0.0,
                "p25": 0.0,
                "median": 0.0,
                "p75": 0.0,
                "p90": 0.0,
            })
            continue

        p10 = _percentile(vals, 0.10)
        p25 = _percentile(vals, 0.25)
        med = _percentile(vals, 0.50)
        p75 = _percentile(vals, 0.75)
        p90 = _percentile(vals, 0.90)

        pnl_by_hold_buckets.append({
            "bucket": b,
            "count": n,
            "p10": round(p10, 2),
            "p25": round(p25, 2),
            "median": round(med, 2),
            "p75": round(p75, 2),
            "p90": round(p90, 2),
        })

    portfolio_entries = (
        db.query(Portfolio)
        .filter(Portfolio.user_id == user_id)
        .order_by(Portfolio.entry_date.asc())
        .all()
    )

    max_drawdown = 0
    if portfolio_entries:
        peak = float(portfolio_entries[0].balance)
        for p in portfolio_entries:
            val = float(p.balance)
            peak = max(peak, val)
            drawdown = (val - peak) / peak if peak else 0
            max_drawdown = min(max_drawdown, drawdown)

    return {
        "total_trades": total_trades,
        "wins": wins,
        "losses": losses,
        "win_rate": round(win_rate, 2),
        "gross_profit": round(gross_profit, 2),
        "gross_loss": round(gross_loss, 2),
        "net_pnl": round(net_pnl, 2),
        "avg_win": round(avg_win, 2),
        "avg_loss": round(avg_loss, 2),
        "profit_factor": round(profit_factor, 2),
        "expectancy": round(expectancy, 2),
        "payoff_ratio": round(payoff_ratio, 2),
        "reward_per_dollar_risk": round(reward_per_dollar_risk, 2),
        "risk_reward": round(risk_reward, 2),
        "avg_hold_time_days": round(avg_hold_time_days, 2),
        "avg_hold_time_days_rounded": avg_hold_time_days_rounded,
        "avg_hold_time_hours": round(avg_hold_time_hours, 2),
        "max_drawdown_percent": round(max_drawdown * 100, 2),
        "pnl_by_weekday": pnl_by_weekday,
        "pnl_by_symbol": pnl_by_symbol,
        "pnl_by_symbol_detail": pnl_by_symbol_detail,
        "pnl_by_hold_buckets": pnl_by_hold_buckets,
    }


# ========================================================================
# DASHBOARD CHARTS
# ========================================================================

@router.get("/dashboard/charts")
def dashboard_charts(
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id

    portfolio_entries = (
        db.query(Portfolio)
        .filter(Portfolio.user_id == user_id)
        .order_by(Portfolio.entry_date.asc())
        .all()
    )

    if not portfolio_entries:
        return {
            "equity_curve": [],
            "normalized_equity_curve": [],
            "weekly_pnl": [],
            "win_loss": {"wins": 0, "losses": 0},
            "allocation": [],
            "financial_curve": [],
        }

    initial_cash_row = (
        db.query(InitialCash)
        .filter(InitialCash.user_id == user_id)
        .first()
    )

    raw_points = _build_home_equity_points(db, user_id, portfolio_entries)
    raw_points = _prepend_home_initial_cash_anchor(raw_points, initial_cash_row)
    filled_curve = _fill_daily_curve(raw_points)

    actual_points = _build_actual_equity_points(db, user_id, portfolio_entries)
    actual_points = _prepend_initial_cash_anchor(actual_points, initial_cash_row)
    actual_filled_curve = _fill_daily_curve(actual_points)

    normalized_points = _build_normalized_equity_points(db, user_id, portfolio_entries)
    normalized_points = _prepend_initial_cash_anchor(normalized_points, initial_cash_row)
    normalized_filled_curve = _fill_daily_curve(normalized_points)

    trades = (
        db.query(Trades)
        .filter(Trades.user_id == user_id)
        .all()
    )

    wins = len([t for t in trades if t.profit_loss is not None and t.profit_loss > 0])
    losses = len([t for t in trades if t.profit_loss is not None and t.profit_loss < 0])

    win_loss = {"wins": wins, "losses": losses}
    trade_count = wins + losses
    win_rate = round((wins / trade_count * 100) if trade_count else 0.0, 2)

    ideal_line = _linear_regression_line(normalized_filled_curve)
    bands = _build_equity_deviation_bands(normalized_filled_curve, ideal_line)

    equity_analysis = {
        "equity": normalized_filled_curve,
        "ideal_line": ideal_line,
        "above_band": bands["above"],
        "below_band": bands["below"],
        "trade_count": trade_count,
        "wins": wins,
        "losses": losses,
        "win_rate": win_rate,
    }

    weekly_pnl_map = {}

    for i in range(1, len(normalized_filled_curve)):
        prev = normalized_filled_curve[i - 1]["value"]
        curr = normalized_filled_curve[i]["value"]
        delta = curr - prev

        week_key = normalized_filled_curve[i]["date"].strftime("%Y-W%U")
        weekly_pnl_map[week_key] = weekly_pnl_map.get(week_key, 0) + delta

    weekly_pnl = [
        {"week": k, "pnl": round(v, 2)}
        for k, v in sorted(weekly_pnl_map.items())
    ]

    latest_financial = (
        db.query(Financial)
        .filter(Financial.user_id == user_id)
        .order_by(Financial.entry_date.desc())
        .first()
    )

    allocation = []
    if latest_financial:
        allocation = [
            {"jar": "NEC", "value": float(latest_financial.nec or 0)},
            {"jar": "FFA", "value": float(latest_financial.ffa or 0)},
            {"jar": "PLAY", "value": float(latest_financial.play or 0)},
            {"jar": "LTSS", "value": float(latest_financial.ltss or 0)},
            {"jar": "GIVE", "value": float(latest_financial.give or 0)},
        ]

    financial_rows = (
        db.query(Financial)
        .filter(Financial.user_id == user_id)
        .order_by(Financial.entry_date.asc())
        .all()
    )

    financial_curve = [
        {
            "entry_date": f.entry_date,
            "date": f.entry_date,
            "income": float(f.income or 0),
            "expenses": float(f.expenses or 0),
            "gains": float(f.gains or 0),
            "networth": float(f.networth or 0),
        }
        for f in financial_rows
    ]

    # return {
    #     "equity_curve": filled_curve,
    #     "normalized_equity_curve": normalized_filled_curve,
    #     "equity_analysis": equity_analysis,
    #     "weekly_pnl": weekly_pnl,
    #     "win_loss": win_loss,
    #     "allocation": allocation,
    #     "financial_curve": financial_curve,
    # }
    return {
        "equity_curve": filled_curve,
        "actual_equity_curve": actual_filled_curve,
        "normalized_equity_curve": normalized_filled_curve,
        "equity_analysis": equity_analysis,
        "weekly_pnl": weekly_pnl,
        "win_loss": win_loss,
        "allocation": allocation,
        "financial_curve": financial_curve,
    }

# =========================================================
# Realized PnL Histogram
# =========================================================

def _start_of_week(d: date) -> date:
    return d - timedelta(days=d.weekday())


def _start_of_month(d: date) -> date:
    return d.replace(day=1)


def _add_months(d: date, months: int) -> date:
    year = d.year + (d.month - 1 + months) // 12
    month = (d.month - 1 + months) % 12 + 1
    return date(year, month, 1)


def _iter_days(start: date, end: date):
    cur = start
    while cur <= end:
        yield cur
        cur += timedelta(days=1)


def _iter_weeks(start: date, end: date):
    cur = _start_of_week(start)
    end_week = _start_of_week(end)
    while cur <= end_week:
        yield cur
        cur += timedelta(days=7)


def _iter_months(start: date, end: date):
    cur = _start_of_month(start)
    end_m = _start_of_month(end)
    while cur <= end_m:
        yield cur
        cur = _add_months(cur, 1)


def _label_for_bucket(granularity: str, bucket_start: date) -> str:
    if granularity == "day":
        return bucket_start.strftime("%m/%d")
    if granularity == "week":
        return bucket_start.strftime("%m/%d")
    return bucket_start.strftime("%b")


@router.get("/dashboard/realized-pnl")
def dashboard_realized_pnl(
    range: str = Query("1W", pattern="^(1W|1M|1Y)$"),
    db: Session = Depends(get_db_connection),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id
    end_d = date.today()

    if range == "1W":
        granularity = "day"
        start_d = end_d - timedelta(days=6)
        bucket_starts = list(_iter_days(start_d, end_d))
        bucket_end = lambda s: s
        bucket_of = lambda d: d

    elif range == "1M":
        granularity = "week"
        start_d = end_d - timedelta(days=29)
        bucket_starts = list(_iter_weeks(start_d, end_d))
        bucket_end = lambda s: s + timedelta(days=6)
        bucket_of = _start_of_week

    else:
        granularity = "month"
        start_month = date(end_d.year, 1, 1)
        start_d = start_month
        bucket_starts = list(_iter_months(start_month, _start_of_month(end_d)))

        def bucket_end(s: date) -> date:
            next_m = _add_months(s, 1)
            return next_m - timedelta(days=1)

        bucket_of = _start_of_month

    buckets = {
        bs: {
            "start": bs.isoformat(),
            "end": bucket_end(bs).isoformat(),
            "label": _label_for_bucket(granularity, bs),
            "trade_count": 0,
            "pnl": 0.0,
        }
        for bs in bucket_starts
    }

    rows = (
        db.query(Trades.close_date, Trades.profit_loss)
        .filter(
            Trades.user_id == user_id,
            Trades.close_date.isnot(None),
        )
        .all()
    )

    for close_dt, pl in rows:
        if pl is None or close_dt is None:
            continue

        close_d = close_dt.date() if hasattr(close_dt, "date") else close_dt
        if close_d < start_d or close_d > end_d:
            continue

        bs = bucket_of(close_d)
        if bs not in buckets:
            continue

        pnl = float(pl or 0.0)
        buckets[bs]["pnl"] = round(buckets[bs]["pnl"] + pnl, 2)
        buckets[bs]["trade_count"] += 1

    bars = [buckets[bs] for bs in bucket_starts]

    return {
        "range": range,
        "granularity": granularity,
        "start": start_d.isoformat(),
        "end": end_d.isoformat(),
        "bars": bars,
    }

    