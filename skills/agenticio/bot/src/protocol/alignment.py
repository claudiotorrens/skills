class AgentAlignment:
    def __init__(self, mode="strict"):
        self.mode = mode
        self.allowed_capabilities = ["local_compute", "read_memory"]

    def verify_action(self, action_intent: dict):
        if action_intent.get("requires_network") and self.mode == "strict":
            raise Exception("Network access denied by Alignment Protocol.")
        return True
