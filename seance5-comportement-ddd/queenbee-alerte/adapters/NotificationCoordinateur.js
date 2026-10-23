// Observateur : quand une alerte est escaladée, on prévient le coordinateur du site.
// Adaptateur : il s'abonne au bus (pattern Observer) ; le domaine ne le connaît pas.
// `notifier` est un port : { envoyer(destinataire, message) } (SMS, e-mail, push…).
export class NotificationCoordinateur {
  constructor({ bus, notifier, coordinateurDuSite }) {
    this.desabonner = bus.on('AlerteEscaladée', e => {
      const coordinateur = coordinateurDuSite(e.siteId);
      notifier.envoyer(coordinateur, `Alerte ${e.alerteId} escaladée (ruche ${e.hiveId}, site ${e.siteId})`);
    });
  }
}
