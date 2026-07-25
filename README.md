# SimpleOQuotidien
Une Application Digiscia

# Système de notifications

1. Client crée une commande (Status: CREEE)
         │
2. Agent assigne un Prestataire via Assignment
   ├── 📩 Email + 🔔 In-App ➔ Prestataire ("Vous avez un devis à faire")
   └── 📩 Email + 🔔 In-App ➔ Client ("Prestataire attribué")
         │
3. Prestataire crée le devis a travers quote (Status: ENVOYE)
   └── 📩 Email avec boutons "Accepter" / "Refuser" (Lien direct) + 🔔 In-App ➔ Client
         │
   ┌─────┴───────────────────────────────────────────────────────┐
   ▼                                                             ▼
[CLIENT ACCEPTE]                                          [CLIENT REFUSE]
Order: ACCEPTEE / Quote: ACCEPTE                         Order: EN_TRAITEMENT / Quote: REFUSE
└── 📩 Email + 🔔 In-App ➔ Prestataire                   └── 🔔 In-App + 📩 Email ➔ AGENTS
                                                             ("Réassignation manuelle requise")
                                                                  │
                                                        4. Agent réassigne un nouveau Prestataire
                                                           (Et le cycle reprend !)