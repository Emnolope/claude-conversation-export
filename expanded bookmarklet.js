(async () => {

  /*************************************************
   * SECTION 1 — GET USER + CONVERSATION DATA
   *************************************************/

  // Step 1: Fetch organization info (Claude requires orgId)
  const organizationResponse = await fetch("/api/organizations", {
    credentials: "include"
  });

  const organizationData = await organizationResponse.json();

  // Claude sometimes returns different shapes
  const organizationId =
    organizationData[0]?.uuid ||
    organizationData.organizations?.[0]?.uuid;

  if (!organizationId) {
    console.error("Could not determine organization ID.");
    return;
  }

  // Step 2: Extract conversation ID from current URL
  const currentUrl = window.location.pathname;
  const conversationId = currentUrl.split("/chat/")[1];

  if (!conversationId) {
    console.error("No conversation ID found in URL.");
    return;
  }

  // Step 3: Fetch FULL conversation tree (not just visible messages)
  const conversationResponse = await fetch(
    `/api/organizations/${organizationId}/chat_conversations/${conversationId}?tree=True&rendering_mode=messages&render_all_tools=true`,
    { credentials: "include" }
  );

  const conversationJson = await conversationResponse.json();


  /*************************************************
   * SECTION 2 — BUILD TREE STRUCTURE
   *************************************************/

  // Claude may store messages under different keys
  const allMessages =
    conversationJson.chat_messages ||
    conversationJson.messages;

  // Maps for fast lookup
  const messageById = {};      // uuid → message
  const childrenByParent = {}; // parent_uuid → [child_uuid]

  // Special root parent UUID used by Claude
  const ROOT_PARENT_UUID = "00000000-0000-4000-8000-000000000000";

  let rootMessageId = null;

  // Initialize maps
  allMessages.forEach(message => {
    messageById[message.uuid] = message;
    childrenByParent[message.uuid] = [];
  });

  // Build parent → children relationships
  allMessages.forEach(message => {
    const parentId = message.parent_message_uuid;

    if (!parentId || parentId === ROOT_PARENT_UUID) {
      rootMessageId = message.uuid;
    } else if (childrenByParent[parentId]) {
      childrenByParent[parentId].push(message.uuid);
    }
  });

  // Ensure children are ordered chronologically
  Object.keys(childrenByParent).forEach(parentId => {
    childrenByParent[parentId].sort((a, b) => {
      const timeA = new Date(messageById[a].created_at);
      const timeB = new Date(messageById[b].created_at);
      return timeA - timeB;
    });
  });


  /*************************************************
   * SECTION 3 — TEXT EXTRACTION + XML SAFETY
   *************************************************/

  function extractMessageText(message) {
    // Some messages use .text, others use structured content
    if (message.text) return message.text;

    if (message.content) {
      return message.content
        .map(part => part.text || "")
        .join("\n");
    }

    return "";
  }

  function escapeForXML(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }


  /*************************************************
   * SECTION 4 — TREE WALK + PATH ENCODING
   *************************************************/

  let xmlOutput = "";

  function traverseTree(messageId, currentPath = "1") {
    const message = messageById[messageId];
    if (!message) return;

    // Determine role
    const isHuman = message.sender === "human";
    const tagName = isHuman ? "human" : "machine";

    // Extract and sanitize text
    const rawText = extractMessageText(message);
    const safeText = escapeForXML(rawText);

    // 🔥 YOUR CHANGE: no space in tag
    xmlOutput += `<${tagName}_${currentPath}>\n${safeText}\n</${tagName}_${currentPath}>\n\n`;

    // Traverse children
    const childIds = childrenByParent[messageId] || [];

    childIds.forEach((childId, index) => {
      const childMessage = messageById[childId];

      // 🔥 YOUR CHANGE: "-" for machine, "." for human
      const delimiter =
        childMessage.sender === "human" ? "." : "-";

      const nextPath = currentPath + delimiter + (index + 1);

      traverseTree(childId, nextPath);
    });
  }

  if (!rootMessageId) {
    console.error("Could not find root message.");
    return;
  }

  traverseTree(rootMessageId);


  /*************************************************
   * SECTION 5 — FILE DOWNLOAD (MOBILE SAFE)
   *************************************************/

  const finalXml = `<root>\n${xmlOutput}</root>`;

  const fileBlob = new Blob([finalXml], {
    type: "application/xml"
  });

  const fileUrl = URL.createObjectURL(fileBlob);

  const downloadLink = document.createElement("a");
  downloadLink.href = fileUrl;
  downloadLink.download = "claude_tree.xml";

  document.body.appendChild(downloadLink);
  downloadLink.click();

  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(fileUrl);

})();
