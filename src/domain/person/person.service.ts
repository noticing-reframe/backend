import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Person } from '../../entity/person/person.entity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const personsPath = join(__dirname, '../../data/persons.json');
const personsData: Person[] = JSON.parse(readFileSync(personsPath, 'utf-8'));

@Injectable()
export class PersonService {
  private persons: Map<string, Person> = new Map();

  constructor() {
    personsData.forEach((p) => this.persons.set(p.character_id, p));
  }

  findAll(): Person[] {
    return Array.from(this.persons.values());
  }

  findById(id: string): Person | null {
    return this.persons.get(id) || null;
  }

  createDocumentText(person: Person): string {
    const backgroundTexts = person.background_story.map((b) => b.text).join(' ');
    return [
      person.character_name,
      person.character_tagline,
      person.character_category,
      person.character_background,
      person.student_attribute,
      backgroundTexts,
    ].join(' ');
  }

  getAttributes(person: Person): string[] {
    return person.student_attribute.split(',').map((s) => s.trim());
  }
}
