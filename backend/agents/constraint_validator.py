from typing import List, Dict, Any, Tuple, Optional
from models.schemas import TransportOption
from services.provider_registry import ProviderRegistry

class ConstraintValidator:
    """
    Deterministic backend validator for travel recommendations.
    Validates hard constraints including budget limits, overnight prohibitions,
    elder accessibility, and authentic verified booking URLs via ProviderRegistry.
    """

    @classmethod
    def validate_transport_options(
        cls,
        options: List[TransportOption],
        budget: float,
        travelers: int = 1,
        no_overnight: bool = False,
        has_elders: bool = False,
        mobility_limits: bool = False,
        retrieved_candidate_urls: List[str] = None
    ) -> Tuple[bool, List[TransportOption], List[Dict[str, Any]], List[str]]:
        """
        Deterministically filters and validates transport options against hard constraints.
        Resolves official provider booking URLs via ProviderRegistry.
        """
        valid_options: List[TransportOption] = []
        rejected_options: List[Dict[str, Any]] = []
        notes: List[str] = []

        travelers = max(1, travelers)

        for opt in options:
            reasons_for_rejection = []
            opt_total = opt.total_price if opt.total_price is not None else (opt.price * travelers)

            # 1. Budget Hard Constraint
            if budget > 0 and opt_total > (budget * 1.05): # Allow 5% leeway threshold for close calls
                reasons_for_rejection.append(
                    f"Total cost ₹{opt_total:,.0f} exceeds budget limit of ₹{budget:,.0f}"
                )

            # 2. Overnight Hard Constraint
            if no_overnight:
                if opt.is_overnight:
                    reasons_for_rejection.append("Violates 'no overnight travel' constraint")
                elif opt.arrival and "(+1)" in opt.arrival:
                    reasons_for_rejection.append("Arrives next day (+1), violating no-overnight requirement")
                elif opt.departure:
                    try:
                        dep_hour = int(opt.departure.split(":")[0])
                        if dep_hour >= 21 or dep_hour < 4:
                            reasons_for_rejection.append("Late night departure conflicts with daytime travel constraint")
                    except Exception:
                        pass

            # 3. Mobility & Elder Constraint
            if (has_elders or mobility_limits) and opt.transport_mode == "bus":
                if "1" in opt.duration and "h" in opt.duration:
                    opt.warning_flags = (opt.warning_flags or []) + ["Long road transit: Elder rest stops recommended"]

            # 4. Strict Provider Registry URL Resolution
            # Gemini MUST NOT invent or supply booking URLs. Backend resolves official verified provider URL.
            resolved_official_url = ProviderRegistry.resolve_booking_url(opt.provider, opt.transport_mode)
            if resolved_official_url and ProviderRegistry.is_valid_provider_url(resolved_official_url):
                opt.booking_url = resolved_official_url
            else:
                # If provider cannot be verified, set to None (do not fabricate URLs)
                opt.booking_url = None
                notes.append(f"No verified official booking portal found for provider '{opt.provider}'.")

            # Decision
            if reasons_for_rejection:
                rejected_options.append({
                    "option": opt,
                    "reasons": reasons_for_rejection
                })
                notes.append(f"Rejected {opt.provider} ({opt.transport_mode}): {'; '.join(reasons_for_rejection)}")
            else:
                valid_options.append(opt)

        all_passed = len(valid_options) > 0 and len(rejected_options) == 0
        if not valid_options:
            notes.append(f"No candidates satisfied all hard constraints (Budget: ₹{budget:,.0f}, No Overnight: {no_overnight}).")

        return (all_passed, valid_options, rejected_options, notes)
