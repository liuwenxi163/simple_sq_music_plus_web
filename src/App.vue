<script setup>
import { darkTheme, NConfigProvider, NDialogProvider, NMessageProvider, NLoadingBarProvider, zhCN, dateZhCN } from 'naive-ui'
import MessageApi from './components/message-api.vue'
</script>
<template><n-config-provider :theme="darkTheme" :theme-overrides="{common:{primaryColor:'#a8d9d9',primaryColorHover:'#c1e5e2',primaryColorPressed:'#8ec2c4',bodyColor:'#1a2028',cardColor:'#232a34',modalColor:'#232a34',borderRadius:'7px',fontFamily:'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Microsoft YaHei, sans-serif'}}" :locale="zhCN" :date-locale="dateZhCN"><n-dialog-provider><n-loading-bar-provider><n-message-provider placement="bottom"><MessageApi /><router-view /></n-message-provider></n-loading-bar-provider></n-dialog-provider></n-config-provider></template>
