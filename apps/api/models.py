from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Table, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Import(Base):
    __tablename__ = "imports"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    distributor = Column(String, nullable=True) # Ex: Distrokid, ONErpm
    imported_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    transactions = relationship("Transaction", back_populates="import_ref")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    import_id = Column(Integer, ForeignKey("imports.id"))
    
    # Links Inteligentes
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=True) # Para fluxo fonomecânico
    work_id = Column(Integer, ForeignKey("works.id"), nullable=True)   # Para fluxo autoral
    
    # Dados da Transação
    trimestre = Column(String)
    source = Column(String) # Plataforma/Fonte (Spotify, Apple, etc)
    territorio = Column(String)
    
    # Dados Financeiros
    streams = Column(Integer, default=0)
    royalties_value = Column(Float)
    
    # Snapshots (Dados crus do CSV para auditoria caso o link falhe ou mude)
    raw_artist = Column(String, nullable=True)
    raw_track = Column(String, nullable=True)
    raw_isrc = Column(String, index=True, nullable=True)
    raw_iswc = Column(String, index=True, nullable=True)

    import_ref = relationship("Import", back_populates="transactions")
    track = relationship("Track", back_populates="transactions")
    work = relationship("Work", back_populates="transactions")

class Track(Base):
    __tablename__ = "tracks"

    id = Column(Integer, primary_key=True, index=True)
    isrc = Column(String, unique=True, index=True) # Chave Principal Fonomecânico
    title = Column(String, index=True)
    artist_name = Column(String, nullable=True) # Artist string from CSV or Manual Edit
    version = Column(String, default="Original") 
    
    # Relacionamentos
    artist_id = Column(Integer, ForeignKey("profiles.id"), nullable=True) # Artista Principal
    iswc = Column(String, ForeignKey("works.iswc"), nullable=True) # Obra associada
    
    # Metadados Extras
    cover_url = Column(String, nullable=True)
    master_audio_url = Column(String, nullable=True)
    master_cover_url = Column(String, nullable=True)
    release_date = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    label_share = Column(Float, default=0.40) # Deal padrão
    label_name = Column(String, default="GRAV Produção Musical Ltda.")
    
    # CWR / DDEX Standard Fields
    p_line = Column(String, nullable=True) # Phonographic Copyright
    c_line = Column(String, nullable=True) # Copyright
    grid = Column(String, nullable=True) # Global Release Identifier
    display_artist = Column(String, nullable=True) # Full display string
    
    # Cache fields for performance (Materialized View pattern)
    cached_streams = Column(Integer, default=0)
    cached_revenue = Column(Float, default=0.0)
    
    # Metadata for Catalog Management
    production_cost = Column(Float, default=0.0)
    display_status = Column(String, default="Live")
    genre = Column(String, nullable=True)
    composer = Column(String, nullable=True) # Fallback if no Work
    publisher = Column(String, nullable=True) # Fallback if no Work
    upc = Column(String, nullable=True)
    bpm = Column(Integer, nullable=True)
    key = Column(String, nullable=True)
    producer = Column(String, nullable=True) # Text alias

    audio_engineer = Column(String, nullable=True) # Text alias
    mixing_engineer = Column(String, nullable=True)
    mastering_engineer = Column(String, nullable=True)
    
    # New Release Info
    release_time_platforms = Column(String, nullable=True)
    release_time_youtube = Column(String, nullable=True)
    isrc_video = Column(String, nullable=True)
    explicit = Column(String, default="Não") # Sim/Não
    author_contact = Column(String, nullable=True)
    
    # New Catalog Fields
    album = Column(String, nullable=True)
    track_number = Column(Integer, nullable=True)
    format = Column(String, nullable=True) # Single, EP, Album
    
    # Relacionamentos
    transactions = relationship("Transaction", back_populates="track")
    splits = relationship("Split", back_populates="track")
    technical_credits = relationship("TechnicalCredit", back_populates="track")
    artist = relationship("Profile", back_populates="tracks")
    work = relationship("Work", back_populates="tracks")
    analytics = relationship("DailyAnalytics", back_populates="track")

class Work(Base):
    __tablename__ = "works"

    id = Column(Integer, primary_key=True, index=True)
    iswc = Column(String, unique=True, index=True, nullable=True) # Chave Principal Autoral
    title = Column(String, index=True)
    
    # Metadados Composicionais
    writers_text = Column(String, nullable=True) # Snapshot nomes compositores
    publisher = Column(String, nullable=True)
    
    # CWR Fields
    genre = Column(String, nullable=True)
    creation_date = Column(DateTime, nullable=True)
    
    transactions = relationship("Transaction", back_populates="work")
    tracks = relationship("Track", back_populates="work")
    splits = relationship("WorkSplit", back_populates="work")

class WorkSplit(Base):
    __tablename__ = "work_splits"
    
    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"))
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=True)
    
    participant_name = Column(String) # Fallback
    role = Column(String, default="Composer") # Composer, Author, Arranger
    writer_type = Column(String, default="CA") # C, A, CA, AR
    share = Column(Float) # Percentage 0-100
    
    work = relationship("Work", back_populates="splits")
    profile = relationship("Profile")

class Split(Base):
    __tablename__ = "splits"

    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"))
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=True) # Link ideal
    
    participant_name = Column(String) # Fallback se profile_id for null
    role = Column(String, default="artist") # artist, producer, feat
    percentage = Column(Float) # 0-100
    
    track = relationship("Track", back_populates="splits")
    profile = relationship("Profile")

class TechnicalCredit(Base):
    __tablename__ = "technical_credits"
    
    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"))
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=True)
    
    name = Column(String) # Fallback
    role = Column(String) # Producer, Mix Engineer, Master Engineer
    
    track = relationship("Track", back_populates="technical_credits")
    profile = relationship("Profile")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Stage Name
    full_name = Column(String, nullable=True) # Legal Name
    photo_url = Column(String, nullable=True)
    type = Column(String, default="artist") # artist, producer, label, writer
    
    # CWR / DDEX Identifiers
    ipi = Column(String, nullable=True) # Interested Party Information
    isni = Column(String, nullable=True) # International Standard Name Identifier
    
    # Info Bancária e Contato
    email = Column(String, nullable=True)
    cpf = Column(String, nullable=True)
    pix = Column(String, nullable=True)
    
    # Auth
    hashed_password = Column(String, nullable=True)
    is_admin = Column(Enum("admin", "artist", name="profile_role"), default="artist")
    
    # Endereço
    address = Column(String, nullable=True)
    neighborhood = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    zip_code = Column(String, nullable=True)
    
    # Dados Bancários Completos
    bank = Column(String, nullable=True)
    agency = Column(String, nullable=True)
    account = Column(String, nullable=True)
    
    # Metadados
    bio = Column(Text, nullable=True)
    website_url = Column(String, nullable=True)
    spotify_url = Column(String, nullable=True)
    instagram_url = Column(String, nullable=True)
    youtube_url = Column(String, nullable=True)
    apple_music_url = Column(String, nullable=True)
    
    # Dados Profissionais (Editora/Associação)
    publisher = Column(String, nullable=True)
    label_name = Column(String, nullable=True)
    association = Column(String, nullable=True)
    publisher_extra = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tracks = relationship("Track", back_populates="artist")

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=True)
    file_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Assinafy Integration
    assinafy_id = Column(String, nullable=True)
    status = Column(String, default="Rascunho") # Rascunho, Enviado, Visualizado, Assinado, Recusado
    signers_info = Column(Text, nullable=True) # JSON String com detalhes dos signatários
    
    track = relationship("Track")

# Utility Tables
class BankList(Base):
    __tablename__ = "bank_list"
    id = Column(Integer, primary_key=True)
    code = Column(String)
    name = Column(String)

class LabelSettings(Base):
    __tablename__ = "label_settings"
    id = Column(Integer, primary_key=True)
    stage_name = Column(String)
    # ... outros campos mantidos implicitamente se necessário, ou simplificados para o MVP

class DailyAnalytics(Base):
    __tablename__ = "daily_analytics"

    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"))
    date = Column(DateTime) # Using DateTime for consistency, though Date is enough
    platform = Column(String, default="Spotify")
    total_streams = Column(Integer)
    
    track = relationship("Track", back_populates="analytics")
