from pydantic import BaseModel, Field


class OTPRequest(BaseModel):
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$", description="10-digit Indian mobile")


class OTPVerify(BaseModel):
    mobile: str
    otp: str = Field(..., min_length=6, max_length=6)


class PartnerRegister(BaseModel):
    mobile: str
    otp: str
    swiggy_partner_id: str = Field(..., pattern=r"^SWG-\d+$")
    name: str
    weekly_income: float = Field(..., gt=0)
    work_type: str = Field(..., pattern="^(full-time|part-time|casual)$")
    zone: str
    aadhaar_last4: str = Field(..., min_length=4, max_length=4)
    pan: str = Field(..., pattern=r"^[A-Z]{5}[0-9]{4}[A-Z]$")
    upi_id: str = Field(..., pattern=r"^[\w.\-]+@[\w]+$")


class LoginRequest(BaseModel):
    mobile: str
    swiggy_partner_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    partner_id: str