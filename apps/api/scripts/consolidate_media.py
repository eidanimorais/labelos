
import os
import shutil
import hashlib

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND_MEDIA_DIR = os.path.join(PROJECT_ROOT, "backend", "static", "media")
FRONTEND_IMAGES_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "images")
UPLOADS_DIR = os.path.join(PROJECT_ROOT, "uploads")
STATIC_ROOT_DIR = os.path.join(PROJECT_ROOT, "static")

def get_file_hash(filepath):
    """Calculates MD5 hash of file to detect duplicates."""
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def move_file(src_path, dest_folder):
    """Moves file to destination, avoiding duplicates."""
    if not os.path.exists(src_path):
        return

    filename = os.path.basename(src_path)
    dest_path = os.path.join(BACKEND_MEDIA_DIR, dest_folder, filename)

    if os.path.exists(dest_path):
        # Check if identical content
        if get_file_hash(src_path) == get_file_hash(dest_path):
            print(f"Skipping duplicate (identical): {filename}")
            # Optionally delete source if we want to clean up immediately
            # os.remove(src_path) 
            return
        else:
            # Rename if content differs but name is same
            base, ext = os.path.splitext(filename)
            new_filename = f"{base}_{get_file_hash(src_path)[:6]}{ext}"
            dest_path = os.path.join(BACKEND_MEDIA_DIR, dest_folder, new_filename)
            print(f"Renaming collision: {filename} -> {new_filename}")

    shutil.copy2(src_path, dest_path)
    print(f"Moved: {src_path} -> {dest_path}")

def process_directory(source_dir, default_dest_folder="other"):
    if not os.path.exists(source_dir):
        print(f"Directory not found: {source_dir}")
        return

    for root, dirs, files in os.walk(source_dir):
        for file in files:
            if file.startswith("."): continue
            
            src_path = os.path.join(root, file)
            
            # Determine destination based on file type or source folder structure
            dest = default_dest_folder
            
            # Simple heuristics
            lower_name = file.lower()
            if "cover" in lower_name or "capa" in lower_name or "art" in lower_name:
                dest = "covers"
            elif "profile" in lower_name or "artist" in lower_name or "avatar" in lower_name:
                dest = "profiles"
            elif lower_name.endswith((".mp3", ".wav", ".flac", ".m4a")):
                dest = "audio"
            
            # Override based on source path if it has clear structure
            if "covers" in root.lower() or "capa" in root.lower():
                dest = "covers"
            elif "profiles" in root.lower():
                dest = "profiles"

            move_file(src_path, dest)

if __name__ == "__main__":
    print("Starting media consolidation...")
    
    # Process Frontend Public Images
    print(f"Processing Frontend Images: {FRONTEND_IMAGES_DIR}")
    process_directory(FRONTEND_IMAGES_DIR)

    # Process Root Static
    # print(f"Processing Root Static: {STATIC_ROOT_DIR}")
    # process_directory(STATIC_ROOT_DIR)

    # Process Uploads (be careful not to move things that are strictly temporary if any)
    # print(f"Processing Uploads: {UPLOADS_DIR}")
    # process_directory(UPLOADS_DIR)

    print("Consolidation complete.")
