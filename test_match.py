import os
import json
from dotenv import load_dotenv
from google import genai
from pypdf import PdfReader

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Step 1: extract resume text (same as before)
reader = PdfReader("sample_resume.pdf")
resume_text = ""
for page in reader.pages:
    resume_text += page.extract_text()

# Step 2: a sample job description to test against
job_description = """
We are hiring a Backend Software Engineer with experience in Python, FastAPI,
PostgreSQL, and cloud deployment (AWS or similar). Experience with Docker,
CI/CD pipelines, and building scalable APIs is a plus. 3+ years preferred.
"""

# Step 3: build the prompt
prompt = f"""
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

response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents=prompt
)

raw_text = response.text.strip()

# Gemini sometimes wraps JSON in ```json fences — strip those if present
if raw_text.startswith("```"):
    raw_text = raw_text.strip("`")
    raw_text = raw_text.replace("json", "", 1).strip()

result = json.loads(raw_text)

print(json.dumps(result, indent=2))