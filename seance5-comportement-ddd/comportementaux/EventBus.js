// Observer : un sujet (le bus) notifie tous ses observateurs abonnés.
export class EventBus {
  #handlers = new Map();

  on(event, handler) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, new Set());
    this.#handlers.get(event).add(handler);
    return () => this.#handlers.get(event).delete(handler); // fonction de désabonnement
  }
  emit(event, payload) {
    for (const handler of this.#handlers.get(event) ?? []) {
      try {
        handler(payload);
      } catch (e) {
        console.log(`  [bus] un observateur de ${event} a échoué : ${e.message}`);
      } // isolation
    }
  }
}
