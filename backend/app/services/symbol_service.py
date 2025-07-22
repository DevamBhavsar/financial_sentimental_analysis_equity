import asyncio
import logging
import json
from typing import Dict, Optional, List, Any
import httpx
from ..database import get_redis
import re

logger = logging.getLogger(__name__)

SCRIP_MASTER_URL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
CACHE_KEY = "angelone:scrip_master"
CACHE_TTL = 86400  # 24 hours


class SymbolService:
    def __init__(self):
        self._name_map: Optional[Dict[str, Dict[str, str]]] = None

    async def _load_scrip_master(self) -> bool:
        """Loads the scrip master file from cache or fetches it from the URL."""
        if self._name_map is not None:
            return True

        async with get_redis() as redis:
            try:
                cached_data = await redis.get(CACHE_KEY)
                if cached_data:
                    logger.info("Loading ScripMaster from Redis cache.")
                    self._process_scrip_data(json.loads(cached_data))
                    return True
            except Exception as e:
                logger.error(f"Redis error while fetching ScripMaster: {e}")

        logger.info("Fetching fresh ScripMaster file from URL.")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(SCRIP_MASTER_URL, timeout=30.0)
                response.raise_for_status()
                data = response.json()

            self._process_scrip_data(data)

            async with get_redis() as redis:
                await redis.setex(CACHE_KEY, CACHE_TTL, json.dumps(data))
            logger.info("Successfully fetched and cached ScripMaster file.")
            return True
        except Exception as e:
            logger.error(f"Failed to fetch or process ScripMaster file: {e}")
            return False

    def _normalize_name(self, name: str) -> str:
        """Normalizes company names for better matching."""
        # original_name = name
        name = name.upper()
        name = re.sub(r"\s+(LTD|LIMITED|PVT|PRIVATE|CO|COMPANY|BANK)\.?$", "", name)
        name = re.sub(r"[\.\,&]", "", name)
        name = re.sub(r"\s+", " ", name).strip()
        # logger.debug(f"[Normalize] Original: '{original_name}' -> Normalized: '{name}'")
        return name

    def _process_scrip_data(self, data: List[Dict[str, str]]):
        """Processes the raw scrip data into a searchable map."""
        self._name_map = {}
        count = 0

        for item in data:
            if (
                item.get("exch_seg") == "NSE"
                and isinstance(item.get("symbol"), str)
                and item["symbol"].endswith("-EQ")
            ):
                if item.get("name") and item.get("token"):
                    normalized_name = self._normalize_name(item["name"])
                    if (
                        count < 5
                    ):  # Log the first 5 normalized names from the master file
                        logger.debug(
                            f"[Master File] Normalized Name Added to Map: '{normalized_name}'"
                        )
                    self._name_map[normalized_name] = item
                    count += 1
        logger.info(f"Processed {count} NSE equity scripts into memory.")

    async def get_token_by_name(self, company_name: str) -> Optional[str]:
        """Finds a symbol token by the company's name using robust matching."""
        if self._name_map is None:
            if not await self._load_scrip_master():
                return None

        normalized_search_name = self._normalize_name(company_name)

        if self._name_map and normalized_search_name in self._name_map:
            return self._name_map[normalized_search_name].get("token")

        if self._name_map:
            for normalized_name, item in self._name_map.items():
                if normalized_name.startswith(normalized_search_name):
                    return item.get("token")

        logger.warning(f"No token found for company name: {company_name}")
        return None


# Global instance
symbol_service = SymbolService()
