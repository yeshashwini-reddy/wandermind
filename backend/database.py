import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "wandermind.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Trips table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trips (
        trip_id TEXT PRIMARY KEY,
        created_at TEXT,
        profile_json TEXT,
        destination_id TEXT,
        destination_name TEXT,
        total_budget REAL,
        itinerary_json TEXT,
        current_day INTEGER DEFAULT 1,
        status TEXT DEFAULT 'PLANNED'
    )
    """)
    
    # Bookings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        booking_id TEXT PRIMARY KEY,
        trip_id TEXT,
        passenger_name TEXT,
        passenger_email TEXT,
        passenger_phone TEXT,
        passengers_count INTEGER,
        transport_json TEXT,
        stay_json TEXT,
        total_amount REAL,
        payment_method TEXT,
        created_at TEXT,
        FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
    )
    """)
    
    # Expenses table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        trip_id TEXT,
        category TEXT,
        description TEXT,
        amount REAL,
        paid_by TEXT,
        split_among TEXT,
        timestamp TEXT,
        FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
    )
    """)
    
    # Agent logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agent_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id TEXT,
        agent_name TEXT,
        step TEXT,
        tool_called TEXT,
        observation TEXT,
        decision TEXT,
        status TEXT,
        timestamp TEXT
    )
    """)
    
    conn.commit()
    conn.close()

# Helper DB methods
def save_trip(trip_id: str, profile: dict, destination_id: str, destination_name: str, total_budget: float, itinerary: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO trips (trip_id, created_at, profile_json, destination_id, destination_name, total_budget, itinerary_json, current_day, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'PLANNED')
    """, (
        trip_id,
        datetime.now().isoformat(),
        json.dumps(profile),
        destination_id,
        destination_name,
        total_budget,
        json.dumps(itinerary)
    ))
    conn.commit()
    conn.close()

def get_trip(trip_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM trips WHERE trip_id = ?", (trip_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "trip_id": row["trip_id"],
        "created_at": row["created_at"],
        "profile": json.loads(row["profile_json"]) if row["profile_json"] else {},
        "destination_id": row["destination_id"],
        "destination_name": row["destination_name"],
        "total_budget": row["total_budget"],
        "itinerary": json.loads(row["itinerary_json"]) if row["itinerary_json"] else {},
        "current_day": row["current_day"],
        "status": row["status"]
    }

def update_trip_itinerary(trip_id: str, new_itinerary: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE trips SET itinerary_json = ? WHERE trip_id = ?", (json.dumps(new_itinerary), trip_id))
    conn.commit()
    conn.close()

def save_booking(booking_data: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO bookings (booking_id, trip_id, passenger_name, passenger_email, passenger_phone, passengers_count, transport_json, stay_json, total_amount, payment_method, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_data["booking_id"],
        booking_data["trip_id"],
        booking_data["passenger_name"],
        booking_data["passenger_email"],
        booking_data["passenger_phone"],
        booking_data["passengers_count"],
        json.dumps(booking_data.get("transport_details", {})),
        json.dumps(booking_data.get("stay_details", {})),
        booking_data["total_paid"],
        booking_data.get("payment_method", "UPI"),
        booking_data.get("booking_date", datetime.now().isoformat())
    ))
    conn.commit()
    conn.close()

def get_booking(booking_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE booking_id = ? OR trip_id = ?", (booking_id, booking_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "booking_id": row["booking_id"],
        "trip_id": row["trip_id"],
        "passenger_name": row["passenger_name"],
        "passenger_email": row["passenger_email"],
        "passenger_phone": row["passenger_phone"],
        "passengers_count": row["passengers_count"],
        "transport_details": json.loads(row["transport_json"]) if row["transport_json"] else {},
        "stay_details": json.loads(row["stay_json"]) if row["stay_json"] else {},
        "total_paid": row["total_amount"],
        "booking_date": row["created_at"]
    }

def add_expense(expense: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO expenses (id, trip_id, category, description, amount, paid_by, split_among, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        expense["id"],
        expense["trip_id"],
        expense["category"],
        expense["description"],
        expense["amount"],
        expense["paid_by"],
        json.dumps(expense.get("split_among", [])),
        expense.get("timestamp", datetime.now().isoformat())
    ))
    conn.commit()
    conn.close()

def get_trip_expenses(trip_id: str) -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses WHERE trip_id = ? ORDER BY timestamp DESC", (trip_id,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "trip_id": r["trip_id"],
            "category": r["category"],
            "description": r["description"],
            "amount": r["amount"],
            "paid_by": r["paid_by"],
            "split_among": json.loads(r["split_among"]) if r["split_among"] else [],
            "timestamp": r["timestamp"]
        })
    return result

def log_agent_event(trip_id: str, agent_name: str, step: str, tool_called: str = None, observation: str = None, decision: str = None, status: str = "COMPLETED"):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO agent_logs (trip_id, agent_name, step, tool_called, observation, decision, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        trip_id, agent_name, step, tool_called, observation, decision, status, datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()

# Initialize tables immediately
init_db()
