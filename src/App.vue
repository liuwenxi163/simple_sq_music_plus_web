<script setup>
import { darkTheme, NConfigProvider, NDialogProvider, NMessageProvider, NLoadingBarProvider, zhCN, dateZhCN } from 'naive-ui'
import MessageApi from './components/message-api.vue'
</script>
<template><n-config-provider :theme="darkTheme" :locale="zhCN" :date-locale="dateZhCN"><n-dialog-provider><n-loading-bar-provider><n-message-provider placement="bottom"><MessageApi /><router-view /></n-message-provider></n-loading-bar-provider></n-dialog-provider></n-config-provider></template>
