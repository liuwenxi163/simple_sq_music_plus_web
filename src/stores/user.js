import { defineStore } from 'pinia'
import { isLogin } from '../utils/api.js'
export default defineStore('userInfo', {
  persist:true,
  state:()=>({username:'',token:'',loginDevice:'web',device:'web',memberId:null,role:'',displayName:''}),
  actions:{
    setUserName(v){this.username=v},setToken(v){this.token=v},setLoginDevice(v){this.loginDevice=v},
    setProfile(p){this.memberId=p.id;this.username=p.username;this.displayName=p.displayName;this.role=p.role},
    isLogin(){return isLogin()},
    clearUserInfo(){this.$reset()}
  }
})
