<script setup lang="ts">
import { ref } from 'vue'

// 表单数据
const formData = ref({
  name: '',
  email: '',
  message: '',
})

// 开关状态
const isDarkMode = ref(false)
const isEnabled = ref(true)

// 下拉选择
const selectedOption = ref('')
const options = [
  { label: '选项一', value: 'option1' },
  { label: '选项二', value: 'option2' },
  { label: '选项三', value: 'option3' },
]

// 标签页
const activeTab = ref('tab1')
const tabs = [
  { label: '概览', value: 'tab1' },
  { label: '分析', value: 'tab2' },
  { label: '设置', value: 'tab3' },
]

// Toast 通知
const toast = useToast()

const showToast = (type: 'success' | 'error' | 'warning' | 'info') => {
  const messages = {
    success: '操作成功！',
    error: '操作失败，请重试',
    warning: '请注意此操作',
    info: '这是一条提示信息',
  }
  toast.add({
    title: messages[type],
    color: type === 'error' ? 'red' : type === 'warning' ? 'yellow' : type === 'success' ? 'green' : 'blue',
  })
}

// 模态框
const isModalOpen = ref(false)

// 加载状态
const isLoading = ref(false)
const handleSubmit = async () => {
  isLoading.value = true
  await new Promise((resolve) => setTimeout(resolve, 2000))
  isLoading.value = false
  toast.add({ title: '表单提交成功！', color: 'green' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <!-- 标题区域 -->
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          🎉 Nuxt UI 组件演示
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400">
          ChatLens - 聊天记录分析工具
        </p>
      </div>

      <!-- 按钮组 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">按钮 Buttons</h2>
        <div class="flex flex-wrap gap-4">
          <UButton>默认按钮</UButton>
          <UButton color="primary">主要按钮</UButton>
          <UButton color="green">成功按钮</UButton>
          <UButton color="red">危险按钮</UButton>
          <UButton color="yellow">警告按钮</UButton>
          <UButton variant="outline">描边按钮</UButton>
          <UButton variant="ghost">幽灵按钮</UButton>
          <UButton variant="soft">柔和按钮</UButton>
          <UButton :loading="isLoading" @click="handleSubmit">
            {{ isLoading ? '加载中...' : '带加载状态' }}
          </UButton>
          <UButton icon="i-heroicons-arrow-path" />
        </div>
      </section>

      <!-- 表单输入 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">表单 Forms</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <UFormField label="用户名">
            <UInput v-model="formData.name" placeholder="请输入用户名" />
          </UFormField>
          <UFormField label="邮箱">
            <UInput v-model="formData.email" type="email" placeholder="请输入邮箱" />
          </UFormField>
          <UFormField label="选择选项" class="md:col-span-2">
            <USelect v-model="selectedOption" :items="options" placeholder="请选择" />
          </UFormField>
          <UFormField label="留言" class="md:col-span-2">
            <UTextarea v-model="formData.message" placeholder="请输入留言内容" :rows="4" />
          </UFormField>
        </div>
      </section>

      <!-- 开关与复选框 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">开关 Toggles</h2>
        <div class="flex flex-wrap items-center gap-8">
          <div class="flex items-center gap-3">
            <USwitch v-model="isDarkMode" />
            <span class="text-gray-700 dark:text-gray-300">深色模式: {{ isDarkMode ? '开' : '关' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <USwitch v-model="isEnabled" color="green" />
            <span class="text-gray-700 dark:text-gray-300">启用功能: {{ isEnabled ? '是' : '否' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <UCheckbox label="记住我" />
          </div>
        </div>
      </section>

      <!-- 标签页 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">标签页 Tabs</h2>
        <UTabs v-model="activeTab" :items="tabs" class="w-full max-w-xl">
          <template #tab1>
            <div class="p-4 bg-white dark:bg-gray-800 rounded-lg">
              <h3 class="font-medium text-gray-900 dark:text-white mb-2">概览内容</h3>
              <p class="text-gray-600 dark:text-gray-400">这里是概览页面的内容区域。</p>
            </div>
          </template>
          <template #tab2>
            <div class="p-4 bg-white dark:bg-gray-800 rounded-lg">
              <h3 class="font-medium text-gray-900 dark:text-white mb-2">分析内容</h3>
              <p class="text-gray-600 dark:text-gray-400">这里是分析页面的内容区域。</p>
            </div>
          </template>
          <template #tab3>
            <div class="p-4 bg-white dark:bg-gray-800 rounded-lg">
              <h3 class="font-medium text-gray-900 dark:text-white mb-2">设置内容</h3>
              <p class="text-gray-600 dark:text-gray-400">这里是设置页面的内容区域。</p>
            </div>
          </template>
        </UTabs>
      </section>

      <!-- Toast 通知 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">通知 Toast</h2>
        <div class="flex flex-wrap gap-4">
          <UButton color="green" @click="showToast('success')">成功通知</UButton>
          <UButton color="red" @click="showToast('error')">错误通知</UButton>
          <UButton color="yellow" @click="showToast('warning')">警告通知</UButton>
          <UButton color="blue" @click="showToast('info')">信息通知</UButton>
        </div>
      </section>

      <!-- 模态框 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">模态框 Modal</h2>
        <UButton @click="isModalOpen = true">打开模态框</UButton>
        <UModal v-model:open="isModalOpen">
          <template #header>
            <h3 class="text-lg font-semibold">模态框标题</h3>
          </template>
          <template #body>
            <p class="text-gray-600 dark:text-gray-400">
              这是模态框的内容区域，可以放置任何内容。
            </p>
          </template>
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" @click="isModalOpen = false">取消</UButton>
              <UButton color="primary" @click="isModalOpen = false">确认</UButton>
            </div>
          </template>
        </UModal>
      </section>

      <!-- 徽章 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">徽章 Badge</h2>
        <div class="flex flex-wrap gap-4">
          <UBadge>默认</UBadge>
          <UBadge color="green">成功</UBadge>
          <UBadge color="red">错误</UBadge>
          <UBadge color="yellow">警告</UBadge>
          <UBadge color="blue">信息</UBadge>
          <UBadge variant="outline">描边</UBadge>
          <UBadge variant="soft">柔和</UBadge>
        </div>
      </section>

      <!-- 卡片 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">卡片 Card</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UCard>
            <template #header>
              <h3 class="font-semibold">卡片标题</h3>
            </template>
            <p class="text-gray-600 dark:text-gray-400">这是卡片的内容区域。</p>
            <template #footer>
              <UButton size="sm">查看详情</UButton>
            </template>
          </UCard>
          <UCard>
            <template #header>
              <h3 class="font-semibold">功能卡片</h3>
            </template>
            <p class="text-gray-600 dark:text-gray-400">支持自定义头部和底部。</p>
            <template #footer>
              <div class="flex gap-2">
                <UButton size="sm" variant="ghost">取消</UButton>
                <UButton size="sm">确认</UButton>
              </div>
            </template>
          </UCard>
          <UCard>
            <template #header>
              <h3 class="font-semibold">简洁卡片</h3>
            </template>
            <p class="text-gray-600 dark:text-gray-400">简洁的卡片展示样式。</p>
          </UCard>
        </div>
      </section>

      <!-- 进度条 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">进度 Progress</h2>
        <div class="space-y-4 max-w-md">
          <UProgress :value="30" />
          <UProgress :value="60" color="green" />
          <UProgress :value="90" color="red" />
          <UProgress :value="100" color="blue" />
        </div>
      </section>

      <!-- 骨架屏 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-6">骨架屏 Skeleton</h2>
        <div class="flex items-center gap-4 max-w-md">
          <USkeleton class="w-12 h-12 rounded-full" />
          <div class="space-y-2 flex-1">
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-4 w-1/2" />
          </div>
        </div>
      </section>
    </div>

    <!-- Toast 容器 -->
    <UToaster />
  </div>
</template>
