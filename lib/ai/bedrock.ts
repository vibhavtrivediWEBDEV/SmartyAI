/**
 * AWS Bedrock Service Implementation (Direct SDK - No Proxy)
 * 
 * ⚠️ DEPRECATED: This file has been replaced by bedrock-glm.ts
 * 
 * This file re-exports the new direct AWS SDK implementation.
 * All proxy-based code has been removed for Vercel compatibility.
 * 
 * @deprecated Use './bedrock-glm' directly instead
 */

// Re-export the new implementation
export { BedrockService } from './bedrock-glm'

    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: this.extractText(m.content)
      }))
  }

  private extractText(content: string | any[]): string {
    if (typeof content === 'string') {
      return content
    }
    
    return content
      .filter((item: any) => item.type === 'text')
      .map((item: any) => item.text)
      .join('\n')
  }

  private handleError(error: any): never {
    console.error('❌ Bedrock Error:', error)
    
    if (error.message?.includes('401') || error.message?.includes('credentials')) {
      throw new Error('AWS Bedrock credentials are invalid. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env')
    }
    
    if (error.message?.includes('ECONNREFUSED')) {
      throw new Error('Cannot connect to Bedrock proxy. Make sure the proxy is running on ' + this.baseUrl)
    }
    
    throw new Error(`Bedrock Error: ${error.message || 'Unknown error'}`)
  }
}
