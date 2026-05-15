/**
 * 工具注册表
 *
 * MCP_TOOL_REGISTRY: MCP Server 专用，包含会话发现等 MCP 特有工具。
 * AGENT_TOOL_REGISTRY: Agent 共用（Server Agent / Electron Agent），
 *   与 Electron TOOL_REGISTRY 保持一致的完整工具集。
 */

import type { ToolDefinition } from './types'

import { searchTool } from './definitions/search'
import { memberStatsTool } from './definitions/member-stats'
import { timeStatsTool } from './definitions/time-stats'
import { recentMessagesTool } from './definitions/recent-messages'
import { sqlQueryTool, schemaTool } from './definitions/sql-query'
import { sessionInfoTool } from './definitions/session-info'
import { sessionsListTool } from './definitions/sessions'
import { chatOverviewTool } from './definitions/chat-overview'
import { searchMessagesTool } from './definitions/search-messages'
import { deepSearchMessagesTool } from './definitions/deep-search-messages'
import { getMessageContextTool } from './definitions/get-message-context'
import { searchSessionsTool } from './definitions/search-sessions'
import { getSessionMessagesTool } from './definitions/get-session-messages'
import { getMembersTool } from './definitions/get-members'
import { getMemberNameHistoryTool } from './definitions/get-member-name-history'
import { getConversationBetweenTool } from './definitions/get-conversation-between'
import { getSessionSummariesTool } from './definitions/get-session-summaries'
import { responseTimeAnalysisTool } from './definitions/response-time-analysis'
import { keywordFrequencyTool } from './definitions/keyword-frequency'
import { SQL_TOOL_DEFS, createAllSqlToolDefinitions } from './sql'

/**
 * MCP Server 专用注册表
 *
 * 包含会话发现/管理工具（list_sessions、get_session_info）和简化搜索（search_keyword），
 * 这些工具在 Agent 上下文中不适用（Agent 已有选定的会话和更完整的搜索工具）。
 */
export const MCP_TOOL_REGISTRY: ToolDefinition[] = [
  sessionsListTool,
  sessionInfoTool,
  searchTool,
  memberStatsTool,
  timeStatsTool,
  recentMessagesTool,
  sqlQueryTool,
  schemaTool,
]

/**
 * Agent 共用注册表
 *
 * 与 Electron TOOL_REGISTRY 完全对齐的工具集，在"已选定会话"上下文中使用。
 * 不包含 MCP 特有的会话发现工具（list_sessions、get_session_info、search_keyword）。
 * 额外包含 execute_sql 作为通用自定义 SQL 查询能力。
 */
export const AGENT_TOOL_REGISTRY: ToolDefinition[] = [
  // Core
  chatOverviewTool,
  searchMessagesTool,
  deepSearchMessagesTool,
  recentMessagesTool,
  getMessageContextTool,
  searchSessionsTool,
  getSessionMessagesTool,
  getMembersTool,

  // Analysis
  memberStatsTool,
  timeStatsTool,
  getMemberNameHistoryTool,
  getConversationBetweenTool,
  getSessionSummariesTool,
  responseTimeAnalysisTool,
  keywordFrequencyTool,

  // SQL
  sqlQueryTool,
  ...createAllSqlToolDefinitions(SQL_TOOL_DEFS),
]

/**
 * 按名称查找工具（在所有注册表中查找）
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return AGENT_TOOL_REGISTRY.find((t) => t.name === name) || MCP_TOOL_REGISTRY.find((t) => t.name === name)
}
