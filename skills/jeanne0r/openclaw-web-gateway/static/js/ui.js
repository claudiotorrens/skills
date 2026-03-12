window.JARVIS_UI = {
  state: {
    participants: [],
    defaultUser: "Family",
  },
};

(function () {
  const dom = {
    userSelect: document.getElementById("userSelect"),
    statusBadge: document.getElementById("statusBadge"),
  };

  function setStatus(text) {
    dom.statusBadge.textContent = text;
  }

  function fillParticipants(participants, defaultUser) {
    dom.userSelect.innerHTML = "";
    participants.forEach((participant) => {
      const option = document.createElement("option");
      option.value = participant.display_name;
      option.textContent = participant.display_name;
      dom.userSelect.appendChild(option);
    });
    dom.userSelect.value = defaultUser || participants[0]?.display_name || "Family";
  }

  async function bootstrap() {
    try {
      const response = await fetch("/api/bootstrap");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "bootstrap failed");
      }
      window.JARVIS_UI.state.participants = data.participants || [];
      window.JARVIS_UI.state.defaultUser = data.default_user || "Family";
      fillParticipants(window.JARVIS_UI.state.participants, window.JARVIS_UI.state.default_user);
      setStatus("Ready");
    } catch (error) {
      console.error(error);
      setStatus("Offline");
    }
  }

  bootstrap();
})();
