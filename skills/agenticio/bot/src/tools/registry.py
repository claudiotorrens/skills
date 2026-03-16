class ToolRegistry:
    def __init__(self):
        self.tools = {}

    def register(self, name: str, func):
        self.tools[name] = func

    def get(self, name: str):
        return self.tools.get(name)
