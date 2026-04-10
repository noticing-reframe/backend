import { Router, Request, Response } from 'express';
import { PersonService } from './person.service.js';

export class PersonController {
  public router: Router;
  private service: PersonService;

  constructor() {
    this.router = Router();
    this.service = new PersonService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getAllPersons.bind(this));
    this.router.get('/:id', this.getPersonById.bind(this));
  }

  private async getAllPersons(_req: Request, res: Response): Promise<void> {
    try {
      const persons = await this.service.getAllPersons();
      // system_prompt와 background_story는 제외하고 반환
      const publicPersons = persons.map(({ system_prompt, background_story, ...rest }) => rest);
      res.json(publicPersons);
    } catch (error) {
      console.error('getAllPersons error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async getPersonById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const person = await this.service.getPersonById(id);

      if (!person) {
        res.status(404).json({ error: 'Person not found' });
        return;
      }

      // system_prompt와 background_story는 제외하고 반환
      const { system_prompt, background_story, ...publicPerson } = person;
      res.json(publicPerson);
    } catch (error) {
      console.error('getPersonById error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
