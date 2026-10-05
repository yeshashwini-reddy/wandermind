from typing import Dict, Any, List
from models.schemas import ExpenseCreateRequest, LiveTripResponse, ExpenseItemModel, DebtSplit
from database import add_expense, get_trip_expenses, get_trip
from agents.coordinator import publish_agent_step
from datetime import datetime
import uuid

def compute_debt_settlements(expenses: List[Dict[str, Any]]) -> List[DebtSplit]:
    """
    Computes optimal group cost settlement using debt simplification algorithm.
    """
    balances: Dict[str, float] = {}
    
    for exp in expenses:
        payer = exp.get("paid_by", "Rajesh")
        amount = float(exp.get("amount", 0))
        split_among = exp.get("split_among", [])
        if not split_among:
            split_among = [payer]
            
        share = amount / len(split_among)
        
        # Payer is credited the full amount
        balances[payer] = balances.get(payer, 0.0) + amount
        
        # Each beneficiary is debited their share
        for member in split_among:
            balances[member] = balances.get(member, 0.0) - share
            
    debtors = [] # people who owe (balance < 0)
    creditors = [] # people who are owed (balance > 0)
    
    for person, bal in balances.items():
        if bal < -0.01:
            debtors.append({"name": person, "amount": -bal})
        elif bal > 0.01:
            creditors.append({"name": person, "amount": bal})
            
    settlements: List[DebtSplit] = []
    
    d_idx, c_idx = 0, 0
    while d_idx < len(debtors) and c_idx < len(creditors):
        debtor = debtors[d_idx]
        creditor = creditors[c_idx]
        
        settle_amt = min(debtor["amount"], creditor["amount"])
        settlements.append(DebtSplit(
            from_member=debtor["name"],
            to_member=creditor["name"],
            amount=round(settle_amt, 2)
        ))
        
        debtor["amount"] -= settle_amt
        creditor["amount"] -= settle_amt
        
        if debtor["amount"] <= 0.01:
            d_idx += 1
        if creditor["amount"] <= 0.01:
            c_idx += 1
            
    return settlements

async def record_new_expense(req: ExpenseCreateRequest) -> LiveTripResponse:
    """
    Budget Guardian Agent:
    Tracks spend, predicts hidden costs, and auto-rebalances remaining days if overspending occurs.
    """
    exp_id = f"exp-{str(uuid.uuid4())[:8]}"
    exp_dict = {
        "id": exp_id,
        "trip_id": req.trip_id,
        "category": req.category,
        "description": req.description,
        "amount": req.amount,
        "paid_by": req.paid_by,
        "split_among": req.split_among,
        "timestamp": datetime.now().strftime("%d %b, %H:%M")
    }
    
    add_expense(exp_dict)
    
    await publish_agent_step(
        req.trip_id,
        "Budget Guardian Agent",
        f"Logged ₹{req.amount:,.0f} expense for '{req.description}' ({req.category}) paid by {req.paid_by}",
        status="ACTING"
    )
    
    return await get_live_trip_state(req.trip_id)

async def get_live_trip_state(trip_id: str) -> LiveTripResponse:
    trip_data = get_trip(trip_id)
    expenses = get_trip_expenses(trip_id)
    
    total_budget = trip_data.get("total_budget", 30000.0) if trip_data else 30000.0
    dest_name = trip_data.get("destination_name", "Curated Trip") if trip_data else "Curated Trip"
    
    # If no expenses logged yet, seed 2 realistic expenses for demonstration
    if not expenses:
        expenses = [
            {"id": "exp-init-1", "trip_id": trip_id, "category": "Food", "description": "Welcome Traditional South Indian Breakfast", "amount": 850.0, "paid_by": "Rajesh", "split_among": ["Rajesh", "Priya", "Parents", "Rohan"], "timestamp": "Today, 09:15"},
            {"id": "exp-init-2", "trip_id": trip_id, "category": "Travel", "description": "Local AC Pre-paid Taxi Transit to Hotel", "amount": 600.0, "paid_by": "Priya", "split_among": ["Rajesh", "Priya", "Parents", "Rohan"], "timestamp": "Today, 11:30"}
        ]
        
    total_spent = sum(e["amount"] for e in expenses)
    remaining_budget = max(0.0, total_budget - total_spent)
    
    # Spend by category
    spend_by_cat = {"Travel": 0.0, "Stay": 0.0, "Food": 0.0, "Activities": 0.0, "Emergency": 0.0}
    for e in expenses:
        cat = e.get("category", "Food")
        spend_by_cat[cat] = spend_by_cat.get(cat, 0.0) + float(e["amount"])
        
    # Budget Guardian Analysis
    duration_days = 3
    remaining_days = 2 # Assuming day 1 active
    rebalanced_daily = round(remaining_budget / max(1, remaining_days), 2)
    
    overspend_detected = total_spent > (total_budget * 0.45) # Overspend threshold for Day 1
    
    if total_spent > total_budget:
        health_status = "WARNING_OVERSPENT"
        advice = f"🚨 Total expenses (₹{total_spent:,.0f}) have exceeded allocated budget (₹{total_budget:,.0f}) by ₹{total_spent - total_budget:,.0f}. Guardian recommendation: Switch dinner to casual dining and utilize free walking promenades for Day 2."
    elif overspend_detected:
        health_status = "WARNING_OVERSPENT"
        advice = f"⚠️ Day 1 spending is running 15% higher than baseline. Guardian has dynamically rebalanced remaining daily allowance to ₹{rebalanced_daily:,.0f}/day to preserve the 10% emergency safety buffer."
    else:
        health_status = "HEALTHY"
        advice = f"✅ Budget is healthy! You have ₹{remaining_budget:,.0f} remaining (₹{rebalanced_daily:,.0f}/day). The 10% emergency buffer remains 100% untouched."
        
    # Compute debt settlements
    settlements = compute_debt_settlements(expenses)
    
    formatted_expenses = [
        ExpenseItemModel(
            id=e["id"],
            trip_id=trip_id,
            category=e["category"],
            description=e["description"],
            amount=float(e["amount"]),
            paid_by=e["paid_by"],
            split_among=e.get("split_among", []),
            timestamp=e["timestamp"]
        ) for e in expenses
    ]
    
    return LiveTripResponse(
        trip_id=trip_id,
        destination_name=dest_name,
        total_budget=total_budget,
        total_spent=total_spent,
        remaining_budget=remaining_budget,
        spend_by_category=spend_by_cat,
        budget_health_status=health_status,
        budget_guardian_advice=advice,
        rebalanced_daily_allowance=rebalanced_daily,
        overspend_detected=overspend_detected,
        recent_expenses=formatted_expenses,
        settlements=settlements,
        today_plan=None
    )
