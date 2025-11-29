<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  MemberActivity,
  MemberNameHistory,
  RepeatAnalysis,
  CatchphraseAnalysis,
  DragonKingAnalysis,
  MonologueAnalysis,
  MentionAnalysis,
  MemberMentionDetail,
} from '@/types/chat'
import { RankListPro, BarChart, ListPro } from '@/components/charts'
import type { RankItem, BarChartData } from '@/components/charts'
import { SectionCard, EmptyState, LoadingState } from '@/components/UI'
import { formatDate, formatDateTime, formatPeriod } from '@/utils'

interface TimeFilter {
  startTs?: number
  endTs?: number
}

const props = defineProps<{
  sessionId: string
  memberActivity: MemberActivity[]
  timeFilter?: TimeFilter
}>()

// ==================== 龙王分析 ====================
const dragonKingAnalysis = ref<DragonKingAnalysis | null>(null)
const isLoadingDragonKing = ref(false)

async function loadDragonKingAnalysis() {
  if (!props.sessionId) return
  isLoadingDragonKing.value = true
  try {
    dragonKingAnalysis.value = await window.chatApi.getDragonKingAnalysis(props.sessionId, props.timeFilter)
  } catch (error) {
    console.error('加载龙王分析失败:', error)
  } finally {
    isLoadingDragonKing.value = false
  }
}

const dragonKingRankData = computed<RankItem[]>(() => {
  if (!dragonKingAnalysis.value) return []
  return dragonKingAnalysis.value.rank.map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: m.count,
    percentage: m.percentage,
  }))
})

// ==================== 自言自语分析 ====================
const monologueAnalysis = ref<MonologueAnalysis | null>(null)
const isLoadingMonologue = ref(false)

async function loadMonologueAnalysis() {
  if (!props.sessionId) return
  isLoadingMonologue.value = true
  try {
    monologueAnalysis.value = await window.chatApi.getMonologueAnalysis(props.sessionId, props.timeFilter)
  } catch (error) {
    console.error('加载自言自语分析失败:', error)
  } finally {
    isLoadingMonologue.value = false
  }
}

function getComboLabel(maxCombo: number): { text: string; color: string } {
  if (maxCombo >= 10) return { text: '无人区广播', color: 'text-red-600 dark:text-red-400' }
  if (maxCombo >= 5) return { text: '小作文达人', color: 'text-yellow-600 dark:text-yellow-400' }
  return { text: '加特林模式', color: 'text-green-600 dark:text-green-400' }
}

const maxTotalStreaks = computed(() => {
  if (!monologueAnalysis.value || monologueAnalysis.value.rank.length === 0) return 1
  return monologueAnalysis.value.rank[0].totalStreaks
})

// ==================== 复读分析 ====================
const repeatAnalysis = ref<RepeatAnalysis | null>(null)
const isLoadingRepeat = ref(false)
const repeatRankMode = ref<'count' | 'rate'>('rate')

const originatorRankData = computed<RankItem[]>(() => {
  if (!repeatAnalysis.value) return []
  const data =
    repeatRankMode.value === 'count' ? repeatAnalysis.value.originators : repeatAnalysis.value.originatorRates
  return data.map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: (m as any).count,
    percentage: repeatRankMode.value === 'count' ? (m as any).percentage : (m as any).rate,
  }))
})

const initiatorRankData = computed<RankItem[]>(() => {
  if (!repeatAnalysis.value) return []
  const data = repeatRankMode.value === 'count' ? repeatAnalysis.value.initiators : repeatAnalysis.value.initiatorRates
  return data.map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: (m as any).count,
    percentage: repeatRankMode.value === 'count' ? (m as any).percentage : (m as any).rate,
  }))
})

const breakerRankData = computed<RankItem[]>(() => {
  if (!repeatAnalysis.value) return []
  const data = repeatRankMode.value === 'count' ? repeatAnalysis.value.breakers : repeatAnalysis.value.breakerRates
  return data.map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: (m as any).count,
    percentage: repeatRankMode.value === 'count' ? (m as any).percentage : (m as any).rate,
  }))
})

const chainLengthChartData = computed<BarChartData>(() => {
  if (!repeatAnalysis.value) return { labels: [], values: [] }
  const distribution = repeatAnalysis.value.chainLengthDistribution
  return {
    labels: distribution.map((d) => `${d.length}人`),
    values: distribution.map((d) => d.count),
  }
})

async function loadRepeatAnalysis() {
  if (!props.sessionId) return
  isLoadingRepeat.value = true
  try {
    repeatAnalysis.value = await window.chatApi.getRepeatAnalysis(props.sessionId, props.timeFilter)
  } catch (error) {
    console.error('加载复读分析失败:', error)
  } finally {
    isLoadingRepeat.value = false
  }
}

function truncateContent(content: string, maxLength = 30): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}

// ==================== 口头禅分析 ====================
const catchphraseAnalysis = ref<CatchphraseAnalysis | null>(null)
const isLoadingCatchphrase = ref(false)

async function loadCatchphraseAnalysis() {
  if (!props.sessionId) return
  isLoadingCatchphrase.value = true
  try {
    catchphraseAnalysis.value = await window.chatApi.getCatchphraseAnalysis(props.sessionId, props.timeFilter)
  } catch (error) {
    console.error('加载口头禅分析失败:', error)
  } finally {
    isLoadingCatchphrase.value = false
  }
}

// 成员活跃度排行数据
const memberRankData = computed<RankItem[]>(() => {
  return props.memberActivity.map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: m.messageCount,
    percentage: m.percentage,
  }))
})

// ==================== @ 互动分析 ====================
const mentionAnalysis = ref<MentionAnalysis | null>(null)
const isLoadingMention = ref(false)
const selectedMemberDetail = ref<MemberMentionDetail | null>(null)
const showMemberDetailModal = ref(false)

async function loadMentionAnalysis() {
  if (!props.sessionId) return
  isLoadingMention.value = true
  try {
    mentionAnalysis.value = await window.chatApi.getMentionAnalysis(props.sessionId, props.timeFilter)
  } catch (error) {
    console.error('加载 @ 互动分析失败:', error)
  } finally {
    isLoadingMention.value = false
  }
}

const mentionerRankData = computed<RankItem[]>(() => {
  if (!mentionAnalysis.value) return []
  return mentionAnalysis.value.topMentioners.map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: m.count,
    percentage: m.percentage,
  }))
})

const mentionedRankData = computed<RankItem[]>(() => {
  if (!mentionAnalysis.value) return []
  return mentionAnalysis.value.topMentioned.map((m) => ({
    id: m.memberId.toString(),
    name: m.name,
    value: m.count,
    percentage: m.percentage,
  }))
})

function openMemberDetail(memberId: number) {
  if (!mentionAnalysis.value) return
  const detail = mentionAnalysis.value.memberDetails.find((d) => d.memberId === memberId)
  if (detail) {
    selectedMemberDetail.value = detail
    showMemberDetailModal.value = true
  }
}

// ==================== 昵称变更记录 ====================
interface MemberWithHistory {
  memberId: number
  name: string
  history: MemberNameHistory[]
}

const membersWithNicknameChanges = ref<MemberWithHistory[]>([])
const isLoadingHistory = ref(false)

async function loadMembersWithNicknameChanges() {
  if (!props.sessionId || props.memberActivity.length === 0) return

  isLoadingHistory.value = true
  const membersWithChanges: MemberWithHistory[] = []

  try {
    const historyPromises = props.memberActivity.map((member) =>
      window.chatApi.getMemberNameHistory(props.sessionId, member.memberId)
    )

    const allHistories = await Promise.all(historyPromises)

    props.memberActivity.forEach((member, index) => {
      const history = allHistories[index]
      if (history.length > 1) {
        membersWithChanges.push({
          memberId: member.memberId,
          name: member.name,
          history,
        })
      }
    })

    membersWithNicknameChanges.value = membersWithChanges
  } catch (error) {
    console.error('加载昵称变更记录失败:', error)
  } finally {
    isLoadingHistory.value = false
  }
}

watch(
  () => [props.sessionId, props.memberActivity.length],
  () => {
    loadMembersWithNicknameChanges()
  },
  { immediate: true }
)

watch(
  () => [props.sessionId, props.timeFilter],
  () => {
    loadDragonKingAnalysis()
    loadMonologueAnalysis()
    loadRepeatAnalysis()
    loadCatchphraseAnalysis()
    loadMentionAnalysis()
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div class="space-y-6">
    <!-- 成员活跃度排行 -->
    <RankListPro :members="memberRankData" title="成员活跃度排行" />

    <!-- 龙王排名 -->
    <LoadingState v-if="isLoadingDragonKing" text="正在统计龙王数据..." />
    <RankListPro
      v-else-if="dragonKingRankData.length > 0"
      :members="dragonKingRankData"
      title="🐉 龙王排名"
      :description="`每天发言最多的人+1（共 ${dragonKingAnalysis?.totalDays ?? 0} 天）`"
      unit="天"
    />

    <!-- 自言自语榜 -->
    <SectionCard title="🎤 自言自语榜" description="连续发言 ≥3 条（间隔 ≤5 分钟）统计">
      <LoadingState v-if="isLoadingMonologue" text="正在统计自言自语数据..." />

      <template v-else-if="monologueAnalysis && monologueAnalysis.rank.length > 0">
        <!-- 最高纪录卡片 -->
        <div
          v-if="monologueAnalysis.maxComboRecord"
          class="mx-5 mt-4 rounded-lg bg-linear-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-900/20 dark:to-orange-900/20"
        >
          <div class="flex items-center gap-2">
            <span class="text-2xl">🏆</span>
            <span class="font-semibold text-gray-900 dark:text-white">历史最高连击纪录</span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-lg font-bold text-amber-600 dark:text-amber-400">
              {{ monologueAnalysis.maxComboRecord.memberName }}
            </span>
            <span class="text-sm text-gray-500">在</span>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ formatDateTime(monologueAnalysis.maxComboRecord.startTs) }}
            </span>
            <span class="text-sm text-gray-500">达成了</span>
            <span class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ monologueAnalysis.maxComboRecord.comboLength }} 连击！
            </span>
          </div>
        </div>

        <!-- 排行榜 -->
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="(member, index) in monologueAnalysis.rank.slice(0, 10)"
            :key="member.memberId"
            class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <!-- 排名 -->
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              :class="
                index === 0
                  ? 'bg-linear-to-r from-amber-400 to-orange-500 text-white'
                  : index === 1
                    ? 'bg-linear-to-r from-gray-300 to-gray-400 text-white'
                    : index === 2
                      ? 'bg-linear-to-r from-amber-600 to-amber-700 text-white'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              "
            >
              {{ index + 1 }}
            </div>

            <!-- 名字 + 标签 -->
            <div class="w-32 shrink-0">
              <p class="truncate font-medium text-gray-900 dark:text-white">
                {{ member.name }}
              </p>
              <p class="text-xs" :class="getComboLabel(member.maxCombo).color">
                {{ getComboLabel(member.maxCombo).text }}
              </p>
            </div>

            <!-- 三色能量条 -->
            <div class="flex flex-1 items-center">
              <div class="h-4 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  class="flex h-full overflow-hidden rounded-full"
                  :style="{ width: `${(member.totalStreaks / maxTotalStreaks) * 100}%` }"
                >
                  <div
                    v-if="member.lowStreak > 0"
                    class="h-full bg-green-500"
                    :style="{ width: `${(member.lowStreak / member.totalStreaks) * 100}%` }"
                    :title="`3-4句: ${member.lowStreak}次`"
                  />
                  <div
                    v-if="member.midStreak > 0"
                    class="h-full bg-yellow-500"
                    :style="{ width: `${(member.midStreak / member.totalStreaks) * 100}%` }"
                    :title="`5-9句: ${member.midStreak}次`"
                  />
                  <div
                    v-if="member.highStreak > 0"
                    class="h-full bg-red-500"
                    :style="{ width: `${(member.highStreak / member.totalStreaks) * 100}%` }"
                    :title="`10+句: ${member.highStreak}次`"
                  />
                </div>
              </div>
            </div>

            <!-- 统计数据 -->
            <div class="shrink-0 text-right">
              <div class="text-lg font-bold text-gray-900 dark:text-white">{{ member.totalStreaks }} 次</div>
              <div class="flex items-center justify-end gap-1 text-xs text-gray-500">
                <span>Max</span>
                <span class="font-semibold text-pink-600 dark:text-pink-400">{{ member.maxCombo }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 图例 -->
        <div class="flex items-center justify-center gap-6 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
          <div class="flex items-center gap-1.5">
            <div class="h-3 w-3 rounded-full bg-green-500" />
            <span class="text-xs text-gray-500">3-4句</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="h-3 w-3 rounded-full bg-yellow-500" />
            <span class="text-xs text-gray-500">5-9句</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="h-3 w-3 rounded-full bg-red-500" />
            <span class="text-xs text-gray-500">10+句</span>
          </div>
        </div>
      </template>

      <EmptyState v-else text="暂无自言自语数据" />
    </SectionCard>

    <!-- 昵称变更记录 -->
    <SectionCard
      title="昵称变更记录"
      :description="
        isLoadingHistory
          ? '加载中...'
          : membersWithNicknameChanges.length > 0
            ? `${membersWithNicknameChanges.length} 位成员曾修改过昵称`
            : '暂无成员修改昵称'
      "
    >
      <div
        v-if="!isLoadingHistory && membersWithNicknameChanges.length > 0"
        class="divide-y divide-gray-100 dark:divide-gray-800"
      >
        <div
          v-for="member in membersWithNicknameChanges"
          :key="member.memberId"
          class="flex items-start gap-3 px-5 py-3"
        >
          <div class="w-32 shrink-0 pt-0.5 font-medium text-gray-900 dark:text-white">
            {{ member.name }}
          </div>

          <div class="flex flex-1 flex-wrap items-center gap-2">
            <template v-for="(item, index) in member.history" :key="index">
              <div class="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-gray-800">
                <span
                  class="text-sm"
                  :class="item.endTs === null ? 'font-semibold text-pink-600' : 'text-gray-700 dark:text-gray-300'"
                >
                  {{ item.name }}
                </span>
                <UBadge v-if="item.endTs === null" color="primary" variant="soft" size="xs">当前</UBadge>
                <span class="text-xs text-gray-400">({{ formatPeriod(item.startTs, item.endTs) }})</span>
              </div>

              <span v-if="index < member.history.length - 1" class="text-gray-300 dark:text-gray-600">→</span>
            </template>
          </div>
        </div>
      </div>

      <EmptyState v-else-if="!isLoadingHistory" text="该群组所有成员均未修改过昵称" />

      <LoadingState v-else text="正在加载昵称变更记录..." />
    </SectionCard>

    <!-- 复读分析模块 -->
    <SectionCard
      title="复读分析"
      :description="
        isLoadingRepeat
          ? '加载中...'
          : repeatAnalysis
            ? `共检测到 ${repeatAnalysis.totalRepeatChains} 次复读，平均复读链长度 ${repeatAnalysis.avgChainLength} 人`
            : '暂无复读数据'
      "
    >
      <template #headerRight>
        <div v-if="repeatAnalysis && repeatAnalysis.totalRepeatChains > 0" class="flex gap-1">
          <UButton
            size="xs"
            :variant="repeatRankMode === 'rate' ? 'solid' : 'ghost'"
            :color="repeatRankMode === 'rate' ? 'primary' : 'gray'"
            @click="repeatRankMode = 'rate'"
          >
            按复读率
          </UButton>
          <UButton
            size="xs"
            :variant="repeatRankMode === 'count' ? 'solid' : 'ghost'"
            :color="repeatRankMode === 'count' ? 'primary' : 'gray'"
            @click="repeatRankMode = 'count'"
          >
            按次数
          </UButton>
        </div>
      </template>

      <LoadingState v-if="isLoadingRepeat" text="正在分析复读数据..." />

      <div v-else-if="repeatAnalysis && repeatAnalysis.totalRepeatChains > 0" class="space-y-6 p-5">
        <!-- 复读链长度分布 & 最火复读内容 -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- 复读链长度分布 -->
          <div class="rounded-lg border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
            <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">📊 复读链长度分布</h4>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">每次复读有多少人参与</p>
            </div>
            <div class="p-4">
              <BarChart v-if="chainLengthChartData.labels.length > 0" :data="chainLengthChartData" :height="200" />
              <EmptyState v-else padding="md" />
            </div>
          </div>

          <!-- 最长复读链 TOP 10 -->
          <div class="rounded-lg border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
            <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">🏆 最长复读链 TOP 10</h4>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">单次复读参与人数最多的内容</p>
            </div>
            <div v-if="repeatAnalysis.hotContents.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800">
              <div
                v-for="(item, index) in repeatAnalysis.hotContents"
                :key="index"
                class="flex items-center gap-3 px-4 py-3"
              >
                <span
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  :class="
                    index === 0
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      : index === 1
                        ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        : index === 2
                          ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                  "
                >
                  {{ index + 1 }}
                </span>
                <span class="shrink-0 text-lg font-bold text-pink-600">{{ item.maxChainLength }}人</span>
                <div class="flex flex-1 items-center gap-1 overflow-hidden text-sm">
                  <span class="shrink-0 font-medium text-gray-900 dark:text-white">{{ item.originatorName }}：</span>
                  <span class="truncate text-gray-600 dark:text-gray-400" :title="item.content">
                    {{ truncateContent(item.content) }}
                  </span>
                </div>
                <div class="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                  <span>{{ item.count }} 次</span>
                  <span class="text-gray-300 dark:text-gray-600">|</span>
                  <span>{{ formatDate(item.lastTs) }}</span>
                </div>
              </div>
            </div>
            <EmptyState v-else padding="md" />
          </div>
        </div>

        <!-- 复读排行榜 -->
        <RankListPro
          v-if="originatorRankData.length > 0"
          :members="originatorRankData"
          title="🎯 谁的聊天最容易产生复读"
          :description="repeatRankMode === 'rate' ? '被复读次数 / 总发言数' : '发出的消息被别人复读的次数'"
          unit="次"
        />

        <RankListPro
          v-if="initiatorRankData.length > 0"
          :members="initiatorRankData"
          title="🔥 谁最喜欢挑起复读"
          :description="repeatRankMode === 'rate' ? '挑起复读次数 / 总发言数' : '第二个发送相同消息、带起节奏的人'"
          unit="次"
        />

        <RankListPro
          v-if="breakerRankData.length > 0"
          :members="breakerRankData"
          title="✂️ 谁喜欢打断复读"
          :description="repeatRankMode === 'rate' ? '打断复读次数 / 总发言数' : '终结复读链的人'"
          unit="次"
        />
      </div>

      <EmptyState v-else text="该群组暂无复读记录" />
    </SectionCard>

    <!-- 口头禅分析模块 -->
    <LoadingState v-if="isLoadingCatchphrase" text="正在分析口头禅数据..." />

    <ListPro
      v-else-if="catchphraseAnalysis && catchphraseAnalysis.members.length > 0"
      :items="catchphraseAnalysis.members"
      title="💬 口头禅分析"
      :description="`分析了 ${catchphraseAnalysis.members.length} 位成员的高频发言`"
      countTemplate="共 {count} 位成员"
    >
      <template #item="{ item: member }">
        <div class="flex items-start gap-4">
          <div class="w-28 shrink-0 pt-1 font-medium text-gray-900 dark:text-white">
            {{ member.name }}
          </div>

          <div class="flex flex-1 flex-wrap items-center gap-2">
            <div
              v-for="(phrase, index) in member.catchphrases"
              :key="index"
              class="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
              :class="
                index === 0
                  ? 'bg-amber-50 dark:bg-amber-900/20'
                  : index === 1
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'bg-gray-50 dark:bg-gray-800/50'
              "
            >
              <span
                class="text-sm"
                :class="
                  index === 0 ? 'font-medium text-amber-700 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'
                "
                :title="phrase.content"
              >
                {{ truncateContent(phrase.content, 20) }}
              </span>
              <span class="text-xs text-gray-400">{{ phrase.count }}次</span>
            </div>
          </div>
        </div>
      </template>
    </ListPro>

    <SectionCard v-else title="💬 口头禅分析">
      <EmptyState text="暂无口头禅数据" />
    </SectionCard>

    <!-- @ 互动分析模块 -->
    <LoadingState v-if="isLoadingMention" text="正在分析 @ 互动数据..." />

    <template v-else-if="mentionAnalysis && mentionAnalysis.totalMentions > 0">
      <!-- @ 排行榜 -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RankListPro
          v-if="mentionerRankData.length > 0"
          :members="mentionerRankData"
          title="📢 谁最喜欢 @ 别人"
          :description="`共 ${mentionAnalysis.totalMentions} 次 @`"
          unit="次"
        />

        <RankListPro
          v-if="mentionedRankData.length > 0"
          :members="mentionedRankData"
          title="🎯 谁最常被 @"
          description="群里的人气王"
          unit="次"
        />
      </div>

      <!-- 单向关注（舔狗检测） -->
      <SectionCard
        v-if="mentionAnalysis.oneWay.length > 0"
        title="🐕 单向关注检测"
        :description="`发现 ${mentionAnalysis.oneWay.length} 对单向关注关系（一方 @ 另一方占比 ≥80%）`"
      >
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="(pair, index) in mentionAnalysis.oneWay.slice(0, 10)"
            :key="index"
            class="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <!-- 排名 -->
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              :class="
                index === 0
                  ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
              "
            >
              {{ index + 1 }}
            </span>

            <!-- 关系展示 -->
            <div class="flex flex-1 items-center gap-2">
              <button
                class="font-medium text-gray-900 hover:text-pink-600 dark:text-white dark:hover:text-pink-600"
                @click="openMemberDetail(pair.fromMemberId)"
              >
                {{ pair.fromName }}
              </button>
              <div class="flex items-center gap-1 text-pink-500">
                <span class="text-lg">→</span>
                <span class="text-xs">{{ pair.fromToCount }}次</span>
              </div>
              <button
                class="font-medium text-gray-900 hover:text-pink-600 dark:text-white dark:hover:text-pink-600"
                @click="openMemberDetail(pair.toMemberId)"
              >
                {{ pair.toName }}
              </button>
            </div>

            <!-- 反向数据 -->
            <div class="shrink-0 text-right text-sm text-gray-500">
              <span v-if="pair.toFromCount === 0" class="text-red-500">从不回应</span>
              <span v-else>反向 {{ pair.toFromCount }} 次</span>
            </div>

            <!-- 单向比例标签 -->
            <UBadge color="pink" variant="soft" size="xs">{{ Math.round(pair.ratio * 100) }}% 单向</UBadge>
          </div>
        </div>
      </SectionCard>

      <!-- 双向奔赴（CP检测） -->
      <SectionCard
        v-if="mentionAnalysis.twoWay.length > 0"
        title="💕 双向奔赴检测"
        :description="`发现 ${mentionAnalysis.twoWay.length} 对互动频繁的 CP（互相 @ 且平衡度 ≥30%）`"
      >
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="(pair, index) in mentionAnalysis.twoWay.slice(0, 10)"
            :key="index"
            class="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <!-- 排名 -->
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              :class="
                index === 0
                  ? 'bg-linear-to-r from-pink-400 to-red-400 text-white'
                  : index === 1
                    ? 'bg-linear-to-r from-pink-300 to-red-300 text-white'
                    : index === 2
                      ? 'bg-linear-to-r from-pink-200 to-red-200 text-pink-700'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
              "
            >
              {{ index + 1 }}
            </span>

            <!-- CP 关系展示 -->
            <div class="flex flex-1 items-center gap-2">
              <button
                class="font-medium text-gray-900 hover:text-pink-600 dark:text-white dark:hover:text-pink-600"
                @click="openMemberDetail(pair.member1Id)"
              >
                {{ pair.member1Name }}
              </button>
              <div class="flex items-center gap-1">
                <span class="text-xs text-gray-400">{{ pair.member1To2 }}</span>
                <span class="text-lg text-pink-500">⇄</span>
                <span class="text-xs text-gray-400">{{ pair.member2To1 }}</span>
              </div>
              <button
                class="font-medium text-gray-900 hover:text-pink-600 dark:text-white dark:hover:text-pink-600"
                @click="openMemberDetail(pair.member2Id)"
              >
                {{ pair.member2Name }}
              </button>
            </div>

            <!-- 总互动次数 -->
            <div class="shrink-0 text-right">
              <span class="text-lg font-bold text-pink-600">{{ pair.total }}</span>
              <span class="ml-1 text-sm text-gray-500">次互动</span>
            </div>

            <!-- 平衡度标签 -->
            <UBadge
              :color="pair.balance >= 0.7 ? 'green' : pair.balance >= 0.5 ? 'blue' : 'gray'"
              variant="soft"
              size="xs"
            >
              {{ Math.round(pair.balance * 100) }}% 平衡
            </UBadge>
          </div>
        </div>
      </SectionCard>
    </template>

    <SectionCard v-else-if="!isLoadingMention" title="📱 @ 互动分析">
      <EmptyState text="暂无 @ 互动数据" />
    </SectionCard>

    <!-- 成员 @ 详情弹窗 -->
    <UModal v-model:open="showMemberDetailModal">
      <template #content>
        <div v-if="selectedMemberDetail" class="p-5">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {{ selectedMemberDetail.name }} 的 @ 关系
          </h3>

          <!-- 该成员最常 @ 的人 -->
          <div v-if="selectedMemberDetail.topMentioned.length > 0" class="mb-4">
            <h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">最常 @ 的人</h4>
            <div class="space-y-2">
              <div
                v-for="(item, index) in selectedMemberDetail.topMentioned"
                :key="index"
                class="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
              >
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ item.toName }}
                </span>
                <span class="text-xs text-gray-500">{{ item.count }} 次</span>
              </div>
            </div>
          </div>

          <!-- 最常 @ 该成员的人 -->
          <div v-if="selectedMemberDetail.topMentioners.length > 0">
            <h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">最常 @ TA 的人</h4>
            <div class="space-y-2">
              <div
                v-for="(item, index) in selectedMemberDetail.topMentioners"
                :key="index"
                class="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
              >
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ item.fromName }}
                </span>
                <span class="text-xs text-gray-500">{{ item.count }} 次</span>
              </div>
            </div>
          </div>

          <div class="mt-4 flex justify-end">
            <UButton color="gray" variant="soft" @click="showMemberDetailModal = false">关闭</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
