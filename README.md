# Hi, I'm Udayraj Saroj 👋
### Full-Stack MERN Developer 

Welcome to my portfolio repository. I specialize in building robust web applications using the **MERN Stack (MongoDB, Express.js, React.js, Node.js)**. My focus is on clean system design, scalable architecture, and solving real-world logical problems.

---

## 🚀 Featured Projects

### 1. 🎁 Treasure-to-Charity
A full-stack donation platform engineered to streamline local philanthropy. It features a custom resource allocation logic that directly connects donors with end-users, bypassing intermediate NGOs.

*   **Key Features:** Direct-to-user distribution flow, atomic database updates to prevent race conditions, and secure JWT authentication.
*   **Tech Stack:** React.js, Node.js, Express, MongoDB Atlas.

**💻 How to Run Locally:**
```bash
# Clone this specific repository
git clone https://github.com/udayrajsaroj/Treasure-to-Charity.git
cd Treasure-to-Charity

# Setup environment variables in backend/.env (PORT, MONGO_URI, JWT_SECRET)

# Run Backend
cd server
npm install
node server.js

# Run Frontend (in a new terminal)
cd ../client
npm install
npm start