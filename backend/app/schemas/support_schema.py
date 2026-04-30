from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict

ProblemReportContext = Literal["login", "app"]
ProblemReportCategory = Literal["Bug", "Acesso / login", "Sugestão", "Outro"]


class ProblemReportCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    context: ProblemReportContext
    category: ProblemReportCategory = "Bug"
    email: EmailStr
    name: Optional[str] = Field(None, max_length=120)
    description: str = Field(..., min_length=5, max_length=5000)
    screen_label: Optional[str] = Field(None, alias="screenLabel", max_length=120)
    page_url: Optional[str] = Field(None, alias="pageUrl", max_length=2000)
    user_agent: Optional[str] = Field(None, alias="userAgent", max_length=1500)


class MessageResponse(BaseModel):
    message: str
