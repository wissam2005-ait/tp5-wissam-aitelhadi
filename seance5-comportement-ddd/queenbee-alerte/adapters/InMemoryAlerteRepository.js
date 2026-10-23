// Adaptateur secondaire : repository en mémoire (une base PostgreSQL le remplacerait).
export class InMemoryAlerteRepository {
  #alertes = new Map();
  async save(alerte) { this.#alertes.set(alerte.id, alerte); }
  async findById(id) { return this.#alertes.get(id); }
  async findByStatut(statut) { return [...this.#alertes.values()].filter(a => a.statut === statut); }
}
