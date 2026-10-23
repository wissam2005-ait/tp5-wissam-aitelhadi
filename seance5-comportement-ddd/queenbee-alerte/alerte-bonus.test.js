// Tests des options « pour aller plus loin » : état ANNULÉE et observateur de notification.
// Lancer : node --test seance5-comportement-ddd/queenbee-alerte/alerte-bonus.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Alerte } from './domain/Alerte.js';
import { AlerteService } from './application/AlerteService.js';
import { InMemoryAlerteRepository } from './adapters/InMemoryAlerteRepository.js';
import { NotificationCoordinateur } from './adapters/NotificationCoordinateur.js';
import { EventBus } from '../comportementaux/EventBus.js';

const T0 = new Date('2027-03-14T08:00:00Z');
const apres = h => new Date(T0.getTime() + h * 3600e3);
const nouvelle = () => Alerte.lever({ id: 'ALR-1', hiveId: 'SN-CASA-014', siteId: 'SN-CASA', type: 'ESSAIMAGE', confiance: 0.8, at: T0 });

test('B1. annuler depuis LEVÉE : ANNULÉE et événement AlerteAnnulée', () => {
  const a = nouvelle(); a.pullEvents();
  a.annuler('fausse alerte : capteur mal posé', apres(1));
  assert.equal(a.statut, 'ANNULÉE');
  const [e] = a.pullEvents();
  assert.equal(e.type, 'AlerteAnnulée');
  assert.equal(e.motif, 'fausse alerte : capteur mal posé');
});

test('B2. annuler exige un motif', () => {
  assert.throws(() => nouvelle().annuler('', apres(1)), /motif/);
});

test('B3. annuler possible depuis PRISE_EN_CHARGE et ESCALADÉE', () => {
  const a = nouvelle(); a.assigner('APIC-31', apres(1)); a.annuler('erreur', apres(2));
  assert.equal(a.statut, 'ANNULÉE');
  const b = nouvelle(); b.escalader(apres(49)); b.annuler('erreur', apres(50));
  assert.equal(b.statut, 'ANNULÉE');
});

test('B4. une alerte résolue ne peut plus être annulée', () => {
  const a = nouvelle(); a.assigner('APIC-31', apres(1)); a.resoudre('INSP-1', apres(2));
  assert.throws(() => a.annuler('trop tard', apres(3)));
});

test('B5. une alerte annulée n’accepte plus aucune transition', () => {
  const a = nouvelle(); a.annuler('erreur', apres(1));
  assert.throws(() => a.assigner('APIC-2', apres(2)));
  assert.throws(() => a.escalader(apres(60)));
  assert.throws(() => a.resoudre('INSP-1', apres(2)));
  assert.throws(() => a.annuler('encore', apres(2)));
});

test('B6. une alerte annulée n’est plus escaladée par la politique des 48 h', async () => {
  let now = T0;
  const service = new AlerteService({
    alertes: new InMemoryAlerteRepository(), bus: new EventBus(),
    clock: { now: () => now }, ids: { next: () => 'ALR-9' },
  });
  const id = await service.lever({ hiveId: 'H1', siteId: 'S1', type: 'MORTALITE', confiance: 0.9 });
  await service.annuler(id, 'fausse alerte');
  now = apres(60);
  assert.equal(await service.escaladerAlertesEnRetard(), 0);
});

test('B7. observateur : l’escalade notifie le coordinateur du site', async () => {
  let now = T0; const envoyes = [];
  const bus = new EventBus();
  new NotificationCoordinateur({
    bus,
    notifier: { envoyer: (dest, msg) => envoyes.push({ dest, msg }) },
    coordinateurDuSite: siteId => `COORD-${siteId}`,
  });
  const service = new AlerteService({
    alertes: new InMemoryAlerteRepository(), bus,
    clock: { now: () => now }, ids: { next: () => 'ALR-7' },
  });
  await service.lever({ hiveId: 'SN-CASA-014', siteId: 'SN-CASA', type: 'ESSAIMAGE', confiance: 0.8 });
  assert.equal(envoyes.length, 0);
  now = apres(50);
  await service.escaladerAlertesEnRetard();
  assert.equal(envoyes.length, 1);
  assert.equal(envoyes[0].dest, 'COORD-SN-CASA');
  assert.match(envoyes[0].msg, /ALR-7 escaladée/);
});
