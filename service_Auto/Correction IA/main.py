from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from api_gemma import correct_text #/ corrector.py = local 

import uvicorn

app = FastAPI()

templates = Jinja2Templates(directory="templates")



@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
    "index.html",
    {"request": request}
    )



@app.post("/correct_api")
async def correct_api(text: str = Form(...)):
    corrected = correct_text(text)
    return JSONResponse({"corrected": corrected})



if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

