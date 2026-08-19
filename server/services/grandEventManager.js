import eventsData from '../data/events.json' with { type: 'json' };
import questionsData from '../data/questions.json' with { type: 'json' };

export class GrandEventManager {
  constructor(io) {
    this.io = io;
    this.events = eventsData;
    this.questions = questionsData;
    this.activeBattle = null; // Live battle instance
  }

  getEvents() {
    return this.events;
  }

  registerForEvent(eventId, playerProfile) {
    const evt = this.events.find(e => e.id === eventId);
    if (!evt) return { error: 'Sự kiện không tồn tại' };
    evt.registeredPlayerCount = (evt.registeredPlayerCount || 0) + 1;
    return { success: true, event: evt };
  }
}
