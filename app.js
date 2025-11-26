/* -------------------------
   Data model & storage keys
   ------------------------- */
const STORAGE = {
    FATAL: 'brgy_fatal_v1',
    NONFATAL: 'brgy_nonfatal_v1',
    DELETED: 'brgy_deleted_v1'
};

let fatalRecords = JSON.parse(localStorage.getItem(STORAGE.FATAL) || '[]');
let nonFatalRecords = JSON.parse(localStorage.getItem(STORAGE.NONFATAL) || '[]');
let deletedRecords = JSON.parse(localStorage.getItem(STORAGE.DELETED) || '[]');

function saveAll(){
    localStorage.setItem(STORAGE.FATAL, JSON.stringify(fatalRecords));
    localStorage.setItem(STORAGE.NONFATAL, JSON.stringify(nonFatalRecords));
    localStorage.setItem(STORAGE.DELETED, JSON.stringify(deletedRecords));
}

/* ---------- Helpers ---------- */
function uid(){ return Date.now().toString(36) + '-' + Math.floor(Math.random()*9000+1000); }
function showPage(id){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    // show logout if not login or create page
    document.getElementById('btn-logout').style.display = (id==='login-page' || id==='create-page')? 'none' : 'inline-block';
    window.scrollTo(0,0);
}
function formatDateTime(dateStr, timeStr){
    if(!dateStr) return '';
    const d = new Date((dateStr || '') + 'T' + (timeStr || '00:00'));
    if(isNaN(d)) return (dateStr || '') + (timeStr? ' ' + timeStr : '');
    return d.toLocaleString();
}
function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }


/* ---------- AUTH ---------- */
// Login: Directly proceeds to dashboard (placeholder for actual auth)
document.getElementById('login-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    afterLogin(); 
});

document.getElementById('btn-logout').addEventListener('click', ()=>{
    if(confirm('Logout?')) showPage('login-page');
});

// Create Account Navigation & Placeholder
document.getElementById('create-account').addEventListener('click', (e)=>{ 
    e.preventDefault(); 
    showPage('create-page'); 
});

document.getElementById('back-to-login').addEventListener('click', ()=>{
    showPage('login-page'); 
});

/* ---------- NAV ---------- */
document.getElementById('add-record').addEventListener('click', ()=>openAdd());
document.getElementById('goto-fatal').addEventListener('click', ()=>{ populateList('fatal'); showPage('fatal-page'); });
document.getElementById('goto-nonfatal').addEventListener('click', ()=>{ populateList('nonfatal'); showPage('nonfatal-page'); });
document.getElementById('open-deleted').addEventListener('click', ()=>{ populateDeleted(); showPage('deleted-page'); });
document.getElementById('back-to-dash-from-fatal').addEventListener('click', ()=> showPage('dashboard-page'));
document.getElementById('back-to-dash-from-nonfatal').addEventListener('click', ()=> showPage('dashboard-page'));
document.getElementById('back-from-deleted').addEventListener('click', ()=> showPage('dashboard-page'));

/* ---------- FORM: Add / Edit ---------- */
let editing = null; 

function openAdd(prefType){
    editing = null;
    document.getElementById('form-title').textContent = 'Add New Record';
    const form = document.getElementById('record-form');
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
    if(prefType) document.getElementById('type').value = prefType;
    showPage('add-page');
}
document.getElementById('add-fatal').addEventListener('click', ()=>openAdd('fatal'));
document.getElementById('add-nonfatal').addEventListener('click', ()=>openAdd('nonfatal'));
document.getElementById('cancel-add').addEventListener('click', ()=> showPage('dashboard-page'));
document.getElementById('save-record').addEventListener('click', ()=> document.getElementById('record-form').dispatchEvent(new Event('submit')));

document.getElementById('record-form').addEventListener('submit', function(e){
    e.preventDefault();
    const r = {
        id: editing ? editing.id : uid(),
        type: document.getElementById('type').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        person: document.getElementById('person').value.trim(),
        location: document.getElementById('location').value.trim(),
        description: document.getElementById('description').value.trim(),
        status: 'Open',
        createdAt: new Date().toISOString()
    };
    if(!r.type){ alert('Select type'); return; }
    if(editing){
        // Existing logic for editing
        if(editing.type === 'fatal') fatalRecords = fatalRecords.filter(x=>x.id!==r.id);
        else nonFatalRecords = nonFatalRecords.filter(x=>x.id!==r.id);
        editing = null;
        // The new record 'r' will be added back below
    } 
    
    // Add the (new or edited) record back
    if(r.type === 'fatal'){ fatalRecords.unshift(r); populateList('fatal'); viewRecord(r); }
    else { nonFatalRecords.unshift(r); populateList('nonfatal'); viewRecord(r); }

    saveAll();
    renderDashboard();
});


/* ---------- ITEM ELEMENT (three-dot) ---------- */
function createRecordElement(r){
    const li = document.createElement('li'); li.className='record-item';
    const left = document.createElement('div'); left.className='rec-left';
    const info = document.createElement('div');
    info.innerHTML = `<div class="rec-title">${escapeHtml(r.person)}</div><div class="rec-sub">${escapeHtml(r.location)} • ${formatDateTime(r.date,r.time)}</div>`;
    left.appendChild(info);
    li.appendChild(left);

    const actions = document.createElement('div'); actions.className='actions';
    const dot = document.createElement('button'); dot.className='dot-btn'; dot.innerHTML = '<i class="fas fa-ellipsis-vertical"></i>';
    const menu = document.createElement('div'); menu.className='menu';
    const btnView = document.createElement('button'); btnView.innerHTML = '<i class="fas fa-eye"></i> View';
    const btnEdit = document.createElement('button'); btnEdit.innerHTML = '<i class="fas fa-pen"></i> Edit';
    const btnShare = document.createElement('button'); btnShare.innerHTML = '<i class="fas fa-share-alt"></i> Share';
    const btnDelete = document.createElement('button'); btnDelete.innerHTML = '<i class="fas fa-trash"></i> Delete';
    menu.appendChild(btnView); menu.appendChild(btnEdit); menu.appendChild(btnShare); menu.appendChild(btnDelete);
    actions.appendChild(dot); actions.appendChild(menu);
    li.appendChild(actions);

    // toggle
    dot.addEventListener('click', (ev)=>{ ev.stopPropagation(); document.querySelectorAll('.menu').forEach(m=>m.classList.remove('show')); menu.classList.toggle('show'); });
    // close on outside click
    document.addEventListener('click', ()=> menu.classList.remove('show'));

    btnView.addEventListener('click', (e)=>{ e.stopPropagation(); menu.classList.remove('show'); viewRecord(r); });
    btnEdit.addEventListener('click', (e)=>{ e.stopPropagation(); menu.classList.remove('show'); startEdit(r); });
    btnShare.addEventListener('click', (e)=>{ e.stopPropagation(); menu.classList.remove('show'); shareRecord(r); });
    btnDelete.addEventListener('click', (e)=>{ e.stopPropagation(); menu.classList.remove('show'); confirmDelete(r); });

    return li;
}

/* ---------- Render lists ---------- */
function populateList(type){
    const listEl = (type==='fatal') ? document.getElementById('fatal-list') : document.getElementById('nonfatal-list');
    const records = (type==='fatal') ? fatalRecords : nonFatalRecords;
    listEl.innerHTML = '';
    if(records.length===0){ listEl.innerHTML = '<li class="record-item">No records.</li>'; return; }
    records.forEach(r => { listEl.appendChild(createRecordElement(r)); });
}

function renderRecent(filter='all'){
    const container = document.getElementById('recent-list');
    container.innerHTML = '';
    let all = [...fatalRecords.map(x=>({...x, type:'fatal'})), ...nonFatalRecords.map(x=>({...x, type:'nonfatal'}))];
    all.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    if(filter!=='all') all = all.filter(x=>x.type===filter);
    if(all.length===0){ container.innerHTML = '<li class="record-item">No recent records.</li>'; return; }
    all.slice(0,30).forEach(r => container.appendChild(createRecordElement(r)));
}

/* ---------- View / Edit / Delete / Share ---------- */
let currentView = null;
function viewRecord(r){
    currentView = r;
    document.getElementById('view-title').textContent = `${r.type.toUpperCase()} — ${r.person}`;
    document.getElementById('v-type').textContent = r.type;
    document.getElementById('v-person').textContent = r.person;
    document.getElementById('v-location').textContent = r.location;
    document.getElementById('v-datetime').textContent = formatDateTime(r.date,r.time);
    document.getElementById('v-status').textContent = r.status || 'Open';
    document.getElementById('v-desc').textContent = r.description;
    showPage('view-page');
}
document.getElementById('back-from-view').addEventListener('click', ()=> showPage('dashboard-page'));
document.getElementById('edit-from-view').addEventListener('click', ()=> { if(currentView) startEdit(currentView); });

function startEdit(r){
    editing = { id: r.id, type: r.type };
    document.getElementById('form-title').textContent = 'Edit Record';
    document.getElementById('type').value = r.type;
    document.getElementById('date').value = r.date;
    document.getElementById('time').value = r.time;
    document.getElementById('person').value = r.person;
    document.getElementById('location').value = r.location;
    document.getElementById('description').value = r.description;
    showPage('add-page');
}

function confirmDelete(r){
    if(!confirm('Move this record to Deleted History?')) return;
    // remove from active
    if(r.type === 'fatal') fatalRecords = fatalRecords.filter(x=>x.id !== r.id);
    else nonFatalRecords = nonFatalRecords.filter(x=>x.id !== r.id);
    deletedRecords.unshift({...r, removedAt: new Date().toISOString()});
    saveAll();
    renderAll();
    showPage('dashboard-page');
}

/* Share */
async function shareRecord(r){
    const text = `Barangay Incident\nType: ${r.type}\nPerson: ${r.person}\nDate: ${r.date} ${r.time}\nLocation: ${r.location}\nDesc: ${r.description}`;
    if(navigator.share){
        try{ await navigator.share({title:'Barangay Incident', text}); alert('Shared'); }
        catch(e){ alert('Share cancelled or failed'); }
    } else {
        await navigator.clipboard.writeText(text);
        alert('Summary copied to clipboard (no native share support).');
    }
}

/* ---------- Deleted History ---------- */
function populateDeleted(){
    const out = document.getElementById('deleted-list'); out.innerHTML = '';
    if(deletedRecords.length===0){ out.innerHTML = '<div class="muted">No deleted records.</div>'; return; }
    deletedRecords.forEach(r=>{
        const row = document.createElement('div'); row.className='history-item';
        row.innerHTML = `<div><strong>${escapeHtml(r.person)}</strong> <span class="muted">(${r.type})</span><div class="muted">${formatDateTime(r.date,r.time)}</div></div>`;
        const actions = document.createElement('div');
        const btnRestore = document.createElement('button'); btnRestore.className='btn btn-ghost'; btnRestore.textContent='Restore';
        const btnPerm = document.createElement('button'); btnPerm.className='btn btn-primary'; btnPerm.style.cssText='background:#d9534f; color:white'; btnPerm.textContent='Delete';
        actions.appendChild(btnRestore); actions.appendChild(btnPerm);
        row.appendChild(actions);
        out.appendChild(row);

        btnRestore.addEventListener('click', ()=>{
            if(confirm('Restore this record?')){
                const copy = {...r}; delete copy.removedAt;
                if(r.type === 'fatal') fatalRecords.unshift(copy); else nonFatalRecords.unshift(copy);
                deletedRecords = deletedRecords.filter(x=>x.id !== r.id);
                saveAll(); renderAll(); populateDeleted();
            }
        });
        btnPerm.addEventListener('click', ()=>{
            if(confirm('Permanently delete this record? This cannot be undone.')){
                deletedRecords = deletedRecords.filter(x=>x.id !== r.id); saveAll(); populateDeleted();
            }
        });
    });
}
document.getElementById('clear-deleted-perm').addEventListener('click', ()=>{
    if(deletedRecords.length===0) return alert('No deleted records.');
    if(confirm('Permanently remove ALL deleted records?')){ deletedRecords = []; saveAll(); populateDeleted(); }
});

/* Move all to deleted */
document.getElementById('clear-all').addEventListener('click', ()=>{
    if(confirm('Move ALL active records to Deleted History?')){
        const now = new Date().toISOString();
        fatalRecords.forEach(r=> deletedRecords.unshift({...r, removedAt: now}));
        nonFatalRecords.forEach(r=> deletedRecords.unshift({...r, removedAt: now}));
        fatalRecords = []; nonFatalRecords = []; saveAll(); renderAll(); populateDeleted(); alert('All moved to Deleted History.');
    }
});

/* Export JSON */
document.getElementById('export-json').addEventListener('click', ()=>{
    const data = JSON.stringify({fatalRecords, nonFatalRecords, deletedRecords}, null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'brgy-records-export.json'; a.click(); URL.revokeObjectURL(url);
});

/* ---------- Dashboard stats ---------- */
function countWithin(records, unit){
    const now = new Date();
    if(unit === 'month'){
        const prefix = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        return records.filter(r => r.date && r.date.startsWith(prefix));
    } else {
        const prefix = String(now.getFullYear());
        return records.filter(r => r.date && r.date.startsWith(prefix));
    }
}
function renderStats(){
    const fMonth = countWithin(fatalRecords, 'month');
    const fYear = countWithin(fatalRecords, 'year');
    const nMonth = countWithin(nonFatalRecords, 'month');
    const nYear = countWithin(nonFatalRecords, 'year');

    document.getElementById('fatal-month-count').textContent = fMonth.length;
    document.getElementById('fatal-year-count').textContent = fYear.length;
    document.getElementById('nonfatal-month-count').textContent = nMonth.length;
    document.getElementById('nonfatal-year-count').textContent = nYear.length;

    document.getElementById('fatal-month-list').textContent = fMonth.slice(0,4).map(x=>x.person).join(', ');
    document.getElementById('fatal-year-list').textContent = fYear.slice(0,4).map(x=>x.person).join(', ');
    document.getElementById('nonfatal-month-list').textContent = nMonth.slice(0,4).map(x=>x.person).join(', ');
    document.getElementById('nonfatal-year-list').textContent = nYear.slice(0,4).map(x=>x.person).join(', ');
}

/* ---------- Render everything ---------- */
function renderAll(){
    populateList('fatal'); 
    populateList('nonfatal');
    renderRecent(document.getElementById('filter-type').value || 'all');
    renderStats();
    saveAll();
}

function renderDashboard(){
    renderRecent(document.getElementById('filter-type').value || 'all');
    renderStats();
}

/* filter change */
document.getElementById('filter-type').addEventListener('change', (e)=> renderRecent(e.target.value));

/* ---------- View page actions ---------- */
document.getElementById('view-share').addEventListener('click', ()=> { if(currentView) shareRecord(currentView); });
document.getElementById('view-delete').addEventListener('click', ()=> { if(currentView) confirmDelete(currentView); });

/* ---------- After login initialisation ---------- */
function afterLogin(){
    populateDeleted();
    renderAll();
    showPage('dashboard-page');
}

/* ---------- Seed demo data if none and ensure login screen is shown initially ---------- */
(function seed(){
    if(fatalRecords.length===0 && nonFatalRecords.length===0){
        const now = new Date().toISOString();
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`; 
        fatalRecords = [{
            id: uid(), type: 'fatal', date: `${currentMonth}-20`, time: '14:30', person: 'Juan Dela Cruz', location: 'Zone 5, Sampaguita St.', description: 'Traffic accident involving a motorcycle and a truck.', status: 'Closed', createdAt: now
        }];
        nonFatalRecords = [{
            id: uid(), type: 'nonfatal', date: `${currentMonth}-25`, time: '09:00', person: 'Maria Santos', location: 'Purok 1, Mangga Ave.', description: 'Loud noise complaint and minor physical altercation.', status: 'Open', createdAt: now
        }];
        saveAll();
    }
    
    // Start on the login page
    showPage('login-page'); 
})();