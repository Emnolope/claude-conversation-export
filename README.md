# Export Claude Chat (Full Tree) — One Click Bookmarklet

Export **full Claude conversation history including hidden branches** as XML.

Works on desktop and mobile.
No install. No extensions. No bullshit.

---

## 🔥 ONE-CLICK EXPORT (BOOKMARKLET)

### Step 1 — Create a bookmark

* Name it anything (e.g. `Export Claude`)
* Paste THIS as the URL:

```javascript
javascript:(async()=>{const o=await fetch("/api/organizations",{credentials:"include"}).then(r=>r.json());const ORG=o[0]?.uuid||o.organizations?.[0]?.uuid;const CONV=location.pathname.split("/chat/")[1];const j=await fetch(`/api/organizations/${ORG}/chat_conversations/${CONV}?tree=True&rendering_mode=messages&render_all_tools=true`,{credentials:"include"}).then(r=>r.json());const m=j.chat_messages||j.messages,n={},c={},z="00000000-0000-4000-8000-000000000000";let r=null;m.forEach(x=>{n[x.uuid]=x;c[x.uuid]=[]});m.forEach(x=>{if(!x.parent_message_uuid||x.parent_message_uuid===z){r=x.uuid}else if(c[x.parent_message_uuid]){c[x.parent_message_uuid].push(x.uuid)}});Object.keys(c).forEach(k=>c[k].sort((a,b)=>new Date(n[a].created_at)-new Date(n[b].created_at)));const g=t=>t.text||t.content?.map(e=>e.text||"").join("\n")||"";const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");let out="";function w(u,p="1"){const x=n[u];if(!x)return;const h=x.sender==="human",role=h?"human":"machine";out+=`<${role}${p}>\n${esc(g(x))}\n</${role}${p}>\n\n`;(c[u]||[]).forEach((id,i)=>{const ch=n[id],d=ch.sender==="human"?".":"-";w(id,p+d+(i+1))})}w(r);const final=`<root>\n${out}</root>`;const blob=new Blob([final],{type:"application/xml"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="claude_tree.xml";document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);})();
```

---

### Step 2 — Use it

1. Open any Claude conversation
2. Tap the bookmark
3. File downloads automatically:

```
claude_tree.xml
```

---

## 📄 WHAT YOU GET

Full conversation tree:

```xml
<human_1>
Hello
</human_1>

<machine_1-1>
Hi
</machine_1-1>

<human_1-1.1>
Next branch
</human_1-1.1>
```

### Rules

* `.` = human messages
* `+` = machine messages
* Numbers = branch/version index
* Structure = full tree (not just visible chat)

---

## 🧠 WHY THIS EXISTS

Claude stores conversations as a **tree (DAG)** internally.
UI only shows one branch.

This extracts the **entire structure** using the internal API.

---

## 🔍 KEYWORDS (for search engines)

claude export, claude chat export, claude conversation export, download claude chat, claude api chat_conversations, claude tree export, anthropic claude export

---

## ⚠️ NOTES

* Must be logged into Claude
* Works best in Chrome / Firefox
* If Brave blocks it → disable Shields

---

## 🧾 CREDIT

Vibe coded with ChatGPT
