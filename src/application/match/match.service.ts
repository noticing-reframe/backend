import { PersonService } from '../person/person.service.js';
import type { PersonMatch } from '../../domain/person/person.interface.js';

export class MatchService {
  private personService: PersonService;

  constructor() {
    this.personService = new PersonService();
  }

  async matchPersons(worryText: string): Promise<PersonMatch[]> {
    return this.personService.matchPersonsToWorry(worryText);
  }
}
