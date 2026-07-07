from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from models import db, History, Favorite
import requests
import random

CATEGORIES = [
    "Philosophy",
    "Wisdom",
    "Motivation",
    "Creativity",
    "Success",
    "Life",
    "Science",
    "Art"
]
app = Flask(__name__)
app.config.from_object(Config)

CORS(app)

db.init_app(app)

with app.app_context():
    db.create_all()



@app.route("/")
def home():
    return {"message": "QuoteForge Backend Running 🚀"}


@app.route("/api/quote", methods=["GET"])
def get_quote():
    try:
        response = requests.get("https://zenquotes.io/api/random")
        data = response.json()[0]

        quote_text = data["q"]
        author = data["a"]

        if "Too many requests" in quote_text:
            return jsonify({
                "error": "Quote service is temporarily unavailable. Please try again later."
            }), 429

        category = random.choice(CATEGORIES)
        new_history = History(
            quote=quote_text,
            author=author,
            category=category
        )

        db.session.add(new_history)
        db.session.commit()
    
        return jsonify({
                "quote": quote_text,
                "author": author,
                "category": category
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/api/history", methods=["GET"])
def get_history():
    quotes = History.query.order_by(History.created_at.desc()).all()

    history = []

    for quote in quotes:
        history.append({
            "id": quote.id,
            "quote": quote.quote,
            "author": quote.author,
            "category": quote.category,
            "created_at": quote.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify(history)

@app.route("/api/favorite", methods=["POST"])
def save_favorite():
    data = request.get_json()

    existing = Favorite.query.filter_by(
        quote=data["quote"],
        author=data["author"]
    ).first()

    if existing:
        if not existing.favorite:
            existing.favorite = True
            db.session.commit()

        return jsonify({
            "id": existing.id,
            "favorite": True
        })

    new_favorite = Favorite(
            quote=data["quote"],
            author=data["author"],
            category=data["category"],
        )

    db.session.add(new_favorite)
    db.session.commit()

    return jsonify({
            "id": new_favorite.id,
            "favorite": True
        })
@app.route("/api/favorites", methods=["GET"])
def get_favorites():
    quotes = Favorite.query.order_by(Favorite.created_at.desc())\
                        .all()

    favorites = []

    for quote in quotes:
        favorites.append({
            "id": quote.id,
            "quote": quote.quote,
            "author": quote.author,
            "category": quote.category,
            "created_at": quote.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify(favorites)
@app.route("/api/history/<int:quote_id>", methods=["DELETE"])
def delete_quote(quote_id):
    quote = History.query.get_or_404(quote_id)

    db.session.delete(quote)
    db.session.commit()

    return jsonify({
        "message": "Quote deleted"
    })
@app.route("/api/history", methods=["DELETE"])
def clear_history():
    History.query.delete()
    db.session.commit()

    return jsonify({
        "message": "History cleared"
    })

if __name__ == "__main__":
    app.run(debug=True)