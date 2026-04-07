from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SplitBase(BaseModel):
    participant_name: str
    role: Optional[str] = None
    percentage: float

class SplitCreate(SplitBase):
    pass

class Split(SplitBase):
    id: int
    track_id: int
    profile_photo: Optional[str] = None

    class Config:
        orm_mode = True

class TrackBase(BaseModel):
    isrc: str
    musica_normalizada: str
    musica_display: str
    version_type: Optional[str] = "Original"
    production_cost: Optional[float] = 0.0
    label_share: Optional[float] = 0.40
    label_name: Optional[str] = "GRAV Produção Musical Ltda."
    artist: Optional[str] = None
    cover_image: Optional[str] = None
    master_audio_url: Optional[str] = None
    master_cover_url: Optional[str] = None
    release_date: Optional[str] = None
    duration: Optional[str] = None
    display_status: Optional[str] = "Live"
    genre: Optional[str] = None
    composer: Optional[str] = None
    publisher: Optional[str] = None
    upc: Optional[str] = None
    bpm: Optional[int] = None
    key: Optional[str] = None
    producer: Optional[str] = None
    audio_engineer: Optional[str] = None
    mixing_engineer: Optional[str] = None
    mastering_engineer: Optional[str] = None
    release_time_platforms: Optional[str] = None
    release_time_youtube: Optional[str] = None
    isrc_video: Optional[str] = None
    explicit: Optional[str] = "Não"
    author_contact: Optional[str] = None
    
    # CWR / DDEX Fields
    p_line: Optional[str] = None
    c_line: Optional[str] = None
    grid: Optional[str] = None
    display_artist: Optional[str] = None
    
    # New Fields
    album: Optional[str] = None
    track_number: Optional[int] = None
    format: Optional[str] = None

class TrackUpdate(BaseModel):
    version_type: Optional[str] = None
    production_cost: Optional[float] = None
    musica_display: Optional[str] = None
    artist: Optional[str] = None
    display_status: Optional[str] = None
    genre: Optional[str] = None
    composer: Optional[str] = None
    publisher: Optional[str] = None
    upc: Optional[str] = None
    bpm: Optional[int] = None
    key: Optional[str] = None
    producer: Optional[str] = None
    audio_engineer: Optional[str] = None
    mixing_engineer: Optional[str] = None
    mastering_engineer: Optional[str] = None
    release_time_platforms: Optional[str] = None
    release_time_youtube: Optional[str] = None
    isrc_video: Optional[str] = None
    explicit: Optional[str] = None
    author_contact: Optional[str] = None
    p_line: Optional[str] = None
    c_line: Optional[str] = None
    grid: Optional[str] = None
    display_artist: Optional[str] = None
    duration: Optional[str] = None
    album: Optional[str] = None
    track_number: Optional[int] = None
    format: Optional[str] = None
    release_date: Optional[str] = None

class Track(TrackBase):
    id: int
    splits: List[Split] = []

    class Config:
        orm_mode = True


class SplitSummaryItem(BaseModel):
    name: str
    percentage: float
    role: Optional[str] = None

class TrackStats(Track):
    total_streams: int = 0
    total_revenue: float = 0.0
    status: str = "Processing"
    artist: Optional[str] = "Unknown"
    split_count: int = 0
    split_summary: List[SplitSummaryItem] = []
    trend: Optional[float] = 0.0
    children: List["TrackStats"] = [] # Versions of the same track

TrackStats.update_forward_refs()


class TransactionBase(BaseModel):
    trimestre: str
    artista_raw: str
    isrc: str
    musica: str
    territorio: str
    plataforma: str
    streams: int
    royalties_value: float

class Transaction(TransactionBase):
    id: int
    import_id: int

    class Config:
        orm_mode = True

class ImportBase(BaseModel):
    filename: str
    notes: Optional[str] = None

class Import(ImportBase):
    id: int
    imported_at: datetime

    class Config:
        orm_mode = True

class WorkBase(BaseModel):
    title: str
    iswc: Optional[str] = None
    iswc_link: Optional[str] = None

class WorkCreate(WorkBase):
    pass

class WorkSplitBase(BaseModel):
    participant_name: str
    role: str = "Composer"
    writer_type: str = "CA"
    share: float

class WorkSplitCreate(WorkSplitBase):
    profile_id: Optional[int] = None

class WorkSplit(WorkSplitBase):
    id: int
    work_id: int
    profile_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class Work(WorkBase):
    id: int
    created_at: datetime
    splits: List[WorkSplit] = []

    class Config:
        from_attributes = True

class LabelSettingsBase(BaseModel):
    stage_name: Optional[str] = "REAL PS"
    legal_name: Optional[str] = None
    primary_identifier: Optional[str] = None
    account: Optional[str] = None
    pix: Optional[str] = None
    bio: Optional[str] = None
    spotify_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    website_url: Optional[str] = None
    
    # Extended Info
    bank_code: Optional[str] = None
    branch_id: Optional[str] = None
    acc_number: Optional[str] = None
    tax_id_pix: Optional[str] = None
    website_url: Optional[str] = None

class LabelSettingsUpdate(LabelSettingsBase):
    pass

class LabelSettings(LabelSettingsBase):
    id: int
    updated_at: datetime

    class Config:
        orm_mode = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class ProfileBase(BaseModel):
    name: str # Stage Name
    full_name: Optional[str] = None
    photo_url: Optional[str] = None
    type: Optional[str] = "artist"
    email: Optional[str] = None
    ipi: Optional[str] = None
    isni: Optional[str] = None
    is_admin: Optional[str] = "artist"

class Profile(ProfileBase):
    id: int
    
    class Config:
        orm_mode = True


