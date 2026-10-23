// QueenBee · service applicatif du contexte « Santé des colonies ».
// Il orchestre l'agrégat : charger → appeler une méthode métier → sauvegarder → publier.
// Ports injectés : alertes (repository), bus (événements), clock (horloge), ids (identifiants).
import { Alerte } from '../domain/Alerte.js';

export class AlerteService {
  constructor({ alertes, bus, clock, ids }) {
    Object.assign(this, { alertes, bus, clock, ids });
  }

  /** Commande « Lever une alerte » (déclenchée par le modèle de prédiction). */
  async lever({ hiveId, siteId, type, confiance }) {
    const alerte = Alerte.lever({ id: this.ids.next(), hiveId, siteId, type, confiance, at: this.clock.now() });
    await this.#enregistrer(alerte);
    return alerte.id;
  }

  /** Commande « Assigner une visite » (coordinateur régional, UC-C01). */
  async assigner(alerteId, apicultriceId) {
    const alerte = await this.#charger(alerteId);
    alerte.assigner(apicultriceId, this.clock.now());
    await this.#enregistrer(alerte);
  }

  /** Commande « Résoudre » (après une inspection, UC-A01). */
  async resoudre(alerteId, inspectionId) {
    const alerte = await this.#charger(alerteId);
    alerte.resoudre(inspectionId, this.clock.now());
    await this.#enregistrer(alerte);
  }

  /** Commande « Annuler » (fausse alerte, coordinateur). */
  async annuler(alerteId, motif) {
    const alerte = await this.#charger(alerteId);
    alerte.annuler(motif, this.clock.now());
    await this.#enregistrer(alerte);
  }

  /** Politique « quand une alerte reste 48 h sans prise en charge, alors l'escalader ». */
  async escaladerAlertesEnRetard() {
    const now = this.clock.now();
    let n = 0;
    for (const alerte of await this.alertes.findByStatut('LEVÉE')) {
      if (alerte.estEnRetard(now)) {
        alerte.escalader(now);
        await this.#enregistrer(alerte);
        n++;
      }
    }
    return n;
  }

  async #charger(id) {
    const alerte = await this.alertes.findById(id);
    if (!alerte) throw new Error(`Alerte introuvable : ${id}`);
    return alerte;
  }

  async #enregistrer(alerte) {
    await this.alertes.save(alerte);
    for (const event of alerte.pullEvents()) this.bus.emit(event.type, event);
  }
}
