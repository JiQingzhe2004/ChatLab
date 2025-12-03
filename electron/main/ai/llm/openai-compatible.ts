/**
 * OpenAI Compatible LLM Provider
 * 支持任何兼容 OpenAI API 格式的服务（如 Ollama、LocalAI、vLLM 等）
 */

import type {
  ILLMService,
  LLMProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  ProviderInfo,
  ToolCall,
} from './types'

const DEFAULT_BASE_URL = 'http://localhost:11434/v1'

export const OPENAI_COMPATIBLE_INFO: ProviderInfo = {
  id: 'openai-compatible',
  name: 'OpenAI 兼容',
  description: '支持任何兼容 OpenAI API 的服务（如 Ollama、LocalAI、vLLM 等）',
  defaultBaseUrl: DEFAULT_BASE_URL,
  models: [
    { id: 'llama3.2', name: 'Llama 3.2', description: 'Meta Llama 3.2 模型' },
    { id: 'qwen2.5', name: 'Qwen 2.5', description: '通义千问 2.5 模型' },
    { id: 'deepseek-r1', name: 'DeepSeek R1', description: 'DeepSeek R1 推理模型' },
  ],
}

export class OpenAICompatibleService implements ILLMService {
  private apiKey: string
  private baseUrl: string
  private model: string
  private disableThinking: boolean

  constructor(apiKey: string, model?: string, baseUrl?: string, disableThinking?: boolean) {
    this.apiKey = apiKey || 'sk-no-key-required' // 本地服务可能不需要 API Key
    this.baseUrl = baseUrl || DEFAULT_BASE_URL
    this.model = model || 'llama3.2'
    this.disableThinking = disableThinking ?? true // 默认禁用思考模式
  }

  getProvider(): LLMProvider {
    return 'openai-compatible'
  }

  getModels(): string[] {
    return OPENAI_COMPATIBLE_INFO.models.map((m) => m.id)
  }

  getDefaultModel(): string {
    return 'llama3.2'
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const requestBody: Record<string, unknown> = {
      model: this.model,
      messages: messages.map((m) => {
        const msg: Record<string, unknown> = { role: m.role, content: m.content }
        if (m.role === 'tool' && m.tool_call_id) {
          msg.tool_call_id = m.tool_call_id
        }
        if (m.role === 'assistant' && m.tool_calls) {
          msg.tool_calls = m.tool_calls
        }
        return msg
      }),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: false,
    }

    if (options?.tools && options.tools.length > 0) {
      requestBody.tools = options.tools
    }

    // 禁用思考模式（用于 Qwen3、DeepSeek-R1 等本地模型）
    if (this.disableThinking) {
      requestBody.chat_template_kwargs = { enable_thinking: false }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 只有在有 API Key 时才添加 Authorization header
    if (this.apiKey && this.apiKey !== 'sk-no-key-required') {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI Compatible API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const choice = data.choices?.[0]
    const message = choice?.message

    let finishReason: ChatResponse['finishReason'] = 'error'
    if (choice?.finish_reason === 'stop') {
      finishReason = 'stop'
    } else if (choice?.finish_reason === 'length') {
      finishReason = 'length'
    } else if (choice?.finish_reason === 'tool_calls') {
      finishReason = 'tool_calls'
    }

    let toolCalls: ToolCall[] | undefined
    if (message?.tool_calls && Array.isArray(message.tool_calls)) {
      toolCalls = message.tool_calls.map((tc: Record<string, unknown>) => ({
        id: tc.id as string,
        type: 'function' as const,
        function: {
          name: (tc.function as Record<string, unknown>)?.name as string,
          arguments: (tc.function as Record<string, unknown>)?.arguments as string,
        },
      }))
    }

    return {
      content: message?.content || '',
      finishReason,
      tool_calls: toolCalls,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    }
  }

  async *chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<ChatStreamChunk> {
    const requestBody: Record<string, unknown> = {
      model: this.model,
      messages: messages.map((m) => {
        const msg: Record<string, unknown> = { role: m.role, content: m.content }
        if (m.role === 'tool' && m.tool_call_id) {
          msg.tool_call_id = m.tool_call_id
        }
        if (m.role === 'assistant' && m.tool_calls) {
          msg.tool_calls = m.tool_calls
        }
        return msg
      }),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    }

    if (options?.tools && options.tools.length > 0) {
      requestBody.tools = options.tools
    }

    // 禁用思考模式（用于 Qwen3、DeepSeek-R1 等本地模型）
    if (this.disableThinking) {
      requestBody.chat_template_kwargs = { enable_thinking: false }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey && this.apiKey !== 'sk-no-key-required') {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI Compatible API error: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response reader')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    const toolCallsAccumulator: Map<number, { id: string; name: string; arguments: string }> = new Map()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            if (toolCallsAccumulator.size > 0) {
              const toolCalls: ToolCall[] = Array.from(toolCallsAccumulator.values()).map((tc) => ({
                id: tc.id,
                type: 'function' as const,
                function: {
                  name: tc.name,
                  arguments: tc.arguments,
                },
              }))
              yield { content: '', isFinished: true, finishReason: 'tool_calls', tool_calls: toolCalls }
            } else {
              yield { content: '', isFinished: true, finishReason: 'stop' }
            }
            return
          }

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta
            const finishReason = parsed.choices?.[0]?.finish_reason

            if (delta?.content) {
              yield {
                content: delta.content,
                isFinished: false,
              }
            }

            if (delta?.tool_calls && Array.isArray(delta.tool_calls)) {
              for (const tc of delta.tool_calls) {
                const index = tc.index ?? 0
                const existing = toolCallsAccumulator.get(index)
                if (existing) {
                  if (tc.function?.arguments) {
                    existing.arguments += tc.function.arguments
                  }
                } else {
                  toolCallsAccumulator.set(index, {
                    id: tc.id || '',
                    name: tc.function?.name || '',
                    arguments: tc.function?.arguments || '',
                  })
                }
              }
            }

            if (finishReason) {
              let reason: ChatStreamChunk['finishReason'] = 'error'
              if (finishReason === 'stop') {
                reason = 'stop'
              } else if (finishReason === 'length') {
                reason = 'length'
              } else if (finishReason === 'tool_calls') {
                reason = 'tool_calls'
              }

              if (toolCallsAccumulator.size > 0) {
                const toolCalls: ToolCall[] = Array.from(toolCallsAccumulator.values()).map((tc) => ({
                  id: tc.id,
                  type: 'function' as const,
                  function: {
                    name: tc.name,
                    arguments: tc.arguments,
                  },
                }))
                yield { content: '', isFinished: true, finishReason: reason, tool_calls: toolCalls }
              } else {
                yield { content: '', isFinished: true, finishReason: reason }
              }
              return
            }
          } catch {
            // 忽略解析错误，继续处理下一行
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const headers: Record<string, string> = {}
      if (this.apiKey && this.apiKey !== 'sk-no-key-required') {
        headers['Authorization'] = `Bearer ${this.apiKey}`
      }

      // 尝试调用 models 端点验证连接
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers,
      })

      // 对于本地服务，即使返回 401 也可能是正常的（不需要认证）
      // 所以我们主要检查服务是否可达
      return response.ok || response.status === 401
    } catch {
      return false
    }
  }
}
