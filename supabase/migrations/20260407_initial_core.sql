create extension if not exists "pgcrypto";

create table if not exists profiles (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    full_name text,
    photo_url text,
    type text not null default 'artist',
    ipi text,
    isni text,
    email text,
    cpf text,
    pix text,
    role text not null default 'artist',
    address text,
    neighborhood text,
    city text,
    state text,
    zip_code text,
    bank text,
    agency text,
    account text,
    bio text,
    website_url text,
    spotify_url text,
    instagram_url text,
    youtube_url text,
    apple_music_url text,
    publisher text,
    label_name text,
    association text,
    publisher_extra text,
    created_at timestamptz not null default now()
);

create table if not exists works (
    id uuid primary key default gen_random_uuid(),
    iswc text unique,
    title text not null,
    writers_text text,
    publisher text,
    genre text,
    creation_date timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists tracks (
    id uuid primary key default gen_random_uuid(),
    isrc text not null unique,
    title text not null,
    artist_name text,
    version text not null default 'Original',
    artist_id uuid references profiles (id) on delete set null,
    work_id uuid references works (id) on delete set null,
    cover_url text,
    master_audio_url text,
    master_cover_url text,
    release_date date,
    duration text,
    label_share numeric(5, 4) not null default 0.40,
    label_name text not null default 'GRAV Produção Musical Ltda.',
    p_line text,
    c_line text,
    grid text,
    display_artist text,
    cached_streams integer not null default 0,
    cached_revenue numeric(14, 2) not null default 0,
    production_cost numeric(14, 2) not null default 0,
    display_status text not null default 'Live',
    genre text,
    composer text,
    publisher text,
    upc text,
    bpm integer,
    key text,
    producer text,
    audio_engineer text,
    mixing_engineer text,
    mastering_engineer text,
    release_time_platforms text,
    release_time_youtube text,
    isrc_video text,
    explicit text not null default 'Nao',
    author_contact text,
    album text,
    track_number integer,
    format text,
    created_at timestamptz not null default now()
);

create table if not exists splits (
    id uuid primary key default gen_random_uuid(),
    track_id uuid not null references tracks (id) on delete cascade,
    profile_id uuid references profiles (id) on delete set null,
    participant_name text not null,
    role text not null default 'artist',
    percentage numeric(6, 3) not null check (percentage >= 0 and percentage <= 100),
    created_at timestamptz not null default now()
);

create table if not exists work_splits (
    id uuid primary key default gen_random_uuid(),
    work_id uuid not null references works (id) on delete cascade,
    profile_id uuid references profiles (id) on delete set null,
    participant_name text not null,
    role text not null default 'Composer',
    writer_type text not null default 'CA',
    share numeric(6, 3) not null check (share >= 0 and share <= 100),
    created_at timestamptz not null default now()
);

create table if not exists imports (
    id uuid primary key default gen_random_uuid(),
    filename text not null,
    distributor text,
    imported_at timestamptz not null default now(),
    notes text
);

create table if not exists transactions (
    id uuid primary key default gen_random_uuid(),
    import_id uuid references imports (id) on delete set null,
    track_id uuid references tracks (id) on delete set null,
    work_id uuid references works (id) on delete set null,
    trimestre text,
    source text,
    territorio text,
    streams integer not null default 0,
    royalties_value numeric(14, 2) not null default 0,
    raw_artist text,
    raw_track text,
    raw_isrc text,
    raw_iswc text,
    created_at timestamptz not null default now()
);

create table if not exists contracts (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    track_id uuid references tracks (id) on delete set null,
    file_path text,
    assinafy_id text,
    status text not null default 'Rascunho',
    signers_info jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_profiles_type on profiles (type);
create index if not exists idx_tracks_artist_id on tracks (artist_id);
create index if not exists idx_tracks_work_id on tracks (work_id);
create index if not exists idx_tracks_title on tracks (title);
create index if not exists idx_works_title on works (title);
create index if not exists idx_transactions_track_id on transactions (track_id);
create index if not exists idx_transactions_work_id on transactions (work_id);
create index if not exists idx_transactions_import_id on transactions (import_id);
create index if not exists idx_transactions_raw_isrc on transactions (raw_isrc);
create index if not exists idx_transactions_raw_iswc on transactions (raw_iswc);
