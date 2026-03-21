(async () => {

  // ===== FETCH ORG =====
  const orgPayload = await fetch("/api/organizations", {
    credentials: "include"
  }).then(r => r.json());

  const orgId =
    orgPayload[0]?.uuid ||
    orgPayload.organizations?.[0]?.uuid;

  if (!orgId) return;


  // ===== GET CONVERSATION ID =====
  const urlPath = window.location.pathname;
  const chatId = urlPath.split("/chat/")[1];

  if (!chatId) return;


  // ===== FETCH CONVERSATION =====
  const dataBlob = await fetch(
    `/api/organizations/${orgId}/chat_conversations/${chatId}?tree=True&rendering_mode=messages&render_all_tools=true`,
    { credentials: "include" }
  ).then(r => r.json());


  // ===== EXTRACT NAME → FILENAME =====
  function sanitizeFilename(name) {
    return name
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 100);
  }

  const fileLabel =
    sanitizeFilename(dataBlob.name || "claude_tree") + ".xml";


  // ===== BUILD TREE =====
  const entries =
    dataBlob.chat_messages || dataBlob.messages;

  const lookup = {};
  const branches = {};
  const zeroParent = "00000000-0000-4000-8000-000000000000";

  let rootId = null;

  entries.forEach(item => {
    lookup[item.uuid] = item;
    branches[item.uuid] = [];
  });

  entries.forEach(item => {
    const parent = item.parent_message_uuid;

    if (!parent || parent === zeroParent) {
      rootId = item.uuid;
    } else if (branches[parent]) {
      branches[parent].push(item.uuid);
    }
  });

  Object.keys(branches).forEach(key => {
    branches[key].sort((a, b) =>
      new Date(lookup[a].created_at) -
      new Date(lookup[b].created_at)
    );
  });


  // ===== TEXT HELPERS =====
  const grabText = t =>
    t.text ||
    t.content?.map(e => e.text || "").join("\n") ||
    "";

  const sanitizeXML = s =>
    s.replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;");


  // ===== WALK TREE =====
  let xmlBuffer = "";

  function walkTree(id, path = "1") {
    const node = lookup[id];
    if (!node) return;

    const isHuman = node.sender === "human";
    const role = isHuman ? "human" : "machine";

    xmlBuffer += `<${role}_${path}>\n${sanitizeXML(grabText(node))}\n</${role}_${path}>\n\n`;

    (branches[id] || []).forEach((childId, index) => {
      const child = lookup[childId];
      const delim = child.sender === "human" ? "." : "-";
      walkTree(childId, path + delim + (index + 1));
    });
  }

  walkTree(rootId);


  // ===== DOWNLOAD =====
  const finalXml = `<root>\n${xmlBuffer}</root>`;

  const blobFile = new Blob([finalXml], {
    type: "application/xml"
  });

  const objectURL = URL.createObjectURL(blobFile);

  const anchor = document.createElement("a");
  anchor.href = objectURL;
  anchor.download = fileLabel;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(objectURL);

})();
