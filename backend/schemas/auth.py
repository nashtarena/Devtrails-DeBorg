from pydantic import BaseModel, Field


class OTPRequest(BaseModel):
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$", description="10-digit Indian mobile")


class OTPVerify(BaseModel):
    mobile: str
    otp: str = Field(..., min_length=6, max_length=6)


class PartnerRegister(BaseModel):
    mobile: str
    otp: str
    swiggy_partner_id: str
    name: str
    weekly_income: float = Field(..., gt=0)
    work_type: str
    zone: str
    aadhaar_last4: str = Field(..., min_length=4, max_length=4)
    pan: str
    upi_id: str
    plan: str = Field(default="plus", pattern=r"^(basic|plus|shield)$")

    def normalize(self):
        self.work_type = self.work_type.lower().replace(" ", "-")
        self.pan = self.pan.upper()
        if not self.swiggy_partner_id.startswith("SWG-"):
            self.swiggy_partner_id = f"SWG-{self.swiggy_partner_id}"


class LoginRequest(BaseModel):
    mobile: str
    swiggy_partner_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    partner_id: str
