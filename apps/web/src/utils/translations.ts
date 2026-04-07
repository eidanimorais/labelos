
export const countryTranslations: Record<string, string> = {
    'Brazil': 'Brasil',
    'USA': 'Estados Unidos',
    'United States': 'Estados Unidos',
    'Portugal': 'Portugal',
    'Great Britain': 'Reino Unido',
    'United Kingdom': 'Reino Unido',
    'UK': 'Reino Unido',
    'Japan': 'Japão',
    'Germany': 'Alemanha',
    'Spain': 'Espanha',
    'Canada': 'Canadá',
    'France': 'França',
    'Switzerland': 'Suíça',
    'Netherlands': 'Holanda',
    'Italy': 'Itália',
    'Mexico': 'México',
    'Argentina': 'Argentina',
    'Ireland': 'Irlanda',
    'Australia': 'Austrália',
    'Chile': 'Chile',
    'Colombia': 'Colômbia',
    'Peru': 'Peru',
    'Austria': 'Áustria',
    'Denmark': 'Dinamarca',
    'Norway': 'Noruega',
    'Finland': 'Finlândia',
    'Poland': 'Polônia',
    'Turkey': 'Turquia',
    'Indonesia': 'Indonésia',
    'Philippines': 'Filipinas',
    'Malaysia': 'Malásia',
    'Thailand': 'Tailândia',
    'Vietnam': 'Vietnã',
    'Singapore': 'Cingapura',
    'Hong Kong': 'Hong Kong',
    'Taiwan': 'Taiwan',
    'South Africa': 'África do Sul',
    'Egypt': 'Egito',
    'Morocco': 'Marrocos',
    'Nigeria': 'Nigéria',
    'Kenya': 'Quênia',
    'Ghana': 'Gana',
    'Angola': 'Angola',
    'Mozambique': 'Moçambique',
    'Cape Verde': 'Cabo Verde',
    'Russia': 'Rússia',
    'South Korea': 'Coreia do Sul',
    'India': 'Índia',
    'Belgium': 'Bélgica',
    'China': 'China',
    'Sweden': 'Suécia',
    'New Zealand': 'Nova Zelândia',
    'Uruguay': 'Uruguai',
    'Paraguay': 'Paraguai',
    'Bolivia': 'Bolívia',
    'Ecuador': 'Equador',
    'Venezuela': 'Venezuela',
    'Guatemala': 'Guatemala',
    'El Salvador': 'El Salvador',
    'Honduras': 'Honduras',
    'Nicaragua': 'Nicarágua',
    'Costa Rica': 'Costa Rica',
    'Panama': 'Panamá',
    'Dominican Rep.': 'República Dominicana',
    'Puerto Rico': 'Porto Rico',
    'Jamaica': 'Jamaica',
    'Luxembourg': 'Luxemburgo',
    'Monaco': 'Mônaco',
    'Andorra': 'Andorra',
    'Vatican': 'Vaticano',
    'Malta': 'Malta',
    'Cyprus': 'Chipre',
    'Iceland': 'Islândia',
    'Greece': 'Grécia',
    'Hungary': 'Hungria',
    'Czech Republic': 'República Tcheca',
    'Romania': 'Romênia',
    'Ukraine': 'Ucrânia',
    'Israel': 'Israel',
    'Saudi Arabia': 'Arábia Saudita',
    'UAE': 'Emirados Árabes Unidos',
    'United Arab Emirates': 'Emirados Árabes Unidos'
};

export const translateCountry = (name: string | null): string => {
    if (!name) return 'Desconhecido';

    // Check direct match
    if (countryTranslations[name]) return countryTranslations[name];

    // Check case insensitive
    const lowerName = name.toLowerCase();
    const entry = Object.entries(countryTranslations).find(([key]) => key.toLowerCase() === lowerName);

    if (entry) return entry[1];

    // Fallback: Return original name
    return name;
};
