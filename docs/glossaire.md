# Glossaire QueenBee · groupe Dev

| Terme | Définition validée | Contexte | Dans le code | Source |
|---|---|---|---|---|
| Coopérative | Groupement d'apicultrices et d'apiculteurs auquel des sites sont rattachés | Référentiel | `Cooperative` | UC-A03 |
| Site | Lieu physique d'un rucher, identifié par un code pays et site (ex. `SN-CASA`) | Référentiel | `Site` | UC-G01 |
| Ruche | Contenant physique identifié (`PPSITE-NNN`), rattaché à un site, avec au plus un capteur | Référentiel | `Ruche`, `hiveId` | UC-A01 |
| Capteur | Dispositif mesurant poids, températures, humidité, activité acoustique | Référentiel | `Capteur` | UC-T02 |
| Transhumance | Déplacement déclaré d'une ruche vers un autre emplacement | Référentiel | `Transhumance` | UC-CY04 |
| Trame | Message brut émis par un capteur, avant validation | Collecte | `Trame` | UC-T02 |
| Mesure | Relevé validé d'une ruche à une date (poids, températures, humidité, acoustique) | Collecte | `Mesure` | UC-T02 |
| Mesure validée | Mesure dont les valeurs sont dans les plages physiques et qui n'est pas un rejeu | Collecte | `MesureValidée` | UC-CY02 |
| Rejeu | Trame déjà reçue (même `hive_id` et `timestamp`), rejetée | Collecte | `rejeu` | UC-CY02 |
| Seuil (capteur) | Valeur physique dont le dépassement déclenche un envoi immédiat | Collecte | `seuilCapteur` | UC-T02 |
| Colonie | Population d'abeilles d'une ruche, observée pour son état de santé | Santé | `Colonie` (référencée par `hiveId`) | UC-A02 |
| Score de santé | Indicateur courant de l'état d'une colonie, calculé à partir des mesures validées | Santé | `ScoreDeSante` | UC-A02 |
| Risque | Menace détectée sur une colonie : essaimage, affaiblissement, stress thermique, mortalité | Santé | `TYPES_DE_RISQUE` | UC-A02 |
| Alerte | Signalement d'un risque sur une colonie, avec cycle de vie levée, prise en charge, résolue | Santé | `Alerte` | UC-A02 |
| Prise en charge | Engagement d'une apicultrice ou d'un apiculteur à traiter une alerte | Santé | `alerte.assigner()` | UC-C01 |
| Escalade | Passage d'une alerte restée 48 h sans prise en charge à un niveau supérieur | Santé | `alerte.escalader()` | UC-A02 |
| Visite | Déplacement planifié vers une ruche, avec une criticité et une apicultrice assignée | Terrain | `Visite` | UC-C01 |
| Inspection | Constat réalisé sur une ruche (état visuel, reine, comportement, photo), possible hors ligne | Terrain | `Inspection` | UC-A01 |
| Synchronisation | Envoi au central des inspections saisies hors ligne, au retour du réseau | Terrain | `synchroniser()` | UC-A01 |
| Conflit de synchronisation | Deux versions concurrentes d'une même inspection, à trancher par le coordinateur | Terrain | `ConflitDeSynchronisation` | UC-A01 |
| Récolte | Volume de miel déclaré pour une ruche, à une date | Production | `Recolte` | UC-A03 |
| Écart de rendement | Différence, en %, entre la récolte déclarée et la prédiction | Production | `ecartRendement` | UC-A03, UC-C02 |
| Validation (d'une récolte) | Acceptation de la déclaration par le coordinateur, après comparaison aux poids mesurés | Production | `recolte.valider()` | UC-C02 |
| Seuil d'écart | Pourcentage d'écart de rendement au-delà duquel le coordinateur est notifié (20 %, à confirmer) | Production | `seuilEcart` | UC-A03 |
| Passerelle | Équipement d'un site qui reçoit les trames LoRaWAN et les relaie au central, souvent en différé | Supervision | `Passerelle` | UC-CY01 |
| Battement de cœur | Signal périodique d'une passerelle prouvant qu'elle est en service | Supervision | `battementDeCoeur` | UC-CY01 |
| Mode dégradé | Fonctionnement sur cache local lorsque la passerelle est muette | Supervision | `modeDegrade` | UC-CY01 |
| Incident | Événement d'infrastructure journalisé : passerelle muette, intégrité, brouillage, déplacement non déclaré | Supervision | `Incident` | UC-CY01 à CY04 |
| Rapport d'impact | Document figé consolidant les indicateurs d'une période pour un bailleur | Impact | `RapportImpact` | UC-G02 |
| Indicateur | Valeur consolidée multi-sites (rendement, colonies à risque, couverture réseau) | Impact | `Indicateur` | UC-G01 |
| Compte | Identité d'un utilisateur de la plateforme, avec rôles et authentification | Accès | `Compte` | UC-AD01 |
| Rôle | Ensemble de permissions (apicultrice, coordinateur, gestionnaire, administrateur) | Accès | `Role` | UC-AD01 |
| Périmètre (de droits) | Ensemble de sites sur lesquels un rôle est valable | Accès | `Perimetre` | UC-AD01 |

## Mots à plusieurs sens

- **« Alerte »** : deux sens, donc deux termes.
  - Sens 1, dans Santé des colonies : un risque détecté sur une colonie, avec cycle de vie `LEVÉE → PRISE_EN_CHARGE → RÉSOLUE` et escalade à 48 h. Acteurs : modèle de prédiction, apicultrice, coordinateur. Code : `Alerte`.
  - Sens 2, dans Supervision et sécurité : un problème d'infrastructure (passerelle muette, intégrité, brouillage, déplacement non déclaré). Cycle de vie différent (ouvert, clos), acteurs différents (supervision, administrateur), règles différentes. Code : `Incident`.
  - **Décision** : deux lignes, deux noms dans le code. Dans l'interface, on peut garder « alerte de site » pour l'utilisateur, mais le modèle dit `Incident`. Les post-it « Alerte de site levée », « Alerte d'intégrité levée » deviennent « Incident ouvert (type …) » sur le mur.
- **« Ruche »** : sens 1 dans Référentiel, contenant physique avec identité (`Ruche`). Sens 2 dans Santé, ensemble d'abeilles observé (`Colonie`). Décision : Santé ne connaît que `hiveId` et parle de colonie.
- **« Site »** : sens 1 dans Référentiel, lieu physique d'un rucher (`Site`). Sens 2 dans Accès, périmètre de droits (`Perimetre`). Décision : Accès stocke seulement des codes de site, et ne dépend pas de la fiche du site.
- **« Validation / validée »** : sens 1 dans Collecte, conformité technique d'une mesure (plage, rejeu). Sens 2 dans Production, acceptation par le coordinateur d'une récolte. Décision : `Mesure validée` et `Récolte validée` restent des noms séparés, jamais un statut `VALIDE` générique.
- **« Seuil »** : sens 1 dans Collecte, limite physique d'un capteur (`seuilCapteur`). Sens 2 dans Production, écart de rendement toléré (`seuilEcart`). Décision : toujours qualifier le mot.
- **« Notification »** : n'est pas un contexte. C'est l'effet d'une politique, envoyé par la messagerie (système externe). Décision : on parle de « coordinateur notifié », jamais d'un agrégat `Notification`.
