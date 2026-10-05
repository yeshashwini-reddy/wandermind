import asyncio
import json
import os
from typing import Dict, Any, List, AsyncGenerator
from datetime import datetime
from database import log_agent_event

# Global in-memory SSE queue for active trip streaming
STREAM_SUBSCRIBERS: Dict[str, List[asyncio.Queue]] = {}

def get_stream_queue(trip_id: str) -> asyncio.Queue:
    if trip_id not in STREAM_SUBSCRIBERS:
        STREAM_SUBSCRIBERS[trip_id] = []
    q = asyncio.Queue()
    STREAM_SUBSCRIBERS[trip_id].append(q)
    return q

def remove_stream_queue(trip_id: str, q: asyncio.Queue):
    if trip_id in STREAM_SUBSCRIBERS and q in STREAM_SUBSCRIBERS[trip_id]:
        STREAM_SUBSCRIBERS[trip_id].remove(q)

async def publish_agent_step(trip_id: str, agent_name: str, step: str, tool_called: str = None, observation: str = None, decision: str = None, status: str = "ACTING"):
    """
    Publishes an agent step to all connected SSE clients for this trip_id and logs it to SQLite.
    """
    payload = {
        "id": f"evt-{int(datetime.now().timestamp()*1000)}",
        "trip_id": trip_id,
        "agent_name": agent_name,
        "step": step,
        "tool_called": tool_called,
        "observation": observation,
        "decision": decision,
        "status": status,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    }
    
    # Log to persistent SQLite
    try:
        log_agent_event(trip_id, agent_name, step, tool_called, observation, decision, status)
    except Exception:
        pass
        
    # Broadcast to SSE queues
    if trip_id in STREAM_SUBSCRIBERS:
        for q in list(STREAM_SUBSCRIBERS[trip_id]):
            try:
                await q.put(payload)
            except Exception:
                pass
                
    return payload
