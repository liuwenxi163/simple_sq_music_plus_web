<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { api, trackKey } from './api'
import Artwork from './Artwork.vue'
import Icon from './Icon.vue'
import PlaylistTarget from './PlaylistTarget.vue'
const props=defineProps({accounts:Array,loading:Boolean,accountErrors:Array,isLiked:Function,choices:Function,pending:Function})
const emit=defineEmits(['play','like','save','context','settings'])
const provider=ref(''),daily=ref(null),busy=ref(false),error=ref(''),recommendationType=ref('daily'),refreshRemaining=ref(0)
const isGuess=computed(()=>provider.value==='qqvip'&&recommendationType.value==='guess')
let refreshTimer
let generation=0
const account=computed(()=>props.accounts?.find(a=>a.id===provider.value))
const songs=computed(()=>(daily.value?.tracks||[]).map(t=>({...t,title:t.name,artist:(t.artistName||[]).join(' / '),album:t.albumName||'',coverUrl:t.pic,local:false})))
const feature=computed(()=>songs.value[0]),date=computed(()=>{const now=new Date();return {day:String(now.getDate()).padStart(2,'0'),month:String(now.getMonth()+1).padStart(2,'0')}})
const normalizeError=message=>({DAILY_RECOMMENDATION_UNAVAILABLE:'平台暂时没有返回今天的推荐，请稍后再试。',GUESS_RECOMMENDATION_UNAVAILABLE:'QQ 暂时没有提供新的推荐，稍后再换一批。',PLATFORM_LOGIN_REQUIRED:'平台登录已过期，请重新登录。',PLATFORM_UNAVAILABLE:'暂时连不上音乐平台，稍后可重试。'})[message]||message
function updateRefresh(){refreshRemaining.value=Math.max(0,Math.ceil(((daily.value?.refreshAvailableAt||0)-Date.now())/1000))}
async function load(refresh=false){
  if(!provider.value)return
  const current=++generation;busy.value=true;error.value=''
  if(!refresh)daily.value=null
  const selected=provider.value,kind=isGuess.value?'guess':'daily'
  try{
    const value=await api('/listening/platforms/'+selected+'/'+kind+(refresh?'?refresh=true':''))
    if(current!==generation)return
    daily.value=value;updateRefresh();emit('context',selected,value)
  }catch(e){if(current===generation)error.value=normalizeError(e.message)}
  finally{if(current===generation)busy.value=false}
}
watch(()=>props.accounts,accounts=>{if(!accounts?.some(a=>a.id===provider.value))provider.value=accounts?.[0]?.id||''},{immediate:true})
watch([provider,isGuess],()=>load(),{immediate:true})
onMounted(()=>{refreshTimer=setInterval(updateRefresh,1000)})
onUnmounted(()=>{generation++;clearInterval(refreshTimer)})
</script>
<template>
  <section class="daily-room">
    <header class="daily-masthead"><div><span class="room-kicker">YOUR DAILY SOUND</span><h1>今天，听点新的<span>。</span></h1><p>跟着你的喜好，发现今天值得听的歌。</p></div><div class="daily-date"><span>{{date.month}}</span><strong>{{date.day}}</strong><small>DAILY SELECTION</small></div></header>
    <nav v-if="accounts?.length" class="platform-tabs" aria-label="每日推荐平台"><button v-for="item in accounts" :key="item.id" :class="{selected:provider===item.id}" :aria-pressed="provider===item.id" @click="provider=item.id"><span class="platform-symbol" :class="item.id">{{item.id==='qqvip'?'Q':'N'}}</span>{{item.name}}<span class="platform-connected">已连接</span></button><button class="platform-manage" @click="emit('settings')"><Icon name="plus" :size="15" />连接音乐平台</button></nav>
    <div v-if="provider==='qqvip'" class="recommendation-switch" role="group" aria-label="推荐内容"><button :aria-pressed="!isGuess" @click="recommendationType='daily'"><Icon name="calendar" :size="15" />每日推荐</button><button :aria-pressed="isGuess" @click="recommendationType='guess'"><Icon name="spark" :size="15" />猜你喜欢</button></div>
    <p v-if="error&&feature" class="recommendation-error" role="alert">{{error}}</p>
    <div v-if="loading||(busy&&!daily)" class="daily-loading" aria-label="读取每日推荐"><div></div><div></div></div>
    <div v-else-if="error&&!feature" class="daily-empty" role="alert"><Icon name="cloud" :size="36" /><h2>今天的推荐，稍等一下。</h2><p>{{error}}</p><button class="quiet" @click="load()"><Icon name="refresh" :size="16" />重新读取</button></div>
    <div v-else-if="!accounts?.length" class="daily-empty"><span class="empty-record"><Icon name="music" :size="42" /></span><h2>连接你的音乐世界</h2><p>登录 QQ 音乐或网易云后，这里会呈现对应账号的每日推荐，喜欢和歌单也能同步回平台。</p><p v-for="item in accountErrors" :key="item.id" class="inline-error">{{item.id==='qqvip'?'QQ 音乐':'网易云音乐'}}：{{normalizeError(item.message)}}</p><button class="primary" @click="emit('settings')">前往账号设置<Icon name="arrow" :size="18" /></button></div>
    <template v-else-if="feature">
      <section class="daily-hero"><div class="daily-color" :style="{backgroundImage:`url(${JSON.stringify(feature.coverUrl)})`}"></div><div class="daily-story"><span class="daily-edition"><span></span>{{account?.name}} · {{isGuess?'PERSONAL RADIO':'FOR YOU'}}</span><h2>{{daily.title}}</h2><p class="daily-story-caption">{{isGuess?'从熟悉的旋律，遇见新的喜欢。':'把今天的好音乐，慢慢听完。'}}</p><div class="daily-actions"><button class="daily-play" @click="emit('play',feature,songs)"><Icon name="play" :size="19" />播放全部</button><span v-if="!isGuess">{{songs.length}} 首音乐<span class="story-dot">·</span>{{daily.date}}</span><button v-else class="guess-refresh" :disabled="busy||refreshRemaining>0" @click="load(true)"><Icon name="refresh" :size="14" />{{busy?'正在更新':refreshRemaining>0?refreshRemaining+' 秒后换一批':'换一批'}}</button></div><div class="daily-preview"><Artwork :src="feature.coverUrl" /><span><small>从这首开始</small><strong>{{feature.title}}</strong><span>{{feature.artist}}</span></span></div></div><div class="daily-art-scene" aria-hidden="true"><Artwork v-if="songs[2]" class="daily-back-cover cover-three" :src="songs[2].coverUrl" /><Artwork v-if="songs[1]" class="daily-back-cover cover-two" :src="songs[1].coverUrl" /><Artwork class="daily-main-cover" :src="feature.coverUrl" /><span class="daily-art-label">{{isGuess?'YOUR TASTE. NEW DISCOVERIES.':'A NEW DAY. A NEW SOUND.'}}</span></div></section>
      <div class="daily-list-heading"><div><span class="room-kicker">{{isGuess?'JUST FOR YOU':'MADE FOR YOUR DAY'}}</span><h2>{{isGuess?'猜你喜欢，接着听':'今天的推荐曲目'}}</h2></div><span>{{account?.name}} · {{songs.length}} 首</span></div>
      <p v-if="isGuess&&daily.partial" class="recommendation-partial">本次先准备了 {{songs.length}} 首，稍后可换一批继续发现。</p>
      <div class="daily-song-grid"><article v-for="(track,index) in songs" :key="trackKey(track)" class="daily-song"><button class="daily-song-art" :aria-label="'播放 '+track.title" @click="emit('play',track,songs)"><Artwork :src="track.coverUrl" /><span><Icon name="play" :size="20" /></span></button><button class="daily-song-name" @click="emit('play',track,songs)"><small>{{String(index+1).padStart(2,'0')}}</small><strong>{{track.title}}</strong><span>{{track.artist}}</span></button><div class="daily-song-actions"><button class="icon-button" :class="{liked:isLiked(track)}" :disabled="pending(track)" :aria-label="(isLiked(track)?'取消喜欢 ':'喜欢 ')+track.title+' · '+account?.name" @click="emit('like',track)"><Icon name="heart" :size="17" /></button><PlaylistTarget compact :options="choices(track)" :label="'加入歌单 '+track.title" @select="emit('save',track,$event)" /></div></article></div>
    </template>
  </section>
</template>
