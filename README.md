# SimpleOQuotidien
Une Application Digiscia

# Système de notifications

flowchart TD
    A[1. Client crée une commande<br><b>Status: CREEE</b>] --> B[2. Agent assigne un Prestataire via Assignment]
    
    B -->|📩 Email + 🔔 In-App| B1[<b>Prestataire:</b> Vous avez un devis à faire]
    B -->|📩 Email + 🔔 In-App| B2[<b>Client:</b> Prestataire attribué]
    
    B1 --> C[3. Prestataire crée le devis via Quote<br><b>Status: ENVOYE</b>]
    
    C -->|📩 Email avec boutons + 🔔 In-App| D[<b>Client reçoit la proposition</b>]
    
    D -->|Clic 'Accepter'| E[<b>CLIENT ACCEPTE</b><br>Order: ACCEPTEE | Quote: ACCEPTE]
    D -->|Clic 'Refuser'| F[<b>CLIENT REFUSE</b><br>Order: EN_TRAITEMENT | Quote: REFUSE]
    
    E -->|📩 Email + 🔔 In-App| E1[<b>Prestataire:</b> Devis accepté]
    
    F -->|📩 Email + 🔔 In-App| F1[<b>AGENTS:</b> Réassignation manuelle requise]
    
    F1 --> G[4. Agent réassigne un nouveau Prestataire]
    G -->|Le cycle reprend| B