// ─── THEME ───
var currentTheme = localStorage.getItem('aviis_theme') || localStorage.getItem('webos_theme') || 'dark';
function applyTheme(theme) {
  document.body.classList.remove('theme-dark','theme-light');
  document.body.classList.add('theme-'+theme);
  var btn = document.getElementById('themeBtn');
  var btnLogin = document.getElementById('themeBtnLogin');
  if(btn) btn.textContent = theme==='dark' ? '🌙' : '☀️';
  if(btnLogin) btn.textContent = theme==='dark' ? '🌙' : '☀️';
  currentTheme = theme;
  try{ localStorage.setItem('aviis_theme',theme); }catch(e){}
}
function toggleTheme(){ applyTheme(currentTheme==='dark'?'light':'dark'); }
function setDesktopBackground(url){
  var desktop=document.getElementById('desktop');
  if(!desktop) return;
  if(url){
    desktop.style.backgroundImage='url("'+url+'")';
    desktop.style.backgroundSize='cover';
    desktop.style.backgroundPosition='center';
    desktop.style.backgroundRepeat='no-repeat';
    desktop.style.backgroundAttachment='fixed';
  } else {
    desktop.style.backgroundImage='';
    desktop.style.backgroundRepeat='';
    desktop.style.backgroundAttachment='';
  }
  try{ localStorage.setItem('aviis_bg', url || ''); }catch(e){}
}
function resizeWallpaperImage(dataUrl, maxSide, callback){
  var img=new Image();
  img.onload=function(){
    var w=img.width, h=img.height;
    var scale=Math.min(1, maxSide / Math.max(w,h));
    var canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(w*scale));
    canvas.height=Math.max(1,Math.round(h*scale));
    var ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    var type=dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    var quality=type==='image/jpeg' ? 0.85 : 1.0;
    callback(canvas.toDataURL(type, quality));
  };
  img.src=dataUrl;
}
function initBackground(){
  var bg = localStorage.getItem('aviis_bg') || localStorage.getItem('webos_bg');
  if(bg){ if(!localStorage.getItem('aviis_bg')){ try{ localStorage.setItem('aviis_bg',bg); }catch(e){} } setDesktopBackground(bg); }
}
function initBrightness(){
  var val = Number(localStorage.getItem('aviis_brightness') || '100');
  var slider = document.getElementById('brightnessSlider');
  if(slider) slider.value = val;
  adjustBrightness(val);
}
function doTaskbarSearch(query){
  try{
    var q = String(query||'').trim();
    if(!q) return;
    var url = 'https://www.google.com/search?q=' + encodeURIComponent(q);
    window.open(url, '_blank');
    var inp = document.getElementById('taskbarSearchInput'); if(inp) inp.value = '';
  }catch(e){ console.error('search error',e); }
}
function adjustBrightness(value){
  var v = Number(value) || 100;
  var desktop = document.getElementById('desktop');
  if(desktop) desktop.style.filter = 'brightness(' + (v/100) + ')';
  try{ localStorage.setItem('aviis_brightness', String(v)); }catch(e){}
}
function loadBackground(event){
  var file = event.target.files && event.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ alert('Seleccioná una imagen válida.'); return; }
  var reader = new FileReader();
  reader.onload = function(){ resizeWallpaperImage(reader.result, 1920, function(resized){ setDesktopBackground(resized); }); };
  reader.readAsDataURL(file);
}
function resetBackground(){ setDesktopBackground(''); }
applyTheme(currentTheme);
initBackground();
initBrightness();
var DESKTOP_APPS=[
  {id:'mypc',label:'Mi PC',icon:'🖥️',window:'mypc',deletable:true},
  {id:'notepad',label:'Bloc de notas',icon:'📄',window:'notepad',deletable:true},
  {id:'spreadsheet',label:'Planilla',icon:'📈',window:'spreadsheet',deletable:true},
  {id:'network',label:'Redes',icon:'🌐',window:'network',deletable:true},
  {id:'printers',label:'Impresoras',icon:'🖨️',window:'printers',deletable:true},
  {id:'paint',label:'Paint',icon:'🎨',window:'paint',deletable:true},
  {id:'gamestore',label:'Games Store',icon:'🎮',window:'gamestore',deletable:true},
  {id:'ai',label:'Asistente IA',icon:'🤖',window:'ai',deletable:true},
  {id:'files',label:'Explorador',icon:'📁',window:'files',deletable:false},
  {id:'aviis',label:'Aviis',icon:'⬇️',window:'aviis',deletable:false},
  {id:'manual',label:'Manual',icon:'📘',window:'manual',deletable:false},
  {id:'trash',label:'Papelera',icon:'🗑️',window:'trash',deletable:false}
];
var dragState=null;
// Apps available in the store but not preinstalled on the desktop
var STORE_APPS = [
  {id:'dou',label:'dou',icon:'🐶',window:'dou',deletable:true,description:'A virtual pet game. Download and care for your pet.'},
  {id:'skane',label:'skane',icon:'🐾',window:'skane',deletable:true,description:'A cozy desktop companion inspired by early 2000s Tamagotchi vibes.'}
];
function updateStartButton(){
  var btn=document.getElementById('startBtn'); if(!btn) return;
  if(currentUser && currentUser.photo){ btn.innerHTML='<img class="startAvatar" src="'+currentUser.photo+'"> '+currentUser.fullname; }
  else if(currentUser){ btn.textContent='⊞ '+currentUser.fullname; }
  else { btn.textContent='⊞ Inicio'; }
}
function updateUserInStorage(user){
  var users=getUsers();
  var idx=users.findIndex(function(u){ return u.username===user.username; });
  if(idx>=0){ users[idx]=user; saveUsers(users); }
}
function saveCurrentUser(){ if(!currentUser) return; updateUserInStorage(currentUser); }
function ensureUserState(){ if(!currentUser) return; currentUser.desktopState=currentUser.desktopState||{grid:{},deleted:[],removed:[],installedApps:[],fileSystem:createDefaultFileSystem()}; if(currentUser.desktopState.positions && !currentUser.desktopState.grid){ currentUser.desktopState.grid={}; Object.keys(currentUser.desktopState.positions).forEach(function(appId){ var pos=currentUser.desktopState.positions[appId]; var cell=pixelsToCell(pos.left,pos.top); currentUser.desktopState.grid[appId]=cell; }); delete currentUser.desktopState.positions; } if(!Array.isArray(currentUser.desktopState.deleted)) currentUser.desktopState.deleted=[]; if(!Array.isArray(currentUser.desktopState.removed)) currentUser.desktopState.removed=[]; if(!Array.isArray(currentUser.desktopState.installedApps)) currentUser.desktopState.installedApps=[]; if(!currentUser.desktopState.fileSystem) currentUser.desktopState.fileSystem=createDefaultFileSystem(); saveCurrentUser(); }
function loadInstalledStoreApps(){ if(!currentUser) return; ensureUserState(); currentUser.desktopState.installedApps = currentUser.desktopState.installedApps||[]; currentUser.desktopState.installedApps.forEach(function(appId){ if(!DESKTOP_APPS.some(function(a){ return a.id===appId; })){ var app = STORE_APPS.find(function(s){ return s.id===appId; }); if(app){ DESKTOP_APPS.push({id:app.id,label:app.label,icon:app.icon,window:app.window,deletable:app.deletable}); } } }); }
function createDefaultFileSystem(){ var now=timestampNow(); return {name:'Mi PC',type:'folder',children:[{name:'Escritorio',type:'folder',children:[],createdAt:now,modifiedAt:now},{name:'Documentos',type:'folder',children:[{name:'Notas.txt',type:'file',content:'Bienvenido al Explorador de archivos de Aviis.\n\nUsá este espacio para crear carpetas y archivos.',createdAt:now,modifiedAt:now}],createdAt:now,modifiedAt:now},{name:'Imágenes',type:'folder',children:[],createdAt:now,modifiedAt:now},{name:'Descargas',type:'folder',children:[],createdAt:now,modifiedAt:now}],createdAt:now,modifiedAt:now}; }
function timestampNow(){ return new Date().toISOString(); }
function formatDate(value){ if(!value) return '--'; var d=new Date(value); return d.toLocaleString('es-AR',{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}); }
function ensureExplorerStructure(){ if(!currentUser) return; ensureUserState(); var root=currentUser.desktopState.fileSystem; if(!root || root.type!=='folder') return; var desk=root.children.find(function(child){ return child.type==='folder' && child.name==='Escritorio'; }); if(!desk){ desk={name:'Escritorio',type:'folder',children:[],createdAt:timestampNow(),modifiedAt:timestampNow()}; root.children.unshift(desk); } else { desk.children=desk.children||[]; if(!desk.createdAt) desk.createdAt=timestampNow(); if(!desk.modifiedAt) desk.modifiedAt=timestampNow(); desk.children=desk.children.filter(function(child){ return child.type!=='app'; }); } saveCurrentUser(); }
function syncDesktopFolderAppShortcuts(desk){ }
function getGridDimensions(){ var area=document.getElementById('desktopArea'); if(!area) return {cols:5,rows:4};
  var cellW=120, cellH=136;
  // smaller cell sizes on narrow screens for better fit
  if(window.innerWidth<=540){ cellW=96; cellH=116; }
  else if(window.innerWidth<=360){ cellW=80; cellH=100; }
  var cols=Math.max(3,Math.floor(area.clientWidth/cellW)); var rows=Math.max(3,Math.floor(area.clientHeight/cellH));
  return {cols:cols,rows:rows,cellW:cellW,cellH:cellH}; }
function cellToPixels(col,row){ var dims=getGridDimensions(); return {left:col*dims.cellW+24,top:row*dims.cellH+24}; }
function pixelsToCell(x,y){ var dims=getGridDimensions(); var col=Math.floor((x-24)/dims.cellW); var row=Math.floor((y-24)/dims.cellH); col=Math.max(0,Math.min(col,dims.cols-1)); row=Math.max(0,Math.min(row,dims.rows-1)); return {col:col,row:row}; }
function isGridCellFree(col,row){ ensureUserState(); var key=col+','+row; var occupied=Object.values(currentUser.desktopState.grid).filter(function(c){ return c.col===col && c.row===row; }); return occupied.length===0; }
function findFreeCellForApp(appId){ var dims=getGridDimensions(); var occupied=getOccupiedDesktopCells(appId); for(var r=0;r<dims.rows;r++){ for(var c=0;c<dims.cols;c++){ if(!occupied[c+','+r]) return {col:c,row:r}; } } return {col:0,row:0}; }
function getAppPosition(id){ ensureUserState(); return currentUser.desktopState.grid[id]; }
function saveAppPosition(id,col,row){ if(!currentUser || typeof col!=='number') return; ensureUserState(); var dims=getGridDimensions(); if(col>=dims.cols) col=dims.cols-1; if(row>=dims.rows) row=dims.rows-1; if(col<0) col=0; if(row<0) row=0; var occupied=getOccupiedDesktopCells(id); if(occupied[col+','+row]){ var newPos=findFreeCellForApp(id); if(newPos) { col=newPos.col; row=newPos.row; } } currentUser.desktopState.grid[id]={col:col,row:row}; saveCurrentUser(); }
function saveDesktopItemPosition(name,col,row){ if(!currentUser || typeof col!=='number') return; ensureUserState(); var desk=getDesktopFolder(); if(!desk||!desk.children) return; var item=desk.children.find(function(child){ return child.name===name; }); if(!item) return; var dims=getGridDimensions(); if(col>=dims.cols) col=dims.cols-1; if(row>=dims.rows) row=dims.rows-1; if(col<0) col=0; if(row<0) row=0; var occupied=getOccupiedDesktopCells(name); if(occupied[col+','+row]){ var free=findFreeCellForDesktopItem(name); col=free.col; row=free.row; } item.desktopPosition={col:col,row:row}; item.modifiedAt=timestampNow(); saveCurrentUser(); }
function deleteDesktopFile(event,name){ if(event){ event.stopPropagation(); } if(!confirm('Eliminar "'+name+'"?')) return; if(!currentUser) return; ensureUserState(); var desk=getDesktopFolder(); if(!desk||!desk.children) return; desk.children=desk.children.filter(function(child){ return child.name!==name; }); saveCurrentUser(); if(window.explorerPath && window.explorerPath.length===2 && window.explorerPath[1]==='Escritorio'){ buildFileExplorer(); } else { renderDesktopFiles(); } }
function getOccupiedDesktopCells(excludeName){ var occupied={}; ensureUserState(); DESKTOP_APPS.filter(function(app){ return !isAppUninstalled(app.id); }).forEach(function(app){ if(app.id!==excludeName){ var cell=getAppPosition(app.id); if(cell){ occupied[cell.col+','+cell.row]=true; } } }); var desk=getDesktopFolder(); if(desk && desk.children){ desk.children.forEach(function(item){ if(item.type!=='app' && item.name!==excludeName && item.desktopPosition && typeof item.desktopPosition.col==='number' && typeof item.desktopPosition.row==='number'){ occupied[item.desktopPosition.col+','+item.desktopPosition.row]=true; } }); } return occupied; }
function isDesktopCellOccupied(col,row,excludeName){ return !!getOccupiedDesktopCells(excludeName)[col+','+row]; }
function findFreeCellForDesktopItem(name){ var dims=getGridDimensions(); var occupied=getOccupiedDesktopCells(name); for(var r=0;r<dims.rows;r++){ for(var c=0;c<dims.cols;c++){ if(!occupied[c+','+r]) return {col:c,row:r}; } } return {col:0,row:0}; }
function isAppDeleted(id){ ensureUserState(); return currentUser.desktopState.deleted.includes(id); }
function isAppUninstalled(id){ ensureUserState(); return currentUser.desktopState.deleted.includes(id) || currentUser.desktopState.removed.includes(id); }
function deleteDesktopApp(id){ if(!currentUser) return; var app=DESKTOP_APPS.find(function(a){ return a.id===id; }); if(!app||!app.deletable) return; ensureUserState(); if(!currentUser.desktopState.deleted.includes(id)){ currentUser.desktopState.deleted.push(id); }
  currentUser.desktopState.removed=currentUser.desktopState.removed.filter(function(appId){ return appId!==id; });
  saveCurrentUser(); renderDesktopIcons(); buildTrash(); buildAviis();
}
function restoreApp(id){ if(!currentUser) return; ensureUserState(); currentUser.desktopState.deleted=currentUser.desktopState.deleted.filter(function(appId){ return appId!==id; }); currentUser.desktopState.removed=currentUser.desktopState.removed.filter(function(appId){ return appId!==id; });
  if(!getAppPosition(id)){
    var cell=findFreeCellForApp(id); saveAppPosition(id,cell.col,cell.row);
  }
  saveCurrentUser(); renderDesktopIcons(); buildTrash(); buildAviis(); }
function isOverBin(x,y){ var bin=document.querySelector('.desktopIcon[data-app="trash"]'); if(!bin) return false; var r=bin.getBoundingClientRect(); return x>=r.left && x<=r.right && y>=r.top && y<=r.bottom; }
function getDefaultAppPosition(index){ var dims=getGridDimensions(); var col=index%dims.cols; var row=Math.floor(index/dims.cols); return {col:col,row:row}; }
function initDesktopApps(){ var area=document.getElementById('desktopArea'); if(!area) return; loadInstalledStoreApps(); area.innerHTML=''; var wrapper=document.createElement('div'); wrapper.id='desktopIcons'; area.appendChild(wrapper); var filesWrapper=document.createElement('div'); filesWrapper.id='desktopFiles'; area.appendChild(filesWrapper); renderDesktopIcons(); renderDesktopFiles(); buildTrash(); buildAviis(); if(!window.aviisDesktopEvents){ window.aviisDesktopEvents=true; document.addEventListener('pointermove',desktopPointerMove); document.addEventListener('pointerup',desktopPointerUp); } }
function renderDesktopIcons(){ var area=document.getElementById('desktopArea'); if(!area) return; var wrapper=document.getElementById('desktopIcons'); if(!wrapper){ wrapper=document.createElement('div'); wrapper.id='desktopIcons'; area.appendChild(wrapper); }
  wrapper.innerHTML=''; if(!currentUser) return; ensureUserState(); var visibleApps=DESKTOP_APPS.filter(function(a){ return !isAppUninstalled(a.id); }); visibleApps.forEach(function(app,index){ var item=document.createElement('div'); item.className='desktopIcon'; item.dataset.app=app.id; item.dataset.open=app.window; item.innerHTML='<div class="iconImg">'+app.icon+'</div><span>'+app.label+'</span>'; var cell=getAppPosition(app.id); if(!cell){ cell=getDefaultAppPosition(index); saveAppPosition(app.id,cell.col,cell.row); } var px=cellToPixels(cell.col,cell.row); item.style.left=px.left+'px'; item.style.top=px.top+'px'; item.addEventListener('pointerdown',desktopItemDown); item.addEventListener('contextmenu',desktopIconContext); wrapper.appendChild(item); }); }
function getDesktopFolder(){ var root=currentUser.desktopState.fileSystem; if(!root||!root.children) return null; return root.children.find(function(child){ return child.type==='folder' && child.name==='Escritorio'; }); }
function renderDesktopFiles(){ var wrapper=document.getElementById('desktopFiles'); if(!wrapper || !currentUser) return; wrapper.innerHTML=''; var desk=getDesktopFolder(); if(!desk || !desk.children || !desk.children.length) return; var visibleItems=desk.children.filter(function(item){ return item.type!=='app'; }); if(!visibleItems.length) return; visibleItems.forEach(function(item,index){ var cols=4; var position=(item.desktopPosition && typeof item.desktopPosition.col==='number' && typeof item.desktopPosition.row==='number') ? item.desktopPosition : null; if(!position || isDesktopCellOccupied(position.col, position.row, item.name)){ position=findFreeCellForDesktopItem(item.name); item.desktopPosition=position; if(!item.createdAt) item.createdAt=timestampNow(); item.modifiedAt=timestampNow(); saveCurrentUser(); } var px=cellToPixels(position.col, position.row); var el=document.createElement('div'); el.className='desktopFileIcon'; el.dataset.name=item.name; el.dataset.type=item.type; el.style.left=px.left+'px'; el.style.top=px.top+'px'; var icon=item.type==='folder' ? '📁' : isImageFile(item) ? '🖼️' : '📄'; el.innerHTML='<div class="iconImg">'+icon+'</div><span>'+item.name+'</span>'; el.addEventListener('pointerdown',desktopItemDown); wrapper.appendChild(el); }); }
function openDesktopObject(name){ var desk=getDesktopFolder(); if(!desk||!desk.children) return; var item=desk.children.find(function(child){ return child.name===name; }); if(!item) return; if(item.type==='folder'){ openApp('files'); window.explorerPath=['Mi PC','Escritorio',item.name]; buildFileExplorer(); } else if(item.type==='app'){ openApp(item.appId); } else { openApp('files'); window.explorerPath=['Mi PC','Escritorio']; buildFileExplorer(); openExplorerItem(name); } }
function desktopItemDown(e){ if(e.button!==0) return; var el=e.currentTarget; e.preventDefault(); el.setPointerCapture && el.setPointerCapture(e.pointerId); dragState={el:el,startX:e.clientX,startY:e.clientY,origLeft:parseInt(el.style.left,10)||0,origTop:parseInt(el.style.top,10)||0,dragged:false}; }
function desktopPointerMove(e){ if(!dragState) return; var dx=e.clientX-dragState.startX, dy=e.clientY-dragState.startY; if(!dragState.dragged && Math.hypot(dx,dy)>8){ dragState.dragged=true; dragState.el.classList.add('dragging'); } if(dragState.dragged){ var newX=dragState.origLeft+dx, newY=dragState.origTop+dy; var cell=pixelsToCell(newX,newY); var px=cellToPixels(cell.col,cell.row); dragState.el.style.left=px.left+'px'; dragState.el.style.top=px.top+'px'; } }
function desktopPointerUp(e){ if(!dragState) return; if(dragState.dragged){ dragState.el.classList.remove('dragging'); var left=parseInt(dragState.el.style.left,10)||0; var top=parseInt(dragState.el.style.top,10)||0; var cell=pixelsToCell(left,top); if(dragState.el.dataset.app){ saveAppPosition(dragState.el.dataset.app, cell.col, cell.row); renderDesktopIcons(); if(isOverBin(e.clientX,e.clientY)){ deleteDesktopApp(dragState.el.dataset.app); } } else if(dragState.el.dataset.name){ saveDesktopItemPosition(dragState.el.dataset.name, cell.col, cell.row); renderDesktopFiles(); if(isOverBin(e.clientX,e.clientY)){ deleteDesktopFile(null, dragState.el.dataset.name); } } } else { if(dragState.el.dataset.open){ openApp(dragState.el.dataset.open); } else if(dragState.el.dataset.name){ openDesktopObject(dragState.el.dataset.name); } } dragState.el.releasePointerCapture && dragState.el.releasePointerCapture(e.pointerId); dragState=null; }
var selectedAppForContext=null;
function desktopIconContext(e){ e.preventDefault(); selectedAppForContext=e.currentTarget.dataset.app; var cm=document.getElementById('contextMenu'); cm.style.left=e.clientX+'px'; cm.style.top=e.clientY+'px'; cm.classList.remove('hidden'); }
function handleContextAction(action){ var app=DESKTOP_APPS.find(function(a){ return a.id===selectedAppForContext; }); if(!app) return; document.getElementById('contextMenu').classList.add('hidden'); if(action==='delete'){ deleteDesktopApp(selectedAppForContext); } else if(action==='permanent'){ if(confirm('¿Eliminar permanentemente "'+app.label+'" de tu sistema?')) removeAppForever(selectedAppForContext); } }
document.addEventListener('click',function(e){ if(e.target.closest('.contextMenu')===null && e.target.closest('.desktopIcon')===null){ document.getElementById('contextMenu').classList.add('hidden'); } });
function promptProfilePhoto(){ if(!selectedUser){ alert('Seleccioná un usuario primero.'); return; } var pass=prompt('Ingresá tu contraseña para cambiar la foto de perfil:'); if(pass===null) return; if(pass!==selectedUser.password){ alert('Contraseña incorrecta.'); return; } document.getElementById('profilePhotoUpload').click(); }
function uploadProfilePhoto(event){ var file=event.target.files && event.target.files[0]; if(!file) return; if(!file.type.startsWith('image/')){ alert('Seleccioná una imagen válida.'); return; } var reader=new FileReader(); reader.onload=function(){ if(!selectedUser) return; resizeProfileImage(reader.result, 140, file.type, function(resized){ selectedUser.photo=resized; updateUserInStorage(selectedUser); if(currentUser && currentUser.username===selectedUser.username){ currentUser.photo=resized; saveCurrentUser(); updateStartButton(); } renderUsersList(); openProfileSettings(); alert('✅ Foto de perfil actualizada.'); }); }; reader.readAsDataURL(file); }
function resizeProfileImage(dataUrl, maxSize, fileType, callback){ var img=new Image(); img.onload=function(){ var w=img.width, h=img.height; var scale=Math.min(1, maxSize/Math.max(w,h)); var canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(w*scale)); canvas.height=Math.max(1,Math.round(h*scale)); var ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height); var format=fileType==='image/png' ? 'image/png' : 'image/jpeg'; var quality=format==='image/jpeg' ? 0.82 : 1.0; callback(canvas.toDataURL(format, quality)); }; img.src=dataUrl; }
function buildTrash(){ var body=document.getElementById('trashBody'); if(!body) return; if(!currentUser){ body.innerHTML='<div style="padding:14px;color:#555">Iniciá sesión para ver la papelera.</div>'; return; } ensureUserState(); var offApps=DESKTOP_APPS.filter(function(app){ return isAppUninstalled(app.id); }); if(!offApps.length){ body.innerHTML='<div style="padding:14px;color:#555">La papelera está vacía.</div>'; return; } var html=''; html+='<div class="trashSection"><h4>Apps fuera del escritorio</h4>'; html+=offApps.map(function(app){ var trashed=currentUser.desktopState.deleted.includes(app.id); var status=trashed?'En papelera':'Eliminada permanentemente'; return '<div class="trashItem"><div><strong>'+app.label+'</strong><div class="trashStatus">'+status+'</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="appBtn pri" onclick="restoreApp(\''+app.id+'\')">Reinstalar</button>'+(trashed?'<button class="appBtn dng" onclick="confirmDeleteForever(\''+app.id+'\')">Eliminar</button>':'')+'</div></div>'; }).join(''); html+='</div>'; html+='<div class="trashActions"><button class="appBtn pri" onclick="restoreAllApps()">Restaurar todas las apps</button></div>'; body.innerHTML=html; }
function confirmDeleteForever(id){ if(!confirm('Eliminar permanentemente '+id+' de la papelera?')) return; removeAppForever(id); }
function removeAppForever(id){ if(!currentUser) return; ensureUserState(); if(!currentUser.desktopState.removed.includes(id)){ currentUser.desktopState.removed.push(id); } currentUser.desktopState.deleted=currentUser.desktopState.deleted.filter(function(appId){ return appId!==id; }); delete currentUser.desktopState.grid[id]; saveCurrentUser(); renderDesktopIcons(); buildTrash(); buildAviis(); }
function restoreAllApps(){ if(!currentUser) return; ensureUserState(); var ids=DESKTOP_APPS.filter(function(app){ return isAppUninstalled(app.id); }).map(function(app){ return app.id; }); ids.forEach(function(id){ restoreApp(id); }); }
function buildAviis(){ var body=document.getElementById('aviisBody'); if(!body) return; if(!currentUser){ body.innerHTML='<div style="padding:14px;color:#555">Iniciá sesión para usar Aviis.</div>'; return; } ensureUserState(); body.innerHTML=DESKTOP_APPS.filter(function(app){ return app.id!=='trash'; }).map(function(app){ if(app.id==='aviis'){ return '<div class="aviisCard"><div style="display:flex;align-items:center;gap:12px"><div class="iconImg">'+app.icon+'</div><div><strong>'+app.label+'</strong><p style="margin:4px 0 0;font-size:12px;color:#555;">Descargador de aplicaciones</p></div></div><button class="appBtn" onclick="openApp(\''+app.id+'\')">Abrir</button></div>'; } var uninstalled=isAppUninstalled(app.id); return '<div class="aviisCard"><div style="display:flex;align-items:center;gap:12px"><div class="iconImg">'+app.icon+'</div><div><strong>'+app.label+'</strong><p style="margin:4px 0 0;font-size:12px;color:#555;">'+(uninstalled?'No instalada — reinstálala desde aquí.':'Instalada en el escritorio.')+'</p></div></div><button class="appBtn '+(uninstalled?'pri':'')+'" onclick="'+(uninstalled?'restoreApp(\''+app.id+'\')':'openApp(\''+app.id+'\')')+'">'+(uninstalled?'Reinstalar':'Abrir')+'</button></div>'; }).join(''); }

// Start menu and manual integration
function toggleStartMenu(){ var m=document.getElementById('startMenu'); if(!m) return; if(m.classList.contains('hidden')){ ensureManualFile(); m.classList.remove('hidden'); document.addEventListener('click', startMenuClickOutside); } else { m.classList.add('hidden'); document.removeEventListener('click', startMenuClickOutside); } }
function startMenuClickOutside(e){ var m=document.getElementById('startMenu'); var btn=document.getElementById('startBtn'); if(!m) return; if(e.target===btn || btn.contains(e.target)) return; if(e.target.closest && e.target.closest('.startMenu')) return; m.classList.add('hidden'); document.removeEventListener('click', startMenuClickOutside); }
function openManualFromMenu(){ ensureManualFile(); // open the file in explorer
  // try to open the manual from Documents; if not found, open Explorer root
  var root=currentUser && currentUser.desktopState && currentUser.desktopState.fileSystem; if(!currentUser || !root){ openApp('files'); return; }
  // find manual path
  var docs = (root.children||[]).find(function(c){ return c.type==='folder' && c.name==='Documentos'; });
  if(docs && docs.children && docs.children.some(function(i){ return i.name==='Manual_de_usuario.txt'; })){ window.explorerPath=['Mi PC','Documentos']; openApp('files'); buildFileExplorer(); // open and select
    setTimeout(function(){ openExplorerItem('Manual_de_usuario.txt'); }, 150);
  } else { openApp('files'); }
}

function ensureManualFile(){ if(!currentUser) return; ensureUserState(); var root=currentUser.desktopState.fileSystem; if(!root) return; var docs = root.children.find(function(c){ return c.type==='folder' && c.name==='Documentos'; }); if(!docs){ docs={name:'Documentos',type:'folder',children:[],createdAt:timestampNow(),modifiedAt:timestampNow()}; root.children.push(docs); }
  if(!docs.children.some(function(i){ return i.name==='Manual_de_usuario.txt'; })){ docs.children.push({name:'Manual_de_usuario.txt',type:'file',content:'Manual de Usuario — Aviis Web OS\n\nInstrucciones paso a paso para empezar y usar el sistema.\n\nPaso 1 — Crear un perfil\n- Abre la pantalla de inicio. Pulsa "Crear perfil".\n- Completa: nombre completo, nombre de usuario (sin espacios) y contraseña.\n- Elige un avatar y confirma con "Crear perfil".\n- Resultado: el perfil queda guardado y el manual se añade a "Documentos" y al "Escritorio".\n\nPaso 2 — Iniciar sesión\n- En la pantalla principal selecciona tu perfil, escribe la contraseña y pulsa "Iniciar sesión".\n- Si olvidaste la contraseña, utiliza la opción de recuperación (si está disponible).\n\nPaso 3 — Familiarizarse con el Escritorio\n- Iconos: Haz doble clic en un icono para abrir la app o el archivo.\n- Mover iconos: Arrastra un icono para cambiar su lugar; su posición se guarda automáticamente.\n- Papelera: Arrastra un icono a la papelera para eliminarlo (puedes restaurarlo desde la Papelera si es posible).\n\nPaso 4 — Usar la Barra de tareas y el Menú inicio\n- Botón Inicio: Abre el menú principal para acceder a apps, manual y cerrar sesión.\n- Apps abiertas: Se muestran en la barra; haz clic para traerlas adelante.\n- Reloj/estado: Información en la esquina derecha.\n\nPaso 5 — Abrir y controlar ventanas\n- Abrir: Doble clic sobre app o desde el Store.\n- Controles de ventana (izquierda→derecha): minimizar `--`, maximizar `▢`, cerrar `X`.\n  - `--` Minimiza la ventana a la barra de tareas.\n  - `▢` Alterna tamaño maximizado/restaurado.\n  - `X` Cierra la ventana.\n- Mover: Arrastra la barra de título (tbar).\n- Redimensionar: Arrastra los bordes (si la ventana lo permite).\n\nPaso 6 — Instalar aplicaciones desde Games Store\n- Abre "Games Store" desde el Escritorio o Inicio.\n- Selecciona un juego y pulsa "Instalar" o "Descargar".\n- El icono se añadirá al Escritorio automáticamente.\n\nPaso 7 — Archivos y Explorador\n- Abrir Explorador: Doble clic en el icono "Explorador".\n- Crear/Guardar: Usa los botones dentro del Explorador o de cada app para crear y guardar archivos.\n- Buscar: Navega por carpetas y selecciona elementos para ver/abrir.\n\nPaso 8 — Aplicaciones principales\n- `dou`: Mascota virtual. Alimenta, juega y cuida su energía. Arrastra elementos para interactuar.\n- `Skane` (Snake): Controles con flechas o WASD. Come manzanas para crecer; evita chocar. El puntaje y el récord se guardan.\n\nPaso 9 — Uso en pantallas táctiles (móviles/tabletas)\n- Arrastrar ventanas: Mantén presionado y mueve por la pantalla.\n- Toques: Tap para abrir, doble tap si la acción lo requiere.\n- Recomendación: Usa orientación horizontal para una experiencia tipo escritorio.\n\nPaso 10 — Atajos y recomendaciones\n- Flechas / WASD: Movimiento en juegos.\n- Enter: Confirmar acciones o reiniciar algunos juegos.\n- Ctrl+S: Guardar en editores que soporten este atajo.\n\nPaso 11 — Solución de problemas rápida\n- No aparece un icono tras instalar: Recarga la página; la instalación usa `localStorage`.\n- App congelada: Cierra la ventana y ábrela de nuevo desde la barra de tareas.\n- Datos perdidos: Si limpias el almacenamiento del navegador, se perderán perfiles, apps y puntajes guardados.\n\nPaso 12 — Privacidad y compatibilidad\n- El sistema funciona localmente en tu navegador; la información se guarda en `localStorage`.\n- Usa un navegador moderno y mantén las pestañas actualizadas para mejor rendimiento.',createdAt:timestampNow(),modifiedAt:timestampNow() }); saveCurrentUser(); }
}

function buildGameStore(){ var body=document.getElementById('gamestoreBody'); if(!body) return; if(!currentUser){ body.innerHTML='<div style="padding:14px;color:#555">Please sign in to use Games Store.</div>'; return; } ensureUserState(); var apps = STORE_APPS; var html = apps.map(function(app){ var installed = DESKTOP_APPS.some(function(a){ return a.id===app.id; }); return '<div class="aviisCard"><div style="display:flex;align-items:center;gap:12px"><div class="iconImg">'+app.icon+'</div><div><strong>'+app.label+'</strong><p style="margin:4px 0 0;font-size:12px;color:#555;">'+(app.description||'')+'</p></div></div><div style="display:flex;gap:8px">'+(!installed?'<button class="appBtn pri" onclick="installGame(\''+app.id+'\')">Download</button>':'<button class="appBtn" onclick="openApp(\''+app.id+'\')">Open</button>')+(!installed?'<button class="appBtn dng" onclick="removeStoreApp(\''+app.id+'\')">Remove</button>':'')+'</div></div>'; }).join(''); body.innerHTML = html; }

function installGame(id){
  if(!currentUser){ alert('Sign in to install apps.'); return; }
  ensureUserState();
  if(DESKTOP_APPS.some(function(a){ return a.id===id; })){ alert('App already installed.'); return; }
  var app = STORE_APPS.find(function(a){ return a.id===id; });
  if(!app){ alert('App not found in store.'); return; }
  var desktopApp = {id:app.id,label:app.label,icon:app.icon,window:app.window,deletable:app.deletable};
  DESKTOP_APPS.push(desktopApp);
  if(!currentUser.desktopState.grid){ currentUser.desktopState.grid={}; }
  currentUser.desktopState.installedApps = currentUser.desktopState.installedApps||[];
  if(currentUser.desktopState.installedApps.indexOf(id)===-1){ currentUser.desktopState.installedApps.push(id); }
  var cell = findFreeCellForApp(id);
  if(!cell){ cell = {col:0,row:0}; }
  saveAppPosition(id, cell.col, cell.row);
  saveCurrentUser();
  if(!document.getElementById('desktopIcons')){ initDesktopApps(); } else { renderDesktopIcons(); }
  buildGameStore();
  alert('Installed '+app.label+' to your desktop.');
}

function removeStoreApp(id){
  // remove from store listing (doesn't uninstall if already installed)
  STORE_APPS = STORE_APPS.filter(function(a){ return a.id!==id; });
  buildGameStore();
}

function buildImageGallery(folder){ var images = (folder.children||[]).filter(function(item){ return isImageFile(item); }); if(images.length===0){ return '<div style="padding:14px;color:#555">No hay imágenes en esta carpeta.</div>'; } return '<div class="feImageGallery">'+images.map(function(img){ var safeName="'"+escapeJSString(img.name)+"'"; return '<div class="feThumb" onclick="openExplorerItem('+safeName+')"><img src="'+img.content+'" alt="'+img.name+'"><div class="feThumbLabel">'+img.name+'</div></div>'; }).join('')+'</div>'; }
function buildFileExplorer(){ if(!currentUser) return; ensureExplorerStructure(); if(!window.explorerPath || !Array.isArray(window.explorerPath) || window.explorerPath.length===0) window.explorerPath=['Mi PC']; var node=getNodeByPath(window.explorerPath); if(!node){ window.explorerPath=['Mi PC']; node=getNodeByPath(window.explorerPath); } document.getElementById('feBreadcrumb').innerHTML=window.explorerPath.map(function(p,i){ return '<span class="feCrumb" onclick="changeDirectory('+i+')">'+p+'</span>'; }).join(' <span style="color:#999">/</span> '); document.getElementById('feTree').innerHTML=renderFileTree(currentUser.desktopState.fileSystem,0); if(node.name==='Imágenes'){ document.getElementById('feList').innerHTML=buildImageGallery(node); } else { document.getElementById('feList').innerHTML=renderFileList(node); } document.getElementById('fePreview').innerHTML='Seleccioná un archivo para ver detalles.'; renderDesktopFiles(); }
function renderFileTree(node,depth){ var html=''; if(node.type==='folder'){ var path="'"+escapeJSString(getNodePath(node))+"'"; html+='<div class="feTreeNode" style="padding-left:'+ (depth*12) +'px;" onclick="navigateToNode('+path+')">'+(depth===0?'📁':'📂')+' '+node.name+'</div>'; if(node.children){ node.children.forEach(function(child){ if(child.type==='folder'){ html+=renderFileTree(child,depth+1); } }); } } return html; }
function getNodeByPath(path){ var node=currentUser.desktopState.fileSystem; for(var i=1;i<path.length;i++){ if(!node.children) return null; node=node.children.find(function(child){ return child.name===path[i]; }); if(!node) return null; } return node; }
function getNodePath(node){ var path=[]; function walk(current, target, stack){ if(current===target){ path=stack.slice(); return true; } if(current.children){ for(var i=0;i<current.children.length;i++){ if(walk(current.children[i],target,stack.concat([current.children[i].name]))) return true; } } return false; }
  walk(currentUser.desktopState.fileSystem, node, ['Mi PC']); return path.join('/'); }
function changeDirectory(index){ if(!window.explorerPath) return; window.explorerPath=window.explorerPath.slice(0,index+1); buildFileExplorer(); }
function navigateToNode(path){ var names=path.split('/'); if(names[0]!=='Mi PC') return; window.explorerPath=names; buildFileExplorer(); }
function escapeJSString(value){ return String(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n').replace(/\r/g,'\\r'); }
function explorerRowClick(e,name){ if(e.target.closest('button')) return; openExplorerItem(name); }
function renderFileList(folder){ if(!folder.children || !folder.children.length) return '<div style="padding:14px;color:#555">Vacío</div>'; return folder.children.map(function(item){ var safeName="'"+escapeJSString(item.name)+"'"; var label=item.name; if(item.type==='app' && item.icon){ label='<span class="feIcon">'+item.icon+'</span> <strong>'+item.name+'</strong>'; } var sizeText='--'; if(item.type==='file'){ if(item.isBinary){ sizeText=item.size?formatBytes(item.size):'—'; } else { sizeText=formatBytes(item.content?item.content.length:0); } } return '<div class="feRow" onclick="explorerRowClick(event,'+safeName+')">'+
    '<div class="feCell">'+(item.type==='folder'?'📁': item.type==='app'?'⚙️':'📄')+' '+label+'</div>'+ 
    '<div class="feCell">'+(item.type==='folder'?'Carpeta':item.type==='app'?'Aplicación':'Archivo')+'</div>'+ 
    '<div class="feCell">'+sizeText+'</div>'+ 
    '<div class="feCell">'+formatDate(item.modifiedAt || item.createdAt)+'</div>'+ 
    '<div class="feCell"><button class="appBtn" onclick="openExplorerItem('+safeName+')">Abrir</button><button class="appBtn dng" onclick="deleteExplorerItem('+safeName+')">Eliminar</button><button class="appBtn" onclick="renameExplorerItem('+safeName+')">Renombrar</button></div>'+ 
    '</div>'; }).join(''); }
function isEditableFile(item){ return item.type==='file' && (!item.isBinary || (item.mimeType && item.mimeType.startsWith('text/'))); }
function isImageFile(item){ return item.type==='file' && item.mimeType && item.mimeType.startsWith('image/'); }
function openExplorerItem(name){ var parent=getNodeByPath(window.explorerPath); if(!parent||!parent.children) return; var item=parent.children.find(function(child){ return child.name===name; }); if(!item) return; if(item.type==='folder'){ window.explorerPath.push(item.name); buildFileExplorer(); } else if(item.type==='app'){ openApp(item.appId); } else { var safeName="'"+escapeJSString(name)+"'"; item.modifiedAt=item.modifiedAt||item.createdAt||timestampNow(); var contentHtml=''; if(isImageFile(item)){ contentHtml='<div style="text-align:center;"><img src="'+item.content+'" alt="'+item.name+'" class="feImagePreview"></div>'; } else if(isEditableFile(item)){ var text=item.content||''; contentHtml='<textarea id="feFileContent" style="width:100%;height:180px;padding:10px;resize:none;border:1px solid #ccc;border-radius:10px;">'+text+'</textarea>'; } else { contentHtml='<div style="padding:12px;border:1px solid #ccc;border-radius:10px;background:#f8fafc;color:#334155;min-height:180px;line-height:1.6;">Este archivo no se puede editar en el Explorador.</div>'; } var actionButtons = ''; if(isEditableFile(item)){ actionButtons += '<button class="appBtn pri" onclick="saveExplorerFile('+safeName+')">Guardar</button>'; } actionButtons += '<button class="appBtn" onclick="downloadExplorerFile('+safeName+')">Descargar</button>'; document.getElementById('fePreview').innerHTML='<div class="fePreviewHeader"><strong>'+item.name+'</strong></div><div class="feMeta">Tipo: '+(item.type==='file'?'Archivo':'Elemento')+' • Última modificación: '+formatDate(item.modifiedAt)+'</div>'+contentHtml+'<div style="margin-top:10px;display:flex;gap:10px">'+actionButtons+'</div>'; } }

// small helper to escape HTML when rendering plain text
function escapeHtml(str){ if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\'/g,"&#39;"); }
function createFolder(){ var name=prompt('Nombre de la nueva carpeta:'); if(!name) return; if(/[\\/]/.test(name)){ alert('El nombre no puede contener / ni \\'); return; } var parent=getNodeByPath(window.explorerPath); if(!parent||!parent.children) return; if(parent.children.find(function(child){ return child.name===name; })){ alert('Ya existe un elemento con ese nombre.'); return; } parent.children.push({name:name,type:'folder',children:[],createdAt:timestampNow(),modifiedAt:timestampNow()}); saveCurrentUser(); buildFileExplorer(); }
function createFile(){ var name=prompt('Nombre del archivo (incluye extensión):','Nuevo documento.txt'); if(!name) return; if(/[\\/]/.test(name)){ alert('El nombre no puede contener / ni \\'); return; } var parent=getNodeByPath(window.explorerPath); if(!parent||!parent.children) return; if(parent.children.find(function(child){ return child.name===name; })){ alert('Ya existe un elemento con ese nombre.'); return; } parent.children.push({name:name,type:'file',content:'',createdAt:timestampNow(),modifiedAt:timestampNow()}); saveCurrentUser(); buildFileExplorer(); }
function deleteExplorerItem(name){ if(!confirm('Eliminar "'+name+'"?')) return; var parent=getNodeByPath(window.explorerPath); if(!parent||!parent.children) return; parent.children=parent.children.filter(function(child){ return child.name!==name; }); saveCurrentUser(); buildFileExplorer(); if(window.explorerPath.length===2 && window.explorerPath[1]==='Escritorio'){ renderDesktopFiles(); } }
function renameExplorerItem(name){ var parent=getNodeByPath(window.explorerPath); if(!parent||!parent.children) return; var item=parent.children.find(function(child){ return child.name===name; }); if(!item) return; var newName=prompt('Nuevo nombre para "'+name+'":',name); if(!newName||newName===name) return; if(/[\\/]/.test(newName)){ alert('El nombre no puede contener / ni \\'); return; } if(parent.children.find(function(child){ return child.name===newName; })){ alert('Ya existe ese nombre.'); return; } item.name=newName; item.modifiedAt=timestampNow(); saveCurrentUser(); buildFileExplorer(); if(window.explorerPath.length===2 && window.explorerPath[1]==='Escritorio'){ renderDesktopFiles(); } }
function saveExplorerFile(name){ var parent=getNodeByPath(window.explorerPath); if(!parent||!parent.children) return; var item=parent.children.find(function(child){ return child.name===name; }); if(!item||item.type!=='file') return; if(!isEditableFile(item)){ alert('Este archivo no se puede editar desde aquí.'); return; } var textarea=document.getElementById('feFileContent'); if(textarea){ item.content=textarea.value; item.modifiedAt=timestampNow(); saveCurrentUser(); alert('Archivo guardado.'); } }
function downloadExplorerFile(name){ var parent=getNodeByPath(window.explorerPath); if(!parent||!parent.children) return; var item=parent.children.find(function(child){ return child.name===name; }); if(!item||item.type!=='file') return; var blob; if(item.isBinary && item.content && item.content.startsWith('data:')){ var parts=item.content.split(','); var meta=parts[0].match(/data:(.*?);base64/); var data=parts[1]; var byteChars=atob(data); var byteNumbers=new Array(byteChars.length); for(var i=0;i<byteChars.length;i++){ byteNumbers[i]=byteChars.charCodeAt(i); } var byteArray=new Uint8Array(byteNumbers); blob=new Blob([byteArray],{type:item.mimeType||'application/octet-stream'}); } else { blob=new Blob([item.content||''],{type:item.mimeType||'text/plain'}); } var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download=item.name; a.click(); URL.revokeObjectURL(url); }
function readExplorerFile(file, callback){ var reader=new FileReader(); if(file.type.startsWith('text/') || file.type==='application/json' || file.type==='application/javascript' || file.type==='application/xml'){ reader.onload=function(){ callback({content:reader.result,mimeType:file.type||'text/plain',isBinary:false,size:file.size}); }; reader.readAsText(file); } else { reader.onload=function(){ callback({content:reader.result,mimeType:file.type||'application/octet-stream',isBinary:true,size:file.size}); }; reader.readAsDataURL(file); } }
function uploadFileToExplorer(event){ var files=event.target.files; if(!files||!files.length) return; var parent=getNodeByPath(window.explorerPath); if(!parent||!parent.children) return; Array.from(files).forEach(function(file){ readExplorerFile(file,function(fileData){ var name=file.name; if(parent.children.find(function(child){ return child.name===name; })){ name='Copia de '+name; } parent.children.push({name:name,type:'file',content:fileData.content,mimeType:fileData.mimeType,isBinary:fileData.isBinary,createdAt:timestampNow(),modifiedAt:timestampNow(),size:fileData.size}); saveCurrentUser(); buildFileExplorer(); if(window.explorerPath.length===2 && window.explorerPath[1]==='Escritorio'){ renderDesktopFiles(); } }); }); event.target.value=''; }
function formatBytes(bytes){ if(typeof bytes!=='number') return '0 B'; if(bytes===0) return '0 B'; var sizes=['B','KB','MB','GB','TB']; var i=Math.floor(Math.log(bytes)/Math.log(1024)); return (bytes/Math.pow(1024,i)).toFixed(1)+' '+sizes[i]; }

// ─── AUTH ───
var STORAGE_KEY='aviis_users', currentUser=null, selectedUser=null;
function getUsers(){ try{ var data = localStorage.getItem(STORAGE_KEY);
    if(!data){ var legacy = localStorage.getItem('webos_users'); if(legacy){ localStorage.setItem(STORAGE_KEY,legacy); localStorage.removeItem('webos_users'); data = legacy; } }
    return JSON.parse(data)||[]; }catch(e){ return []; } }
function saveUsers(u){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(u)); }catch(e){} }
var selectedAv='👤';
function pickAv(el){
  document.querySelectorAll('.avatarOpt').forEach(function(e){ e.classList.remove('picked'); });
  el.classList.add('picked'); selectedAv=el.getAttribute('data-av');
}
function showTab(t){
  document.getElementById('tabLogin').className='tabBtn'+(t==='login'?' on':'');
  document.getElementById('tabReg').className='tabBtn'+(t==='register'?' on':'');
  document.getElementById('panelLogin').style.display=t==='login'?'':'none';
  document.getElementById('panelReg').style.display=t==='register'?'':'none';
  if(t==='login') renderUsersList();
}
function renderUsersList(){
  var users=getUsers(), box=document.getElementById('usersList');
  if(!users.length){ box.innerHTML='<div style="color:rgba(255,255,255,0.35);font-size:12px;padding:10px 0 14px;text-align:center">No hay perfiles creados.<br>Creá uno en "Crear perfil".</div>'; selectedUser=null; return; }
  box.innerHTML=users.map(function(u,i){
    var avatarHtml = u.photo ? '<img class="userAvatarImg" src="'+u.photo+'">' : u.avatar;
    return '<div class="userCard" id="uc'+i+'" onclick="selectUser('+i+')">'+
      '<div class="userAvatar">'+avatarHtml+'</div>'+
      '<div class="userInfo"><div class="userName">'+u.fullname+'</div><div class="userSub">@'+u.username+'</div></div>'+ 
      '<button class="userSettingsBtn" onclick="editUserSettings('+i+',event)">⚙️</button>'+ 
      '</div>';
  }).join('');
  selectUser(0);
}
function selectUser(i){
  document.querySelectorAll('.userCard').forEach(function(c){ c.classList.remove('sel'); });
  var card=document.getElementById('uc'+i);
  if(card){ card.classList.add('sel'); selectedUser=getUsers()[i]; }
}
function editUserSettings(index,event){
  event.stopPropagation();
  var users=getUsers();
  if(index<0||index>=users.length) return;
  selectedUser=users[index];
  selectUser(index);
  var pass=prompt('Ingresá tu contraseña para acceder a la configuración:');
  if(pass===null) return;
  if(pass!==selectedUser.password){ alert('Contraseña incorrecta.'); return; }
  openProfileSettings();
}
function openProfileSettings(){
  var modal=document.getElementById('profileSettingsModal');
  var content=document.getElementById('profileSettingsContent');
  if(!modal || !content || !selectedUser) return;
  content.innerHTML = '<div class="profileSettingsField"><strong>'+selectedUser.fullname+'</strong><div class="userSub">@'+selectedUser.username+'</div></div>' +
    '<div class="profileSettingsActions">' +
    '<button class="appBtn pri" onclick="changeUserName()">Cambiar nombre</button>' +
    '<button class="appBtn" onclick="changeUserPassword()">Cambiar contraseña</button>' +
    '<button class="appBtn" onclick="triggerProfilePhotoUpload()">Subir foto de perfil</button>' +
    '<button class="appBtn dng" onclick="deleteCurrentProfile()">Eliminar perfil</button>' +
    '</div>';
  modal.classList.remove('hidden');
}
function closeProfileSettings(){
  var modal=document.getElementById('profileSettingsModal');
  if(modal) modal.classList.add('hidden');
}
function changeUserName(){
  if(!selectedUser) return;
  var newName=prompt('Nuevo nombre completo:', selectedUser.fullname);
  if(!newName||newName===selectedUser.fullname) return;
  selectedUser.fullname=newName;
  updateUserInStorage(selectedUser);
  if(currentUser && currentUser.username===selectedUser.username){ currentUser.fullname=newName; saveCurrentUser(); updateStartButton(); }
  renderUsersList();
  openProfileSettings();
}
function changeUserPassword(){
  if(!selectedUser) return;
  var current=prompt('Contraseña actual:');
  if(current===null) return;
  if(current!==selectedUser.password){ alert('Contraseña incorrecta.'); return; }
  var pass=prompt('Nueva contraseña (mínimo 4 caracteres):');
  if(pass===null) return;
  if(pass.length<4){ alert('La contraseña debe tener al menos 4 caracteres.'); return; }
  var pass2=prompt('Repetir nueva contraseña:');
  if(pass2!==pass){ alert('Las contraseñas no coinciden.'); return; }
  selectedUser.password=pass;
  updateUserInStorage(selectedUser);
  alert('Contraseña actualizada.');
  openProfileSettings();
}
function triggerProfilePhotoUpload(){
  if(!selectedUser){ alert('Seleccioná un usuario.'); return; }
  document.getElementById('profilePhotoUpload').click();
}
function deleteCurrentProfile(){
  if(!selectedUser) return;
  if(!confirm('¿Eliminar el perfil de "'+selectedUser.fullname+'"? Esta acción no se puede deshacer.')) return;
  var username=selectedUser.username;
  var users=getUsers().filter(function(u){ return u.username!==username; });
  saveUsers(users);
  if(currentUser && currentUser.username===username){ currentUser=null; document.querySelectorAll('.win').forEach(function(w){ w.classList.add('hidden'); }); document.getElementById('desktop').classList.add('hidden'); document.getElementById('loginScreen').classList.remove('hidden'); updateStartButton(); }
  selectedUser=null;
  closeProfileSettings();
  renderUsersList();
  alert('El perfil ha sido eliminado.');
}
function doLogin(){
  var err=document.getElementById('loginError');
  if(!selectedUser){ err.textContent='Seleccioná un usuario.'; return; }
  var pass=document.getElementById('lp').value;
  if(pass===selectedUser.password){
    err.textContent=''; currentUser=selectedUser;
    document.getElementById('lp').value='';
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('desktop').classList.remove('hidden');
    document.getElementById('startBtn').textContent='⊞ '+currentUser.fullname;
    ensureUserState(); loadInstalledStoreApps(); updateStartButton(); initDesktopApps();
    startClock(); buildPC(); buildNet(); buildPrinters(); buildSheet();
  } else {
    err.textContent='❌ Contraseña incorrecta.';
    document.getElementById('lp').value=''; document.getElementById('lp').focus();
  }
}
function doRegister(){
  var err=document.getElementById('regError'), ok=document.getElementById('regSuccess');
  err.textContent=''; ok.textContent='';
  var fullname=document.getElementById('rName').value.trim();
  var username=document.getElementById('rUser').value.trim().toLowerCase().replace(/\s+/g,'');
  var pass=document.getElementById('rPass').value, pass2=document.getElementById('rPass2').value;
  if(!fullname){ err.textContent='Ingresá tu nombre completo.'; return; }
  if(!username||username.length<3){ err.textContent='El usuario debe tener al menos 3 caracteres.'; return; }
  if(pass.length<4){ err.textContent='La contraseña debe tener al menos 4 caracteres.'; return; }
  if(pass!==pass2){ err.textContent='Las contraseñas no coinciden.'; return; }
  var users=getUsers();
  if(users.find(function(u){ return u.username===username; })){ err.textContent='Ese nombre de usuario ya existe.'; return; }
  // prepare default filesystem and add manual + desktop shortcut
  var fs = createDefaultFileSystem();
  var docs = fs.children.find(function(c){ return c.type==='folder' && c.name==='Documentos'; });
  if(!docs){ docs={name:'Documentos',type:'folder',children:[],createdAt:timestampNow(),modifiedAt:timestampNow()}; fs.children.push(docs); }
  var manualContent = 'Manual de Usuario — Aviis Web OS\n\nInstrucciones paso a paso para empezar y usar el sistema.\n\nPaso 1 — Crear un perfil\n- Abre la pantalla de inicio. Pulsa "Crear perfil".\n- Completa: nombre completo, nombre de usuario (sin espacios) y contraseña.\n- Elige un avatar y confirma con "Crear perfil".\n- Resultado: el perfil queda guardado y el manual se añade a "Documentos" y al "Escritorio".\n\nPaso 2 — Iniciar sesión\n- En la pantalla principal selecciona tu perfil, escribe la contraseña y pulsa "Iniciar sesión".\n- Si olvidaste la contraseña, utiliza la opción de recuperación (si está disponible).\n\nPaso 3 — Familiarizarse con el Escritorio\n- Iconos: Haz doble clic en un icono para abrir la app o el archivo.\n- Mover iconos: Arrastra un icono para cambiar su lugar; su posición se guarda automáticamente.\n- Papelera: Arrastra un icono a la papelera para eliminarlo (puedes restaurarlo desde la Papelera si es posible).\n\nPaso 4 — Usar la Barra de tareas y el Menú inicio\n- Botón Inicio: Abre el menú principal para acceder a apps, manual y cerrar sesión.\n- Apps abiertas: Se muestran en la barra; haz clic para traerlas adelante.\n- Reloj/estado: Información en la esquina derecha.\n\nPaso 5 — Abrir y controlar ventanas\n- Abrir: Doble clic sobre app o desde el Store.\n- Controles de ventana (izquierda→derecha): minimizar `--`, maximizar `▢`, cerrar `X`.\n  - `--` Minimiza la ventana a la barra de tareas.\n  - `▢` Alterna tamaño maximizado/restaurado.\n  - `X` Cierra la ventana.\n- Mover: Arrastra la barra de título (tbar).\n- Redimensionar: Arrastra los bordes (si la ventana lo permite).\n\nPaso 6 — Instalar aplicaciones desde Games Store\n- Abre "Games Store" desde el Escritorio o Inicio.\n- Selecciona un juego y pulsa "Instalar" o "Descargar".\n- El icono se añadirá al Escritorio automáticamente.\n\nPaso 7 — Archivos y Explorador\n- Abrir Explorador: Doble clic en el icono "Explorador".\n- Crear/Guardar: Usa los botones dentro del Explorador o de cada app para crear y guardar archivos.\n- Buscar: Navega por carpetas y selecciona elementos para ver/abrir.\n\nPaso 8 — Aplicaciones principales\n- `dou`: Mascota virtual. Alimenta, juega y cuida su energía. Arrastra elementos para interactuar.\n- `Skane` (Snake): Controles con flechas o WASD. Come manzanas para crecer; evita chocar. El puntaje y el récord se guardan.\n\nPaso 9 — Uso en pantallas táctiles (móviles/tabletas)\n- Arrastrar ventanas: Mantén presionado y mueve por la pantalla.\n- Toques: Tap para abrir, doble tap si la acción lo requiere.\n- Recomendación: Usa orientación horizontal para una experiencia tipo escritorio.\n\nPaso 10 — Atajos y recomendaciones\n- Flechas / WASD: Movimiento en juegos.\n- Enter: Confirmar acciones o reiniciar algunos juegos.\n- Ctrl+S: Guardar en editores que soporten este atajo.\n\nPaso 11 — Solución de problemas rápida\n- No aparece un icono tras instalar: Recarga la página; la instalación usa `localStorage`.\n- App congelada: Cierra la ventana y ábrela de nuevo desde la barra de tareas.\n- Datos perdidos: Si limpias el almacenamiento del navegador, se perderán perfiles, apps y puntajes guardados.\n\nPaso 12 — Privacidad y compatibilidad\n- El sistema funciona localmente en tu navegador; la información se guarda en `localStorage`.\n- Usa un navegador moderno y mantén las pestañas actualizadas para mejor rendimiento.';
  docs.children.push({name:'Manual_de_usuario.txt',type:'file',content:manualContent,createdAt:timestampNow(),modifiedAt:timestampNow()});
  // add desktop shortcut inside Escritorio
  var desk = fs.children.find(function(c){ return c.type==='folder' && c.name==='Escritorio'; });
  if(!desk){ desk={name:'Escritorio',type:'folder',children:[],createdAt:timestampNow(),modifiedAt:timestampNow()}; fs.children.unshift(desk); }
  desk.children.push({name:'Manual_de_usuario.txt',type:'file',content:manualContent,createdAt:timestampNow(),modifiedAt:timestampNow(),desktopPosition:null});

  users.push({fullname:fullname,username:username,password:pass,avatar:selectedAv,created:new Date().toLocaleDateString('es-AR'),desktopState:{positions:{},deleted:[],fileSystem:fs}});
  saveUsers(users); ok.textContent='✅ Perfil creado. Manual agregado a Documentos y Escritorio.';
  document.getElementById('rName').value=''; document.getElementById('rUser').value='';
  document.getElementById('rPass').value=''; document.getElementById('rPass2').value='';
  setTimeout(function(){ showTab('login'); ok.textContent=''; },1500);
}
document.getElementById('lp').addEventListener('keydown',function(e){ if(e.key==='Enter') doLogin(); });
document.getElementById('rPass2').addEventListener('keydown',function(e){ if(e.key==='Enter') doRegister(); });
renderUsersList();
mountDouApp();
mountSkaneApp();

var DOU_STATE_KEY='dou_pet_state';
function loadDouState(){
  try{ var data=localStorage.getItem(DOU_STATE_KEY); if(data){ var parsed=JSON.parse(data); return Object.assign({hunger:90,energy:92,happiness:88,lastAction:'hello'}, parsed); } }catch(e){}
  return {hunger:90,energy:92,happiness:88,lastAction:'hello'};
}
function saveDouState(state){ try{ localStorage.setItem(DOU_STATE_KEY, JSON.stringify(state)); }catch(e){} }
function clamp100(value){ return Math.min(100, Math.max(0, value)); }
function getDouMood(state){ if(state.energy<24) return 'sleepy'; if(state.hunger<24) return 'hungry'; if(state.happiness<34) return 'sad'; var average=(state.hunger+state.energy+state.happiness)/3; return average>72 ? 'happy' : 'content'; }
function getDouMessage(mood, action){ if(action==='feed') return '¡Gracias por la comida!'; if(action==='play') return '¡Juguemos!'; if(action==='sleep') return 'Zzz... qué rico.'; if(action==='pet') return '¡Mimo recibido!'; if(mood==='hungry') return 'Tengo hambre...'; if(mood==='sleepy') return 'Estoy con sueño...'; if(mood==='sad') return 'Necesito un abrazo.'; return 'Me siento genial :)'; }
function getMouthClass(mood){ if(mood==='happy') return 'happy'; if(mood==='sleepy' || mood==='hungry' || mood==='sad') return 'sad'; return 'playful'; }
function mountDouApp(){
  var rootEl=document.getElementById('douAppRoot'); if(!rootEl || !window.React || !window.ReactDOM) return;
  var root=window.ReactDOM.createRoot(rootEl);
  var useState=window.React.useState;
  var useEffect=window.React.useEffect;
  var useRef=window.React.useRef;

  function DouScene(){
    var foodItems=[
      {id:'meat',emoji:'🍖',x:24,y:228},
      {id:'apple',emoji:'🍎',x:88,y:228},
      {id:'cookie',emoji:'🍪',x:152,y:228}
    ];
    var initial=loadDouState();
    var stateHook=useState(initial); var state=stateHook[0], setState=stateHook[1];
    var noteHook=useState('Arrastrá uno de los alimentos hasta su boca.'); var note=noteHook[0], setNote=noteHook[1];
    var foodHook=useState(foodItems); var foods=foodHook[0], setFoods=foodHook[1];
    var ballHook=useState({x:32,y:24,vx:1.9,vy:1.5}); var ball=ballHook[0], setBall=ballHook[1];
    var shakeHook=useState(false); var shake=shakeHook[0], setShake=shakeHook[1];
    var containerRef=useRef(null); var petRef=useRef(null); var dragRef=useRef({active:false,offsetX:0,offsetY:0,itemId:null});

    useEffect(function(){ saveDouState(state); }, [state]);
    useEffect(function(){ var tick=function(){ setState(function(prev){ return { hunger: clamp100(prev.hunger-4), energy: clamp100(prev.energy-3), happiness: clamp100(prev.happiness-2), lastAction: prev.lastAction }; }); }; var timer=setInterval(tick,7200); return function(){ clearInterval(timer); }; }, []);
    useEffect(function(){ if(!note) return function(){}; var timer=setTimeout(function(){ setNote(''); }, 3200); return function(){ clearTimeout(timer); }; }, [note]);
    useEffect(function(){ if(!shake) return function(){}; var timer=setTimeout(function(){ setShake(false); }, 280); return function(){ clearTimeout(timer); }; }, [shake]);
    useEffect(function(){ var interval=setInterval(function(){ setBall(function(prev){ var nextX=prev.x+prev.vx, nextY=prev.y+prev.vy, nextVx=prev.vx, nextVy=prev.vy; if(nextX<=8||nextX>=214){ nextVx=-nextVx; nextX=Math.max(8, Math.min(nextX,214)); } if(nextY<=10||nextY>=118){ nextVy=-nextVy; nextY=Math.max(10, Math.min(nextY,118)); } return {x:nextX,y:nextY,vx:nextVx,vy:nextVy}; }); }, 28); return function(){ clearInterval(interval); }; }, []);
    useEffect(function(){ return function(){ document.removeEventListener('pointermove',onPointerMove); document.removeEventListener('pointerup',onPointerUp); document.removeEventListener('mousemove',onPointerMove); document.removeEventListener('mouseup',onPointerUp); document.body.style.userSelect=''; }; });

    var mood=getDouMood(state);
    var message=getDouMessage(mood, state.lastAction);
    var mouthClass=getMouthClass(mood) + ((foods.some(function(item){ return item.dragging; })) || state.lastAction==='feed' ? ' open' : '');

    var resetFoods=function(){ setFoods(foodItems); };
    var handleAction=function(type){ setState(function(prev){ var next={hunger:prev.hunger,energy:prev.energy,happiness:prev.happiness,lastAction:type}; if(type==='feed'){ next.hunger=clamp100(prev.hunger+18); next.energy=clamp100(prev.energy+6); next.happiness=clamp100(prev.happiness+8); } else if(type==='play'){ next.happiness=clamp100(prev.happiness+18); next.energy=clamp100(prev.energy-10); next.hunger=clamp100(prev.hunger-10); } else if(type==='sleep'){ next.energy=clamp100(prev.energy+28); next.hunger=clamp100(prev.hunger-12); next.happiness=clamp100(prev.happiness+9); } else if(type==='pet'){ next.happiness=clamp100(prev.happiness+10); next.energy=clamp100(prev.energy+3); } return next; }); setNote(getDouMessage(mood, type)); if(type==='play'){ setShake(true); setBall(function(prev){ return {x:prev.x,y:prev.y,vx:Math.sign(prev.vx)*2.8,vy:Math.sign(prev.vy)*2.4}; }); } if(type==='feed'){ resetFoods(); } };

    function onPointerMove(ev){ if(!dragRef.current.active || !containerRef.current) return; var rect=containerRef.current.getBoundingClientRect(); var x=ev.clientX-rect.left-dragRef.current.offsetX; var y=ev.clientY-rect.top-dragRef.current.offsetY; x=Math.max(8, Math.min(x, rect.width-56)); y=Math.max(170, Math.min(y, rect.height-56)); setFoods(function(prev){ return prev.map(function(item){ if(item.id!==dragRef.current.itemId) return item; return {id:item.id,emoji:item.emoji,dragging:true,x:x,y:y}; }); }); }
    function onPointerUp(ev){ if(!dragRef.current.active){ return; } dragRef.current.active=false; document.removeEventListener('pointermove',onPointerMove); document.removeEventListener('pointerup',onPointerUp); document.removeEventListener('mousemove',onPointerMove); document.removeEventListener('mouseup',onPointerUp); document.body.style.userSelect=''; if(petRef.current){ var petRect=petRef.current.getBoundingClientRect(); if(ev.clientX>=petRect.left && ev.clientX<=petRect.right && ev.clientY>=petRect.top && ev.clientY<=petRect.bottom){ handleAction('feed'); return; } } resetFoods(); }
    function startFoodDrag(e,id){ if(e.type==='mousedown' && e.button!==0) return; e.preventDefault(); if(!containerRef.current) return; var rect=e.currentTarget.getBoundingClientRect(); dragRef.current={active:true,offsetX:e.clientX-rect.left,offsetY:e.clientY-rect.top,itemId:id}; if(e.currentTarget.setPointerCapture){ e.currentTarget.setPointerCapture(e.pointerId || 1); } setFoods(function(prev){ return prev.map(function(item){ if(item.id!==id) return item; return {id:item.id,emoji:item.emoji,dragging:true,x:item.x,y:item.y}; }); }); document.addEventListener('pointermove',onPointerMove); document.addEventListener('pointerup',onPointerUp); document.addEventListener('mousemove',onPointerMove); document.addEventListener('mouseup',onPointerUp); document.body.style.userSelect='none'; }

    var buildStat=function(label,value){ return window.React.createElement('div',{className:'douStat'}, window.React.createElement('div',{className:'douStatLabel'},label), window.React.createElement('div',{className:'douStatValue'},value+'%'), window.React.createElement('div',{className:'douStatBar'}, window.React.createElement('div',{className:'douStatFill',style:{width:value+'%'}}))); };

    return window.React.createElement('div',{className:'douApp',ref:containerRef},
      window.React.createElement('div',{className:'douHeader'}, window.React.createElement('div',{className:'douTitle'},'dou'), window.React.createElement('div',{className:'douSubtitle'},'Tu amiguito retro de escritorio')),
      window.React.createElement('div',{className:'douMain'},
        window.React.createElement('div',{className:'douPetCard'+(shake?' shake':'')},
          window.React.createElement('div',{className:'douNote'}, note || message),
          window.React.createElement('div',{className:'douPet bounce'+(foods.some(function(item){ return item.dragging; }) ? ' petTap' : ''),ref:petRef,onClick:function(){ handleAction('pet'); }},
            window.React.createElement('div',{className:'douFace'},
              window.React.createElement('div',{className:'douEyes'+(mood==='sleepy'?' blink':'')}, window.React.createElement('div',{className:'douEye'}), window.React.createElement('div',{className:'douEye'})),
              window.React.createElement('div',{className:'douMouth '+mouthClass})
            )
          ),
          window.React.createElement('div',{className:'douStats'}, buildStat('Hambre',state.hunger), buildStat('Energía',state.energy), buildStat('Felicidad',state.happiness))
        ),
        window.React.createElement('div',{className:'douInteract'},
          window.React.createElement('div',{className:'douWindowArea'},
            window.React.createElement('div',{className:'douWindowTop'},'Tirá la pelotita por la ventana'),
            window.React.createElement('div',{className:'douWindow'},
              window.React.createElement('div',{className:'douBall',style:{left:ball.x+'px',top:ball.y+'px'},onClick:function(){ handleAction('play'); }},'⚽')
            )
          ),
          window.React.createElement('div',{className:'douFeedArea'},
            window.React.createElement('div',{className:'douFeedHint'},'Arrastrá la comida hasta su boca'),
            window.React.createElement('div',{className:'douFoodShelf'},
              foods.map(function(item){ return window.React.createElement('div',{key:item.id,className:'douFood'+(item.dragging?' dragging':''),style:{left:item.x+'px',top:item.y+'px'},onPointerDown:function(e){ startFoodDrag(e,item.id); }, onMouseDown:function(e){ startFoodDrag(e,item.id); }},item.emoji); })
            ),
            window.React.createElement('div',{className:'douBedArea',onClick:function(){ handleAction('sleep'); }},
              window.React.createElement('div',{className:'douBedEmoji'},'🛏️'),
              window.React.createElement('div',{className:'douBedLabel'},'Clic para dormir')
            )
          )
        )
      )
    );
  }
  root.render(window.React.createElement(DouScene));
}

var SKANE_BEST_KEY='skane_best_score';
function loadSkaneBest(){ try{ return Math.max(0, parseInt(localStorage.getItem(SKANE_BEST_KEY),10)||0); }catch(e){ return 0; } }
function saveSkaneBest(score){ try{ localStorage.setItem(SKANE_BEST_KEY, String(score)); }catch(e){} }
function mountSkaneApp(){
  var rootEl=document.getElementById('skaneAppRoot'); if(!rootEl || !window.React || !window.ReactDOM) return;
  var root=window.ReactDOM.createRoot(rootEl);
  var useState=window.React.useState;
  var useEffect=window.React.useEffect;
  var useRef=window.React.useRef;

  function SkaneScene(){
    var cols=14, rows=12;
    var initialBest=loadSkaneBest();
    var snakeHook=useState([[5,6],[4,6],[3,6]]); var snake=snakeHook[0], setSnake=snakeHook[1];
    var dirHook=useState('right'); var direction=dirHook[0], setDirection=dirHook[1];
    var appleHook=useState([10,8]); var apple=appleHook[0], setApple=appleHook[1];
    var scoreHook=useState(0); var score=scoreHook[0], setScore=scoreHook[1];
    var bestHook=useState(initialBest); var bestScore=bestHook[0], setBestScore=bestHook[1];
    var aliveHook=useState(true); var alive=aliveHook[0], setAlive=aliveHook[1];
    var msgHook=useState('Usá WASD o flechas para mover.'); var message=msgHook[0], setMessage=msgHook[1];
    var dirRef=useRef(direction); var aliveRef=useRef(alive); var snakeRef=useRef(snake); var appleRef=useRef(apple);

    useEffect(function(){ dirRef.current=direction; }, [direction]);
    useEffect(function(){ aliveRef.current=alive; }, [alive]);
    useEffect(function(){ snakeRef.current=snake; }, [snake]);
    useEffect(function(){ appleRef.current=apple; }, [apple]);
    useEffect(function(){ saveSkaneBest(bestScore); }, [bestScore]);

    function randomApple(){ var candidate; var occupied={}; snakeRef.current.forEach(function(cell){ occupied[cell[0]+','+cell[1]]=true; }); do { candidate=[Math.floor(Math.random()*cols), Math.floor(Math.random()*rows)]; } while(occupied[candidate[0]+','+candidate[1]]); return candidate; }
    function resetGame(){ var start=[[5,6],[4,6],[3,6]]; setSnake(start); snakeRef.current=start; setDirection('right'); dirRef.current='right'; var startApple=randomApple(); setApple(startApple); appleRef.current=startApple; setScore(0); setAlive(true); aliveRef.current=true; setMessage('Usá WASD o flechas para mover.'); }
    function die(){ setAlive(false); aliveRef.current=false; setMessage('Chocaste. Presioná Enter para reiniciar.'); if(score>bestScore){ setBestScore(score); } }
    function moveSnake(){ if(!aliveRef.current) return; var dir=dirRef.current; var head=snakeRef.current[0]; var next=[head[0],head[1]];
      if(dir==='left') next[0]--; else if(dir==='right') next[0]++; else if(dir==='up') next[1]--; else if(dir==='down') next[1]++;
      if(next[0]<0||next[0]>=cols||next[1]<0||next[1]>=rows){ die(); return; }
      var tail=snakeRef.current.slice();
      var collided=tail.some(function(cell){ return cell[0]===next[0]&&cell[1]===next[1]; });
      if(collided){ die(); return; }
      var grows = next[0]===appleRef.current[0] && next[1]===appleRef.current[1];
      var nextSnake=[next].concat(tail);
      if(!grows){ nextSnake.pop(); }
      setSnake(nextSnake); snakeRef.current=nextSnake;
      if(grows){ var nextApple=randomApple(); setApple(nextApple); appleRef.current=nextApple; setScore(function(prev){ var nextScore=prev+1; if(nextScore>bestScore){ setBestScore(nextScore); } return nextScore; }); setMessage('Manzana recogida!'); }
    }
    function updateDirection(key){ var current=dirRef.current; var next=current;
      if(key==='ArrowLeft' || key==='a'){ if(current!=='right') next='left'; }
      else if(key==='ArrowRight' || key==='d'){ if(current!=='left') next='right'; }
      else if(key==='ArrowUp' || key==='w'){ if(current!=='down') next='up'; }
      else if(key==='ArrowDown' || key==='s'){ if(current!=='up') next='down'; }
      if(next!==current){ setDirection(next); dirRef.current=next; } }
    function onKeyDown(e){ if(!aliveRef.current){ if(e.key==='Enter'){ resetGame(); } return; } if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','w','s','d'].includes(e.key)){ updateDirection(e.key); e.preventDefault(); } }
    useEffect(function(){ document.addEventListener('keydown', onKeyDown); return function(){ document.removeEventListener('keydown', onKeyDown); }; }, []);
    useEffect(function(){ var interval=setInterval(moveSnake, 220); return function(){ clearInterval(interval); }; }, []);

    var cells=[];
    var snakeSet={};
    snake.forEach(function(cell, index){ snakeSet[cell[0]+','+cell[1]]= index===0 ? 'head' : 'body'; });
    for(var y=0;y<rows;y++){ for(var x=0;x<cols;x++){ var cls='skaneCell'; if(apple[0]===x && apple[1]===y){ cls+=' apple'; } else if(snakeSet[x+','+y]){ cls+=' '+snakeSet[x+','+y]; } cells.push(window.React.createElement('div',{key:x+','+y,className:cls}, '')); } }

    return window.React.createElement('div',{className:'skaneApp'},
      window.React.createElement('div',{className:'skaneHeaderRow'},
        window.React.createElement('div',{className:'skaneTitle'},'Skane'),
        window.React.createElement('div',{className:'skaneScoreBoard'},
          window.React.createElement('div',{className:'skaneScoreItem'}, window.React.createElement('strong',null,'Score:'), ' '+score),
          window.React.createElement('div',{className:'skaneScoreItem'}, window.React.createElement('strong',null,'Record:'), ' '+bestScore)
        )
      ),
      window.React.createElement('div',{className:'skaneBody'},
        window.React.createElement('div',{className:'skaneMap'}, cells),
        window.React.createElement('div',{className:'skaneInfoRow'},
          window.React.createElement('div',{className:'skaneNote'}, alive ? 'Controla con WASD o flechas. Evita chocar.' : '¡Muriste! Presioná Enter para reiniciar.'),
          window.React.createElement('button',{className:'skaneRestart',onClick:resetGame}, alive ? 'Reiniciar' : 'Reiniciar')
        )
      )
    );
  }
  root.render(window.React.createElement(SkaneScene));
}

// ─── CLOCK ───
function startClock(){
  function tick(){
    var now=new Date();
    var ar=new Date(now.toLocaleString('en-US',{timeZone:'America/Argentina/Buenos_Aires'}));
    var h=String(ar.getHours()).padStart(2,'0'), m=String(ar.getMinutes()).padStart(2,'0'), s=String(ar.getSeconds()).padStart(2,'0');
    var days=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    var months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    document.getElementById('tbClock').innerHTML=h+':'+m+':'+s+'<br><span style="font-size:10px;opacity:0.7">'+days[ar.getDay()]+', '+ar.getDate()+' '+months[ar.getMonth()]+' '+ar.getFullYear()+'</span>';
  }
  tick(); setInterval(tick,1000);
}

// ─── WINDOW MANAGER ───
var openWins={}, zTop=300;
var titles={mypc:'🖥️ Mi PC',notepad:'📝 Editor',spreadsheet:'📊 Planilla',network:'🌐 Redes',printers:'🖨️ Impresoras',paint:'🎨 Paint',ai:'🤖 IA',files:'📁 Explorador',trash:'🗑️ Papelera',aviis:'⬇️ Aviis',skane:'🐾 Skane',manual:'📘 Manual'};
function openApp(app){
  var w=document.getElementById('win-'+app); if(!w) return;
  w.classList.remove('hidden'); w.style.zIndex=++zTop;
  openWins[app]=true;
  if(app==='trash') buildTrash();
  if(app==='aviis') buildAviis();
  if(app==='files') buildFileExplorer();
  if(app==='ai'){
    loadAiSettings();
    // ensure chat has a welcome message
    var msgs=document.getElementById('aiMessages'); if(msgs && msgs.children.length===0) aiClearChat();
  }
  if(app==='gamestore'){
    buildGameStore();
  }
  if(app==='manual'){
    // load manual content from user filesystem or fallback
    try{
      if(currentUser){ ensureUserState(); var root=currentUser.desktopState.fileSystem; var docs=(root.children||[]).find(function(c){ return c.type==='folder' && c.name==='Documentos'; }); var manual=null; if(docs && docs.children){ manual=docs.children.find(function(i){ return i.name==='Manual_de_usuario.txt'; }); }
      if(!manual){ ensureManualFile(); docs=(root.children||[]).find(function(c){ return c.type==='folder' && c.name==='Documentos'; }); if(docs && docs.children) manual=docs.children.find(function(i){ return i.name==='Manual_de_usuario.txt'; }); }
      var body=document.getElementById('manualBody'); if(body){ body.innerHTML = '<div style="overflow:auto;white-space:pre-wrap;padding:12px;">'+(manual && manual.content?escapeHtml(manual.content):'Manual no encontrado.')+'</div>'; }
      }
    }catch(e){ console.error('manual open error',e); }
  }
  if(app==='dou'){
    // if the user opens the installed 'dou' app, show placeholder until you provide game implementation
    var body=document.getElementById('win-dou'); if(body){ /* nothing special, window content already present */ }
  }
  // If this window hasn't been placed by the user yet, position it in a bottom row to avoid overlap
  try{
    if(!w.dataset.placed){
      var openCount = Object.keys(openWins).length;
      var width = w.offsetWidth || 420;
      var spacing = 20;
      var left = 24 + ((openCount-1) * (width + spacing));
      // ensure left doesn't go off screen
      left = Math.max(24, Math.min(left, Math.max(24, window.innerWidth - width - 24)));
      var top = Math.max(80, window.innerHeight - (w.offsetHeight || 360) - 80);
      w.style.left = left + 'px';
      w.style.top = top + 'px';
      w.dataset.placed = '1';
    }
  }catch(e){}
  updateTB();
}
function closeWin(app){ document.getElementById('win-'+app).classList.add('hidden'); delete openWins[app]; updateTB(); }
function minWin(app){ document.getElementById('win-'+app).classList.add('hidden'); updateTB(); }
function maxWin(id){
  var w=document.getElementById(id);
  if(w._maxed){ w.style.cssText=w._prev; w._maxed=false; }
  else{ w._prev=w.style.cssText; w.style.width='100%'; w.style.height='calc(100% - 42px)'; w.style.left='0'; w.style.top='0'; w._maxed=true; }
}
function doLogout(){
  if(!confirm('¿Cerrar sesión de '+(currentUser?currentUser.fullname:'')+' ?')) return;
  currentUser=null; selectedUser=null; openWins={};
  document.querySelectorAll('.win').forEach(function(w){ w.classList.add('hidden'); });
  document.getElementById('desktop').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  updateStartButton();
  renderUsersList(); document.getElementById('lp').value='';
}
function updateTB(){
  var bar=document.getElementById('taskbarApps'); bar.innerHTML='';
  Object.keys(openWins).forEach(function(app){
    var btn=document.createElement('button'); btn.className='tbApp';
    var w=document.getElementById('win-'+app);
    if(w&&!w.classList.contains('hidden')) btn.classList.add('active');
    btn.textContent=titles[app]||app;
    btn.onclick=function(){
      var ww=document.getElementById('win-'+app);
      if(ww.classList.contains('hidden')){ ww.classList.remove('hidden'); ww.style.zIndex=++zTop; btn.classList.add('active'); }
      else{ ww.classList.add('hidden'); btn.classList.remove('active'); }
    };
    bar.appendChild(btn);
  });
}

// ─── DRAG ───
function startDrag(e,id){
  var el=document.getElementById(id);
  if(!el) return;
  var startX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
  var startY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
  var sx = startX - el.offsetLeft, sy = startY - el.offsetTop;
  el.style.zIndex=++zTop;
  function move(ev){ ev.preventDefault && ev.preventDefault(); var cx = ev.clientX !== undefined ? ev.clientX : (ev.touches && ev.touches[0] && ev.touches[0].clientX); var cy = ev.clientY !== undefined ? ev.clientY : (ev.touches && ev.touches[0] && ev.touches[0].clientY); if(typeof cx!=='number' || typeof cy!=='number') return; el.style.left=(cx-sx)+'px'; el.style.top=(cy-sy)+'px'; }
  function up(){ document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); document.removeEventListener('touchmove',move); document.removeEventListener('touchend',up); }
  document.addEventListener('mousemove',move); document.addEventListener('mouseup',up);
  document.addEventListener('touchmove',move,{passive:false}); document.addEventListener('touchend',up);
}

// ─── MY PC ───
function switchPcTab(tab){
  document.getElementById('pcTabInfo').style.display = tab==='info' ? '' : 'none';
  document.getElementById('pcTabErgo').style.display = tab==='ergo' ? '' : 'none';
  document.getElementById('pcTab-info').className = 'pcTab'+(tab==='info'?' on':'');
  document.getElementById('pcTab-ergo').className = 'pcTab'+(tab==='ergo'?' on':'');
  if(tab==='ergo') buildErgo();
}
function buildPC(){
  var ram=navigator.deviceMemory||'N/D', cores=navigator.hardwareConcurrency||'N/D';
  var ua=navigator.userAgent||'N/D', platform=navigator.platform||'N/D';
  var osInfo=detectOS(ua,platform);
  var browser=detectBrowser(ua);
  var gpu=getWebGLInfo();
  var screenRes=screen.width+'×'+screen.height+' px';
  var colorDepth=screen.colorDepth+' bits';
  var pixelRatio=(window.devicePixelRatio||1).toFixed(1);
  var memoryInfo='N/D';
  if(window.performance && performance.memory){
    memoryInfo=(performance.memory.usedJSHeapSize/1024/1024).toFixed(1)+' MB usados / '+(performance.memory.jsHeapSizeLimit/1024/1024).toFixed(1)+' MB límite';
  }
  document.getElementById('pcInfo').innerHTML=
    card('⚙️ Sistema',[['Sistema',osInfo],['Plataforma',platform],['Navegador',browser],['User Agent',ua]])+
    card('🧠 Memoria RAM',[['Memoria total',ram+' GB'],['Uso JS Heap',memoryInfo],['Núcleos lógicos',cores+' núcleos']])+
    card('💾 Almacenamiento',[['Uso actual','<span id="storageInfo">Estimando...</span>']])+ 
    card('🖥️ Pantalla & GPU',[['Resolución',screenRes],['Profundidad color',colorDepth],['Ratio de píxeles',pixelRatio],['GPU',gpu.renderer],['Vendor',gpu.vendor]]);
  estimateStorage();
}

function getWebGLInfo(){
  var canvas=document.createElement('canvas');
  var gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
  if(!gl) return {vendor:'N/D',renderer:'N/D'};
  var dbg=gl.getExtension('WEBGL_debug_renderer_info');
  if(!dbg) return {vendor:'N/D',renderer:'N/D'};
  return {vendor:gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)||'N/D', renderer:gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)||'N/D'};
}

function detectOS(ua,platform){
  if(/Windows NT 10\.0/.test(ua)) return 'Windows 10';
  if(/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
  if(/Windows NT 6\.2/.test(ua)) return 'Windows 8';
  if(/Windows NT 6\.1/.test(ua)) return 'Windows 7';
  if(/Mac OS X 10[._]\d+/.test(ua)) return ua.match(/Mac OS X 10[._]\d+/)[0].replace(/_/g,'.');
  if(/Android/.test(ua)) return 'Android';
  if(/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if(/Linux/.test(platform)||/Linux/.test(ua)) return 'Linux';
  return platform||'N/D';
}

function detectBrowser(ua){
  if(/Edg\//.test(ua)) return 'Microsoft Edge';
  if(/OPR\//.test(ua)) return 'Opera';
  if(/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) return 'Google Chrome';
  if(/Firefox\//.test(ua)) return 'Firefox';
  if(/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return 'Navegador desconocido';
}

function formatBytes(bytes){
  if(bytes===0) return '0 B';
  var sizes=['B','KB','MB','GB','TB'];
  var i=Math.floor(Math.log(bytes)/Math.log(1024));
  return (bytes/Math.pow(1024,i)).toFixed(1)+' '+sizes[i];
}

function estimateStorage(){
  if(!navigator.storage || !navigator.storage.estimate) return;
  navigator.storage.estimate().then(function(est){
    var used=est.usage||0, quota=est.quota||0;
    var info='Usado '+formatBytes(used)+' / '+formatBytes(quota)+' ('+(quota?Math.round(used/quota*100):0)+'%)';
    var node=document.getElementById('storageInfo');
    if(node) node.textContent=info;
  }).catch(function(){ });
}

function card(title,rows,pct){
  var s='<div class="pcc"><h3>'+title+'</h3>';
  rows.forEach(function(r){ s+='<div class="pcs2"><span style="color:#666">'+r[0]+'</span><span style="font-weight:500">'+r[1]+'</span></div>'; });
  if(pct!==undefined) s+='<div class="pbl" style="margin-top:6px"><div class="pbf" style="width:'+pct+'%"></div></div>';
  return s+'</div>';
}

// ─── ERGONOMÍA ───
function buildErgo(){
  var tips = [
    {
      icon:'🪑', title:'Postura y silla', sub:'Sentarse correctamente',
      items:[
        'La espalda debe apoyarse completamente en el respaldo de la silla, manteniendo la columna recta.',
        'Los pies deben apoyarse planos en el suelo (o en un reposapiés), con las rodillas en ángulo de ~90°.',
        'Los muslos deben estar paralelos al suelo, sin presión bajo los muslos.',
        'Los hombros relajados, codos en ángulo de 90°-110° apoyados levemente en el escritorio.',
        'No cruzar las piernas durante períodos largos: dificulta la circulación sanguínea.'
      ]
    },
    {
      icon:'🖥️', title:'Distancia y posición del monitor', sub:'Cuidado visual',
      items:[
        'La distancia ideal al monitor es entre 50 y 70 cm (aproximadamente el largo de tu brazo extendido).',
        'La parte superior del monitor debe estar a la altura de los ojos o ligeramente por debajo.',
        'Inclinar el monitor 10°-20° hacia atrás reduce la fatiga del cuello.',
        'Evitá usar la pantalla de costado: siempre debería estar frente a vos.',
        'En laptops, usá un soporte externo para elevar la pantalla y un teclado/mouse externos.'
      ]
    },
    {
      icon:'💡', title:'Iluminación', sub:'Ambiente adecuado',
      items:[
        'La luz natural debe entrar por los costados del monitor, nunca por detrás ni de frente (genera reflejos).',
        'Usá cortinas o persianas para controlar la luz solar directa en pantalla.',
        'La iluminación artificial del ambiente debe ser difusa, no fluorescente directa sobre la pantalla.',
        'El brillo del monitor debe ser similar al del entorno: ni muy brillante ni muy oscuro.',
        'Activá el modo "luz cálida" o "Night Light" después de las 18hs para reducir la luz azul.'
      ]
    },
    {
      icon:'👁️', title:'Regla 20-20-20 para los ojos', sub:'Descanso visual',
      items:[
        'Cada 20 minutos, mirá un objeto a 20 pies (~6 metros) de distancia durante 20 segundos.',
        'Parpadeá conscientemente: frente a pantallas parpadeamos hasta un 60% menos de lo normal.',
        'Activá la reducción de luz azul en el sistema operativo o usá filtros físicos.',
        'Si usás lentes, considerá unos específicos para pantalla (filtro anti-luz azul).',
        'Realizá movimientos oculares suaves: de izquierda a derecha y en círculos para relajar los músculos.'
      ]
    },
    {
      icon:'⌨️', title:'Teclado y mouse', sub:'Posición de las manos',
      items:[
        'Las muñecas deben estar rectas al tipear, no dobladas hacia arriba ni hacia abajo.',
        'El mouse debe estar al mismo nivel que el teclado, sin necesitar estirar el brazo.',
        'Usá un reposamuñecas de gel para descansar entre períodos de escritura (no mientras tipeás).',
        'El teclado debe estar a 5-10 cm del borde del escritorio para apoyar los antebrazos.',
        'Considerá un teclado ergonómico partido si tenés molestias frecuentes en las muñecas.'
      ]
    },
    {
      icon:'🏃', title:'Movimiento y pausas activas', sub:'Bienestar general',
      items:[
        'Levantate y caminá al menos 5 minutos cada hora de trabajo frente a la pantalla.',
        'Realizá estiramientos de cuello, hombros y espalda cada 30 minutos.',
        'Evitá usar el celular en posición encorvada (cuello hacia adelante): se llama "text neck".',
        'El ejercicio regular fuera del trabajo mejora notablemente la resistencia a malas posturas.',
        'Configurá alarmas o recordatorios para hacer pausas: el cuerpo suele ignorar las señales de cansancio.'
      ]
    }
  ];

  var html = '<div class="ergo-wrap">';
  html += '<div class="ergo-hero"><h2>🪑 Guía de Ergonomía Computacional</h2><p>Adoptá buenos hábitos posturales para cuidar tu salud y mejorar tu productividad frente a la pantalla.</p></div>';

  tips.forEach(function(t){
    html += '<div class="ergo-card">';
    html += '<div class="ergo-card-header"><div class="ergo-card-icon">'+t.icon+'</div><div><div class="ergo-card-title">'+t.title+'</div><div class="ergo-card-sub">'+t.sub+'</div></div></div>';
    t.items.forEach(function(item){
      html += '<div class="ergo-tip"><div class="ergo-tip-dot"></div><span>'+item+'</span></div>';
    });
    html += '</div>';
  });

  html += '<div class="ergo-card" style="background:#f0fdf4;border-color:#86efac">';
  html += '<div class="ergo-card-header"><div class="ergo-card-icon">📏</div><div><div class="ergo-card-title">Medidas rápidas de referencia</div><div class="ergo-card-sub">Tabla de distancias ideales</div></div></div>';
  var medidas = [['Distancia a la pantalla','50 – 70 cm','good'],['Altura del monitor','A nivel de ojos','good'],['Ángulo de rodillas','~90°','good'],['Ángulo de codos','90° – 110°','good'],['Pausa recomendada','5 min / hora','warn'],['Horas máx. continuas','2 horas','warn'],['Pantalla frente a ventana','Nunca','bad']];
  medidas.forEach(function(m){
    html += '<div class="pcs2"><span style="color:#555">'+m[0]+'</span><span><strong>'+m[1]+'</strong><span class="ergo-badge '+m[2]+'">'+{good:'✓ Ideal',warn:'⚠ Atención',bad:'✗ Evitar'}[m[2]]+'</span></span></div>';
  });
  html += '</div></div>';

  document.getElementById('ergoContent').innerHTML = html;
}

// ─── NOTEPAD ───
function fmt(cmd,bid){
  document.execCommand(cmd,false,null);
  document.getElementById(bid).classList.toggle('on');
  document.getElementById('ntEditor').focus();
}
function saveDoc(){
  var c=document.getElementById('ntEditor').innerHTML;
  var k='webos_doc_'+Date.now();
  try{ localStorage.setItem(k,c); }catch(e){}
  alert('✅ Documento guardado localmente.\nClave: '+k);
}
function printDoc(){
  var c=document.getElementById('ntEditor').innerHTML;
  var w=window.open('','_blank');
  if(w){ w.document.write('<html><body style="font-family:serif;padding:40px;max-width:800px;margin:auto">'+c+'</body></html>'); w.document.close(); w.print(); }
}

// ─── SPREADSHEET ───
var ROWS=20,COLS=10,cellData={},selCells=new Set(),lastSel=null;
function buildSheet(){
  var cols='ABCDEFGHIJ'.split('');
  var h='<thead><tr><th class="rh">#</th>';
  cols.forEach(function(c){ h+='<th>'+c+'</th>'; });
  h+='</tr></thead><tbody>';
  for(var r=1;r<=ROWS;r++){
    h+='<tr><th class="rh">'+r+'</th>';
    for(var c=0;c<COLS;c++){
      var id=cols[c]+r;
      h+='<td id="td-'+id+'" onclick="selCell(event,\''+id+'\')"><input id="c-'+id+'" onchange="cChanged(\''+id+'\')" onfocus="selCell(event,\''+id+'\')" style="font-size:11px"></td>';
    }
    h+='</tr>';
  }
  h+='</tbody>';
  document.getElementById('shTbl').innerHTML=h;
}
function selCell(e,id){
  if(!e.shiftKey) selCells.clear();
  selCells.add(id); lastSel=id;
  document.querySelectorAll('.sht td').forEach(function(td){ td.style.outline=''; });
  selCells.forEach(function(cid){ var td=document.getElementById('td-'+cid); if(td) td.style.outline='2px solid #667eea'; });
  var inp=document.getElementById('c-'+id);
  if(inp) document.getElementById('fbar').value=cellData[id]||inp.value||'';
}
function cChanged(id){ var val=document.getElementById('c-'+id).value; cellData[id]=val; evalCell(id); }
function evalCell(id){
  var f=cellData[id]; if(!f) return;
  var inp=document.getElementById('c-'+id); if(!inp) return;
  if(f.charAt(0)==='='){
    try{
      var expr=f.slice(1);
      expr=expr.replace(/SUMA\(([A-Z]\d+):([A-Z]\d+)\)/gi,function(_,a,b){ return rngSum(a,b); });
      expr=expr.replace(/[A-Z]\d+/g,function(ref){ var i=document.getElementById('c-'+ref); return i?(parseFloat(i.value)||0):0; });
      var res=Function('"use strict";return('+expr+')')();
      inp.value=isNaN(res)?'#ERR':res;
    }catch(e){ inp.value='#ERR'; }
  }
}
function rngSum(a,b){
  var ca=a.charCodeAt(0)-65,ra=parseInt(a.slice(1)),cb=b.charCodeAt(0)-65,rb=parseInt(b.slice(1));
  var cols='ABCDEFGHIJ',s=0;
  for(var r=ra;r<=rb;r++) for(var c=ca;c<=cb;c++){ var i=document.getElementById('c-'+cols[c]+r); if(i) s+=parseFloat(i.value)||0; }
  return s;
}
function applyFml(){
  if(!lastSel) return;
  var f=document.getElementById('fbar').value, inp=document.getElementById('c-'+lastSel);
  if(inp){ inp.value=f; cellData[lastSel]=f; evalCell(lastSel); }
}
function shFmt(cmd){
  selCells.forEach(function(id){
    var i=document.getElementById('c-'+id); if(!i) return;
    if(cmd==='bold') i.style.fontWeight=i.style.fontWeight==='bold'?'':'bold';
    if(cmd==='italic') i.style.fontStyle=i.style.fontStyle==='italic'?'':'italic';
  });
}
function shBg(c){ selCells.forEach(function(id){ var td=document.getElementById('td-'+id); if(td) td.style.background=c; }); }
function shTxt(c){ selCells.forEach(function(id){ var i=document.getElementById('c-'+id); if(i) i.style.color=c; }); }

// ─── NETWORK ───
function buildNet(){
  var info=getConnectionInfo();
  var defaultView=info.mediumType==='Ethernet' ? 'eth' : 'wifi';
  var onlineClass = info.online ? '● Conectado' : '○ Desconectado';
  document.getElementById('netBody').innerHTML=
    '<div class="ncs">'+
    '<div class="ncc"><h3>Estado de conexión</h3>'+
    '<span class="nbadge">'+onlineClass+'</span>'+ 
    '<div class="ntp">'+
    '<button class="ntpill '+(defaultView==='wifi'?'on':'')+'" id="pw" onclick="swNet(\'wifi\')">📶 WiFi</button>'+ 
    '<button class="ntpill '+(defaultView==='eth'?'on':'')+'" id="pe" onclick="swNet(\'eth\')">🔌 Ethernet</button>'+ 
    '</div><div class="ni" id="niBox">'+netHTML(defaultView, info)+'</div></div></div>'+ 
    '<div class="nd">'+
    '<div class="ndd"><h4>🏠 PAN — Red de Área Personal</h4><p>Alcance 1-10 m, para dispositivos personales. Ej: Bluetooth entre celular y auriculares.</p></div>'+
    '<div class="ndd"><h4>🏢 LAN — Red de Área Local</h4><p>Conecta dispositivos en un edificio. Alta velocidad y bajo costo. Ej: red de oficina u hogar.</p></div>'+
    '<div class="ndd"><h4>🏙️ MAN — Red de Área Metropolitana</h4><p>Cubre una ciudad (hasta ~50 km). Ej: red de fibra de una empresa de telecomunicaciones.</p></div>'+
    '<div class="ndd"><h4>🌍 WAN — Red de Área Amplia</h4><p>Cubre países o continentes. La mayor es Internet, usando infraestructura de telecomunicaciones.</p></div>'+
    '</div>';
  if(!window.webosNetEvents){
    window.webosNetEvents=true;
    window.addEventListener('online',buildNet);
    window.addEventListener('offline',buildNet);
    var conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    if(conn && conn.addEventListener) conn.addEventListener('change',buildNet);
  }
  fetchPublicIP();
}
function getConnectionInfo(){
  var conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection||{};
  var online=Boolean(navigator.onLine);
  var type=conn.type || conn.effectiveType || 'N/D';
  var effectiveType=conn.effectiveType || conn.type || 'N/D';
  var downlink=conn.downlink!==undefined ? conn.downlink+' Mbps' : 'N/D';
  var rtt=conn.rtt!==undefined ? conn.rtt+' ms' : 'N/D';
  var saveData=conn.saveData ? 'Sí' : 'No';
  var downlinkMax=conn.downlinkMax!==undefined ? conn.downlinkMax+' Mbps' : 'N/D';
  var mediumType='N/D';
  if(/wifi/i.test(type) || /wifi/i.test(effectiveType)) mediumType='WiFi';
  else if(/ethernet/i.test(type) || /ethernet/i.test(effectiveType)) mediumType='Ethernet';
  else if(/cellular|2g|3g|4g|5g/i.test(type) || /cellular|2g|3g|4g|5g/i.test(effectiveType)) mediumType='Celular';
  else if(type!=='N/D') mediumType=type;
  if(!online){ mediumType='Desconectado'; }
  return {online:online, type:type, mediumType:mediumType, effectiveType:effectiveType, downlink:downlink, downlinkMax:downlinkMax, rtt:rtt, saveData:saveData};
}
function netHTML(t, info){
  var typeLabel=t==='eth' ? 'Ethernet' : 'WiFi';
  return row('Conexión actual', info.mediumType)+
         row('Vista seleccionada', typeLabel)+
         row('Tipo real', info.type)+
         row('Efectivo', info.effectiveType)+
         row('Velocidad estimada', info.downlink)+
         row('Velocidad máxima', info.downlinkMax)+
         row('Latencia', info.rtt)+
         row('Ahorro de datos', info.saveData)+
         row('IP pública', '<span id="publicIp">cargando...</span>')+
         row('DNS local', 'N/D')+
         row('Puerta de enlace', 'N/D')+
         row('En línea', info.online ? 'Sí' : 'No');
}
function row(k,v){ return '<div><span>'+k+'</span><strong>'+v+'</strong></div>'; }
function swNet(t){
  document.getElementById('pw').className='ntpill'+(t==='wifi'?' on':'');
  document.getElementById('pe').className='ntpill'+(t==='eth'?' on':'');
  document.getElementById('niBox').innerHTML=netHTML(t,getConnectionInfo());
}
function fetchPublicIP(){
  var node=document.getElementById('publicIp');
  if(!node || !navigator.onLine) return;
  fetch('https://api.ipify.org?format=json').then(function(res){ return res.json(); }).then(function(data){ if(node) node.textContent=data.ip || 'N/D'; }).catch(function(){ if(node) node.textContent='N/D'; });
}

// ─── PRINTERS ───
var printers=[
  {name:'HP LaserJet Pro M404',status:'online',type:'Láser'},
  {name:'Epson L380',status:'offline',type:'Tinta'},
  {name:'Canon PIXMA G3110',status:'online',type:'Tinta'}
];
var pQueue=[
  {doc:'Informe_ventas.pdf',pages:5,s:'printing'},
  {doc:'Contrato_2024.docx',pages:12,s:'waiting'},
  {doc:'Foto_empresa.jpg',pages:1,s:'waiting'}
];
function buildPrinters(){
  var pl=printers.map(function(p){
    return '<div class="pri"><div><div class="prn">🖨️ '+p.name+'</div><div style="font-size:10px;color:#999">'+p.type+'</div></div>'+
    '<span class="pst '+(p.status==='online'?'pon':'pof')+'">'+(p.status==='online'?'● En línea':'○ Desconectada')+'</span></div>';
  }).join('');
  var ql=pQueue.map(function(q){
    return '<div class="qi"><div>📄 '+q.doc+'<div style="font-size:10px;color:#aaa">'+q.pages+' pág.</div></div>'+
    '<span class="qs '+(q.s==='printing'?'qp':'qw')+'">'+(q.s==='printing'?'Imprimiendo':'En espera')+'</span></div>';
  }).join('');
  document.getElementById('printerBody').innerHTML=
    '<div class="prs"><div class="prc"><h3>Impresoras instaladas</h3>'+pl+
    '<button class="appBtn pri" style="width:100%;margin-top:9px" onclick="togAddPrinter()">+ Agregar impresora</button>'+
    '<div id="apForm" class="apf" style="display:none">'+
    '<input id="npName" placeholder="Nombre de la impresora">'+
    '<select id="npType"><option>Láser</option><option>Tinta</option><option>Multifunción</option><option>Térmica</option></select>'+
    '<button class="appBtn pri" onclick="addPrinter()" style="width:100%">Agregar</button></div></div>'+
    '<div class="prc"><h3>Cola de impresión ('+pQueue.length+' trabajos)</h3>'+ql+
    '<div style="display:flex;gap:7px;margin-top:9px;flex-wrap:wrap">'+
    '<button class="appBtn pri" onclick="printNext()">🖨️ Imprimir</button>'+
    '<button class="appBtn dng" onclick="clearQ()">🗑️ Limpiar</button>'+
    '<button class="appBtn" onclick="addToQ()">+ Agregar</button>'+
    '</div></div></div>';
}
function togAddPrinter(){ var f=document.getElementById('apForm'); if(f) f.style.display=f.style.display==='none'?'block':'none'; }
function addPrinter(){
  var n=document.getElementById('npName').value.trim(), t=document.getElementById('npType').value;
  if(!n){ alert('Ingrese un nombre'); return; }
  printers.push({name:n,status:'offline',type:t}); alert('✅ Impresora "'+n+'" agregada'); buildPrinters();
}
function printNext(){
  if(!pQueue.length){ alert('La cola está vacía'); return; }
  var j=pQueue.shift(); alert('🖨️ Imprimiendo: '+j.doc+'\n('+j.pages+' páginas)');
  if(pQueue.length) pQueue[0].s='printing'; buildPrinters();
}
function clearQ(){ pQueue=[]; buildPrinters(); }
function addToQ(){
  var n=prompt('Nombre del documento:','NuevoDoc.pdf'); if(!n) return;
  var p=parseInt(prompt('Número de páginas:','1'))||1;
  pQueue.push({doc:n,pages:p,s:'waiting'}); buildPrinters();
}

// ═══════════════════════════════════════
// ─── PAINT ───
// ═══════════════════════════════════════
var paintTool='brush', paintColor='#000000', paintSize=4;
var paintDrawing=false, paintLastX=0, paintLastY=0;
var paintShapeStart={x:0,y:0};
var paintSnapshot=null;

var PALETTE=['#000000','#ffffff','#808080','#c0c0c0',
             '#ff0000','#800000','#ff6600','#ff9900',
             '#ffff00','#808000','#00ff00','#008000',
             '#00ffff','#008080','#0000ff','#000080',
             '#ff00ff','#800080','#ff69b4','#a52a2a',
             '#ffd700','#7fffd4','#dda0dd','#f0e68c'];

function initPaint(){
  // Paleta de colores
  var pal=document.getElementById('paintColorPalette');
  if(!pal||pal.dataset.init) return;
  pal.dataset.init='1';
  PALETTE.forEach(function(c,i){
    var d=document.createElement('div');
    d.className='pcolor'+(i===0?' sel':'');
    d.style.background=c;
    d.title=c;
    d.onclick=function(){ setPaintColor(c); };
    pal.appendChild(d);
  });
}

function setPaintColor(c){
  paintColor=c;
  document.getElementById('paintCurrColor').style.background=c;
  document.getElementById('paintColorPicker').value=c;
  document.querySelectorAll('.pcolor').forEach(function(d){
    d.classList.toggle('sel', d.style.background===hexToRgb(c)||d.title===c);
  });
}
function hexToRgb(hex){
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return 'rgb('+r+', '+g+', '+b+')';
}

function setPaintTool(t){
  paintTool=t;
  document.querySelectorAll('.ptBtn[id^="pt-"]').forEach(function(b){ b.classList.remove('active'); });
  var btn=document.getElementById('pt-'+t);
  if(btn) btn.classList.add('active');
  var canvas=document.getElementById('paintCanvas');
  if(canvas) canvas.style.cursor=(t==='eraser')?'cell':(t==='fill')?'crosshair':(t==='text')?'text':'crosshair';
  // Ocultar input de texto si cambiamos de herramienta
  var ti=document.getElementById('paintTextInput');
  if(ti) ti.style.display='none';
}

function updateBrushSize(v){ paintSize=parseInt(v); document.getElementById('brushSizeVal').textContent=v; }

function getCanvasPos(e){
  var canvas=document.getElementById('paintCanvas');
  var rect=canvas.getBoundingClientRect();
  var scaleX=canvas.width/rect.width, scaleY=canvas.height/rect.height;
  return { x:(e.clientX-rect.left)*scaleX, y:(e.clientY-rect.top)*scaleY };
}

function paintStart(e){
  var pos=getCanvasPos(e);
  var canvas=document.getElementById('paintCanvas');
  var ctx=canvas.getContext('2d');

  if(paintTool==='text'){
    var ti=document.getElementById('paintTextInput');
    var rect=canvas.getBoundingClientRect();
    ti.style.display='block';
    ti.style.left=(e.clientX)+'px';
    ti.style.top=(e.clientY-10)+'px';
    ti.style.color=paintColor;
    ti.style.fontSize=Math.max(12,paintSize*3)+'px';
    ti.dataset.x=pos.x; ti.dataset.y=pos.y;
    ti.value=''; ti.focus();
    return;
  }

  if(paintTool==='fill'){
    floodFill(ctx, Math.round(pos.x), Math.round(pos.y), paintColor);
    return;
  }

  paintDrawing=true;
  paintLastX=pos.x; paintLastY=pos.y;
  paintShapeStart={x:pos.x,y:pos.y};

  if(paintTool==='brush'||paintTool==='eraser'){
    ctx.beginPath();
    ctx.arc(pos.x,pos.y,paintSize/2,0,Math.PI*2);
    ctx.fillStyle=paintTool==='eraser'?'#ffffff':paintColor;
    ctx.fill();
  }

  // Captura snapshot para shapes
  if(paintTool==='line'||paintTool==='rect'||paintTool==='circle'){
    paintSnapshot=ctx.getImageData(0,0,canvas.width,canvas.height);
  }
}

function paintMove(e){
  if(!paintDrawing) return;
  var pos=getCanvasPos(e);
  var canvas=document.getElementById('paintCanvas');
  var ctx=canvas.getContext('2d');

  if(paintTool==='brush'||paintTool==='eraser'){
    ctx.beginPath();
    ctx.moveTo(paintLastX,paintLastY);
    ctx.lineTo(pos.x,pos.y);
    ctx.strokeStyle=paintTool==='eraser'?'#ffffff':paintColor;
    ctx.lineWidth=paintSize;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.stroke();
    paintLastX=pos.x; paintLastY=pos.y;
  } else if(paintTool==='line'){
    ctx.putImageData(paintSnapshot,0,0);
    ctx.beginPath(); ctx.moveTo(paintShapeStart.x,paintShapeStart.y); ctx.lineTo(pos.x,pos.y);
    ctx.strokeStyle=paintColor; ctx.lineWidth=paintSize; ctx.lineCap='round'; ctx.stroke();
  } else if(paintTool==='rect'){
    ctx.putImageData(paintSnapshot,0,0);
    ctx.beginPath();
    ctx.rect(paintShapeStart.x,paintShapeStart.y,pos.x-paintShapeStart.x,pos.y-paintShapeStart.y);
    ctx.strokeStyle=paintColor; ctx.lineWidth=paintSize; ctx.stroke();
  } else if(paintTool==='circle'){
    ctx.putImageData(paintSnapshot,0,0);
    var rx=(pos.x-paintShapeStart.x)/2, ry=(pos.y-paintShapeStart.y)/2;
    var cx=paintShapeStart.x+rx, cy=paintShapeStart.y+ry;
    ctx.beginPath(); ctx.ellipse(cx,cy,Math.abs(rx),Math.abs(ry),0,0,Math.PI*2);
    ctx.strokeStyle=paintColor; ctx.lineWidth=paintSize; ctx.stroke();
  }
}

function paintEnd(e){
  paintDrawing=false; paintSnapshot=null;
}

function paintTextConfirm(e){
  if(e.key==='Enter'){
    var ti=document.getElementById('paintTextInput');
    var text=ti.value; if(!text){ ti.style.display='none'; return; }
    var canvas=document.getElementById('paintCanvas');
    var ctx=canvas.getContext('2d');
    ctx.fillStyle=paintColor;
    ctx.font=Math.max(12,paintSize*3)+'px Segoe UI';
    ctx.fillText(text, parseFloat(ti.dataset.x), parseFloat(ti.dataset.y));
    ti.style.display='none';
  }
  if(e.key==='Escape'){ document.getElementById('paintTextInput').style.display='none'; }
}

function paintClear(){
  var canvas=document.getElementById('paintCanvas');
  var ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height);
}

function paintSave(){
  var canvas=document.getElementById('paintCanvas');
  // Fondo blanco
  var tmp=document.createElement('canvas');
  tmp.width=canvas.width; tmp.height=canvas.height;
  var tctx=tmp.getContext('2d');
  tctx.fillStyle='#fff'; tctx.fillRect(0,0,tmp.width,tmp.height);
  tctx.drawImage(canvas,0,0);
  var a=document.createElement('a');
  a.href=tmp.toDataURL('image/png');
  a.download='webos-paint-'+Date.now()+'.png';
  a.click();
}

// Flood fill (balde de pintura)
function floodFill(ctx,startX,startY,fillColorHex){
  var canvas=ctx.canvas;
  var imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
  var data=imgData.data;
  var width=canvas.width, height=canvas.height;
  function getIdx(x,y){ return (y*width+x)*4; }
  var sr=data[getIdx(startX,startY)],sg=data[getIdx(startX,startY)+1],sb=data[getIdx(startX,startY)+2],sa=data[getIdx(startX,startY)+3];
  var fr=parseInt(fillColorHex.slice(1,3),16),fg=parseInt(fillColorHex.slice(3,5),16),fb=parseInt(fillColorHex.slice(5,7),16);
  if(sr===fr&&sg===fg&&sb===fb) return;
  var stack=[[startX,startY]];
  var visited=new Uint8Array(width*height);
  while(stack.length){
    var p=stack.pop(); var x=p[0],y=p[1];
    if(x<0||x>=width||y<0||y>=height) continue;
    if(visited[y*width+x]) continue;
    var idx=getIdx(x,y);
    if(Math.abs(data[idx]-sr)>30||Math.abs(data[idx+1]-sg)>30||Math.abs(data[idx+2]-sb)>30) continue;
    visited[y*width+x]=1;
    data[idx]=fr; data[idx+1]=fg; data[idx+2]=fb; data[idx+3]=255;
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  ctx.putImageData(imgData,0,0);
}

// Inicializar paint cuando se abre
var _origOpenApp=openApp;
openApp=function(app){
  _origOpenApp(app);
  if(app==='paint'){
    setTimeout(function(){
      initPaint();
      var canvas=document.getElementById('paintCanvas');
      var ctx=canvas.getContext('2d');
      // Fondo blanco inicial
      if(!canvas.dataset.init){
        canvas.dataset.init='1';
        ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      }
    },50);
  }
};

// ═══════════════════════════════════════
// ─── AI ASSISTANT ───
// ═══════════════════════════════════════
var aiHistory=[];
var aiSystemPrompt = 'Sos el asistente IA integrado en WebOS Argentina, un sistema operativo web educativo. Respondé siempre en español argentino, de manera clara, amigable y concisa. Podés ayudar con tecnología, programación, matemáticas, redacción, preguntas generales y cualquier tema que el usuario necesite.';

function aiInputKey(e){
  if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); aiSend(); }
}

function aiClearChat(){
  aiHistory=[];
  document.getElementById('aiMessages').innerHTML=
    '<div class="aiMsg bot"><div class="aiAvatar">🤖</div>'+
    '<div class="aiBubble">Chat limpiado. ¿En qué te puedo ayudar?</div></div>';
}

async function aiSend(){
  var input=document.getElementById('aiInput');
  var text=input.value.trim(); if(!text) return;
  input.value='';

  // Agregar mensaje del usuario
  aiAddMsg('user', text);
  aiHistory.push({role:'user',content:text});

  // Deshabilitar botón
  var btn=document.getElementById('aiSendBtn');
  btn.disabled=true; btn.style.opacity='0.5';

  // Indicador de escritura
  var typingId='aiTyping_'+Date.now();
  var msgs=document.getElementById('aiMessages');
  msgs.innerHTML+='<div class="aiMsg bot aiTyping" id="'+typingId+'">'+
    '<div class="aiAvatar">🤖</div>'+
    '<div class="aiBubble"><div class="aiDots">'+
    '<div class="aiDot"></div><div class="aiDot"></div><div class="aiDot"></div>'+
    '</div></div></div>';
  msgs.scrollTop=msgs.scrollHeight;

  try{
    // Determine provider and key
    var provider = localStorage.getItem('aviis_ai_provider') || 'anthropic';
    var key = localStorage.getItem('aviis_ai_key') || '';
    if(!key){
      throw new Error('No API key configured. Open the AI window and save your API key.');
    }

    if(provider==='anthropic'){
      var response=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':key},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:aiSystemPrompt,messages:aiHistory})
      });
      var data=await response.json();
      var reply=(data.content&&data.content[0]&&data.content[0].text) || (data.error && data.error.message) || 'No pude generar una respuesta. Intentá de nuevo.';
      var typingEl=document.getElementById(typingId); if(typingEl) typingEl.remove();
      aiAddMsg('bot', reply);
      aiHistory.push({role:'assistant',content:reply});
    } else if(provider==='openai'){
      var response=await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body:JSON.stringify({model:'gpt-4o-mini',messages:[{role:'system',content:aiSystemPrompt}].concat(aiHistory),max_tokens:1000})
      });
      var data=await response.json();
      var reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || (data.error && data.error.message) || 'No pude generar una respuesta. Intentá de nuevo.';
      var typingEl=document.getElementById(typingId); if(typingEl) typingEl.remove();
      aiAddMsg('bot', reply);
      aiHistory.push({role:'assistant',content:reply});
    } else {
      throw new Error('Unknown AI provider: '+provider);
    }
  } catch(err){
    var typingEl=document.getElementById(typingId); if(typingEl) typingEl.remove();
    aiAddMsg('bot','❌ Error al conectar con la IA. '+err.message);
  }

  btn.disabled=false; btn.style.opacity='1';
  msgs.scrollTop=msgs.scrollHeight;
}

function aiAddMsg(role, text){
  var msgs=document.getElementById('aiMessages');
  var avatar=role==='user'?(currentUser?currentUser.avatar:'👤'):'🤖';
  var div=document.createElement('div');
  div.className='aiMsg '+role;
  // Escapar HTML básico
  var safe=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  div.innerHTML='<div class="aiAvatar">'+avatar+'</div><div class="aiBubble">'+safe+'</div>';
  msgs.appendChild(div);
  msgs.scrollTop=msgs.scrollHeight;
}

function saveAiSettings(){
  var prov = document.getElementById('aiProvider').value;
  var key = document.getElementById('aiKey').value.trim();
  try{ localStorage.setItem('aviis_ai_provider', prov); }catch(e){}
  try{ localStorage.setItem('aviis_ai_key', key); }catch(e){}
  var btn=document.querySelector('#win-ai .appBtn');
  aiAddMsg('bot','✅ AI settings saved. Provider: '+prov+(key?', key set':' (no key)'));
}

function loadAiSettings(){
  var prov = localStorage.getItem('aviis_ai_provider') || 'anthropic';
  var key = localStorage.getItem('aviis_ai_key') || '';
  var sel = document.getElementById('aiProvider'); if(sel) sel.value = prov;
  var k = document.getElementById('aiKey'); if(k) k.value = key;
}
