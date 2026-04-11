import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import yaml from 'js-yaml';
import type { PromptTemplate, TemplateVariables, ToolDefinition } from '../../entity/prompt/prompt-template.entity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const promptsDir = join(__dirname, '../../data/prompts');

@Injectable()
export class PromptService {
  private promptCache: Map<string, PromptTemplate> = new Map();

  loadPrompt(name: string): PromptTemplate {
    if (this.promptCache.has(name)) {
      return this.promptCache.get(name)!;
    }

    const filePath = join(promptsDir, `${name}.yaml`);
    const content = readFileSync(filePath, 'utf-8');
    const prompt = yaml.load(content) as PromptTemplate;
    this.promptCache.set(name, prompt);
    return prompt;
  }

  getSystemPrompt(name: string): string {
    return this.loadPrompt(name).system_prompt;
  }

  getUserMessageTemplate(name: string): string | undefined {
    return this.loadPrompt(name).user_message_template;
  }

  getToolDefinition(name: string): ToolDefinition | null {
    return this.loadPrompt(name).output_schema;
  }

  render(template: string, variables: TemplateVariables): string {
    let result = template;

    // Handle {{#each array}} ... {{/each}} blocks
    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    result = result.replace(eachRegex, (_, arrayName, blockContent) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return '';

      return array.map((item, idx) => {
        let itemContent = blockContent;
        // Replace {{index}} with 1-based index
        itemContent = itemContent.replace(/\{\{\s*index\s*\}\}/g, String(idx + 1));
        // Replace other item properties
        if (typeof item === 'object' && item !== null) {
          for (const [key, value] of Object.entries(item)) {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            itemContent = itemContent.replace(regex, String(value));
          }
        }
        return itemContent;
      }).join('');
    });

    // Handle simple {{variable}} replacements
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string' || typeof value === 'number') {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        result = result.replace(regex, String(value));
      }
    }

    // Handle {{n}} for array length
    for (const [key, value] of Object.entries(variables)) {
      if (Array.isArray(value)) {
        result = result.replace(/\{\{\s*n\s*\}\}/g, String(value.length));
      }
    }

    return result;
  }

  renderSystemPrompt(name: string, variables: TemplateVariables): string {
    const template = this.getSystemPrompt(name);
    return this.render(template, variables);
  }

  renderUserMessage(name: string, variables: TemplateVariables): string {
    const template = this.getUserMessageTemplate(name);
    if (!template) return '';
    return this.render(template, variables);
  }
}
