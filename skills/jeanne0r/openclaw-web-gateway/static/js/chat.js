(function () {
  const dom = {
    form: document.getElementById("chatForm"),
    input: document.getElementById("messageInput"),
    messages: document.getElementById("messages"),
    sendBtn: document.getElementById("sendBtn"),
    userSelect: document.getElementById("userSelect"),
  };

  function addMessage(role, content, label) {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${role}`;

    if (label) {
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = label;
      wrapper.appendChild(meta);
    }

    const text = document.createElement("div");
    text.textContent = content;
    wrapper.appendChild(text);

    dom.messages.appendChild(wrapper);
    dom.messages.scrollTop = dom.messages.scrollHeight;
  }

  addMessage("system", "Gateway loaded. Send a message to test your OpenClaw connection.", "System");

  dom.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = dom.input.value.trim();
    const user = dom.userSelect.value || "Family";
    if (!message) return;

    addMessage("user", message, user);
    dom.input.value = "";
    dom.sendBtn.disabled = true;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, message }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Request failed");
      }
      addMessage("assistant", data.reply, "Jarvis");
    } catch (error) {
      addMessage("system", String(error.message || error), "Error");
    } finally {
      dom.sendBtn.disabled = false;
      dom.input.focus();
    }
  });
})();
