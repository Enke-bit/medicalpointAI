from pypdf import PdfReader

r = PdfReader("Statista_Smart_Hospitals_Digital_Maturity_Survey_AI.pdf")
out = []
out.append(f"PAGES: {len(r.pages)}")
for i, p in enumerate(r.pages):
    out.append(f"\n--- PAGE {i+1} ---\n")
    out.append(p.extract_text() or "[NO TEXT]")
open("extracted.txt", "w", encoding="utf-8").write("\n".join(out))
print("done", len(r.pages))
