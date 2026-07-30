from fastapi.middleware.cors import CORSMiddleware
import os
import json
from dotenv import load_dotenv
from google import genai
from pypdf import PdfReader
from fastapi import FastAPI, UploadFile, File, Form
from io import BytesIO

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def build_prompt(resume_text: str, job_description: str) -> str:
    return f"""
You are a resume-matching assistant. Compare the RESUME to the JOB DESCRIPTION
and return ONLY a valid JSON object, with no markdown formatting and no extra text.

The JSON must have exactly these fields:
- match_score: an integer from 0 to 100
- matched_skills: a list of strings
- missing_skills: a list of strings
- suggestions: a list of 2-3 short strings with concrete advice

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
"""

def parse_json_response(raw_text: str) -> dict:
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        raw_text = raw_text.replace("json", "", 1).strip()
    return json.loads(raw_text)

@app.post("/match")
async def match_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    # Read the uploaded PDF into memory and extract text
    file_bytes = await resume.read()
    reader = PdfReader(BytesIO(file_bytes))
    resume_text = ""
    for page in reader.pages:
        resume_text += page.extract_text()

    # Build prompt and call Gemini
    prompt = build_prompt(resume_text, job_description)
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    # Parse and return, with a fallback if parsing fails
    try:
        result = parse_json_response(response.text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse model response", "raw": response.text}

    return result