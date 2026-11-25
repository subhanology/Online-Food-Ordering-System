Q1 - Online Food Ordering System
Open this folder in VS Code. Run npm start. Open http://localhost:3001.
Node 18+ recommended. No npm install is required. Bootstrap CSS is loaded from a CDN.
Use server URL directly, not Live Server. Stop with Ctrl+C.
GET /food, POST /orders, GET /orders. Import included Postman collection and run it.
Demo only: no authentication is required by the question; server listens on loopback.
Phone validation assumes 11-digit Pakistani numbers. Sample menu and prices are illustrative.
Git (from this folder):
 git init
 git add package.json .gitignore data server.js
 git commit -m "Implement Node REST APIs and JSON persistence"
 git add public
 git commit -m "Build responsive menu and interactive cart"
 git add README.txt Food-Ordering.postman_collection.json
 git commit -m "Add API tests and setup guide"
 git log --oneline
