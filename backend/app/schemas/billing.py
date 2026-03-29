from pydantic import BaseModel


class CheckoutSessionCreate(BaseModel):
    price_id: str | None = None


class CheckoutSessionResponse(BaseModel):
    url: str


class BillingPortalResponse(BaseModel):
    url: str
