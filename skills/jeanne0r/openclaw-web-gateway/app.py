from flask import Flask, render_template

from config import APP_SUBTITLE, APP_TITLE, DEBUG, HOST, PORT
from routes.chat import chat_bp
from routes.state import state_bp

app = Flask(__name__)
app.register_blueprint(chat_bp)
app.register_blueprint(state_bp)


@app.get("/")
def index():
    return render_template("index.html", app_title=APP_TITLE, app_subtitle=APP_SUBTITLE)


if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=DEBUG)
