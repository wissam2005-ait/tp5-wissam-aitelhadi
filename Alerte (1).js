// QueenBee · contexte « Santé des colonies »  —  KIT DE DÉPART (TP 5, parcours Dev)
// AGRÉGAT Alerte : racine unique, invariants protégés, événements du domaine.
// Le cycle de vie est géré avec le pattern State : AUCUN switch sur le statut.
//
//   LEVÉE ──assigner──▶ PRISE_EN_CHARGE ──résoudre──▶ RÉSOLUE
//     │                        ▲
//     └──escalader (≥ 48 h)──▶ ESCALADÉE ──assigner──┘
//   LEVÉE / ESCALADÉE / PRISE_EN_CHARGE ──annuler (fausse alerte)──▶ ANNULÉE
//
// Ce qui est fourni : la structure, l'état LEVÉE → PRISE_EN_CHARGE (exemple),
// la collecte des événements. À vous : les TODO (numérotés dans l'ordre conseillé).
// Vérification : npm run tp5  (12 tests ; 4 passent au départ).

export const TYPES_DE_RISQUE = ['ESSAIMAGE', 'AFFAIBLISSEMENT', 'STRESS_THERMIQUE', 'MORTALITE'];
export const DELAI_ESCALADE_MS = 48 * 60 * 60 * 1000;

const iso = d => new Date(d).toISOString();

// ---------------------------------------------------------------- états
// Message unique pour « résoudre sans prise en charge » (LEVÉE et ESCALADÉE).
const REFUS_RESOLUTION = 'Une alerte doit être prise en charge avant d’être résolue';

const Levee = {
  nom: 'LEVÉE',
  annuler(alerte, motif, at) {
    if (!motif) throw new Error('Un motif est exigé pour annuler une alerte');
    alerte._passer(Annulee, { type: 'AlerteAnnulée', motif, at: iso(at) });
  },
  // Une transition = changer d'état + enregistrer un événement
  assigner(alerte, apicultriceId, at) {
    alerte._passer(PriseEnCharge, { type: 'AlertePriseEnCharge', apicultriceId, at: iso(at) });
  },
  escalader(alerte, at) {
    // TODO 4 : l'escalade n'est possible que si l'alerte est en retard
    if (!alerte.estEnRetard(at)) {
      throw new Error('Escalade impossible : l’alerte n’a pas atteint 48 h sans prise en charge');
    }
    alerte._passer(Escaladee, { type: 'AlerteEscaladée', at: iso(at) });
  },
  resoudre() {
    // TODO 3
    throw new Error(REFUS_RESOLUTION);
  },
};

const PriseEnCharge = {
  nom: 'PRISE_EN_CHARGE',
  annuler(alerte, motif, at) {
    if (!motif) throw new Error('Un motif est exigé pour annuler une alerte');
    alerte._passer(Annulee, { type: 'AlerteAnnulée', motif, at: iso(at) });
  },
  assigner() {                                // TODO 5a
    throw new Error('Alerte déjà prise en charge');
  },
  escalader() {                               // TODO 5b
    throw new Error('Une alerte prise en charge ne peut pas être escaladée');
  },
  resoudre(alerte, inspectionId, at) {        // TODO 5c
    if (!inspectionId) throw new Error('Une inspection est exigée pour résoudre une alerte');
    alerte._passer(Resolue, { type: 'AlerteRésolue', inspectionId, at: iso(at) });
  },
};

const Escaladee = {
  nom: 'ESCALADÉE',
  annuler(alerte, motif, at) {
    if (!motif) throw new Error('Un motif est exigé pour annuler une alerte');
    alerte._passer(Annulee, { type: 'AlerteAnnulée', motif, at: iso(at) });
  },
  assigner(alerte, apicultriceId, at) {       // TODO 6a : comme depuis LEVÉE
    alerte._passer(PriseEnCharge, { type: 'AlertePriseEnCharge', apicultriceId, at: iso(at) });
  },
  escalader() {                               // TODO 6b
    throw new Error('Alerte déjà escaladée');
  },
  resoudre() {                                // TODO 6c
    throw new Error(REFUS_RESOLUTION);
  },
};

const Resolue = {
  nom: 'RÉSOLUE',
  // TODO 7 : état final, plus aucune transition
  assigner() {
    throw new Error('Alerte résolue : aucune transition possible (assigner)');
  },
  escalader() {
    throw new Error('Alerte résolue : aucune transition possible (escalader)');
  },
  resoudre() {
    throw new Error('Alerte résolue : aucune transition possible (résoudre)');
  },
  annuler() {
    throw new Error('Alerte résolue : aucune transition possible (annuler)');
  },
};

const Annulee = {
  nom: 'ANNULÉE',
  // État final : une fausse alerte ne bouge plus
  assigner() {
    throw new Error('Alerte annulée : aucune transition possible (assigner)');
  },
  escalader() {
    throw new Error('Alerte annulée : aucune transition possible (escalader)');
  },
  resoudre() {
    throw new Error('Alerte annulée : aucune transition possible (résoudre)');
  },
  annuler() {
    throw new Error('Alerte annulée : aucune transition possible (annuler)');
  },
};

// ---------------------------------------------------------------- agrégat
export class Alerte {
  #etat = Levee;
  #events = [];

  constructor({ id, hiveId, siteId, risque, confiance, leveeLe }) {
    Object.assign(this, { id, hiveId, siteId, risque, confiance, leveeLe: new Date(leveeLe) });
  }

  /** Fabrique : seul moyen de créer une alerte valide. */
  static lever({ id, hiveId, siteId, type, confiance, at }) {
    // TODO 1 : invariant — le type doit appartenir à TYPES_DE_RISQUE
    if (!TYPES_DE_RISQUE.includes(type)) {
      throw new Error(`Type de risque inconnu : ${type}`);
    }
    // TODO 2 : invariant — la confiance est un nombre compris entre 0 et 1
    if (typeof confiance !== 'number' || !Number.isFinite(confiance) || confiance < 0 || confiance > 1) {
      throw new Error(`La confiance doit être un nombre compris entre 0 et 1 (reçu : ${confiance})`);
    }
    const alerte = new Alerte({ id, hiveId, siteId, risque: type, confiance, leveeLe: at });
    alerte.#events.push({ type: 'AlerteLevée', alerteId: id, hiveId, siteId, risque: type, confiance, at: iso(at) });
    return alerte;
  }

  get statut() { return this.#etat.nom; }

  assigner(apicultriceId, at) { this.#etat.assigner(this, apicultriceId, at); }
  escalader(at) { this.#etat.escalader(this, at); }
  resoudre(inspectionId, at) { this.#etat.resoudre(this, inspectionId, at); }
  /** Fausse alerte signalée par le coordinateur. */
  annuler(motif, at) { this.#etat.annuler(this, motif, at); }

  /** Règle métier : une alerte restée LEVÉE 48 h sans prise en charge est en retard. */
  estEnRetard(now) {
    // TODO 4 (suite) : seule une alerte encore LEVÉE peut être en retard
    return this.#etat === Levee && new Date(now).getTime() - this.leveeLe.getTime() >= DELAI_ESCALADE_MS;
  }

  /** Événements produits depuis le dernier appel (consommés une seule fois). */
  pullEvents() {
    const e = this.#events;
    this.#events = [];
    return e;
  }

  /** Réservé aux objets état de ce module : change d'état et enregistre l'événement. */
  _passer(etat, event) {
    this.#etat = etat;
    this.#events.push({ ...event, alerteId: this.id, hiveId: this.hiveId, siteId: this.siteId });
  }
}
