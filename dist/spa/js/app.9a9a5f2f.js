(()=>{"use strict";var e={4653:(e,t,o)=>{var r=o(1957),n=o(1947),a=o(499),i=o(9835);function s(e,t,o,r,n,a){const s=(0,i.up)("router-view");return(0,i.wg)(),(0,i.j4)(s)}const l=(0,i.aZ)({name:"App"});var c=o(1639);const u=(0,c.Z)(l,[["render",s]]),d=u;var h=o(3340),p=o(8339);const f=[{path:"/",component:()=>Promise.all([o.e(736),o.e(485)]).then(o.bind(o,3485)),children:[{path:"",component:()=>Promise.all([o.e(736),o.e(706)]).then(o.bind(o,9706))}]},{path:"/:catchAll(.*)*",component:()=>Promise.all([o.e(736),o.e(862)]).then(o.bind(o,1862))}],m=f,g=(0,h.BC)((function(){const e=p.r5,t=(0,p.p7)({scrollBehavior:()=>({left:0,top:0}),routes:m,history:e("/cashu/static/dist/spa/")});return t}));async function v(e,t){const o=e(d);o.use(n.Z,t);const r=(0,a.Xl)("function"===typeof g?await g({}):g);return{app:o,router:r}}var y=o(3703),b=o(6827);const w={config:{},plugins:{LocalStorage:y.Z,Notify:b.Z}},k="/cashu/static/dist/spa/",C=/\/\//,S=e=>(k+e).replace(C,"/");async function q({app:e,router:t},o){let r=!1;const n=e=>{try{return S(t.resolve(e).href)}catch(o){}return Object(e)===e?null:e},a=e=>{if(r=!0,"string"===typeof e&&/^https?:\/\//.test(e))return void(window.location.href=e);const t=n(e);null!==t&&(window.location.href=t,window.location.reload())},i=window.location.href.replace(window.location.origin,"");for(let l=0;!1===r&&l<o.length;l++)try{await o[l]({app:e,router:t,ssrContext:null,redirect:a,urlPath:i,publicPath:k})}catch(s){return s&&s.url?void a(s.url):void console.error("[Quasar] boot error:",s)}!0!==r&&(e.use(t),e.mount("#q-app"))}v(r.ri,w).then((e=>{const[t,r]=void 0!==Promise.allSettled?["allSettled",e=>e.map((e=>{if("rejected"!==e.status)return e.value.default;console.error("[Quasar] boot error:",e.reason)}))]:["all",e=>e.map((e=>e.default))];return Promise[t]([Promise.resolve().then(o.bind(o,1096)),Promise.resolve().then(o.bind(o,8027))]).then((t=>{const o=r(t).filter((e=>"function"===typeof e));q(e,o)}))}))},1096:(e,t,o)=>{o.r(t);var r=o(5054);window.LOCALE="en",window.windowMixin={data:function(){return{g:{offline:!navigator.onLine,visibleDrawer:!1,extensions:[],user:null,wallet:null,payments:[],allowedThemes:null}}},methods:{changeColor:function(e){document.body.setAttribute("data-theme",e),this.$q.localStorage.set("cashu.theme",e)},toggleDarkMode:function(){this.$q.dark.toggle(),this.$q.localStorage.set("cashu.darkMode",this.$q.dark.isActive)},copyText:function(e,t,o){let n=this.$q.notify;(0,r.Z)(e).then((function(){n({message:t||"Copied to clipboard!",position:o||"bottom"})}))},formatCurrency:function(e,t){return new Intl.NumberFormat(window.LOCALE,{style:"currency",currency:t}).format(e)},formatSat:function(e){return new Intl.NumberFormat(window.LOCALE).format(e)},notifyApiError:function(e){var t={400:"warning",401:"warning",500:"negative"};this.$q.notify({timeout:5e3,type:t[e.response.status]||"warning",message:e.response.data.message||e.response.data.detail||null,caption:[e.response.status," ",e.response.statusText].join("").toUpperCase()||null,icon:null})},notifySuccess:async function(e,t="top"){this.$q.notify({timeout:5e3,type:"positive",message:e,position:t,progress:!0,actions:[{icon:"close",color:"white",handler:()=>{}}]})},notifyError:async function(e,t=null){this.$q.notify({color:"red",message:e,caption:t,position:"top",progress:!0,actions:[{icon:"close",color:"white",handler:()=>{}}]})},notifyWarning:async function(e,t=null,o=5e3){this.$q.notify({timeout:o,type:"warning",message:e,caption:t,position:"top",progress:!0,actions:[{icon:"close",color:"black",handler:()=>{}}]})},notify:async function(e,t="null",o="top",r=null,n=null){this.$q.notify({timeout:5e3,type:"nuill",color:"grey",message:e,caption:null,position:"top",actions:[{icon:"close",color:"white",handler:()=>{}}]})}},created:function(){1==this.$q.localStorage.getItem("cashu.darkMode")||0==this.$q.localStorage.getItem("cashu.darkMode")?this.$q.dark.set(this.$q.localStorage.getItem("cashu.darkMode")):this.$q.dark.set(!0),this.g.allowedThemes=window.allowedThemes??["classic"],addEventListener("offline",(e=>{this.g.offline=!0})),addEventListener("online",(e=>{this.g.offline=!1})),this.$q.localStorage.getItem("cashu.theme")?document.body.setAttribute("data-theme",this.$q.localStorage.getItem("cashu.theme")):this.changeColor("classic")}}},8027:(e,t,o)=>{o.r(t),o.d(t,{default:()=>s});var r=o(3340),n=o(5764),a=o.n(n),i=o(7852);const s=(0,r.xr)((async({app:e})=>{e.use(a()),e.component(i.Z.name,i.Z)}))}},t={};function o(r){var n=t[r];if(void 0!==n)return n.exports;var a=t[r]={exports:{}};return e[r].call(a.exports,a,a.exports,o),a.exports}o.m=e,(()=>{var e=[];o.O=(t,r,n,a)=>{if(!r){var i=1/0;for(u=0;u<e.length;u++){for(var[r,n,a]=e[u],s=!0,l=0;l<r.length;l++)(!1&a||i>=a)&&Object.keys(o.O).every((e=>o.O[e](r[l])))?r.splice(l--,1):(s=!1,a<i&&(i=a));if(s){e.splice(u--,1);var c=n();void 0!==c&&(t=c)}}return t}a=a||0;for(var u=e.length;u>0&&e[u-1][2]>a;u--)e[u]=e[u-1];e[u]=[r,n,a]}})(),(()=>{o.n=e=>{var t=e&&e.__esModule?()=>e["default"]:()=>e;return o.d(t,{a:t}),t}})(),(()=>{o.d=(e,t)=>{for(var r in t)o.o(t,r)&&!o.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}})(),(()=>{o.f={},o.e=e=>Promise.all(Object.keys(o.f).reduce(((t,r)=>(o.f[r](e,t),t)),[]))})(),(()=>{o.u=e=>"js/"+e+"."+{485:"81a1d23d",706:"662db243",862:"e43ee2bb"}[e]+".js"})(),(()=>{o.miniCssF=e=>"css/"+e+".71d74027.css"})(),(()=>{o.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()})(),(()=>{o.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t)})(),(()=>{var e={},t="cashu:";o.l=(r,n,a,i)=>{if(e[r])e[r].push(n);else{var s,l;if(void 0!==a)for(var c=document.getElementsByTagName("script"),u=0;u<c.length;u++){var d=c[u];if(d.getAttribute("src")==r||d.getAttribute("data-webpack")==t+a){s=d;break}}s||(l=!0,s=document.createElement("script"),s.charset="utf-8",s.timeout=120,o.nc&&s.setAttribute("nonce",o.nc),s.setAttribute("data-webpack",t+a),s.src=r),e[r]=[n];var h=(t,o)=>{s.onerror=s.onload=null,clearTimeout(p);var n=e[r];if(delete e[r],s.parentNode&&s.parentNode.removeChild(s),n&&n.forEach((e=>e(o))),t)return t(o)},p=setTimeout(h.bind(null,void 0,{type:"timeout",target:s}),12e4);s.onerror=h.bind(null,s.onerror),s.onload=h.bind(null,s.onload),l&&document.head.appendChild(s)}}})(),(()=>{o.r=e=>{"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}})(),(()=>{o.p="/cashu/static/dist/spa/"})(),(()=>{if("undefined"!==typeof document){var e=(e,t,o,r,n)=>{var a=document.createElement("link");a.rel="stylesheet",a.type="text/css";var i=o=>{if(a.onerror=a.onload=null,"load"===o.type)r();else{var i=o&&("load"===o.type?"missing":o.type),s=o&&o.target&&o.target.href||t,l=new Error("Loading CSS chunk "+e+" failed.\n("+s+")");l.code="CSS_CHUNK_LOAD_FAILED",l.type=i,l.request=s,a.parentNode.removeChild(a),n(l)}};return a.onerror=a.onload=i,a.href=t,o?o.parentNode.insertBefore(a,o.nextSibling):document.head.appendChild(a),a},t=(e,t)=>{for(var o=document.getElementsByTagName("link"),r=0;r<o.length;r++){var n=o[r],a=n.getAttribute("data-href")||n.getAttribute("href");if("stylesheet"===n.rel&&(a===e||a===t))return n}var i=document.getElementsByTagName("style");for(r=0;r<i.length;r++){n=i[r],a=n.getAttribute("data-href");if(a===e||a===t)return n}},r=r=>new Promise(((n,a)=>{var i=o.miniCssF(r),s=o.p+i;if(t(i,s))return n();e(r,s,null,n,a)})),n={143:0};o.f.miniCss=(e,t)=>{var o={706:1};n[e]?t.push(n[e]):0!==n[e]&&o[e]&&t.push(n[e]=r(e).then((()=>{n[e]=0}),(t=>{throw delete n[e],t})))}}})(),(()=>{var e={143:0};o.f.j=(t,r)=>{var n=o.o(e,t)?e[t]:void 0;if(0!==n)if(n)r.push(n[2]);else{var a=new Promise(((o,r)=>n=e[t]=[o,r]));r.push(n[2]=a);var i=o.p+o.u(t),s=new Error,l=r=>{if(o.o(e,t)&&(n=e[t],0!==n&&(e[t]=void 0),n)){var a=r&&("load"===r.type?"missing":r.type),i=r&&r.target&&r.target.src;s.message="Loading chunk "+t+" failed.\n("+a+": "+i+")",s.name="ChunkLoadError",s.type=a,s.request=i,n[1](s)}};o.l(i,l,"chunk-"+t,t)}},o.O.j=t=>0===e[t];var t=(t,r)=>{var n,a,[i,s,l]=r,c=0;if(i.some((t=>0!==e[t]))){for(n in s)o.o(s,n)&&(o.m[n]=s[n]);if(l)var u=l(o)}for(t&&t(r);c<i.length;c++)a=i[c],o.o(e,a)&&e[a]&&e[a][0](),e[a]=0;return o.O(u)},r=globalThis["webpackChunkcashu"]=globalThis["webpackChunkcashu"]||[];r.forEach(t.bind(null,0)),r.push=t.bind(null,r.push.bind(r))})();var r=o.O(void 0,[736],(()=>o(4653)));r=o.O(r)})();