# Liste de référence des villes/communes desservies par la plateforme.
# Utilisée pour valider le champ "city" des services (PRE-07 : empêcher la
# saisie de villes inexistantes) — doit rester synchronisée avec
# frontend/src/lib/constants/cities.ts.
VILLES_COTE_DIVOIRE = [
    'Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo',
    'Man', 'Divo', 'Gagnoa', 'Anyama', 'Abengourou', 'Agboville',
    'Grand-Bassam', 'Dabou', 'Bouaflé', 'Séguéla', 'Odienné', 'Bondoukou',
    'Ferkessédougou', 'Issia', 'Sinfra', 'Soubré', 'Touba', 'Adzopé',
    'Bingerville', 'Aboisso', 'Toumodi', 'Tiassalé', 'Guiglo', 'Danané',
]

VILLES_VALIDES = {v.upper() for v in VILLES_COTE_DIVOIRE}
