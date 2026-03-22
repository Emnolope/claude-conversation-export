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
javascript:(async()=>{const o=await fetch("/api/organizations",{credentials:"include"}).then(r=>r.json());const orgId=o[0]?.uuid||o.organizations?.[0]?.uuid;if(!orgId)return;const chatId=location.pathname.split("/chat/")[1];if(!chatId)return;const d=await fetch(`/api/organizations/${orgId}/chat_conversations/${chatId}?tree=True&rendering_mode=messages&render_all_tools=true`,{credentials:"include"}).then(r=>r.json());const f=((d.name||"claude_tree").replace(/[<>:"/\\|?*\x00-\x1F]/g,"").replace(/\s+/g,"_").slice(0,100))+".xml";const R="__root__";const n={[R]:{sender:null,kids:[]}};(d.chat_messages||d.messages).forEach(m=>{n[m.uuid]={...m,kids:[]};});(d.chat_messages||d.messages).forEach(m=>{const p=m.parent_message_uuid;(n[p]&&p!==R?n[p]:n[R]).kids.push(m.uuid);});Object.values(n).forEach(v=>v.kids.sort((a,b)=>n[a]?.created_at<n[b]?.created_at?-1:1));const g=v=>v.text||v.content?.map(e=>e.text||"").join("\n")||"";const x=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");let xml="";function w(id,path){const node=n[id];if(!node)return;node.kids.forEach((kid,i)=>{const k=n[kid];const role=k.sender==="human"?"human":"machine";const delim=role==="human"?".":"-";const kp=id===R?String(i+1):path+delim+(i+1);xml+=`<${role}_${kp}>\n${x(g(k))}\n</${role}_${kp}>\n\n`;w(kid,kp);});}w(R,null);const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([`<root xml:space="preserve">\n${xml}</root>`],{type:"application/xml"}));a.download=f;document.body.appendChild(a);a.click();document.body.removeChild(a);})();
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
