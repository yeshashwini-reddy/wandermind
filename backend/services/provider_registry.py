import re
import urllib.parse
from typing import Dict, Any, Optional, List

class ProviderRegistry:
    """
    Centralized Registry & Resolver for Official Travel Provider Booking URLs.
    Guarantees that WanderMind only provides verified, official external booking portals.
    Gemini or LLMs are never permitted to manufacture or hallucinate URLs.
    """

    # Verified Official Provider Directory
    PROVIDERS: Dict[str, Dict[str, Any]] = {
        "air_india": {
            "name": "Air India",
            "aliases": ["air india", "air india express", "airindia", "ix-", "ai-"],
            "mode": "flight",
            "official_domain": "airindia.com",
            "booking_url": "https://www.airindia.com/en-in/book-flights/"
        },
        "indigo": {
            "name": "IndiGo",
            "aliases": ["indigo", "indigo express", "6e-", "goindigo"],
            "mode": "flight",
            "official_domain": "goindigo.in",
            "booking_url": "https://www.goindigo.in/"
        },
        "spicejet": {
            "name": "SpiceJet",
            "aliases": ["spicejet", "spice jet", "sg-"],
            "mode": "flight",
            "official_domain": "spicejet.com",
            "booking_url": "https://www.spicejet.com/"
        },
        "irctc": {
            "name": "IRCTC Indian Railways",
            "aliases": [
                "irctc", "indian railways", "vande bharat", "shatabdi", "rajdhani",
                "express", "superfast", "intercity", "kacheguda", "ernakulam",
                "ksr bengaluru", "vasco da gama"
            ],
            "mode": "train",
            "official_domain": "irctc.co.in",
            "booking_url": "https://www.irctc.co.in/nget/train-search"
        },
        "redbus": {
            "name": "redBus",
            "aliases": ["redbus", "red bus", "national travel"],
            "mode": "bus",
            "official_domain": "redbus.in",
            "booking_url": "https://www.redbus.in/"
        },
        "intrcity": {
            "name": "IntrCity SmartBus",
            "aliases": ["intrcity", "smartbus", "intrcity smartbus"],
            "mode": "bus",
            "official_domain": "intrcity.com",
            "booking_url": "https://www.intrcity.com/"
        },
        "zingbus": {
            "name": "Zingbus",
            "aliases": ["zingbus", "zing bus"],
            "mode": "bus",
            "official_domain": "zingbus.com",
            "booking_url": "https://www.zingbus.com/"
        },
        "ksrtc": {
            "name": "KSRTC",
            "aliases": ["ksrtc", "airavat", "kerala rtc", "karnataka rtc"],
            "mode": "bus",
            "official_domain": "ksrtc.in",
            "booking_url": "https://www.ksrtc.in/"
        },
        "tsrtc": {
            "name": "TSRTC",
            "aliases": ["tsrtc", "telangana rtc"],
            "mode": "bus",
            "official_domain": "tsrtconline.in",
            "booking_url": "https://www.tsrtconline.in/"
        },
        "taj_hotels": {
            "name": "Taj Hotels & Resorts",
            "aliases": ["taj", "taj fort aguada", "taj hotels"],
            "mode": "stay",
            "official_domain": "tajhotels.com",
            "booking_url": "https://www.tajhotels.com/en-in/taj/taj-fort-aguada-goa/"
        },
        "santana_resort": {
            "name": "Santana Beach Resort Candolim",
            "aliases": ["santana", "santana beach resort"],
            "mode": "stay",
            "official_domain": "santana-goa.com",
            "booking_url": "https://www.santana-goa.com/"
        },
        "hostelworld": {
            "name": "Hostelworld / Bunkd Hostel",
            "aliases": ["bunkd", "hostelworld", "co-living"],
            "mode": "stay",
            "official_domain": "hostelworld.com",
            "booking_url": "https://www.hostelworld.com/"
        },
        "marriott_itc": {
            "name": "ITC Hotels / Marriott",
            "aliases": ["itc", "itc rajputana", "marriott"],
            "mode": "stay",
            "official_domain": "marriott.com",
            "booking_url": "https://www.marriott.com/"
        },
        "umaid_bhawan": {
            "name": "Umaid Bhawan Heritage House",
            "aliases": ["umaid bhawan", "umaid"],
            "mode": "stay",
            "official_domain": "umaidbhawan.com",
            "booking_url": "https://www.umaidbhawan.com/"
        },
        "moustache_hostels": {
            "name": "Moustache Hostel & Stays",
            "aliases": ["moustache", "moustachescapes"],
            "mode": "stay",
            "official_domain": "moustachescapes.com",
            "booking_url": "https://moustachescapes.com/"
        },
        "makemytrip": {
            "name": "MakeMyTrip",
            "aliases": ["makemytrip", "mmt"],
            "mode": "aggregator",
            "official_domain": "makemytrip.com",
            "booking_url": "https://www.makemytrip.com/"
        }
    }

    @classmethod
    def normalize_provider_name(cls, provider_raw: str) -> str:
        """Strips noise, punctuation, and flight numbers for clean provider matching."""
        if not provider_raw:
            return ""
        p = provider_raw.lower().strip()
        return re.sub(r"[^a-z0-9\s\-]", "", p)

    @classmethod
    def resolve_provider_key(cls, provider_raw: str, mode: Optional[str] = None) -> Optional[str]:
        """Identifies the canonical provider key from free-text provider names."""
        norm = cls.normalize_provider_name(provider_raw)
        if not norm:
            return None

        # Direct key match
        if norm in cls.PROVIDERS:
            return norm

        # Alias scan
        for key, pinfo in cls.PROVIDERS.items():
            if mode and pinfo.get("mode") not in [mode, "aggregator"]:
                continue
            for alias in pinfo.get("aliases", []):
                if alias in norm or norm in alias:
                    return key

        # Mode-based fallback if train or bus
        if mode == "train":
            return "irctc"
        if mode == "bus":
            return "redbus"

        return None

    @classmethod
    def resolve_booking_url(cls, provider_raw: str, mode: Optional[str] = None) -> Optional[str]:
        """
        Resolves the verified, official booking URL for any provider.
        Gemini is NEVER allowed to provide or override this URL.
        """
        key = cls.resolve_provider_key(provider_raw, mode)
        if key and key in cls.PROVIDERS:
            return cls.PROVIDERS[key]["booking_url"]
        
        # Fallback to mode aggregators
        if mode == "flight":
            return "https://www.makemytrip.com/flights/"
        elif mode == "train":
            return "https://www.irctc.co.in/nget/train-search"
        elif mode == "bus":
            return "https://www.redbus.in/"
        elif mode == "stay":
            return "https://www.makemytrip.com/hotels/"

        return None

    @classmethod
    def is_valid_provider_url(cls, url: Optional[str]) -> bool:
        """
        Validates that a URL is secure HTTPS, belongs to a known provider domain,
        and contains no javascript:, data:, or localhost schemes.
        """
        if not url or not isinstance(url, str):
            return False

        trimmed = url.strip().lower()

        # Security constraints
        if not trimmed.startswith("https://"):
            return False
        if "javascript:" in trimmed or "data:" in trimmed or "localhost" in trimmed or "127.0.0.1" in trimmed:
            return False

        # Verify domain against whitelist
        allowed_domains = {pinfo["official_domain"] for pinfo in cls.PROVIDERS.values()}
        try:
            parsed = urllib.parse.urlparse(trimmed)
            hostname = parsed.hostname or ""
            return any(hostname == domain or hostname.endswith("." + domain) for domain in allowed_domains)
        except Exception:
            return False
