import {test} from 'node:test'
import assert from 'node:assert/strict'
import {platformOf,localRequest,playlistTargets} from '../src/listening/listening-policy.js'
test('only a track from the same connected platform gets cloud playlist destinations',()=>{
 const contexts={qqvip:{playlists:[{id:'1',name:'Mine',kind:'owned'},{id:'2',name:'Likes',kind:'likes'}]},netease:{playlists:[{id:'9',name:'Other',kind:'owned'}]}}
 const targets=playlistTargets({id:'mid',plugName:'qqvip'},[{id:'local:a',name:'Local'}],contexts)
 assert.deepEqual(targets.map(t=>t.destination),['NAS 本地歌单','QQ 音乐 · 云端歌单']);assert.equal(targets[1].remoteId,'1')
 assert.equal(playlistTargets({local:true},[],contexts).length,0)
})
test('explicit playback quality remains part of the local lookup',()=>{assert.equal(localRequest({id:'mid',plugName:'qqvip'},'QQVIP_Flac_2000').format,'flac');assert.equal(localRequest({id:1,plugName:'netease'},'auto').id,'1');assert.equal(platformOf({local:true,plugName:'qqvip'}),null)})
