from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User, Plan
from app.schemas.billing import CheckoutSessionCreate, CheckoutSessionResponse, BillingPortalResponse

router = APIRouter(prefix="/billing", tags=["billing"])


def get_stripe():
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing not configured")
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout(
    data: CheckoutSessionCreate,
    current_user: User = Depends(get_current_user),
):
    stripe = get_stripe()
    price_id = data.price_id or settings.STRIPE_PRO_PRICE_ID
    if not price_id:
        raise HTTPException(status_code=400, detail="No price configured")

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/billing?success=1",
        cancel_url=f"{settings.FRONTEND_URL}/billing?canceled=1",
        customer_email=current_user.email,
        metadata={"user_id": str(current_user.id)},
        allow_promotion_codes=True,
    )
    return CheckoutSessionResponse(url=session.url)


@router.post("/portal", response_model=BillingPortalResponse)
async def billing_portal(current_user: User = Depends(get_current_user)):
    stripe = get_stripe()
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    session = stripe.billing_portal.Session.create(
        customer=current_user.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/billing",
    )
    return BillingPortalResponse(url=session.url)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    stripe = get_stripe()
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook secret not configured")

    body = await request.body()
    try:
        event = stripe.Webhook.construct_event(body, stripe_signature, settings.STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")

        if user_id:
            from sqlalchemy import select
            import uuid
            result = await db.execute(
                select(User).where(User.id == uuid.UUID(user_id))
            )
            user = result.scalar_one_or_none()
            if user:
                user.plan = Plan.pro
                user.stripe_customer_id = customer_id
                user.stripe_subscription_id = subscription_id
                await db.flush()

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")

        from sqlalchemy import select
        result = await db.execute(
            select(User).where(User.stripe_customer_id == customer_id)
        )
        user = result.scalar_one_or_none()
        if user:
            user.plan = Plan.free
            user.stripe_subscription_id = None
            await db.flush()

    return {"received": True}
