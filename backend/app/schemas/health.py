from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


class HealthReadyResponse(BaseModel):
    status: str
    database: str
