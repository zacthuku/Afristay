import logging
import uuid
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

AIRTEL_BASE_URL = "https://openapi.airtel.africa"


def _normalize_phone(phone: str) -> str:
    """Convert 07XXXXXXXX or +2547XXXXXXXX → 2547XXXXXXXX (no +)."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        phone = phone[1:]
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    return phone


class AirtelService:
    async def _get_token(self) -> str:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{AIRTEL_BASE_URL}/auth/oauth2/token",
                json={
                    "client_id": settings.AIRTEL_CLIENT_ID,
                    "client_secret": settings.AIRTEL_CLIENT_SECRET,
                    "grant_type": "client_credentials",
                },
                headers={"Content-Type": "application/json", "Accept": "*/*"},
            )
            resp.raise_for_status()
            data = resp.json()
            token = data.get("access_token")
            if not token:
                raise ValueError(f"No access_token in Airtel auth response: {data}")
            return token

    async def ussd_push(self, phone: str, amount: float, booking_id: str) -> dict:
        token = await self._get_token()
        msisdn = _normalize_phone(phone)
        transaction_id = f"AFS-{uuid.uuid4().hex[:12].upper()}"

        payload = {
            "reference": f"Booking {booking_id[:8]}",
            "subscriber": {
                "country": "KE",
                "currency": "KES",
                "msisdn": msisdn,
            },
            "transaction": {
                "amount": int(amount),
                "country": "KE",
                "currency": "KES",
                "id": transaction_id,
            },
        }

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{AIRTEL_BASE_URL}/merchant/v2/payments/",
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Country": "KE",
                    "X-Currency": "KES",
                    "Content-Type": "application/json",
                    "Accept": "*/*",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        status = data.get("status", {})
        result_code = status.get("result_code", "")
        # ESB000010 = success / dispatched
        if result_code not in ("ESB000010", "DP00800001006"):
            if status.get("code") not in ("200",):
                raise ValueError(f"Airtel payment initiation failed: {status.get('message', data)}")

        airtel_id = data.get("data", {}).get("transaction", {}).get("id", transaction_id)
        return {"transaction_id": airtel_id, "internal_id": transaction_id}

    async def check_status(self, transaction_id: str) -> str:
        """Returns 'TS' (success), 'TF' (failed), or 'DP' (pending)."""
        token = await self._get_token()
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{AIRTEL_BASE_URL}/standard/v1/payments/{transaction_id}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Country": "KE",
                    "X-Currency": "KES",
                    "Accept": "*/*",
                },
            )
            resp.raise_for_status()
            data = resp.json()
        return data.get("data", {}).get("transaction", {}).get("status", "DP")


airtel_service = AirtelService()
