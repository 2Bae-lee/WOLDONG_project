from fastapi import APIRouter

from ai_model.inference import predict_warnings
from app.models.warning import WarningRequest


router = APIRouter()


@router.post("/predict-warning")
def predict_warning(req: WarningRequest):
    return {"warnings": predict_warnings(req.checked_items, threshold=req.threshold)}
