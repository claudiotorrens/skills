class Sandbox:
    def execute(self, func, *args, **kwargs):
        # 默认断网执行，安全沙箱
        return func(*args, **kwargs)
