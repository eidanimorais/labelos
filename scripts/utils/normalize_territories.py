
import sqlite3

def normalize():
    conn = sqlite3.connect('royalties.db')
    cursor = conn.cursor()
    
    # Comprehensive ISO 3166-1 alpha-2 to Portuguese mapping
    # + Common English names to Portuguese
    mappings = {
        # A
        "AF": "Afeganistão", "Afghanistan": "Afeganistão",
        "ZA": "África do Sul", "South Africa": "África do Sul",
        "AL": "Albânia", "Albania": "Albânia",
        "DE": "Alemanha", "Germany": "Alemanha",
        "AD": "Andorra",
        "AO": "Angola",
        "AI": "Anguila", "Anguilla": "Anguila",
        "AQ": "Antártida", "Antarctica": "Antártida",
        "AG": "Antígua e Barbuda", "Antigua and Barbuda": "Antígua e Barbuda",
        "SA": "Arábia Saudita", "Saudi Arabia": "Arábia Saudita",
        "DZ": "Argélia", "Algeria": "Argélia",
        "AR": "Argentina",
        "AM": "Armênia", "Armenia": "Armênia",
        "AW": "Aruba",
        "AU": "Austrália", "Australia": "Austrália",
        "AT": "Áustria", "Austria": "Áustria",
        "AZ": "Azerbaijão", "Azerbaijan": "Azerbaijão",
        
        # B
        "BS": "Bahamas",
        "BH": "Bahrein", "Bahrain": "Bahrein",
        "BD": "Bangladesh",
        "BB": "Barbados",
        "BE": "Bélgica", "Belgium": "Bélgica",
        "BZ": "Belize",
        "BJ": "Benin",
        "BM": "Bermudas", "Bermuda": "Bermudas",
        "BY": "Bielorrússia", "Belarus": "Bielorrússia",
        "BO": "Bolívia", "Bolivia": "Bolívia",
        "BA": "Bósnia e Herzegovina", "Bosnia and Herzegovina": "Bósnia e Herzegovina", "Bosnia-Herzego.": "Bósnia e Herzegovina",
        "BW": "Botsuana", "Botswana": "Botsuana",
        "BR": "Brasil", "Brazil": "Brasil",
        "BN": "Brunei", "Brunei Darussalam": "Brunei", "Brunei Darussal": "Brunei",
        "BG": "Bulgária", "Bulgaria": "Bulgária",
        "BF": "Burkina Faso",
        "BI": "Burundi",
        "BT": "Butão", "Bhutan": "Butão",
        
        # C
        "CV": "Cabo Verde", "Cape Verde": "Cabo Verde",
        "CM": "Camarões", "Cameroon": "Camarões",
        "KH": "Camboja", "Cambodia": "Camboja",
        "CA": "Canadá", "Canada": "Canadá",
        "QA": "Catar", "Qatar": "Catar",
        "KZ": "Cazaquistão", "Kazakhstan": "Cazaquistão",
        "TD": "Chade", "Chad": "Chade",
        "CL": "Chile",
        "CN": "China",
        "CY": "Chipre", "Cyprus": "Chipre",
        "SG": "Cingapura", "Singapore": "Cingapura",
        "CO": "Colômbia", "Colombia": "Colômbia",
        "KM": "Comores", "Comoros": "Comores",
        "CG": "Congo", "Congo Republ.": "Congo",
        "CD": "Congo (RDC)", "DR Congo (Zaire)": "Congo (RDC)", "Democratic Republic of the Congo": "Congo (RDC)",
        "KP": "Coreia do Norte", "North Korea": "Coreia do Norte",
        "KR": "Coreia do Sul", "South Korea": "Coreia do Sul", "Rep. Korea": "Coreia do Sul",
        "CI": "Costa do Marfim", "Ivory Coast": "Costa do Marfim", "Cote d'Ivoire": "Costa do Marfim",
        "CR": "Costa Rica",
        "HR": "Croácia", "Croatia": "Croácia",
        "CU": "Cuba",
        "CW": "Curaçao",
        
        # D
        "DK": "Dinamarca", "Denmark": "Dinamarca",
        "DJ": "Djibuti", "Djibouti": "Djibuti",
        "DM": "Dominica",
        
        # E
        "EG": "Egito", "Egypt": "Egito",
        "SV": "El Salvador",
        "AE": "Emirados Árabes Unidos", "United Arab Emirates": "Emirados Árabes Unidos", "UAE": "Emirados Árabes Unidos", "Arab Emirates": "Emirados Árabes Unidos",
        "EC": "Equador", "Ecuador": "Equador",
        "ER": "Eritreia", "Eritrea": "Eritreia",
        "SK": "Eslováquia", "Slovakia": "Eslováquia", "Slovakia Rep.": "Eslováquia",
        "SI": "Eslovênia", "Slovenia": "Eslovênia",
        "ES": "Espanha", "Spain": "Espanha",
        "US": "Estados Unidos", "USA": "Estados Unidos", "United States": "Estados Unidos",
        "EE": "Estônia", "Estonia": "Estônia",
        "ET": "Etiópia", "Ethiopia": "Etiópia",
        
        # F
        "FJ": "Fiji",
        "PH": "Filipinas", "Philippines": "Filipinas",
        "FI": "Finlândia", "Finland": "Finlândia",
        "FR": "França", "France": "França",
        
        # G
        "GA": "Gabão", "Gabon": "Gabão",
        "GM": "Gâmbia", "Gambia": "Gâmbia",
        "GH": "Gana", "Ghana": "Gana",
        "GE": "Geórgia", "Georgia": "Geórgia",
        "GI": "Gibraltar",
        "GD": "Granada", "Grenada": "Granada",
        "GR": "Grécia", "Greece": "Grécia",
        "GL": "Groenlândia", "Greenland": "Groenlândia",
        "GP": "Guadalupe", "Guadeloupe": "Guadalupe",
        "GU": "Guam",
        "GT": "Guatemala",
        "GG": "Guernsey",
        "GY": "Guiana", "Guyana": "Guiana",
        "GF": "Guiana Francesa", "French Guiana": "Guiana Francesa",
        "GN": "Guiné", "Guinea": "Guiné",
        "GW": "Guiné-Bissau", "Guinea-Bissau": "Guiné-Bissau",
        "GQ": "Guiné Equatorial", "Equatorial Guinea": "Guiné Equatorial", "Equat. Guinea": "Guiné Equatorial",
        
        # H
        "HT": "Haiti",
        "NL": "Holanda", "Netherlands": "Holanda",
        "HN": "Honduras",
        "HK": "Hong Kong",
        "HU": "Hungria", "Hungary": "Hungria",
        
        # I
        "YE": "Iêmen", "Yemen": "Iêmen",
        "IN": "Índia", "India": "Índia",
        "ID": "Indonésia", "Indonesia": "Indonésia",
        "IQ": "Iraque", "Iraq": "Iraque",
        "IR": "Irã", "Iran": "Irã",
        "IE": "Irlanda", "Ireland": "Irlanda",
        "IS": "Islândia", "Iceland": "Islândia",
        "IL": "Israel",
        "IT": "Itália", "Italy": "Itália",
        
        # J
        "JM": "Jamaica",
        "JP": "Japão", "Japan": "Japão",
        "JE": "Jersey",
        "JO": "Jordânia", "Jordan": "Jordânia",
        
        # K
        "KW": "Kuwait",
        
        # L
        "LA": "Laos",
        "LS": "Lesoto", "Lesotho": "Lesoto",
        "LV": "Letônia", "Latvia": "Letônia",
        "LB": "Líbano", "Lebanon": "Líbano",
        "LR": "Libéria", "Liberia": "Libéria",
        "LY": "Líbia", "Libya": "Líbia",
        "LI": "Liechtenstein",
        "LT": "Lituânia", "Lithuania": "Lituânia",
        "LU": "Luxemburgo", "Luxembourg": "Luxemburgo",
        
        # M
        "MO": "Macau",
        "MK": "Macedônia do Norte", "North Macedonia": "Macedônia do Norte", "Macedonia": "Macedônia do Norte",
        "MG": "Madagascar",
        "MY": "Malásia", "Malaysia": "Malásia",
        "MW": "Malaui", "Malawi": "Malaui",
        "MV": "Maldivas", "Maldives": "Maldivas",
        "ML": "Mali",
        "MT": "Malta",
        "MA": "Marrocos", "Morocco": "Marrocos",
        "MQ": "Martinica", "Martinique": "Martinica",
        "MU": "Maurício", "Mauritius": "Maurício",
        "MR": "Mauritânia", "Mauritania": "Mauritânia",
        "YT": "Mayotte", "Mahore/Mayotte": "Mayotte",
        "MX": "México", "Mexico": "México",
        "MM": "Mianmar", "Myanmar": "Mianmar", "Myanmar (Burma)": "Mianmar",
        "FM": "Micronésia", "Micronesia": "Micronésia",
        "MZ": "Moçambique", "Mozambique": "Moçambique",
        "MD": "Moldávia", "Moldova": "Moldávia",
        "MC": "Mônaco", "Monaco": "Mônaco",
        "MN": "Mongólia", "Mongolia": "Mongólia",
        "ME": "Montenegro",
        "MS": "Montserrat",
        
        # N
        "NA": "Namíbia", "Namibia": "Namíbia",
        "NR": "Nauru",
        "NP": "Nepal",
        "NI": "Nicarágua", "Nicaragua": "Nicarágua",
        "NE": "Níger", "Niger": "Níger",
        "NG": "Nigéria", "Nigeria": "Nigéria",
        "NU": "Niue",
        "NO": "Noruega", "Norway": "Noruega",
        "NC": "Nova Caledônia", "New Caledonia": "Nova Caledônia",
        "NZ": "Nova Zelândia", "New Zealand": "Nova Zelândia",
        
        # O
        "OM": "Omã", "Oman": "Omã",
        
        # P
        "PK": "Paquistão", "Pakistan": "Paquistão",
        "PW": "Palau", "Belau (Palau)": "Palau",
        "PS": "Palestina", "Palestine": "Palestina",
        "PA": "Panamá", "Panama": "Panamá",
        "PG": "Papua Nova Guiné", "Papua New Guinea": "Papua Nova Guiné", "Papua NewGuinea": "Papua Nova Guiné",
        "PY": "Paraguai", "Paraguay": "Paraguai",
        "PE": "Peru",
        "PF": "Polinésia Francesa", "French Polynesia": "Polinésia Francesa", "Polynesia (Fr.)": "Polinésia Francesa",
        "PL": "Polônia", "Poland": "Polônia",
        "PR": "Porto Rico", "Puerto Rico": "Porto Rico",
        "PT": "Portugal",
        
        # Q
        "KE": "Quênia", "Kenya": "Quênia",
        "KG": "Quirguistão", "Kyrgyzstan": "Quirguistão",
        
        # R
        "GB": "Reino Unido", "United Kingdom": "Reino Unido", "Great Britain": "Reino Unido", "UK": "Reino Unido",
        "CF": "República Centro-Africana", "Central African Republic": "República Centro-Africana",
        "DO": "República Dominicana", "Dominican Republic": "República Dominicana", "Dominican Rep.": "República Dominicana",
        "CZ": "República Tcheca", "Czech Republic": "República Tcheca",
        "RE": "Reunião", "Réunion": "Reunião",
        "RO": "Romênia", "Romania": "Romênia",
        "RW": "Ruanda", "Rwanda": "Ruanda",
        "RU": "Rússia", "Russia": "Rússia",
        
        # S
        "EH": "Saara Ocidental", "Western Sahara": "Saara Ocidental",
        "WS": "Samoa",
        "AS": "Samoa Americana", "American Samoa": "Samoa Americana",
        "SM": "San Marino",
        "LC": "Santa Lúcia", "Saint Lucia": "Santa Lúcia", "St. Lucia": "Santa Lúcia",
        "KN": "São Cristóvão e Névis", "Saint Kitts and Nevis": "São Cristóvão e Névis", "St. Kitts&Nevis": "São Cristóvão e Névis",
        "ST": "São Tomé e Príncipe", "Sao Tome and Principe": "São Tomé e Príncipe", "Sao Tomé & Prin": "São Tomé e Príncipe",
        "VC": "São Vicente e Granadinas", "Saint Vincent and the Grenadines": "São Vicente e Granadinas", "St. Vincent&Gre": "São Vicente e Granadinas",
        "SC": "Seicheles", "Seychelles": "Seicheles",
        "SN": "Senegal",
        "SL": "Serra Leoa", "Sierra Leone": "Serra Leoa",
        "RS": "Sérvia", "Serbia": "Sérvia",
        "SY": "Síria", "Syria": "Síria",
        "SO": "Somália", "Somalia": "Somália",
        "LK": "Sri Lanka",
        "SZ": "Suazilândia", "Swaziland": "Suazilândia", "Eswatini": "Suazilândia",
        "SD": "Sudão", "Sudan": "Sudão",
        "SS": "Sudão do Sul", "South Sudan": "Sudão do Sul",
        "SE": "Suécia", "Sweden": "Suécia",
        "CH": "Suíça", "Switzerland": "Suíça",
        "SR": "Suriname",
        
        # T
        "TH": "Tailândia", "Thailand": "Tailândia",
        "TW": "Taiwan",
        "TJ": "Tajiquistão", "Tajikistan": "Tajiquistão",
        "TZ": "Tanzânia", "Tanzania": "Tanzânia",
        "TL": "Timor-Leste",
        "TG": "Togo",
        "TK": "Tokelau",
        "TO": "Tonga",
        "TT": "Trinidad e Tobago", "Trinidad and Tobago": "Trinidad e Tobago",
        "TN": "Tunísia", "Tunisia": "Tunísia",
        "TC": "Turcas e Caicos", "Turks and Caicos Islands": "Turcas e Caicos", "Turks and Caico": "Turcas e Caicos",
        "TM": "Turcomenistão", "Turkmenistan": "Turcomenistão",
        "TR": "Turquia", "Turkey": "Turquia",
        "TV": "Tuvalu",
        
        # U
        "UA": "Ucrânia", "Ukraine": "Ucrânia",
        "UG": "Uganda",
        "UY": "Uruguai", "Uruguay": "Uruguai",
        "UZ": "Uzbequistão", "Uzbekistan": "Uzbequistão",
        
        # V
        "VU": "Vanuatu",
        "VA": "Vaticano", "Holy See (Vatican City State)": "Vaticano",
        "VE": "Venezuela",
        "VN": "Vietnã", "Vietnam": "Vietnã",
        "VG": "Ilhas Virgens Britânicas", "Virgin Islands, British": "Ilhas Virgens Britânicas", "Virgin Islands (Brit.)": "Ilhas Virgens Britânicas",
        "VI": "Ilhas Virgens Americanas", "Virgin Islands, U.S.": "Ilhas Virgens Americanas", "Virgin Islands (USA)": "Ilhas Virgens Americanas",
        
        # W
        "WF": "Wallis e Futuna", "Wallis and Futuna": "Wallis e Futuna", "Wallis and Futu": "Wallis e Futuna",
        
        # Z
        "ZM": "Zâmbia", "Zambia": "Zâmbia",
        "ZW": "Zimbábue", "Zimbabwe": "Zimbábue"
    }
    
    print("Starting comprehensive normalization...")
    
    count = 0
    # Create a reverse mapping for efficient standardized lookup if we wanted to be fancy, 
    # but direct iteration is fine for this script size.
    
    # We will do a two-pass approach or just simple replacements.
    # Simple replacement is safer.
    
    total_updated = 0
    
    for original, new_val in mappings.items():
        # Skip if original == new_val check is implicit in SQL but good to save time
        if original == new_val:
            continue
            
        cursor.execute("UPDATE transactions SET territorio = ? WHERE territorio = ?", (new_val, original))
        rows = cursor.rowcount
        if rows > 0:
            # print(f"Updated {rows} rows from '{original}' to '{new_val}'")
            total_updated += rows
            
    conn.commit()
    print(f"Total rows updated: {total_updated}")
    
    # Verification step: Show what remains that might be weird
    cursor.execute("SELECT DISTINCT territorio FROM transactions ORDER BY territorio")
    remaining = cursor.fetchall()
    print("\n--- Current Territories in DB ---")
    for r in remaining:
        print(r[0])
        
    conn.close()

if __name__ == "__main__":
    normalize()
