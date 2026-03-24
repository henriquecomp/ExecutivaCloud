from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict


class SettingsBackupData(BaseModel):
    legal_organizations: List[Dict[str, Any]] = Field(default_factory=list, alias="legalOrganizations")
    organizations: List[Dict[str, Any]] = Field(default_factory=list)
    departments: List[Dict[str, Any]] = Field(default_factory=list)
    executives: List[Dict[str, Any]] = Field(default_factory=list)
    secretaries: List[Dict[str, Any]] = Field(default_factory=list)
    users: List[Dict[str, Any]] = Field(default_factory=list)
    event_types: List[Dict[str, Any]] = Field(default_factory=list, alias="eventTypes")
    events: List[Dict[str, Any]] = Field(default_factory=list)
    contact_types: List[Dict[str, Any]] = Field(default_factory=list, alias="contactTypes")
    contacts: List[Dict[str, Any]] = Field(default_factory=list)
    expenses: List[Dict[str, Any]] = Field(default_factory=list)
    expense_categories: List[Dict[str, Any]] = Field(default_factory=list, alias="expenseCategories")
    tasks: List[Dict[str, Any]] = Field(default_factory=list)
    document_categories: List[Dict[str, Any]] = Field(default_factory=list, alias="documentCategories")
    documents: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class SettingsBackupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    version: str = Field(..., min_length=1, max_length=20)
    data: SettingsBackupData

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class SettingsBackupCreate(SettingsBackupBase):
    pass


class SettingsBackupUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    version: Optional[str] = Field(default=None, min_length=1, max_length=20)
    data: Optional[SettingsBackupData] = None

    model_config = ConfigDict(populate_by_name=True)


class SettingsBackup(SettingsBackupBase):
    id: int
    created_at: datetime = Field(..., alias="createdAt")
