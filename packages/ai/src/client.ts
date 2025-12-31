import OpenAI from 'openai';

/**
 * OpenAI client wrapper with proper error handling
 * API key should be provided via environment variable OPENAI_API_KEY
 */
export class AIClient {
  private client: OpenAI;
  
  constructor(apiKey?: string) {
    if (!apiKey && !process.env.OPENAI_API_KEY) {
      throw new Error(
        'OpenAI API key not found. Please set OPENAI_API_KEY environment variable or pass apiKey to constructor.'
      );
    }
    
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }
  
  /**
   * Generate a completion with structured JSON output
   */
  async generateJSON<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: any,
    temperature: number = 0.7
  ): Promise<T> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        response_format: { type: 'json_object' },
      });
      
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }
      
      const parsed = JSON.parse(content);
      
      // Validate against schema if Zod schema provided
      if (schema && typeof schema.parse === 'function') {
        return schema.parse(parsed);
      }
      
      return parsed as T;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
  
  /**
   * Generate a text completion
   */
  async generateText(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7
  ): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
      });
      
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }
      
      return content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
  
  /**
   * Generate streaming completion (for chat interface)
   */
  async *generateStream(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7
  ): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        stream: true,
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('OpenAI API streaming error:', error);
      throw error;
    }
  }
}
