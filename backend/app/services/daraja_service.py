import base64
import httpx
from datetime import datetime

from app.core.config import settings


class DarajaService:
    """Safaricom Daraja API client for Lipa Na M-Pesa Online (STK Push)."""

    def _base_url(self) -> str:
        if settings.DARAJA_ENV == "production":
            return "https://api.safaricom.co.ke"
        return "https://sandbox.safaricom.co.ke"

    async def get_access_token(self) -> str:
        credentials = f"{settings.DARAJA_CONSUMER_KEY}:{settings.DARAJA_CONSUMER_SECRET}"
        encoded = base64.b64encode(credentials.encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._base_url()}/oauth/v1/generate?grant_type=client_credentials",
                headers={"Authorization": f"Basic {encoded}"},
                timeout=15.0,
            )
            response.raise_for_status()
            return response.json()["access_token"]

    def _format_phone(self, phone: str) -> str:
        """Normalize phone to 2547XXXXXXXX format."""
        phone = phone.strip().replace(" ", "").replace("-", "")
        if phone.startswith("+254"):
            phone = phone[1:]  # remove +
        elif phone.startswith("0"):
            phone = "254" + phone[1:]
        elif phone.startswith("7") or phone.startswith("1"):
            phone = "254" + phone
        return phone

    def _timestamp(self) -> str:
        return datetime.now().strftime("%Y%m%d%H%M%S")

    def _password(self, timestamp: str) -> str:
        raw = f"{settings.DARAJA_SHORTCODE}{settings.DARAJA_PASSKEY}{timestamp}"
        return base64.b64encode(raw.encode()).decode()

    async def stk_push(self, phone: str, amount: float, booking_id: str) -> dict:
        """Initiate STK Push payment. Returns Daraja response with CheckoutRequestID."""
        access_token = await self.get_access_token()
        timestamp = self._timestamp()
        password = self._password(timestamp)
        formatted_phone = self._format_phone(phone)
        # Amount must be a whole number (KES)
        amount_int = max(1, int(round(amount)))

        payload = {
            "BusinessShortCode": settings.DARAJA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount_int,
            "PartyA": formatted_phone,
            "PartyB": settings.DARAJA_SHORTCODE,
            "PhoneNumber": formatted_phone,
            "CallBackURL": settings.DARAJA_CALLBACK_URL,
            "AccountReference": f"Afristay-{booking_id[:8]}",
            "TransactionDesc": "Afristay Booking Payment",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self._base_url()}/mpesa/stkpush/v1/processrequest",
                json=payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()


daraja_service = DarajaService()
