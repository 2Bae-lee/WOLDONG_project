from fastapi.responses import JSONResponse

def success(data=None, message="성공", status_code=200):
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return JSONResponse(content=body, status_code=status_code)

def error(message="오류가 발생했습니다", status_code=400):
    return JSONResponse(
        content={"success": False, "message": message},
        status_code=status_code
    )
