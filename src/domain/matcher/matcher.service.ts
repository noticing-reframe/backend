import { Injectable } from '@nestjs/common';
import type { MatchResult, DocumentInput } from '../../entity/matcher/match-result.entity';

@Injectable()
export class MatcherService {
  match(query: string, documents: DocumentInput[], topN: number = 3): MatchResult[] {
    const docTexts = documents.map((d) => d.text);
    const allTexts = [...docTexts, query];

    const { vocabulary, idf } = this.computeIDF(allTexts);
    const queryVector = this.computeTFIDFVector(query, vocabulary, idf);

    const scored = documents.map((doc, index) => {
      const docVector = this.computeTFIDFVector(doc.text, vocabulary, idf);
      const similarity = this.cosineSimilarity(queryVector, docVector);
      const matchedTerms = this.findMatchedTerms(query, doc.attributes);
      return { index, similarity, matchedTerms };
    });

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topN);
  }

  private tokenize(text: string): string[] {
    const particles = /[은는이가을를의로에서와과도만까지부터라고처럼같이]/g;
    return text
      .toLowerCase()
      .replace(particles, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 1);
  }

  private computeIDF(documents: string[]): {
    vocabulary: Map<string, number>;
    idf: Map<string, number>;
  } {
    const vocabulary = new Map<string, number>();
    const documentFrequency = new Map<string, number>();
    let vocabIndex = 0;

    for (const doc of documents) {
      const tokens = new Set(this.tokenize(doc));
      for (const token of tokens) {
        if (!vocabulary.has(token)) {
          vocabulary.set(token, vocabIndex++);
        }
        documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
      }
    }

    const N = documents.length;
    const idf = new Map<string, number>();
    for (const [term, df] of documentFrequency) {
      idf.set(term, Math.log(N / df) + 1);
    }

    return { vocabulary, idf };
  }

  private computeTFIDFVector(
    text: string,
    vocabulary: Map<string, number>,
    idf: Map<string, number>
  ): number[] {
    const tokens = this.tokenize(text);
    const tf = new Map<string, number>();

    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    const vector = new Array(vocabulary.size).fill(0);
    for (const [term, freq] of tf) {
      const idx = vocabulary.get(term);
      if (idx !== undefined) {
        const idfValue = idf.get(term) || 1;
        vector[idx] = freq * idfValue;
      }
    }

    return vector;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
  }

  private findMatchedTerms(query: string, attributes: string[]): string[] {
    const queryTokens = new Set(this.tokenize(query));
    const matched: string[] = [];

    for (const attr of attributes) {
      if (queryTokens.has(attr.toLowerCase())) {
        matched.push(attr);
      }
    }

    return matched;
  }
}
