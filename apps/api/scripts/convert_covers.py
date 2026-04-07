import os
import sys
from PIL import Image, ImageOps

# Configuração de Caminhos
# Assume execução da raiz ou ajuste via path relativo
current_file = os.path.abspath(__file__)
# backend/scripts/convert_covers.py -> backend/scripts -> backend -> royalties
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_file)))

SOURCE_DIR = os.path.join(project_root, "frontend/public/images/capa/capa_full")
TARGET_DIR = os.path.join(project_root, "frontend/public/images/capa")

TARGET_SIZE = (500, 500)

def convert_covers():
    if not os.path.exists(SOURCE_DIR):
        print(f"❌ Diretório de origem não encontrado: {SOURCE_DIR}")
        return

    if not os.path.exists(TARGET_DIR):
        print(f"⚠️ Diretório de destino não existe, criando: {TARGET_DIR}")
        os.makedirs(TARGET_DIR)

    files = [f for f in os.listdir(SOURCE_DIR) if not f.startswith('.')]
    print(f"Encontrados {len(files)} arquivos para processar.")

    processed = 0
    errors = 0

    for filename in files:
        file_path = os.path.join(SOURCE_DIR, filename)
        
        # Ignorar subdiretórios se houver
        if os.path.isdir(file_path): continue

        try:
            # Definir nome de saída: basename + .webp
            name_part = os.path.splitext(filename)[0]
            target_filename = f"{name_part}.webp"
            target_path = os.path.join(TARGET_DIR, target_filename)

            # Abrir e Processar
            with Image.open(file_path) as img:
                # Converter para RGB se for RGBA/P (para garantir compatibilidade webp/jpeg se mudasse)
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                    
                # Resize + Crop (cover fit)
                # ImageOps.fit redimensiona mantendo aspect ratio e faz crop centralizado
                new_img = ImageOps.fit(img, TARGET_SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
                
                # Salvar WebP com qualidade 85 (bom balanço)
                new_img.save(target_path, "WEBP", quality=85)
                
            print(f"✅ Convertido: {filename} -> {target_filename}")
            processed += 1

        except Exception as e:
            print(f"❌ Erro ao converter {filename}: {e}")
            errors += 1

    print("\n--- Relatório de Conversão ---")
    print(f"Processados com sucesso: {processed}")
    print(f"Erros: {errors}")

if __name__ == "__main__":
    convert_covers()
