(this["webpackJsonpthump-web-client"]=this["webpackJsonpthump-web-client"]||[]).push([[0],{23:function(e,t,n){"use strict";n.d(t,"c",(function(){return i})),n.d(t,"b",(function(){return s})),n.d(t,"a",(function(){return o})),n.d(t,"f",(function(){return r})),n.d(t,"d",(function(){return a})),n.d(t,"h",(function(){return c})),n.d(t,"j",(function(){return u})),n.d(t,"e",(function(){return l})),n.d(t,"g",(function(){return h})),n.d(t,"i",(function(){return d}));var i="wss://mikeylemmon.com/api",s="#",o="client/id";function r(e){return JSON.parse(e).clientId}var a="user/all";function c(e){return JSON.parse(e)}function u(e){return"user/update"+s+JSON.stringify(e)}var l="user/event";function h(e){return JSON.parse(e)}function d(e){return l+s+JSON.stringify(e)}},36:function(e,t,n){"use strict";n.d(t,"a",(function(){return s})),n.d(t,"b",(function(){return o})),n.d(t,"c",(function(){return r})),n.d(t,"d",(function(){return a})),n.d(t,"e",(function(){return c})),n.d(t,"f",(function(){return u}));var i=n(23),s="clock/now",o="clock/origin",r="clock/update",a=function(){return s+i.b},c=function(e){return r+i.b+JSON.stringify(e)};function u(e){return JSON.parse(e)}},70:function(e,t,n){"use strict";(function(e){n.d(t,"a",(function(){return r}));var i=n(29),s=n(694),o=n(36),r=function(){function t(e,n){var s=this,r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};Object(i.a)(this,t),this.global=void 0,this.conn=void 0,this.localOrigin=void 0,this.correction=0,this.precision=0,this.correction2=0,this.precision2=0,this.lowpass=.3,this.lastReqAt=0,this.lastRespAt=0,this.loopId=-1,this.syncInitial=0,this.serverOrigin=0,this.precisionNow=0,this.syncPeriod=500,this.synced=!1,this.options=void 0,this.update=function(){s.conn.readyState===WebSocket.OPEN?(s.lastReqAt=s.nowRaw(),s.conn.send(Object(o.d)())):s.global.clearTimeout(s.loopId)},this.global=e,this.options=r,this.localOrigin=e.performance.timeOrigin,this.conn=n,this.loopId=e.setInterval(this.update,this.syncPeriod)}return Object(s.a)(t,[{key:"nowRaw",value:function(){return e.performance.now()}},{key:"onClockOrigin",value:function(e){var t=JSON.parse(e).originMs;t?this.serverOrigin=t:console.error("[workerClock #onClockOrigin] Received empty response")}},{key:"onClockNow",value:function(e){var t=(JSON.parse(e)||{}).nowMs;if(t){this.lastRespAt=this.nowRaw();var n=this.lastRespAt-this.lastReqAt,i=t-(n/2+this.lastReqAt);0===this.correction?this.correction=i:this.correction=i*this.lowpass+this.correction*(1-this.lowpass);var s=i-this.correction;0===this.precision?this.precision=s:this.precision=s*this.lowpass+this.precision*(1-this.lowpass),this.correction2=this.precision*this.lowpass+this.correction2*(1-this.lowpass);var o=i-this.correction-this.correction2;0===this.precision2?this.precision2=o:this.precision2=o*this.lowpass+this.precision2*(1-this.lowpass);var r=this.now()-n/2-t;this.precisionNow=r*this.lowpass+this.precisionNow*(1-this.lowpass),!this.synced&&this.syncInitial++>6&&(this.synced=!0,this.global.clearTimeout(this.loopId),this.correction+=this.correction2,this.syncPeriod=2e3,this.loopId=this.global.setInterval(this.update,this.syncPeriod),this.options.onSynced&&this.options.onSynced())}else console.error("[workerClock #onClockNow] Received empty response")}},{key:"now",value:function(){var e=this.nowRaw(),t=1+(e-this.lastRespAt)/this.syncPeriod;return e+this.correction+this.correction2*t}},{key:"toGlobal",value:function(e){return e+this.correction+this.correction2}},{key:"toLocal",value:function(e){return e-this.correction-this.correction2}}]),t}()}).call(this,n(724))},709:function(e,t,n){e.exports=n(710)},710:function(e,t,n){"use strict";n.r(t);var i=n(27),s=n.n(i),o=n(544),r=n.n(o);n(715);!function(){var e=n(726).default;r.a.render(s.a.createElement(e,null),document.getElementById("root"))}()},715:function(e,t,n){},725:function(e,t,n){},726:function(e,t,n){"use strict";n.r(t);var i=n(27),s=n.n(i),o=n(33),r=n(29),a=n(25),c=n(697),u=n(23),l=n(36),h=n(70),d=function e(t,n){var i=this;Object(r.a)(this,e),this.conn=void 0,this.clock=void 0,this.global=void 0,this.options=void 0,this.clientId=0,this.users=[],this.reopen=function(){i.conn.readyState===WebSocket.CLOSED&&(i.conn=i.newConn(),i.clock=new h.a(i.global,i.conn,i.options.clock))},this.newConn=function(){var e=new WebSocket(u.c);return e.onclose=function(e){888!==e.code?(console.warn("WebSocket closed, will attempt to reopen in a few seconds",e),setTimeout(i.reopen,5e3)):console.warn("Closing for good",e)},e.onopen=function(e){console.log("WebSocket opened",e)},e.onerror=function(e){console.error("WebSocket error",e)},e.onmessage=i.onMessage,e},this.onMessage=function(e){var t=function(e,t,n){var i=[],s=new RegExp(t,"g");for(;n--;){var o=s.lastIndex,r=s.exec(e);if(!r)break;i.push(e.slice(o,r.index))}return i.push(e.slice(s.lastIndex)),i}(e.data,u.b,1),n=Object(c.a)(t,2),s=n[0],o=n[1];switch(s){case l.a:case l.b:if(!i.clock)return void console.error("[WSClient #onMessage] No local clock ready to handle server clock message");s===l.b?i.clock.onClockOrigin(o):i.clock.onClockNow(o);break;case l.c:var r=Object(l.f)(o);i.options.onClockUpdate(r),console.log("[WSClient #onMessage] Received clockUpdate",r);break;case u.a:i.clientId=Object(u.f)(o),console.log("[WSClient #onMessage] Received clientId",i.clientId),i.options.onClientId(i.clientId);break;case u.d:i.users=Object(u.h)(o),console.log("[WSClient #onMessage] Received users",i.users);break;case u.e:var a=Object(u.g)(o);i.options.onUserEvent(a);break;default:console.log("[WSClient #onMessage] Unhandled message",{head:s,body:o,parts:t},e)}},this.now=function(){return i.clock?i.clock.now():-1},this.getUser=function(e){var t,n=Object(o.a)(i.users);try{for(n.s();!(t=n.n()).done;){var s=t.value;if(s.clientId===e)return s}}catch(r){n.e(r)}finally{n.f()}},this.global=t,this.options=n,this.conn=this.newConn(),this.clock=new h.a(this.global,this.conn,this.options.clock)};var p=n(71),f=n.n(p),v=n(695),m=n(698);function g(e){return{data:e.data,channel:e.target.number,kind:e.type,attack:e.attack,note:e.note&&e.note._number,release:e.release,value:e.value,controller:e.controller}}var w=Object(m.a)(Array(16).keys()).map((function(e){return e+1})),b=["controlchange","noteoff","noteon","pitchbend"],k=function e(t){var n=this;Object(r.a)(this,e),this.webMidi=null,this.enabled=!1,this.enable=function(){var e=Object(v.a)(f.a.mark((function e(t){var i,s,r,a,c,u,l,h,d,p;return f.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return i=t.onMessage,s=t.onEnabled,r=window,a=r.WebMidi,e.prev=2,e.next=5,a.enable();case 5:e.next=11;break;case 7:return e.prev=7,e.t0=e.catch(2),console.error("[MIDI #enable] Failed to enable MIDI",e.t0),e.abrupt("return");case 11:n.webMidi=a,n.enabled=!0,c=n.webMidi,u=c.inputs,l=c.outputs,console.log("[MIDI #enable] inputs",u),console.log("[MIDI #enable] outputs",l),s&&s(n.webMidi),h=Object(o.a)(u);try{for(p=function(){var e,t=d.value,n=Object(o.a)(b);try{var s=function(){var n=e.value;t.addListener(n,(function(e){return i(t.name,n,g(e))}),{channels:w})};for(n.s();!(e=n.n()).done;)s()}catch(r){n.e(r)}finally{n.f()}},h.s();!(d=h.n()).done;)p()}catch(f){h.e(f)}finally{h.f()}case 19:case"end":return e.stop()}}),e,null,[[2,7]])})));return function(t){return e.apply(this,arguments)}}(),this.enable(t)};function y(){for(var e=["BD0010.WAV","BD0050.WAV","SD7510.WAV","CP.WAV","CH.WAV","OH10.WAV","LT00.WAV","MT00.WAV","HT00.WAV","LC00.WAV","MC00.WAV","HC00.WAV","CB.WAV","CY0075.WAV","MA.WAV","RS.WAV"],t={},n=20;n<128;++n)t[n]=e[(n-20)%e.length];return new a.Sampler({urls:t,release:1,baseUrl:"/samples/808/"}).toDestination()}var C=function e(t,n){var i=this;Object(r.a)(this,e),this.age=0,this.released=!1,this.firstUpdate=!0,this.ageReleased=0,this.x=-1,this.y=-1,this.velx=0,this.vely=0,this.young=2,this.health=1,this.youngDur=void 0,this.fadeOut=void 0,this.radius=void 0,this.radiusOrig=void 0,this.evt=void 0,this.user=void 0,this.release=function(){i.released=!0,i.ageReleased=i.age},this.isDead=function(){return i.released&&i.age-i.ageReleased>i.fadeOut},this.update=function(e,t){i.firstUpdate&&(i.x=e.width*(i.user.posX+.1*(2*Math.random()-1)),i.y=e.height*(i.user.posY+.1*(2*Math.random()-1)),i.firstUpdate=!1),i.young=Math.max(1,2-i.age/i.youngDur),i.age++,i.released&&(i.health=1-(i.age-i.ageReleased)/i.fadeOut),i.radius=i.radiusOrig*i.health,i.velx*=.924,i.vely*=.924,i.velx-=.003*(i.x-i.user.posX*e.width),i.vely-=.003*(i.y-i.user.posY*e.height);var n,s=Object(o.a)(t);try{for(s.s();!(n=s.n()).done;){var r=n.value;if(r!==i){var a=i.x-r.x,c=i.y-r.y,u=a*a,l=c*c,h=a<0?-1:1,d=c<0?-1:1,p=Math.sqrt(u+l),f=2500,v=p-(i.radius+r.radius);v<0?(i.velx+=1.8*h*(7500-u)/f,i.vely+=1.8*d*(7500-l)/f):v<50?(i.velx+=.2*h*u/f,i.vely+=.2*d*l/f):r.evt.instrument===i.evt.instrument&&(i.velx-=2e-6*h*u,i.vely-=2e-6*d*l)}}}catch(m){s.e(m)}finally{s.f()}(i.y<i.radius&&i.vely<0||i.y>e.height-i.radius&&i.vely>0)&&(i.vely*=-1),(i.x<i.radius&&i.velx<0||i.x>e.width-i.radius&&i.velx>0)&&(i.velx*=-1),i.y+=i.vely,i.x+=i.velx},this.draw=function(e){e.colorMode(e.HSL,1);var t=i.evt,n=t.instrument,s=t.midiEvent,o=s.attack,r=s.note,a=.3*(o||.5)+.55,c=2*i.radius*i.young;switch(n){case"eightOhEight":var u=r%16/16;e.fill(.4*u+.05,a,.45,i.health),e.square(i.x-c/2,i.y-c/2,c);break;default:var l=r%12/12,h=Math.min(r/128+.2,.65);e.fill(.25*l+.55,a,h,i.health),e.circle(i.x,i.y,c)}e.colorMode(e.RGB,255)},this.evt=t,this.user=n;var s=this.evt.midiEvent.attack||.5;switch(this.radius=25*s+5,this.radiusOrig=this.radius,t.instrument){case"eightOhEight":this.youngDur=2,this.fadeOut=3;break;default:this.youngDur=5,this.fadeOut=10}},O=function e(){var t=this;Object(r.a)(this,e),this.notes=[],this.noteon=function(e,n){t.notes.push(new C(e,n))},this.noteoff=function(e){var n=t.notes.filter((function(n){return!n.released&&t.isSameNote(n,e)}));n.length?n.forEach((function(e){return e.release()})):console.error("[VisualNotes #noteoff] Unable to find note for event",e)},this.isSameNote=function(e,t){return e.evt.instrument===t.instrument&&e.evt.midiEvent.note===t.midiEvent.note},this.draw=function(e){t.notes=t.notes.filter((function(e){return!e.isDead()})),t.notes.forEach((function(n){return n.update(e,t.notes)})),t.notes.forEach((function(t){return t.draw(e)}))}},I=function e(){var t=this;Object(r.a)(this,e),this.width=0,this.height=0,this.nn=0,this.visualNotes=new O,this.started=!1,this.syncing=!0,this.instruments={piano:new a.Sampler({urls:{A0:"A0.mp3",C1:"C1.mp3","D#1":"Ds1.mp3","F#1":"Fs1.mp3",A1:"A1.mp3",C2:"C2.mp3","D#2":"Ds2.mp3","F#2":"Fs2.mp3",A2:"A2.mp3",C3:"C3.mp3","D#3":"Ds3.mp3","F#3":"Fs3.mp3",A3:"A3.mp3",C4:"C4.mp3","D#4":"Ds4.mp3","F#4":"Fs4.mp3",A4:"A4.mp3",C5:"C5.mp3","D#5":"Ds5.mp3","F#5":"Fs5.mp3",A5:"A5.mp3",C6:"C6.mp3","D#6":"Ds6.mp3","F#6":"Fs6.mp3",A6:"A6.mp3",C7:"C7.mp3","D#7":"Ds7.mp3","F#7":"Fs7.mp3",A7:"A7.mp3",C8:"C8.mp3"},release:1,baseUrl:"https://tonejs.github.io/audio/salamander/"}).toDestination(),eightOhEight:y()},this.ws=void 0,this.midi=void 0,this.pp=null,this.user={clientId:0,name:"",instrument:"",inputDevice:"",offset:2,posX:.8*Math.random()+.1,posY:.6*Math.random()+.2},this.clockOpts={bpm:95},this.nameCustomized=!1,this.inputs={},this.destroy=function(){t.ws.conn.close(888,"sketch destroyed")},this.timeGlobalToTone=function(e){var n=a.context.rawContext._nativeAudioContext.getOutputTimestamp(),i=n.contextTime,s=n.performanceTime;return i+(t.ws.clock.toLocal(e)-s)/1e3},this.timeToneToGlobal=function(e){var n=a.context.rawContext._nativeAudioContext.getOutputTimestamp(),i=n.contextTime,s=n.performanceTime+1e3*(e-i);return t.ws.clock.toGlobal(s)},this.setSize=function(e,n){t.width=e,t.height=n},this.sketch=function(e){t.pp=e,e.setup=function(){return t.setup(e)},e.draw=function(){return t.draw(e)},e.mousePressed=function(){return t.mousePressed(e)}},this.setup=function(e){console.log("[Sketch #setup] ".concat(t.width," x ").concat(t.height)),e.createCanvas(t.width,t.height),t.setupInputs(e),t.user.posX=.8*Math.random()+.1,t.user.posY=.6*Math.random()+.2},this.setupInputs=function(e){var n=t.setupInputsUser(t.ws.clientId),i=e.createSelect();for(var s in i.position(n.x+n.width+10,40),t.instruments)i.option(s);i.size(100),i.changed((function(){console.log("[Sketch #inputs.instrument] Changed:",i.value()),t.user.instrument=i.value(),t.sendUserUpdate()})),t.inputs.instrument=i,t.user.instrument=i.value(),t.midi.enabled&&!t.inputs.inputDevice&&t.setupInputsMidi(t.midi.webMidi)},this.setupInputsUser=function(e){if(t.user.clientId=e,t.pp){if(!t.inputs.name||!t.nameCustomized){var n=t.pp.createInput("User ".concat(t.ws.clientId));n.size(80),n.position(20,40),n.input((function(){console.log("[Sketch #inputs.name] Changed:",n.value()),t.nameCustomized=!0,t.user.name=n.value(),t.sendUserUpdate()})),t.inputs.name=n,t.user.name=n.value();var i=t.pp.createInput("".concat(t.user.offset));i.size(50),i.position(n.x+n.width+10,40);var s=function(){var e=parseFloat(i.value());Number.isNaN(e)||(t.user.offset=e,t.sendUserUpdate())};return i.input((function(){console.log("[Sketch #inputs.offset] Changed:",i.value()),s()})),t.inputs.offset=i,s(),i}}else console.warn("[Sketch #setupInputsUser] Attempted to setup user input before sketch was initialized")},this.setupInputsMidi=function(e){if(t.pp&&t.inputs.instrument){var n=e.inputs,i=t.pp.createSelect(),s=t.inputs.instrument;i.position(s.x+s.width+10,40);var r,a=Object(o.a)(n);try{for(a.s();!(r=a.n()).done;){var c=r.value._midiInput;c?i.option(c.name):console.error("[Sketch #setupInputsMidi] Received a midi input with missing data")}}catch(u){a.e(u)}finally{a.f()}i.option("keyboard"),i.changed((function(){console.log("[Sketch #setupInputsMidi] Changed:",i.value()),t.user.inputDevice=i.value(),t.sendUserUpdate()})),t.inputs.inputDevice=i,t.user.inputDevice=i.value()}},this.setupInputsBPM=function(){if(t.pp){var e=t.pp.createSlider(30,200,t.clockOpts.bpm);e.position(20,t.pp.height-40),e.size(t.pp.width/2),e.input((function(){t.clockOpts.bpm=e.value(),t.sendClockUpdate(t.clockOpts)})),t.inputs.bpm=e}},this.draw=function(e){var n=!1;for(var i in t.instruments){var s=t.instruments[i];n=n||!s.loaded}e.background(51),t.visualNotes.draw(e),t.drawLabels(e),t.drawUsers(e),n?t.drawMessage(e,"Loading instruments..."):t.syncing?t.drawMessage(e,"Syncing clock with server..."):t.started||t.drawMessage(e,"Click to enable audio")},this.drawUsers=function(e){e.strokeWeight(0),e.textAlign(e.CENTER,e.CENTER);var n,i=Object(o.a)(t.ws.users);try{for(i.s();!(n=i.n()).done;){var s=n.value,r=s.posX*e.width,a=s.posY*e.height;e.fill(255),e.textSize(14),e.textStyle(e.BOLD),e.text(s.name,r,a),e.fill(200),e.textSize(11),e.textStyle(e.ITALIC),e.text("".concat(s.instrument," (@").concat(s.offset,")"),r,a+18)}}catch(c){i.e(c)}finally{i.f()}},this.drawLabels=function(e){for(var n in e.textSize(12),e.fill(255),e.strokeWeight(1),e.stroke(0),e.textAlign(e.LEFT,e.BOTTOM),e.textStyle(e.BOLD),t.inputs){var i=t.inputs[n],s=i.x+3,o=i.y-5;switch(!0){case"offset"===n:var r=parseFloat(i.value()),a="";Number.isNaN(r)&&(e.fill(255,0,0),a=" (NaN!)"),e.text("".concat(n.toUpperCase()).concat(a,"\n","(in beats)"),s,o),Number.isNaN(r)&&e.fill(255);break;case n in t.user:e.text(n.toUpperCase(),s,o);break;default:e.text("".concat(n.toUpperCase(),": ").concat(i.value()),s,o)}}},this.drawMessage=function(e,t){e.fill(200),e.strokeWeight(0),e.textSize(20),e.textAlign(e.CENTER,e.CENTER),e.textStyle(e.BOLDITALIC),e.text(t,e.width/2,e.height/2)},this.mousePressed=function(e){if(!t.started)return a.start(),console.log("[Sketch #mousePressed] Started Tone"),void(t.started=!0);e.mouseX<.1*e.width||e.mouseX>.9*e.width||e.mouseY<.2*e.height||e.mouseY>.8*e.height||(t.user.posX=e.mouseX/e.width,t.user.posY=e.mouseY/e.height,t.sendUserUpdate())},this.sendUserUpdate=function(){var e=t.ws.conn;e&&e.readyState===WebSocket.OPEN?e.send(Object(u.j)(t.user)):console.warn("[Sketch #sendUserUpdate] Can't send user update, websocket connection is not open")},this.sendClockUpdate=function(e){var n=t.ws.conn;n&&n.readyState===WebSocket.OPEN?n.send(Object(l.e)(e)):console.warn("[Sketch #sendUserUpdate] Can't send bpm update, websocket connection is not open")},this.onClockUpdate=function(e){t.clockOpts=e,t.inputs.bpm&&t.inputs.bpm.value(e.bpm)},this.onMIDI=function(e,n,i){if(e===t.user.inputDevice){var s={clientId:t.user.clientId,instrument:t.user.instrument,midiEvent:i,timestamp:t.ws.now()+t.offsetMs()},o=t.ws.conn;o&&o.readyState===WebSocket.OPEN?o.send(Object(u.i)(s)):t.onUserEvent(s)}},this.offsetMs=function(){return t.inputs.bpm?1e3/(t.inputs.bpm.value()/60)*t.user.offset:0},this.onUserEvent=function(e){var n=e.clientId,i=e.instrument,s=e.midiEvent,o=e.timestamp,r=s.data,c=s.channel,u=s.kind,l=t.instruments[i];if(l){if(!1!==l.loaded){var h=t.timeGlobalToTone(o);if(!(h-a.immediate()<-1))switch(u){case"noteon":var d=s;l.triggerAttack(a.Frequency(d.note,"midi").toFrequency(),h,d.attack);var p=t.user;if(n!==p.clientId){var f=t.ws.getUser(n);p=f||p}a.Draw.schedule((function(){return t.visualNotes.noteon(e,p)}),h);break;case"noteoff":var v=s;l.triggerRelease(a.Frequency(v.note,"midi").toFrequency(),h),a.Draw.schedule((function(){return t.visualNotes.noteoff(e)}),h);break;case"controlchange":var m=s;console.log("[Sketch #onMIDI] CC event on channel ".concat(c,":"),m.controller.number,m.controller.name,m.value);break;case"pitchbend":var g=s;console.log("[Sketch #onMIDI] Pitchbend event on channel ".concat(c,":"),g.value);break;default:console.warn("[Sketch #onMIDI] Unhandled MIDI event on channel ".concat(c,":"),u,r,e)}}}else console.error("[Sketch #onUserEvent] Unable to find instrument",i)},console.log("[Sketch #ctor]"),this.ws=new d(window,{clock:{onSynced:function(){t.syncing=!1,t.setupInputsBPM()}},onClientId:this.setupInputsUser,onClockUpdate:this.onClockUpdate,onUserEvent:this.onUserEvent}),this.midi=new k({onMessage:this.onMIDI,onEnabled:this.setupInputsMidi}),window.Tone=a,window.me=this},S=function(){var e=Object(i.useRef)(null),t=Object(i.useRef)(new I),n=Object(i.useRef)("Loading");return Object(i.useEffect)((function(){if(!e.current)return n.current="Internal component error",void console.warn("[VideoOutput #useEffect] Can't find component reference");var i=e.current;i.childNodes[0]&&i.removeChild(i.childNodes[0]);var s=i.clientWidth,o=i.clientHeight,r=t.current;r.setSize(s,o);var a=new window.p5(r.sketch,i);return function(){r.destroy(),a.remove(),console.log("[VideoOutput #useEffect.return]")}})),s.a.createElement("div",{ref:e,style:{display:"flex",flex:1,alignItems:"center",justifyContent:"center",color:"white"}},n.current)};n(725),t.default=function(){return s.a.createElement("div",{className:"App",style:{display:"flex",flexDirection:"column",position:"absolute",backgroundColor:"#383838",top:0,left:0,right:0,bottom:0}},s.a.createElement(S,null))}}},[[709,1,2]]]);
//# sourceMappingURL=main.fa9219fd.chunk.js.map