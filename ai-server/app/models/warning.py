from pydantic import BaseModel, Field


class WarningRequest(BaseModel):
    checked_items: list[str] = Field(
        default_factory=list,
        description="Checked child and schedule item names.",
    )
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)
