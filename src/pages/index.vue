<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-8">
    <div class="text-center max-w-2xl">
      <!-- Logo / 标题 -->
      <div class="mb-8">
        <div class="w-20 h-20 mx-auto mb-6 bg-primary-500 rounded-2xl flex items-center justify-center">
          <span class="text-4xl">💬</span>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          ChatLens
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400">
          聊天记录分析工具 - 让你更好地了解你的聊天数据
        </p>
      </div>

      <!-- 功能入口 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <UCard class="hover:shadow-lg transition-shadow cursor-pointer">
          <div class="text-center p-4">
            <div class="text-3xl mb-3">📁</div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">导入聊天记录</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">支持多种格式的聊天记录导入</p>
          </div>
        </UCard>
        <UCard class="hover:shadow-lg transition-shadow cursor-pointer">
          <div class="text-center p-4">
            <div class="text-3xl mb-3">📊</div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">数据分析</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">可视化展示聊天数据统计</p>
          </div>
        </UCard>
      </div>

      <!-- 快速开始按钮 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <UButton size="lg" color="primary">
          开始使用
        </UButton>
        <UButton size="lg" variant="outline" to="/ui">
          组件演示
        </UButton>
      </div>

      <!-- 版本信息 -->
      <p class="mt-12 text-sm text-gray-400">
        v0.1.0 · Built with Vue 3 + Electron + Nuxt UI
      </p>
    </div>
  </div>
</template>

