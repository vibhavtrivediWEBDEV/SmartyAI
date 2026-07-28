/**
 * AWS Bedrock GLM Service - Direct SDK Integration
 * Calls GLM-5 via Bedrock Converse API (no proxy needed)
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { AIConfig, AIResponse, ChatMessage, ChatOptions, AIService } from './aiService';

// Determine model ID based on region
const region = process.env.AWS_REGION || 'ap-south-1';
const profilePrefix = region.startsWith('eu-') ? 'eu' : region.startsWith('ap-') ? 'apac' : 'us';

// Use environment variable or default to GLM-5
// Alternative models: `${profilePrefix}.deepseek.v3.2` or `anthropic.claude-3-5-sonnet-20241022-v2:0`
const GLM_MODEL_ID = process.env.BEDROCK_MODEL || 'zai.glm-5';

export class BedrockService implements AIService {
  private config: AIConfig;
  private client: BedrockRuntimeClient | null = null;
  private modelId: string;
  private initialized = false;

  constructor(config: AIConfig) {
    this.config = config;
    
    // Get model from config or environment
    this.modelId = config.model || process.env.BEDROCK_MODEL || GLM_MODEL_ID;
    
    // Skip client initialization during build
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      // Server-side: defer initialization
      console.log('🤖 Bedrock GLM Service: Deferring initialization');
    }
  }
  
  private ensureInitialized() {
    if (this.initialized) return;
    
    const accessKeyId = this.config.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = this.config.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
    
    console.log('🤖 Bedrock GLM Service initialized:');
    console.log('   Model:', this.modelId);
    console.log('   Region:', this.config.region || region);
    
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
    }
    
    this.client = new BedrockRuntimeClient({
      region: this.config.region || region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    
    this.initialized = true;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse> {
    this.ensureInitialized();
    
    try {
      const input = this.toConverseInput(messages, options);
      const response = await this.client!.send(new ConverseCommand(input));
      return this.fromConverseResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async complete(prompt: string, options?: ChatOptions): Promise<AIResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async stream(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    options?: ChatOptions
  ): Promise<AIResponse> {
    this.ensureInitialized();
    
    try {
      const input = this.toConverseInput(messages, options);
      const response = await this.client!.send(new ConverseStreamCommand(input));

      let fullContent = '';
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      for await (const event of response.stream ?? []) {
        // Handle text deltas
        if (event.contentBlockDelta?.delta?.text) {
          const text = event.contentBlockDelta.delta.text;
          fullContent += text;
          onChunk(text);
        }

        // Handle usage metadata
        if ((event as any).metadata?.usage) {
          const meta = (event as any).metadata;
          usage = {
            promptTokens: meta.usage.inputTokens || 0,
            completionTokens: meta.usage.outputTokens || 0,
            totalTokens: (meta.usage.inputTokens || 0) + (meta.usage.outputTokens || 0),
          };
        }
      }

      return {
        content: fullContent,
        model: this.modelId,
        provider: 'bedrock',
        usage,
        finishReason: 'end_turn',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Convert our message format to Bedrock Converse format
  private toConverseInput(messages: ChatMessage[], options?: ChatOptions) {
    // Extract system messages
    const systemMessages = messages
      .filter(m => m.role === 'system')
      .map(m => ({ text: this.extractText(m.content) }))
      .filter(Boolean);

    // Convert user/assistant messages
    const converseMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: [{ text: this.extractText(m.content) }],
      }));

    return {
      modelId: options?.model || this.modelId,
      messages: converseMessages,
      system: systemMessages.length > 0 ? systemMessages : undefined,
      inferenceConfig: {
        maxTokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
        topP: options?.topP,
      },
    };
  }

  // Convert Bedrock response to our format
  private fromConverseResponse(response: any): AIResponse {
    const message = response.output?.message;
    const content = message?.content || [];
    
    let textContent = '';
    for (const block of content) {
      if (block.text) textContent += block.text;
    }

    return {
      content: textContent,
      model: this.modelId,
      provider: 'bedrock',
      usage: {
        promptTokens: response.usage?.inputTokens || 0,
        completionTokens: response.usage?.outputTokens || 0,
        totalTokens: (response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 0),
      },
      finishReason: response.stopReason || 'end_turn',
    };
  }

  private extractText(content: string | any[]): string {
    if (typeof content === 'string') return content;
    return content
      .filter((item: any) => item.type === 'text')
      .map((item: any) => item.text)
      .join('\n');
  }

  private handleError(error: any): never {
    console.error('❌ Bedrock GLM Error:', error);
    
    if (error.message?.includes('credentials') || error.Code === 'InvalidSignature') {
      throw new Error('AWS Bedrock credentials are invalid. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
    }
    
    if (error.message?.includes('model') || error.Code === 'ValidationException') {
      throw new Error('Invalid model ID or model not accessible. Check BEDROCK_MODEL in .env');
    }
    
    throw new Error(`Bedrock GLM Error: ${error.message || 'Unknown error'}`);
  }
}
