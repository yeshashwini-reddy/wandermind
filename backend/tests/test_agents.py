import pytest
import asyncio
from models.schemas import IntakeRequest, ReplanRequest, GroupMemberPreference
from agents.profile_agent import process_profile_intake
from agents.group_consensus_agent import calculate_group_consensus
from agents.replanner_agent import handle_replanning_event
from agents.booking_agent import execute_booking_search
from tools.fare_tool import search_travel_options

@pytest.mark.asyncio
async def test_budget_split_and_emergency_buffer():
    intake = IntakeRequest(
        occasion="Family",
        travelers_count=4,
        ages=[65, 38, 35, 8],
        has_elders=True,
        has_kids=True,
        mobility_limits=True,
        elder_mode=True,
        duration_days=3,
        total_budget=30000.0,
        diet="Veg"
    )
    result = await process_profile_intake(intake, trip_id="test_trip")
    bd = result.budget_breakdown
    assert bd.total == 30000.0
    assert bd.emergency_buffer == 3000.0 # 10%
    assert bd.travel == 9000.0 # 30%
    assert bd.stay == 9000.0 # 30%
    assert bd.food == 6000.0 # 20%
    assert bd.activities == 3000.0 # 10%
    assert any("HARD CONSTRAINT" in c for c in result.hard_constraints_enforced)

@pytest.mark.asyncio
async def test_group_consensus_fairness_score():
    members = [
        GroupMemberPreference(name="Aarav", vibe="Adventure", diet="Non-veg", pace="Fast"),
        GroupMemberPreference(name="Diya", vibe="Relaxed", diet="Veg", pace="Slow"),
        GroupMemberPreference(name="Kabir", vibe="Cultural", diet="Jain", pace="Moderate")
    ]
    res = await calculate_group_consensus(members, trip_id="test_group")
    assert res.group_fairness_score >= 75
    assert len(res.member_scores) == 3
    assert len(res.compromises_made) > 0
    assert "Jain" in res.unified_diet or "Veg" in res.unified_diet

@pytest.mark.asyncio
async def test_replanner_rain_diff_logic():
    req = ReplanRequest(
        trip_id="test_replan",
        destination_id="goa",
        current_day=1,
        trigger_type="rain"
    )
    res = await handle_replanning_event(req)
    assert len(res.before_vs_after_diffs) > 0
    assert any(d.change_type == "SWAPPED_INDOOR" for d in res.before_vs_after_diffs)
    assert all(a.type == "indoor" for a in res.updated_day_plan.timeline if "Museum" in a.title or "Pavilion" in a.title)

@pytest.mark.asyncio
async def test_booking_ranking_and_cancellation_flagging():
    res = search_travel_options("goa", 4)
    transports = res["transports"]
    stays = res["stays"]
    badges = [t["badge"] for t in transports]
    assert "Cheapest" in badges
    assert "Fastest" in badges
    assert "Best Value" in badges
    assert res["ai_package"]["total_package_cost"] > 0
    assert res["savings_vs_premium"] >= 0

@pytest.mark.asyncio
async def test_occasion_traveler_count_enforcement():
    # 1. Solo Explorer forces travelers_count = 1 even if initialized with 5
    solo_req = IntakeRequest(occasion="Solo Explorer", travelers_count=5, elder_mode=True)
    assert solo_req.travelers_count == 1
    solo_req_id = IntakeRequest(occasion="Solo", travelers_count=8)
    assert solo_req_id.travelers_count == 1

    # 2. Romantic Honeymoon forces travelers_count = 2 even if initialized with 5
    honey_req = IntakeRequest(occasion="Romantic Honeymoon", travelers_count=5, mobility_limits=True)
    assert honey_req.travelers_count == 2
    honey_req_id = IntakeRequest(occasion="Honeymoon", travelers_count=6)
    assert honey_req_id.travelers_count == 2

    # 3. Family / Friends keeps custom traveler count
    family_req = IntakeRequest(occasion="Family", travelers_count=5)
    assert family_req.travelers_count == 5
    friends_req = IntakeRequest(occasion="Friends", travelers_count=6)
    assert friends_req.travelers_count == 6

    # 4. Profile validation per_person_per_day downstream check
    solo_res = await process_profile_intake(solo_req, trip_id="test_solo")
    # Budget 30000, 1 person, 3 days -> 10000 / person / day
    assert solo_res.budget_breakdown.per_person_per_day == 10000.0

