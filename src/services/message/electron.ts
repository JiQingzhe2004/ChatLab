/**
 * ElectronMessageAdapter — wrap window.aiApi 消息查询方法
 */

import type { MessageAdapter, TimeFilter, PaginatedMessages, MessageRecord, SearchResult } from './types'

export class ElectronMessageAdapter implements MessageAdapter {
  async getMessagesBefore(
    sessionId: string,
    beforeId: number,
    limit: number,
    filter?: TimeFilter,
    senderId?: number,
    keywords?: string[]
  ): Promise<PaginatedMessages> {
    return window.aiApi.getMessagesBefore(sessionId, beforeId, limit, filter, senderId, keywords)
  }

  async getMessagesAfter(
    sessionId: string,
    afterId: number,
    limit: number,
    filter?: TimeFilter,
    senderId?: number,
    keywords?: string[]
  ): Promise<PaginatedMessages> {
    return window.aiApi.getMessagesAfter(sessionId, afterId, limit, filter, senderId, keywords)
  }

  async getMessageContext(
    sessionId: string,
    messageIds: number | number[],
    contextSize?: number
  ): Promise<MessageRecord[]> {
    return window.aiApi.getMessageContext(sessionId, messageIds, contextSize)
  }

  async searchMessages(
    sessionId: string,
    keywords: string[],
    filter?: TimeFilter,
    limit?: number,
    offset?: number,
    senderId?: number
  ): Promise<SearchResult> {
    return window.aiApi.searchMessages(sessionId, keywords, filter, limit, offset, senderId)
  }

  async getAllRecentMessages(sessionId: string, filter?: TimeFilter, limit?: number): Promise<SearchResult> {
    return window.aiApi.getAllRecentMessages(sessionId, filter, limit)
  }
}
