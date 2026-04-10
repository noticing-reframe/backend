import { InsightRepository } from '../../domain/insight/insight.repository.js';
import type { Insight, CreateInsightInput } from '../../domain/insight/insight.interface.js';

export class InsightService {
  private repository: InsightRepository;

  constructor(repository?: InsightRepository) {
    this.repository = repository || new InsightRepository();
  }

  async createInsight(input: CreateInsightInput): Promise<Insight> {
    return this.repository.create(input);
  }

  async getInsightsByUserId(userId: string): Promise<Insight[]> {
    return this.repository.findByUserId(userId);
  }
}
