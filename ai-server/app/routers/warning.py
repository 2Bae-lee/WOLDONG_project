from fastapi import APIRouter, HTTPException

from ai_model.inference import predict_warnings
from app.models.warning import WarningRequest


router = APIRouter()


@router.post("/predict-warning")
def predict_warning(req: WarningRequest):
    try:
        warnings = predict_warnings(req.checked_items, threshold=req.threshold)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"warnings": warnings}
