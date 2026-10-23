// Tests du kit QueenBee « agrégat Alerte ». Lancer : npm run tp5
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Alerte, DELAI_ESCALADE_MS } from './domain/Alerte.js';
import { AlerteService } from './application/AlerteService.js';
import { InMemoryAlerteRepository } from './adapters/InMemoryAlerteRepository.js';

const T0 = new Date('2027-03-14T08:00:00Z');
const apres = h => new Date(T0.getTime() + h * 3600e3);
const nouvelle = (extra = {}) => Alerte.lever({ id: 'ALR-1', hiveId: 'SN-CASA-014', siteId: 'SN-CASA', type: 'ESSAIMAGE', confiance: 0.8, at: T0, ...extra });

test('1. lever : statut LEVÉE et événement AlerteLevée', () => {
  const a = nouvelle();
  assert.equal(a.statut, 'LEVÉE');
  assert.deepEqual(a.pullEvents().map(e => e.type), ['AlerteLevée']);
});

test('2. invariant : type de risque inconnu refusé', () => {
  assert.throws(() => nouvelle({ type: 'INVASION_DE_FRELONS' }), /Type de risque/);
});

test('3. invariant : confiance comprise entre 0 et 1', () => {
  assert.throws(() => nouvelle({ confiance: 1.4 }), /confiance/);
  assert.throws(() => nouvelle({ confiance: -0.1 }), /confiance/);
});

test('4. assigner : PRISE_EN_CHARGE et événement AlertePriseEnCharge', () => {
  const a = nouvelle(); a.pullEvents();
  a.assigner('APIC-31', apres(2));
  assert.equal(a.statut, 'PRISE_EN_CHARGE');
  assert.deepEqual(a.pullEvents().map(e => e.type), ['AlertePriseEnCharge']);
});

test('5. résoudre sans prise en charge : refusé', () => {
  assert.throws(() => nouvelle().resoudre('INSP-1', apres(1)), /prise en charge/);
});

test('6. résoudre après prise en charge : RÉSOLUE', () => {
  const a = nouvelle();
  a.assigner('APIC-31', apres(2));
  a.resoudre('INSP-1', apres(5));
  assert.equal(a.statut, 'RÉSOLUE');
  assert.equal(a.pullEvents().at(-1).type, 'AlerteRésolue');
});

test('7. escalader avant 48 h : refusé', () => {
  assert.throws(() => nouvelle().escalader(apres(47)), /48 h/);
});

test('8. escalader après 48 h puis assigner : possible', () => {
  const a = nouvelle();
  assert.equal(a.estEnRetard(new Date(T0.getTime() + DELAI_ESCALADE_MS)), true);
  a.escalader(apres(49));
  assert.equal(a.statut, 'ESCALADÉE');
  a.assigner('APIC-12', apres(50));
  assert.equal(a.statut, 'PRISE_EN_CHARGE');
});

test('9. une alerte résolue n’accepte plus aucune transition', () => {
  const a = nouvelle();
  a.assigner('APIC-31', apres(1));
  a.resoudre('INSP-1', apres(2));
  assert.throws(() => a.assigner('APIC-2', apres(3)));
  assert.throws(() => a.escalader(apres(60)));
  assert.throws(() => a.resoudre('INSP-2', apres(3)));
});

test('10. pullEvents vide la liste', () => {
  const a = nouvelle();
  a.pullEvents();
  assert.equal(a.pullEvents().length, 0);
});

test('11. service : la politique d’escalade publie AlerteEscaladée', async () => {
  let now = T0; const publies = [];
  const service = new AlerteService({
    alertes: new InMemoryAlerteRepository(),
    bus: { emit: type => publies.push(type) },
    clock: { now: () => now },
    ids: { next: () => 'ALR-9' },
  });
  await service.lever({ hiveId: 'H1', siteId: 'S1', type: 'MORTALITE', confiance: 0.9 });
  now = apres(50);
  assert.equal(await service.escaladerAlertesEnRetard(), 1);
  assert.deepEqual(publies, ['AlerteLevée', 'AlerteEscaladée']);
});

test('12. pattern State : aucun switch sur le statut dans l’agrégat', () => {
  const source = readFileSync(new URL('./domain/Alerte.js', import.meta.url), 'utf8');
  assert.equal(/switch\s*\(/.test(source), false);
});
