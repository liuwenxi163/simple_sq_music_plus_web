<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from './api'
import Icon from './Icon.vue'
const rows=ref([]),error=ref(''),notice=ref(''),busy=ref(false),reset=ref(null),password=ref('')
const form=reactive({username:'',displayName:'',password:''})
async function load(){rows.value=await api('/members')}
async function act(fn){if(busy.value)return;busy.value=true;error.value='';notice.value='';try{await fn();await load()}catch(e){error.value=e.message}finally{busy.value=false}}
function create(){act(async()=>{await api('/members',{...form});form.username=form.displayName=form.password='';notice.value='成员已创建，可以使用新账号登录。'})}
function toggle(row){act(()=>api('/members/'+row.id,{disabled:!row.disabled},'PATCH'))}
function renew(){act(async()=>{await api('/members/'+reset.value+'/password',{password:password.value},'PUT');password.value='';reset.value=null;notice.value='密码已重置，该成员需要重新登录。'})}
onMounted(()=>load().catch(e=>error.value=e.message))
</script>
<template><div class="member-page"><p class="member-lead">每个人有自己的推荐、歌单和音乐账号。NAS 音乐文件由家庭共用。</p><p v-if="error" role="alert" class="inline-error">{{error}}</p><p v-if="notice" role="status" class="muted">{{notice}}</p><div class="member-roster"><article v-for="row in rows" :key="row.id" class="member-row"><span class="member-avatar">{{row.displayName.slice(0,1).toUpperCase()}}</span><div class="member-name"><strong>{{row.displayName}}</strong><small>{{row.username}} · {{row.role==='ADMIN'?'最高权限管理员':row.disabled?'已停用':'家庭成员'}}</small></div><span v-if="row.role==='ADMIN'" class="member-fixed">默认成员</span><template v-else><button class="quiet" :disabled="busy" @click="reset=reset===row.id?null:row.id;password=''">重置密码</button><button class="text-button" :disabled="busy" @click="toggle(row)">{{row.disabled?'启用':'停用'}}</button></template><form v-if="reset===row.id" class="member-reset" @submit.prevent="renew"><label>新密码<input v-model="password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required /></label><button class="primary" :disabled="busy">保存新密码</button><button type="button" class="quiet" @click="reset=null;password=''">取消</button></form></article></div><section class="member-create"><div><span class="eyebrow">FAMILY MEMBERS</span><h2>邀请一位家人</h2><p>为家人创建独立账号。平台扫码登录由本人在「我的账号」完成。</p></div><form @submit.prevent="create"><label>登录账号<input v-model="form.username" minlength="3" maxlength="48" pattern="[a-zA-Z0-9][a-zA-Z0-9_.-]{2,47}" autocomplete="off" placeholder="例如 alice" required /></label><label>昵称<input v-model="form.displayName" maxlength="40" placeholder="在音乐空间显示的名字" required /></label><label>初始密码<input v-model="form.password" type="password" minlength="8" maxlength="72" autocomplete="new-password" placeholder="至少 8 位" required /></label><button class="primary" :disabled="busy"><Icon name="plus" :size="17" />{{busy?'正在保存…':'创建成员'}}</button></form></section></div></template>
<style src="./members.css"></style>
