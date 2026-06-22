from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


_LEGACY_INFERENCE_PATH = Path(__file__).resolve().parents[1] / "inference.py"
_predict_warnings = None


def _load_legacy_predict_warnings():
    global _predict_warnings

    if _predict_warnings is not None:
        return _predict_warnings

    legacy_spec = spec_from_file_location(
        "ai_model._legacy_inference",
        _LEGACY_INFERENCE_PATH,
    )

    if legacy_spec is None or legacy_spec.loader is None:
        raise ImportError(f"Cannot load legacy inference module: {_LEGACY_INFERENCE_PATH}")

    legacy_module = module_from_spec(legacy_spec)
    legacy_spec.loader.exec_module(legacy_module)
    _predict_warnings = legacy_module.predict_warnings
    return _predict_warnings


def __getattr__(name):
    if name == "predict_warnings":
        return _load_legacy_predict_warnings()
    raise AttributeError(name)


__all__ = ["predict_warnings"]
