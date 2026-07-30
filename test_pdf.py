from pypdf import PdfReader

reader = PdfReader("sample_resume.pdf")

print(f"Number of pages: {len(reader.pages)}")
print("-" * 40)

text = ""
for page in reader.pages:
    text += page.extract_text()

print(text)