import sqlite3
import csv
import difflib

# Song Data provided by user
song_data = [
    {"title": "Abracadabra", "iswc": "T-330.932.570-6", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/37853080"},
    {"title": "Af, Tô Muito Apaixonado", "iswc": "T-320.760.868-8", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/31568400"},
    {"title": "American Pie", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54145181"},
    {"title": "Amiga Da Onça", "iswc": "T-329.452.073-9", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/31469263"},
    {"title": "Amigo Talarico", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/31469264"},
    {"title": "Apaixonadin", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47987547"},
    {"title": "Bem-vindo Ao Hardmode", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54147628"},
    {"title": "Blackpink", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54147614"},
    {"title": "Caca As Bruxas", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54213788"},
    {"title": "Cada Um Pro Seu Lado", "iswc": "T-327.602.995-5", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47955463"},
    {"title": "Calor Do Verao", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47717225"},
    {"title": "Cancao Pra Ela", "iswc": "T-327.602.987-5", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47716673"},
    {"title": "Capital Girando", "iswc": "T-329.452.072-8", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/31278302"},
    {"title": "Capital Girando 2", "iswc": "T-320.760.693-3", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/38189872"},
    {"title": "Cascavel", "iswc": "", "link": ""},
    {"title": "China In Box", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47619403"},
    {"title": "Cilada", "iswc": "T-329.452.045-5", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/32760352"},
    {"title": "Coração Vazio", "iswc": "T-329.452.049-9", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/34345572"},
    {"title": "Cosplay De Amor Da Minha Vida", "iswc": "T-320.760.912-5", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/35101363"},
    {"title": "Cosplay De Amor Da Minha Vida (versão Speed)", "iswc": "T-320.760.921-6", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/35217948"},
    {"title": "Daqui De Cima", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54147598"},
    {"title": "Debiloide", "iswc": "T-336.650.740-2", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54224045"},
    {"title": "Dia Z", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54146905"},
    {"title": "Diario Das Minhas Lamentacoes", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47618206"},
    {"title": "Drink Azul", "iswc": "T-313.215.481-1", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/31467156"},
    {"title": "Drink Azul 2", "iswc": "T-336.650.129-9", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54219665"},
    {"title": "E Facin Fazer Trap", "iswc": "T-327.602.975-1", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47722412"},
    {"title": "Esperanca Do Meu Bairro", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54147543"},
    {"title": "Espero Que Tu Esteja La", "iswc": "T-327.602.977-3", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47722103"},
    {"title": "Eu Ainda Tô Aqui", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/31556571"},
    {"title": "Eu Te Fiz Sofrer", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47965960"},
    {"title": "Eu Tô Morrendo", "iswc": "T-320.760.771-0", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/39516975"},
    {"title": "Evoque", "iswc": "T-321.330.812-0", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/39102990"},
    {"title": "Faco Acontecer", "iswc": "T-336.650.134-6", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54216030"},
    {"title": "Faz Calor", "iswc": "T-330.932.567-1", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/31131272"},
    {"title": "Fiz Essa Pensando Nela", "iswc": "T-320.760.950-1", "link": ""},
    {"title": "Fiz Essa Pra Voce Lembrar De Mim", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47721395"},
    {"title": "Flor De Lótus", "iswc": "T-320.760.767-4", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/39516974"},
    {"title": "Flow Mexicano", "iswc": "", "link": ""},
    {"title": "Flow Natalino", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54145438"},
    {"title": "Flow Natalino 2", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54145407"},
    {"title": "Forbes", "iswc": "T-321.330.809-5", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/40803338"},
    {"title": "Frio Do Inverno", "iswc": "T-320.760.699-9", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/39268270"},
    {"title": "Grav Fm", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54145891"},
    {"title": "Hardmode!", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54213500"},
    {"title": "Holofotes", "iswc": "T-329.452.044-4", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/32760351"},
    {"title": "Inimiga Do Fim", "iswc": "T-320.760.658-0", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/36937981"},
    {"title": "Intacto", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/36103839"},
    {"title": "Jacaré De Estimação", "iswc": "T-329.452.047-7", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/32763652"},
    {"title": "Jackie Chan", "iswc": "T-328.887.868-8", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47987407"},
    {"title": "Jersey Club", "iswc": "T-321.330.956-5", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/39359456"},
    {"title": "Jogo De Azar", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54145825"},
    {"title": "Levo Minha Vida Nesse Corre", "iswc": "T-327.602.988-6", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47985645"},
    {"title": "Líder Da Toman", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/35054086"},
    {"title": "Ligacao", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54145813"},
    {"title": "Lil Chainz: Chusk Sessions, Vol. 2", "iswc": "T-332.964.147-2", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/51064470"},
    {"title": "Lsd", "iswc": "", "link": ""},
    {"title": "Maria Gasolina", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/33697678"},
    {"title": "Meu Corre", "iswc": "", "link": ""},
    {"title": "Meu Lugar", "iswc": "T-320.760.654-6", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/34597611"},
    {"title": "Momento", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54213346"},
    {"title": "Multiplica", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54147366"},
    {"title": "Musa De Cinema", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47994831"},
    {"title": "Musica Pra Quem Partiu", "iswc": "T-327.602.976-2", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47994818"},
    {"title": "Não Escute Se Estiver Com Saudades", "iswc": "T-329.452.052-4", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/37998775"},
    {"title": "Não Existe Final Feliz", "iswc": "T-320.760.803-1", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/39530978"},
    {"title": "Nao Sei O Que Voce Viu Em Mim", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47992964"},
    {"title": "Nao Vou Falar De Amor", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47987362"},
    {"title": "Ninho De Cobra", "iswc": "T-336.650.818-7", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54225710"},
    {"title": "Nunca Chore Por Vadias", "iswc": "T-320.760.684-2", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/38189870"},
    {"title": "Oi, Tô Com Saudades", "iswc": "T-320.760.762-9", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/39516973"},
    {"title": "Olhos De Lua", "iswc": "T-320.760.793-6", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/39529679"},
    {"title": "Pacman", "iswc": "T-333.211.142-5", "link": ""},
    {"title": "Pacto De Rua", "iswc": "T-336.650.808-5", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54226623"},
    {"title": "Party", "iswc": "T-329.452.043-3", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/32760350"},
    {"title": "Por Todas As Vezes", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54145567"},
    {"title": "Prada", "iswc": "T-320.760.859-7", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/31317257"},
    {"title": "Preciso Melhorar Tanto Em Mim", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54145552"},
    {"title": "Projeto X", "iswc": "T-321.330.952-1", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/36952098"},
    {"title": "Putaria E Muita Rima", "iswc": "T-320.760.677-3", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/38189869"},
    {"title": "Quadrada", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54145540"},
    {"title": "Quando A Sdd Apertar", "iswc": "T-336.776.958-8", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54147266"},
    {"title": "Quando Voce Vai Entender", "iswc": "T-327.602.978-4", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/48000355"},
    {"title": "Que Não Te Falte Amor", "iswc": "T-320.760.742-5", "link": ""},
    {"title": "Quem Faz A Onda?", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54118270"},
    {"title": "Rebola Bb", "iswc": "T-336.650.223-6", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54214460"},
    {"title": "Rei Dos Piratas", "iswc": "T-327.602.985-3", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47823473"},
    {"title": "Rosas Cinzas", "iswc": "T-320.760.752-7", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/39516972"},
    {"title": "Saiyajin", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/35054085"},
    {"title": "Senpai", "iswc": "T-320.760.669-3", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/36952097"},
    {"title": "Sinto Sua Falta", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/31317259"},
    {"title": "Sinto Tanta Falta De Nós", "iswc": "T-320.760.824-6", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/39536772"},
    {"title": "So Me Apaixono Por Vadias", "iswc": "T-336.776.956-6", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54147189"},
    {"title": "So Uma Musica Triste", "iswc": "T-327.602.986-4", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/47821818"},
    {"title": "Sou De Gang", "iswc": "T-327.602.994-4", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/48039325"},
    {"title": "Subestimado", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54147129"},
    {"title": "Tá Noiva?", "iswc": "T-331.557.920-1", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/50144822"},
    {"title": "Tão Fly", "iswc": "T-329.452.050-2", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/34389965"},
    {"title": "Temporada De Caca", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/54219222"},
    {"title": "Tipo Billie Jean", "iswc": "T-330.932.568-2", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/32760349"},
    {"title": "Trap Story", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/48043101"},
    {"title": "Tropa Do Enguiça", "iswc": "T-330.932.569-3", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/35054084"},
    {"title": "Uma Música Triste Qualquer", "iswc": "T-320.760.814-4", "link": ""},
    {"title": "Voltalogo", "iswc": "T-320.760.781-2", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/39523781"},
    {"title": "White House", "iswc": "", "link": "https://ecadnet.ecad.org.br/consulta/detalhes/obras-musicais/48362970"}
]

def find_best_match(query, choices, cutoff=0.9):
    # Standardize
    query_norm = query.lower().strip()
    
    best_match = None
    best_score = 0.0
    
    for choice in choices:
        choice_norm = choice.lower().strip()
        
        # Calculate similarity ratio
        ratio = difflib.SequenceMatcher(None, query_norm, choice_norm).ratio()
        
        if ratio >= cutoff and ratio > best_score:
            best_score = ratio
            best_match = choice
            
    return best_match, best_score

def run_match_and_update():
    conn = sqlite3.connect('royalties.db')
    cursor = conn.cursor()
    
    # Get all tracks from DB
    cursor.execute("SELECT id, title, iswc FROM tracks")
    db_tracks = cursor.fetchall()
    
    # Create a mapping of Title -> ID
    # Note: If multiple tracks have same title, this simple dict might overwrite.
    # Given the task, we'll try to handle it gracefully.
    db_titles_map = {}
    for t in db_tracks:
        # Key: lowercase title, Value: {id: id, original_title: title}
        key = t[1].lower().strip()
        if key not in db_titles_map:
            db_titles_map[key] = []
        db_titles_map[key].append(t[0])
        
    db_titles_list = list(db_titles_map.keys())
    
    updates = 0
    matched = []
    unmatched = []
    
    print(f"Total songs to process: {len(song_data)}")
    
    for item in song_data:
        csv_title = item['title']
        csv_iswc = item['iswc']
        
        if not csv_iswc:
            unmatched.append(f"{csv_title} (Sem ISWC na lista original)")
            continue
            
        csv_title_lower = csv_title.lower().strip()
        
        target_ids = []
        
        # 1. Exact Match
        if csv_title_lower in db_titles_map:
            target_ids = db_titles_map[csv_title_lower]
            print(f"Exact match: '{csv_title}' -> IDs {target_ids}")
        else:
            # 2. Fuzzy Match with difflib
            best_match, score = find_best_match(csv_title, db_titles_list, cutoff=0.9)
            if best_match:
                target_ids = db_titles_map[best_match]
                print(f"Fuzzy match: '{csv_title}' ~ '{best_match}' ({score:.2f}) -> IDs {target_ids}")
            else:
                unmatched.append(f"{csv_title} (Não encontrado no banco)")
                
        if target_ids:
            # Update DB for all matching IDs
            for tid in target_ids:
                try:
                    cursor.execute("UPDATE tracks SET iswc = ? WHERE id = ?", (csv_iswc, tid))
                    updates += 1
                except Exception as e:
                    print(f"Error updating {csv_title} (ID {tid}): {e}")
            matched.append(f"{csv_title}")

    conn.commit()
    conn.close()
    
    print("-" * 30)
    print(f"Updates successfully performed: {updates}")
    
    with open('match_report.txt', 'w') as f:
        f.write("RELATÓRIO DE CORRESPONDÊNCIA\n")
        f.write("="*30 + "\n\n")
        f.write("ATUALIZADOS:\n")
        for m in matched:
            f.write(f"[OK] {m}\n")
            
        f.write("\nNÃO ENCONTRADOS / SEM ISWC:\n")
        for m in unmatched:
            f.write(f"[X] {m}\n")
            
    print("Report saved to match_report.txt")

if __name__ == "__main__":
    run_match_and_update()
