
export const getRegionFlag = (name: string | null): string => {
    if (!name) return '🌍';
    const n = name.toLowerCase().trim();
    const map: Record<string, string> = {
        // Special & New Mappings (User Requested)
        'essuatini': '🇸🇿', 'essuatíni': '🇸🇿',
        'isle of man': '🇮🇲', 'ilha de man': '🇮🇲',
        'northern mariana islands': '🇲🇵', 'ilhas marianas do norte': '🇲🇵',
        'solomon islands': '🇸🇧', 'ilhas salomão': '🇸🇧',
        'saint pierre and miquelon': '🇵🇲', 'são pedro e miquelão': '🇵🇲',
        'kiribati': '🇰🇮', 'quiribati': '🇰🇮',
        'democratic republic of the congo': '🇨🇩', 'república democrática do congo': '🇨🇩',
        'south georgia and the south sandwich islands': '🇬🇸', 'ilhas geórgia do sul e sandwich do sul': '🇬🇸',
        'cook islands': '🇨🇰', 'ilhas cook': '🇨🇰',
        'marshall islands': '🇲🇭', 'ilhas marshall': '🇲🇭',
        'sint maarten': '🇸🇽', 'são martinho': '🇸🇽',
        'norfolk island': '🇳🇫', 'ilha norfolque': '🇳🇫',
        'saint helena': '🇸🇭', 'santa helena': '🇸🇭',
        'svalbard and jan mayen': '🇳🇴', 'svalbard e jan mayen': '🇳🇴', // User requested Norway flag
        'faroe islands': '🇫🇴', 'ilhas faroe': '🇫🇴', 'ilhas faroé': '🇫🇴',
        'british indian ocean territory': '🇮🇴', 'território britânico do oceano índico': '🇮🇴',
        'saint martin': '🇲🇫', 'ilha de são martinho': '🇲🇫',
        'pitcairn islands': '🇵🇳', 'ilhas pitcairn': '🇵🇳',
        'french southern territories': '🇹🇫', 'terras austrais e antárticas francesas': '🇹🇫',
        'central african republic': '🇨🇫', 'república centro-africana': '🇨🇫',
        'cayman islands': '🇰🇾', 'ilhas cayman': '🇰🇾',
        'kyrgyzstan': '🇰🇬', 'quirguistão': '🇰🇬',
        'aland islands': '🇦🇽', 'ilhas åland': '🇦🇽',
        'saint barthelemy': '🇧🇱', 'são bartolomeu': '🇧🇱',
        'caribbean netherlands': '🇧🇶', 'caribe holandês': '🇧🇶',
        'kosovo': '🇽🇰',

        // A
        'afghanistan': '🇦🇫', 'afeganistão': '🇦🇫', 'af': '🇦🇫',
        'south africa': '🇿🇦', 'za': '🇿🇦', 'áfrica do sul': '🇿🇦',
        'albania': '🇦🇱', 'al': '🇦🇱', 'albânia': '🇦🇱',
        'germany': '🇩🇪', 'de': '🇩🇪', 'alemanha': '🇩🇪',
        'andorra': '🇦🇩', 'ad': '🇦🇩',
        'angola': '🇦🇴', 'ao': '🇦🇴',
        'anguilla': '🇦🇮', 'ai': '🇦🇮', 'anguila': '🇦🇮',
        'antarctica': '🇦🇶', 'aq': '🇦🇶', 'antártida': '🇦🇶',
        'antigua and barbuda': '🇦🇬', 'ag': '🇦🇬', 'antígua e barbuda': '🇦🇬',
        'saudi arabia': '🇸🇦', 'sa': '🇸🇦', 'arábia saudita': '🇸🇦',
        'algeria': '🇩🇿', 'dz': '🇩🇿', 'argélia': '🇩🇿',
        'argentina': '🇦🇷', 'ar': '🇦🇷',
        'armenia': '🇦🇲', 'am': '🇦🇲', 'armênia': '🇦🇲',
        'aruba': '🇦🇼', 'aw': '🇦🇼',
        'australia': '🇦🇺', 'au': '🇦🇺', 'austrália': '🇦🇺',
        'austria': '🇦🇹', 'at': '🇦🇹', 'áustria': '🇦🇹',
        'azerbaijan': '🇦🇿', 'az': '🇦🇿', 'azerbaijão': '🇦🇿',

        // B
        'bahamas': '🇧🇸', 'bs': '🇧🇸',
        'bahrain': '🇧🇭', 'bh': '🇧🇭', 'bahrein': '🇧🇭',
        'bangladesh': '🇧🇩', 'bd': '🇧🇩',
        'barbados': '🇧🇧', 'bb': '🇧🇧',
        'belgium': '🇧🇪', 'be': '🇧🇪', 'bélgica': '🇧🇪',
        'belize': '🇧🇿', 'bz': '🇧🇿',
        'benin': '🇧🇯', 'bj': '🇧🇯',
        'bermuda': '🇧🇲', 'bm': '🇧🇲', 'bermudas': '🇧🇲',
        'belarus': '🇧🇾', 'by': '🇧🇾', 'bielorrússia': '🇧🇾',
        'bolivia': '🇧🇴', 'bo': '🇧🇴', 'bolívia': '🇧🇴',
        'bosnia and herzegovina': '🇧🇦', 'ba': '🇧🇦', 'bósnia e herzegovina': '🇧🇦',
        'botswana': '🇧🇼', 'bw': '🇧🇼', 'botsuana': '🇧🇼',
        'brazil': '🇧🇷', 'br': '🇧🇷', 'brasil': '🇧🇷',
        'brunei': '🇧🇳', 'bn': '🇧🇳',
        'bulgaria': '🇧🇬', 'bg': '🇧🇬', 'bulgária': '🇧🇬',
        'burkina faso': '🇧🇫', 'bf': '🇧🇫',
        'burundi': '🇧🇮', 'bi': '🇧🇮',
        'bhutan': '🇧🇹', 'bt': '🇧🇹', 'butão': '🇧🇹',

        // C
        'cape verde': '🇨🇻', 'cv': '🇨🇻', 'cabo verde': '🇨🇻',
        'cameroon': '🇨🇲', 'cm': '🇨🇲', 'camarões': '🇨🇲',
        'cambodia': '🇰🇭', 'kh': '🇰🇭', 'camboja': '🇰🇭',
        'canada': '🇨🇦', 'ca': '🇨🇦', 'canadá': '🇨🇦',
        'qatar': '🇶🇦', 'qa': '🇶🇦', 'catar': '🇶🇦',
        'kazakhstan': '🇰🇿', 'kz': '🇰🇿', 'cazaquistão': '🇰🇿',
        'chad': '🇹🇩', 'td': '🇹🇩', 'chade': '🇹🇩',
        'chile': '🇨🇱', 'cl': '🇨🇱',
        'china': '🇨🇳', 'cn': '🇨🇳',
        'cyprus': '🇨🇾', 'cy': '🇨🇾', 'chipre': '🇨🇾',
        'singapore': '🇸🇬', 'sg': '🇸🇬', 'cingapura': '🇸🇬',
        'colombia': '🇨🇴', 'co': '🇨🇴', 'colômbia': '🇨🇴',
        'comoros': '🇰🇲', 'km': '🇰🇲', 'comores': '🇰🇲',
        'congo': '🇨🇬', 'cg': '🇨🇬',
        'dr congo': '🇨🇩', 'cd': '🇨🇩', 'congo (rdc)': '🇨🇩',
        'north korea': '🇰🇵', 'kp': '🇰🇵', 'coreia do norte': '🇰🇵',
        'south korea': '🇰🇷', 'kr': '🇰🇷', 'coreia do sul': '🇰🇷',
        'ivory coast': '🇨🇮', 'ci': '🇨🇮', 'costa do marfim': '🇨🇮',
        'costa rica': '🇨🇷', 'cr': '🇨🇷',
        'croatia': '🇭🇷', 'hr': '🇭🇷', 'croácia': '🇭🇷',
        'cuba': '🇨🇺', 'cu': '🇨🇺',
        'curacao': '🇨🇼', 'cw': '🇨🇼', 'curaçao': '🇨🇼',

        // D
        'denmark': '🇩🇰', 'dk': '🇩🇰', 'dinamarca': '🇩🇰',
        'djibouti': '🇩🇯', 'dj': '🇩🇯', 'djibuti': '🇩🇯',
        'dominica': '🇩🇲', 'dm': '🇩🇲',

        // E
        'egypt': '🇪🇬', 'eg': '🇪🇬', 'egito': '🇪🇬',
        'el salvador': '🇸🇻', 'sv': '🇸🇻',
        'united arab emirates': '🇦🇪', 'ae': '🇦🇪', 'emirados árabes unidos': '🇦🇪', 'uae': '🇦🇪',
        'ecuador': '🇪🇨', 'ec': '🇪🇨', 'equador': '🇪🇨',
        'eritrea': '🇪🇷', 'er': '🇪🇷', 'eritreia': '🇪🇷',
        'slovakia': '🇸🇰', 'sk': '🇸🇰', 'eslováquia': '🇸🇰',
        'slovenia': '🇸🇮', 'si': '🇸🇮', 'eslovênia': '🇸🇮',
        'spain': '🇪🇸', 'es': '🇪🇸', 'espanha': '🇪🇸',
        'united states': '🇺🇸', 'us': '🇺🇸', 'usa': '🇺🇸', 'estados unidos': '🇺🇸',
        'estonia': '🇪🇪', 'ee': '🇪🇪', 'estônia': '🇪🇪',
        'ethiopia': '🇪🇹', 'et': '🇪🇹', 'etiópia': '🇪🇹',

        // F
        'fiji': '🇫🇯', 'fj': '🇫🇯',
        'philippines': '🇵🇭', 'ph': '🇵🇭', 'filipinas': '🇵🇭',
        'finland': '🇫🇮', 'fi': '🇫🇮', 'finlândia': '🇫🇮',
        'france': '🇫🇷', 'fr': '🇫🇷', 'frança': '🇫🇷',

        // G
        'gabon': '🇬🇦', 'ga': '🇬🇦', 'gabão': '🇬🇦',
        'gambia': '🇬🇲', 'gm': '🇬🇲', 'gâmbia': '🇬🇲',
        'ghana': '🇬🇭', 'gh': '🇬🇭', 'gana': '🇬🇭',
        'georgia': '🇬🇪', 'ge': '🇬🇪', 'geórgia': '🇬🇪',
        'gibraltar': '🇬🇮', 'gi': '🇬🇮',
        'grenada': '🇬🇩', 'gd': '🇬🇩', 'granada': '🇬🇩',
        'greece': '🇬🇷', 'gr': '🇬🇷', 'grécia': '🇬🇷',
        'greenland': '🇬🇱', 'gl': '🇬🇱', 'groenlândia': '🇬🇱',
        'guadeloupe': '🇬🇵', 'gp': '🇬🇵', 'guadalupe': '🇬🇵',
        'guam': '🇬🇺', 'gu': '🇬🇺',
        'guatemala': '🇬🇹', 'gt': '🇬🇹',
        'guernsey': '🇬🇬', 'gg': '🇬🇬',
        'guyana': '🇬🇾', 'gy': '🇬🇾', 'guiana': '🇬🇾',
        'french guiana': '🇬🇫', 'gf': '🇬🇫', 'guiana francesa': '🇬🇫',
        'guinea': '🇬🇳', 'gn': '🇬🇳', 'guiné': '🇬🇳',
        'guinea-bissau': '🇬🇼', 'gw': '🇬🇼', 'guiné-bissau': '🇬🇼',
        'equatorial guinea': '🇬🇶', 'gq': '🇬🇶', 'guiné equatorial': '🇬🇶',

        // H
        'haiti': '🇭🇹', 'ht': '🇭🇹',
        'netherlands': '🇳🇱', 'nl': '🇳🇱', 'holanda': '🇳🇱',
        'honduras': '🇭🇳', 'hn': '🇭🇳',
        'hong kong': '🇭🇰', 'hk': '🇭🇰',
        'hungary': '🇭🇺', 'hu': '🇭🇺', 'hungria': '🇭🇺',

        // I
        'yemen': '🇾🇪', 'ye': '🇾🇪', 'iêmen': '🇾🇪',
        'india': '🇮🇳', 'in': '🇮🇳', 'índia': '🇮🇳',
        'indonesia': '🇮🇩', 'id': '🇮🇩', 'indonésia': '🇮🇩',
        'iraq': '🇮🇶', 'iq': '🇮🇶', 'iraque': '🇮🇶',
        'iran': '🇮🇷', 'ir': '🇮🇷', 'irã': '🇮🇷',
        'ireland': '🇮🇪', 'ie': '🇮🇪', 'irlanda': '🇮🇪',
        'iceland': '🇮🇸', 'is': '🇮🇸', 'islândia': '🇮🇸',
        'israel': '🇮🇱', 'il': '🇮🇱',
        'italy': '🇮🇹', 'it': '🇮🇹', 'itália': '🇮🇹',

        // J
        'jamaica': '🇯🇲', 'jm': '🇯🇲',
        'japan': '🇯🇵', 'jp': '🇯🇵', 'japão': '🇯🇵',
        'jersey': '🇯🇪', 'je': '🇯🇪',
        'jordan': '🇯🇴', 'jo': '🇯🇴', 'jordânia': '🇯🇴',

        // K
        'kuwait': '🇰🇼', 'kw': '🇰🇼',

        // L
        'laos': '🇱🇦', 'la': '🇱🇦',
        'lesotho': '🇱🇸', 'ls': '🇱🇸', 'lesoto': '🇱🇸',
        'latvia': '🇱🇻', 'lv': '🇱🇻', 'letônia': '🇱🇻',
        'lebanon': '🇱🇧', 'lb': '🇱🇧', 'líbano': '🇱🇧',
        'liberia': '🇱🇷', 'lr': '🇱🇷', 'libéria': '🇱🇷',
        'libya': '🇱🇾', 'ly': '🇱🇾', 'líbia': '🇱🇾',
        'liechtenstein': '🇱🇮', 'li': '🇱🇮',
        'lithuania': '🇱🇹', 'lt': '🇱🇹', 'lituânia': '🇱🇹',
        'luxembourg': '🇱🇺', 'lu': '🇱🇺', 'luxemburgo': '🇱🇺',

        // M
        'macau': '🇲🇴', 'mo': '🇲🇴',
        'north macedonia': '🇲🇰', 'mk': '🇲🇰', 'macedônia do norte': '🇲🇰',
        'madagascar': '🇲🇬', 'mg': '🇲🇬',
        'malaysia': '🇲🇾', 'my': '🇲🇾', 'malásia': '🇲🇾',
        'malawi': '🇲🇼', 'mw': '🇲🇼', 'malaui': '🇲🇼',
        'maldives': '🇲🇻', 'mv': '🇲🇻', 'maldivas': '🇲🇻',
        'mali': '🇲🇱', 'ml': '🇲🇱',
        'malta': '🇲🇹', 'mt': '🇲🇹',
        'morocco': '🇲🇦', 'ma': '🇲🇦', 'marrocos': '🇲🇦',
        'martinique': '🇲🇶', 'mq': '🇲🇶', 'martinica': '🇲🇶',
        'mauritius': '🇲🇺', 'mu': '🇲🇺', 'maurício': '🇲🇺',
        'mauritania': '🇲🇷', 'mr': '🇲🇷', 'mauritânia': '🇲🇷',
        'mayotte': '🇾🇹', 'yt': '🇾🇹',
        'mexico': '🇲🇽', 'mx': '🇲🇽', 'méxico': '🇲🇽',
        'myanmar': '🇲🇲', 'mm': '🇲🇲', 'mianmar': '🇲🇲',
        'micronesia': '🇫🇲', 'fm': '🇫🇲', 'micronésia': '🇫🇲',
        'mozambique': '🇲🇿', 'mz': '🇲🇿', 'moçambique': '🇲🇿',
        'moldova': '🇲🇩', 'md': '🇲🇩', 'moldávia': '🇲🇩',
        'monaco': '🇲🇨', 'mc': '🇲🇨', 'mônaco': '🇲🇨',
        'mongolia': '🇲🇳', 'mn': '🇲🇳', 'mongólia': '🇲🇳',
        'montenegro': '🇲🇪', 'me': '🇲🇪',
        'montserrat': '🇲🇸', 'ms': '🇲🇸',

        // N
        'namibia': '🇳🇦', 'na': '🇳🇦', 'namíbia': '🇳🇦',
        'nauru': '🇳🇷', 'nr': '🇳🇷',
        'nepal': '🇳🇵', 'np': '🇳🇵',
        'nicaragua': '🇳🇮', 'ni': '🇳🇮', 'nicarágua': '🇳🇮',
        'niger': '🇳🇪', 'ne': '🇳🇪', 'níger': '🇳🇪',
        'nigeria': '🇳🇬', 'ng': '🇳🇬', 'nigéria': '🇳🇬',
        'niue': '🇳🇺', 'nu': '🇳🇺',
        'norway': '🇳🇴', 'no': '🇳🇴', 'noruega': '🇳🇴',
        'new caledonia': '🇳🇨', 'nc': '🇳🇨', 'nova caledônia': '🇳🇨',
        'new zealand': '🇳🇿', 'nz': '🇳🇿', 'nova zelândia': '🇳🇿',

        // O
        'oman': '🇴🇲', 'om': '🇴🇲', 'omã': '🇴🇲',

        // P
        'pakistan': '🇵🇰', 'pk': '🇵🇰', 'paquistão': '🇵🇰',
        'palau': '🇵🇼', 'pw': '🇵🇼',
        'palestine': '🇵🇸', 'ps': '🇵🇸', 'palestina': '🇵🇸',
        'panama': '🇵🇦', 'pa': '🇵🇦', 'panamá': '🇵🇦',
        'papua new guinea': '🇵🇬', 'pg': '🇵🇬', 'papua nova guiné': '🇵🇬',
        'paraguay': '🇵🇾', 'py': '🇵🇾', 'paraguai': '🇵🇾',
        'peru': '🇵🇪', 'pe': '🇵🇪',
        'french polynesia': '🇵🇫', 'pf': '🇵🇫', 'polinésia francesa': '🇵🇫',
        'poland': '🇵🇱', 'pl': '🇵🇱', 'polônia': '🇵🇱',
        'puerto rico': '🇵🇷', 'pr': '🇵🇷', 'porto rico': '🇵🇷',
        'portugal': '🇵🇹', 'pt': '🇵🇹',

        // Q
        'kenya': '🇰🇪', 'ke': '🇰🇪', 'quênia': '🇰🇪',

        // R
        'united kingdom': '🇬🇧', 'uk': '🇬🇧', 'reino unido': '🇬🇧', 'gb': '🇬🇧',
        'dominican republic': '🇩🇴', 'do': '🇩🇴', 'república dominicana': '🇩🇴',
        'czech republic': '🇨🇿', 'cz': '🇨🇿', 'república tcheca': '🇨🇿',
        'reunion': '🇷🇪', 're': '🇷🇪', 'reunião': '🇷🇪',
        'romania': '🇷🇴', 'ro': '🇷🇴', 'romênia': '🇷🇴',
        'rwanda': '🇷🇼', 'rw': '🇷🇼', 'ruanda': '🇷🇼',
        'russia': '🇷🇺', 'ru': '🇷🇺', 'rússia': '🇷🇺',

        // S
        'western sahara': '🇪🇭', 'eh': '🇪🇭', 'saara ocidental': '🇪🇭',
        'samoa': '🇼🇸', 'ws': '🇼🇸',
        'american samoa': '🇦🇸', 'as': '🇦🇸', 'samoa americana': '🇦🇸',
        'san marino': '🇸🇲', 'sm': '🇸🇲',
        'saint lucia': '🇱🇨', 'lc': '🇱🇨', 'santa lúcia': '🇱🇨',
        'saint kitts and nevis': '🇰🇳', 'kn': '🇰🇳', 'são cristóvão e névis': '🇰🇳',
        'sao tome and principe': '🇸🇹', 'st': '🇸🇹', 'são tomé e príncipe': '🇸🇹',
        'saint vincent and the grenadines': '🇻🇨', 'vc': '🇻🇨', 'são vicente e granadinas': '🇻🇨',
        'seychelles': '🇸🇨', 'sc': '🇸🇨', 'seicheles': '🇸🇨',
        'senegal': '🇸🇳', 'sn': '🇸🇳',
        'sierra leone': '🇸🇱', 'sl': '🇸🇱', 'serra leoa': '🇸🇱',
        'serbia': '🇷🇸', 'rs': '🇷🇸', 'sérvia': '🇷🇸',
        'syria': '🇸🇾', 'sy': '🇸🇾', 'síria': '🇸🇾',
        'somalia': '🇸🇴', 'so': '🇸🇴', 'somália': '🇸🇴',
        'sri lanka': '🇱🇰', 'lk': '🇱🇰',
        'eswatini': '🇸🇿', 'sz': '🇸🇿', 'suazilândia': '🇸🇿',
        'sudan': '🇸🇩', 'sd': '🇸🇩', 'sudão': '🇸🇩',
        'south sudan': '🇸🇸', 'ss': '🇸🇸', 'sudão do sul': '🇸🇸',
        'sweden': '🇸🇪', 'se': '🇸🇪', 'suécia': '🇸🇪',
        'switzerland': '🇨🇭', 'ch': '🇨🇭', 'suíça': '🇨🇭',
        'suriname': '🇸🇷', 'sr': '🇸🇷',

        // T
        'thailand': '🇹🇭', 'th': '🇹🇭', 'tailândia': '🇹🇭',
        'taiwan': '🇹🇼', 'tw': '🇹🇼',
        'tajikistan': '🇹🇯', 'tj': '🇹🇯', 'tajiquistão': '🇹🇯',
        'tanzania': '🇹🇿', 'tz': '🇹🇿', 'tanzânia': '🇹🇿',
        'timor-leste': '🇹🇱', 'tl': '🇹🇱',
        'togo': '🇹🇬', 'tg': '🇹🇬',
        'tokelau': '🇹🇰', 'tk': '🇹🇰',
        'tonga': '🇹🇴', 'to': '🇹🇴',
        'trinidad and tobago': '🇹🇹', 'tt': '🇹🇹', 'trinidad e tobago': '🇹🇹',
        'tunisia': '🇹🇳', 'tn': '🇹🇳', 'tunísia': '🇹🇳',
        'turks and caicos': '🇹🇨', 'tc': '🇹🇨', 'turcas e caicos': '🇹🇨',
        'turkmenistan': '🇹🇲', 'tm': '🇹🇲', 'turcomenistão': '🇹🇲',
        'turkey': '🇹🇷', 'tr': '🇹🇷', 'turquia': '🇹🇷',
        'tuvalu': '🇹🇻', 'tv': '🇹🇻',

        // U
        'ukraine': '🇺🇦', 'ua': '🇺🇦', 'ucrânia': '🇺🇦',
        'uganda': '🇺🇬', 'ug': '🇺🇬',
        'uruguay': '🇺🇾', 'uy': '🇺🇾', 'uruguai': '🇺🇾',
        'uzbekistan': '🇺🇿', 'uz': '🇺🇿', 'uzbequistão': '🇺🇿',

        // V
        'vanuatu': '🇻🇺', 'vu': '🇻🇺',
        'vatican': '🇻🇦', 'va': '🇻🇦', 'vaticano': '🇻🇦',
        'venezuela': '🇻🇪', 've': '🇻🇪',
        'vietnam': '🇻🇳', 'vn': '🇻🇳', 'vietnã': '🇻🇳',
        'british virgin islands': '🇻🇬', 'vg': '🇻🇬', 'ilhas virgens britânicas': '🇻🇬',
        'us virgin islands': '🇻🇮', 'vi': '🇻🇮', 'ilhas virgens americanas': '🇻🇮',

        // W
        'wallis and futuna': '🇼🇫', 'wf': '🇼🇫', 'wallis e futuna': '🇼🇫',

        // Z
        'zambia': '🇿🇲', 'zm': '🇿🇲', 'zâmbia': '🇿🇲',
        'zimbabwe': '🇿🇼', 'zw': '🇿🇼', 'zimbábue': '🇿🇼'
    };

    if (map[n]) return map[n];

    // Fallback checks
    if (n.includes('united kingdom') || n.includes('great britain')) return '🇬🇧';
    if (n.includes('united states') || n.includes('usa')) return '🇺🇸';

    return '🌍';
};
