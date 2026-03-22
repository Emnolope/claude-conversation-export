(async () => {
  const org = await fetch("/api/organizations", {credentials:"include"}).then(r => r.json());
  const oid = org[0]?.uuid || org.organizations?.[0]?.uuid;
  if (!oid) return;

  const chatId = location.pathname.split("/chat/")[1];
  if (!chatId) return;

  const data = await fetch(
    `/api/organizations/${oid}/chat_conversations/${chatId}?tree=True&rendering_mode=messages&render_all_tools=true`,
    {credentials:"include"}
  ).then(r => r.json());

  const filename = ((data.name || "claude_tree")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 100)) + ".xml";

  const ROOT = "__root__";
  const Nodes = {[ROOT]: {sender: null, kids: []}};

  (data.chat_messages || data.messages).forEach(msg => {
    Nodes[msg.uuid] = {...msg, kids: []};
  });

  (data.chat_messages || data.messages).forEach(msg => {
    const parent = msg.parent_message_uuid;
    (Nodes[parent] && parent !== ROOT ? Nodes[parent] : Nodes[ROOT]).kids.push(msg.uuid);
  });

  Object.values(Nodes).forEach(node =>
    node.kids.sort((a, b) => Nodes[a]?.created_at < Nodes[b]?.created_at ? -1 : 1)
  );

  const grabText = node => node.text || node.content?.map(e => e.text || "").join("\n") || "";
  const xmlEscape = str => str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  let xml = "";

  function walk(id, path) {
    const node = Nodes[id];
    if (!node) return;
    node.kids.forEach((kid, i) => {
      const kidNode  = Nodes[kid];
      const role     = kidNode.sender === "human" ? "human" : "machine";
      const delim    = role === "human" ? "." : "-";
      const kidPath  = id === ROOT ? String(i + 1) : path + delim + (i + 1);
      const kidText  = grabText(kidNode);
      const ts       = kidNode.created_at || "";
      xml += `<${role}_${kidPath} created_at="${ts}">\n${xmlEscape(kidText)}\n</${role}_${kidPath}>\n\n`;
      walk(kid, kidPath);
    });
  }

  walk(ROOT, null);

  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob(
    [`<root xml:space="preserve">\n${xml}</root>`],
    {type: "application/xml"}
  ));
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
})();
