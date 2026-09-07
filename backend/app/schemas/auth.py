'''pydantic schemas for administrator authentication'''

from pydantic import BaseModel

class LoginRequest(BaseModel):
    '''validates administrator login credentials'''

    username: str
    password: str

class TokenResponse(BaseModel):
    '''represents the token returned after successful login'''

    access_token: str
    token_type: str= "bearer"

class AdminResponse(BaseModel):
    '''represents admin info exposed through the api'''

    admin_id: int
    username: str
    email: str
    admin_status: str

    model_config = {
        "from_attributes": True, #allows pydantic to construct an api response conveniently from an orm obj
    }