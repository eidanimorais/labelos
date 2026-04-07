import docx
import sys

def read_docx(file_path):
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(f"<p>{para.text}</p>")
        return '\n'.join(full_text)
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    path = "/Users/daniel/Documents/DEV/royalties/contratos/termo-fonograma.docx"
    print(read_docx(path))
