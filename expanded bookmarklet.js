 (async () => {

  const o = await fetch("/api/organizations",{credentials:"include"}).then(r=>r.json());

  const orgId = o[0]?.uuid || o.organizations?.[0]?.uuid;

  if (!orgId) return;

  const chatId = location.pathname.split("/chat/")[1];

  if (!chatId) return;

  const d = await fetch(

    `/api/organizations/${orgId}/chat_conversations/${chatId}?tree=True&rendering_mode=messages&render_all_tools=true`,

    {credentials:"include"}

  ).then(r=>r.json());

  const fileLabel = ((d.name||"claude_tree")

    .replace(/[<>:"/\\|?*\x00-\x1F]/g,"")

    .replace(/\s+/g,"_")

    .slice(0,100))+".xml";

  const ROOT="__root__";

  const nodes = {[ROOT]:{sender:null,kids:[]}};

  (d.chat_messages||d.messages).forEach(m => { nodes[m.uuid]={...m,kids:[]}; });

  (d.chat_messages||d.messages).forEach(m => {

    const p=m.parent_message_uuid;

    (nodes[p]&&p!==ROOT ? nodes[p] : nodes[ROOT]).kids.push(m.uuid);

  });

  Object.values(nodes).forEach(n=>

    n.kids.sort((a,b)=>nodes[a]?.created_at<nodes[b]?.created_at?-1:1)

  );

  const grabText = n => n.text||n.content?.map(e=>e.text||"").join("\n")||"";

  const X = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  let xml="";

  function walk(id,path) {

    const node=nodes[id];

    if(!node) return;

    node.kids.forEach((kid,i)=>{

      const knode=nodes[kid];

      const role=knode.sender==="human"?"human":"machine";

      const delim=role==="human"?".":"-";

      const kpath=id===ROOT?String(i+1):path+delim+(i+1);

      xml+=`<${role}_${kpath}>\n${X(grabText(knode))}\n</${role}_${kpath}>\n\n`;

      walk(kid,kpath);

    });

  }

  walk(ROOT,null);

  const a=document.createElement("a");

  a.href=URL.createObjectURL(new Blob([`<root xml:space="preserve">\n${xml}</root>`],{type:"application/xml"}));

  a.download=fileLabel;

  document.body.appendChild(a);

  a.click();

  document.body.removeChild(a);

})();
