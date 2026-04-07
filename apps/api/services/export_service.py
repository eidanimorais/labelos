import io
import os
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from datetime import datetime
from .google_drive_service import get_drive_service

def generate_technical_sheet_pdf(track_data: dict) -> bytes:
    """Generates a PDF technical sheet using reportlab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        alignment=1, # Center
        spaceAfter=30,
        textColor=colors.HexColor("#111827")
    )
    
    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor("#6B7280"),
        spaceAfter=2
    )
    
    value_style = ParagraphStyle(
        'ValueStyle',
        parent=styles['Normal'],
        fontSize=12,
        fontName='Helvetica',
        textColor=colors.HexColor("#111827"),
        spaceAfter=12
    )

    elements = []

    # Title
    elements.append(Paragraph("FICHA TÉCNICA", title_style))
    elements.append(Spacer(1, 0.2 * inch))

    # Data Fields Mapping
    fields = [
        ("Título", track_data.get("title")),
        ("Artista(s) Principal(is)", track_data.get("artist")),
        ("Data de Lançamento", track_data.get("release_date")),
        ("Horário nas Plataformas", track_data.get("release_time_platforms", "00h")),
        ("Horário no YouTube", track_data.get("release_time_youtube", "12h")),
        ("Explicit", track_data.get("explicit", "Não")),
        ("ISRC Áudio", track_data.get("isrc")),
        ("ISRC Vídeo", track_data.get("isrc_video", "Não disponível")),
        ("Gênero", track_data.get("genre")),
        ("Compositor(es)", track_data.get("composer")),
        ("Editora(s)", track_data.get("publisher")),
        ("Produtor(es)", track_data.get("producer")),
        ("Mixagem", track_data.get("mixing_engineer")),
        ("Masterização", track_data.get("mastering_engineer")),
        ("Contato Autor/Editora", track_data.get("author_contact", "Não aplicável")),
    ]

    for label, value in fields:
        elements.append(Paragraph(label.upper(), label_style))
        elements.append(Paragraph(str(value) if value else "-", value_style))

    # Footer
    elements.append(Spacer(1, 0.5 * inch))
    footer_text = f"Gerado por LabelOS em {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    elements.append(Paragraph(footer_text, styles['Italic']))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def export_to_google_docs(track_data: dict):
    """Creates a Google Doc with the technical sheet information."""
    drive_service = get_drive_service()
    if not drive_service:
        raise Exception("Google Drive service not initialized")

    # Create document folder if it doesn't exist
    folder_id = drive_service.find_or_create_folder("Fichas Técnicas")
    
    # Document content (Markdown-like or plain text for initial version)
    content = f"""FICHA TÉCNICA

Título: {track_data.get('title')}
Artista(s) Principal(is): {track_data.get('artist')}
Data de Lançamento: {track_data.get('release_date')}
Horário nas Plataformas: {track_data.get('release_time_platforms', '00h')}
Horário no YouTube: {track_data.get('release_time_youtube', '12h')}
Explicit: {track_data.get('explicit', 'Não')}
ISRC Áudio: {track_data.get('isrc')}
ISRC Vídeo: {track_data.get('isrc_video', 'Não disponível')}
Gênero: {track_data.get('genre')}
Compositor(es): {track_data.get('composer')}
Editora(s): {track_data.get('publisher')}
Produtor(es): {track_data.get('producer')}
Mixagem: {track_data.get('mixing_engineer')}
Masterização: {track_data.get('mastering_engineer')}
Contato Autor/Editora: {track_data.get('author_contact', 'Não aplicável')}

Gerado por LabelOS em {datetime.now().strftime('%d/%m/%Y %H:%M')}
"""
    
    # Since we want a real Google Doc, we'll upload as plain text and let Google convert it
    # or better, use the Docs API to format. But for simplicity and based on the user's need,
    # uploading as a Google Doc is best.
    
    file_metadata = {
        'name': f"Ficha Técnica - {track_data.get('title')} - {track_data.get('isrc')}",
        'mimeType': 'application/vnd.google-apps.document',
        'parents': [folder_id]
    }
    
    media = io.BytesIO(content.encode('utf-8'))
    from googleapiclient.http import MediaIoBaseUpload
    
    upload_media = MediaIoBaseUpload(media, mimetype='text/plain', resumable=True)
    
    doc = drive_service.service.files().create(
        body=file_metadata,
        media_body=upload_media,
        fields='id, webViewLink'
    ).execute()
    
    return doc
