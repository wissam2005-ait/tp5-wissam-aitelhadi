# Kit TP 5 — QueenBee : l'agrégat Alerte (parcours Dev)

Contexte : « Santé des colonies » du projet QueenBee (cahier des charges, UC-A02 et UC-C01).
Une alerte est levée par le modèle de prédiction (risque d'essaimage, affaiblissement,
stress thermique, mortalité), prise en charge par une apicultrice ou un apiculteur,
puis résolue après une inspection. Sans prise en charge sous 48 h, elle est escaladée.

## Ce qui est fourni
- `domain/Alerte.js` : la structure de l'agrégat, l'état LEVÉE → PRISE_EN_CHARGE en exemple
- `application/AlerteService.js` : le service applicatif complet (charger → agir → sauvegarder → publier)
- `adapters/InMemoryAlerteRepository.js` : un repository en mémoire
- `demo.js` : un scénario sur deux ruches (fonctionne quand l'agrégat est terminé)
- `alerte.spec.js` : 12 tests

## Ce qu'il faut faire
Compléter les `TODO 1` à `TODO 7` de `domain/Alerte.js`, dans l'ordre, en relançant les tests :

```bash
npm run tp5                                              # 4 tests passent au départ
node seance5-comportement-ddd/queenbee-alerte/demo.js    # quand les 12 tests passent
```

Contraintes : pas de `switch` sur le statut (le test 12 le vérifie), aucun import dans
`domain/` (vérifié par `npm run lint:archi`).

## Pour aller plus loin
- Ajouter un état `ANNULÉE` (fausse alerte signalée par le coordinateur)
- Brancher un observateur qui « notifie » le coordinateur du site en cas d'escalade
- Ajouter l'événement dans la context map de l'Event Storming
