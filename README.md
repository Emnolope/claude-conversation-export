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
javascript:(async()=>{const o=await fetch("/api/organizations",{credentials:"include"}).then(r=>r.json());const i=o[0]?.uuid||o.organizations?.[0]?.uuid;const u=location.pathname;const c=u.split("/chat/")[1];const d=await fetch(`/api/organizations/${i}/chat_conversations/${c}?tree=True&rendering_mode=messages&render_all_tools=true`,{credentials:"include"}).then(r=>r.json());const f=(d.name||"claude_tree").replace(/[<>:"/\\|?*\x00-\x1F]/g,"").replace(/\s+/g,"_").slice(0,100)+".xml";const e=d.chat_messages||d.messages,l={},b={},z="00000000-0000-4000-8000-000000000000";let r=null;e.forEach(x=>{l[x.uuid]=x;b[x.uuid]=[]});e.forEach(x=>{if(!x.parent_message_uuid||x.parent_message_uuid===z){r=x.uuid}else if(b[x.parent_message_uuid]){b[x.parent_message_uuid].push(x.uuid)}});Object.keys(b).forEach(k=>b[k].sort((a,b2)=>new Date(l[a].created_at)-new Date(l[b2].created_at)));const g=t=>t.text||t.content?.map(e=>e.text||"").join("\n")||"";const s=x=>x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");let x="";function w(u,p="1"){const n=l[u];if(!n)return;const h=n.sender==="human",t=h?"human":"machine";x+=`<${t}_${p}>\n${s(g(n))}\n</${t}_${p}>\n\n`;(b[u]||[]).forEach((id,i)=>{const d=l[id].sender==="human"?".":"-";w(id,p+d+(i+1))})}w(r);const B=new Blob([`<root>\n${x}</root>`],{type:"application/xml"});const U=URL.createObjectURL(B);const a=document.createElement("a");a.href=U;a.download=f;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(U);})();
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
