# Bounded contexts QueenBee

Huit contextes. Le critère de découpage est le changement de sens des mots (voir `glossaire.md`) : cycle de vie, personnes et règles différents.

## Référentiel des ruchers
- Responsabilité (une phrase) : tenir l'inventaire officiel des coopératives, sites, ruches et capteurs, et leur localisation de référence.
- Type : support · spécialité la plus concernée : Dev
- Agrégats : Site (code unique, une seule coopérative) · Ruche (identifiant `PPSITE-NNN` unique, un capteur à la fois, un seul site à un instant donné)
- Événements publiés : SiteEnregistré · RucheEnregistrée · CapteurAssocié · DéplacementDéclaré
- Événements consommés : aucun (contexte amont de tous les autres)
- Cas d'utilisation sources : UC-A01 (ruche introuvable), UC-CY04 (déplacement déclaré), UC-AD01 (rattachements)
- Mots propres à ce contexte : Site (lieu), Ruche (contenant identifié), Capteur, Coopérative, Transhumance

## Collecte des mesures
- Responsabilité : recevoir les trames des capteurs, les valider (plage physique, rejeu) et publier des mesures fiables.
- Type : support · spécialité : Data
- Agrégats : Mesure (plages physiques, couple `hive_id` + `timestamp` unique, immuable une fois validée)
- Événements publiés : MesureValidée.v1 · TrameRejetée
- Événements consommés : RucheEnregistrée (venant de Référentiel) ; trames brutes (venant de Capteurs et passerelle LoRaWAN, système externe)
- Cas d'utilisation sources : UC-T02, UC-CY02
- Mots propres à ce contexte : Trame, Mesure, Rejeu, Plage physique, Seuil (capteur)

## Santé des colonies
- Responsabilité : transformer les mesures en risques, et gérer le cycle de vie des alertes jusqu'à leur résolution.
- Type : cœur · spécialité : Dev
- Agrégats : Alerte (8 invariants, voir `dev-agregat-alerte.md`) · Santé de la ruche (un seul score courant par ruche, calculé à partir de mesures validées)
- Événements publiés : AlerteLevée.v1 · AlertePriseEnCharge · AlerteEscaladée.v1 · AlerteRésolue.v1 · ScoreDeSantéRecalculé
- Événements consommés : MesureValidée (venant de Collecte) · InspectionSynchronisée (venant de Terrain) · risque détecté (venant du Modèle de prédiction) · météo (venant d'OpenWeatherMap)
- Cas d'utilisation sources : UC-A02, UC-C01 (classement par risque)
- Mots propres à ce contexte : Alerte, Colonie, Score de santé, Risque, Prise en charge, Escalade

## Terrain
- Responsabilité : planifier les visites, assigner les apicultrices, et enregistrer les inspections, y compris hors ligne et leur synchronisation.
- Type : cœur · spécialité : Dev
- Agrégats : Visite (une ruche, une criticité, une seule apicultrice, droit sur le site) · Inspection (identifiant généré côté terminal, immuable après synchronisation)
- Événements publiés : VisitePlanifiée · VisiteAssignée · InspectionEnregistrée · InspectionSynchronisée.v1 · ConflitDeSynchronisationDétecté · RucheIntrouvableSignalée · AnomalieConstatée
- Événements consommés : AlerteLevée, AlerteEscaladée (venant de Santé) · ScoreDeSantéRecalculé (classement) · périmètres de droits (venant d'Accès)
- Cas d'utilisation sources : UC-A01, UC-C01
- Mots propres à ce contexte : Visite, Inspection, Synchronisation, Conflit, Criticité

## Production
- Responsabilité : enregistrer les récoltes, les comparer à la prédiction et aux poids mesurés, puis les faire valider.
- Type : cœur · spécialité : Data
- Agrégats : Récolte (volume positif, une récolte validée ne change plus, un écart signalé exige un commentaire)
- Événements publiés : RécolteDéclarée · ÉcartDeRendementCalculé · RécolteValidée.v1 · ÉcartMisEnInvestigation
- Événements consommés : MesureValidée (poids, venant de Collecte) · prédiction de rendement (venant du Modèle de prédiction) · RucheEnregistrée
- Cas d'utilisation sources : UC-A03, UC-C02
- Mots propres à ce contexte : Récolte, Écart de rendement, Validation (d'une récolte), Seuil d'écart, Rendement

## Supervision et sécurité
- Responsabilité : surveiller l'infrastructure (passerelles, canaux, intégrité, positions) et tracer les incidents.
- Type : support · spécialité : Cyber
- Agrégats : Passerelle (rattachée à un site, muette après 15 min sans battement de cœur) · Incident (journalisé, jamais supprimé, ouvert puis clos sans retour)
- Événements publiés : PasserelleHorsLigneDétectée · PasserelleRétablie · IncidentOuvert (types : passerelle muette, intégrité, brouillage, déplacement non déclaré) · IncidentClos
- Événements consommés : battements de cœur (venant des passerelles, système externe) · TrameRejetée, MesureValidée (position) · DéplacementDéclaré (venant de Référentiel)
- Cas d'utilisation sources : UC-CY01, UC-CY02, UC-CY03, UC-CY04
- Mots propres à ce contexte : Incident, Battement de cœur, Mode dégradé, Brouillage, Déplacement non déclaré

## Impact et rapports
- Responsabilité : consolider les indicateurs multi-sites et produire les rapports d'impact pour les bailleurs.
- Type : support · spécialité : Data
- Agrégats : Rapport d'impact (période non vide, instantané figé à la génération, on n'envoie qu'un rapport généré)
- Événements publiés : PériodeChoisie · RapportGénéré · RapportEnvoyé
- Événements consommés : RécolteValidée (Production) · AlerteRésolue (Santé) · PasserelleHorsLigne et PasserelleRétablie (couverture réseau, Supervision) · RucheEnregistrée (Référentiel)
- Cas d'utilisation sources : UC-G01, UC-G02
- Mots propres à ce contexte : Indicateur, Rapport d'impact, Période, Bailleur

## Accès et comptes
- Responsabilité : gérer les comptes, rôles par site, authentification et traçabilité des actions.
- Type : générique · spécialité : Cyber
- Agrégats : Compte utilisateur (blocage après 5 échecs, MFA obligatoire pour coordinateur, gestionnaire et administrateur, rôles par site, toute action tracée)
- Événements publiés : CompteCréé · CompteModifié · CompteDésactivé · RôleAssigné.v1 · CompteBloqué
- Événements consommés : SiteEnregistré (pour rattacher des rôles)
- Cas d'utilisation sources : UC-AD01, UC-T01
- Mots propres à ce contexte : Compte, Rôle, Périmètre (de droits), Jeton

## Systèmes externes (hors contextes)
Capteurs et passerelle LoRaWAN · Modèle de prédiction · OpenWeatherMap · Messagerie (push, SMS, e-mail). Chacun est relié au contexte consommateur par une couche anticorruption (étape D).
