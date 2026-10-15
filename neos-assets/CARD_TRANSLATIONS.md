# Traduções das cartas

A coleção utiliza nomes e descrições em português obtidos da API pública YGOPRODeck:
https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt

Documentação: https://api.ygoprodeck.com/api-guide/

Snapshot local: cards-pt.json. Inclui IDs de ilustrações alternativas. A data de atualização e a fonte constam no próprio JSON.

Atualização manual: node scripts/update-card-translations.mjs

Os textos traduzidos substituem apenas nome e descrição nas bases SQLite carregadas pelo jogo. IDs, atributos e demais dados das regras são preservados. Cartas ainda não traduzidas pela fonte conservam o texto original. As ilustrações continuam vindo da configuração de imagens; na coleção, o texto da miniatura é desenhado pela interface em português.
