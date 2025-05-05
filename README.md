<p align="left"> <img src="https://github.com/rahulks01/amici/blob/main/Frontend/public/logo-full.png" alt="Amici Logo" width="220" style="vertical-align: middle;"></p> 

**Amici** is a modern, real-time chat application built using the **MERN stack** (MongoDB, Express, React, Node.js), featuring a responsive and efficient frontend integrated with **Socket.IO**, **Zustand**, and **Tailwind CSS**. The backend leverages **Redis** for caching and a robust Pub/Sub model to enable efficient group messaging functionality.<br> <i>(amici translates to 'friend' in French)</i>

---

## About Amici

**Amici** provides a seamless and scalable messaging platform designed to facilitate both private and group communication in real time. It supports structured conversations through "channels" and incorporates real-time updates using web sockets, with state managed efficiently on the client side.

### Core Features

* **Real-Time Messaging**: Instant communication powered by **Socket.IO**
* **Group Chats named as Channels**: Organized discussions within defined user groups
* **State Management**: Lightweight global state handling using **Zustand**
* **Responsive UI**: Clean and adaptive design using **Tailwind CSS**
* **Redis Integration**: Efficient caching and Pub/Sub implementation for group messages
* **Secure Authentication**: JWT-based authentication system
* **Email Support**: Integration for account verification using Nodemailer

---

## Getting Started: Running Amici Locally

Follow the steps below to set up and run the application on your local development environment.

### 1. Clone the Repository

```bash
git clone https://github.com/rahulks01/amici.git
cd amici
```

### 2. Install Dependencies

Navigate into both the `backend` and `frontend` directories and install the required dependencies:

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in both the **backend** and **frontend** directories with the following structure:

#### 📁 Backend `.env`

```env
PORT=<your-backend-port>
JWT_SECRET=<your-jwt-secret>
ORIGIN=<your-frontend-url>
DATABASE_URL=<your-database-url>
DATABASE_PASSWORD=<your-database-password>

REDIS_USERNAME=<your-redis-username>
REDIS_PASSWORD=<your-redis-password>
REDIS_HOST=<your-redis-host>
REDIS_PORT=<your-redis-port>

EMAIL_HOST=<your-email-host>
EMAIL_PORT=<your-email-port>
EMAIL_USER=<your-sender-email-address>
EMAIL_PASS=<your-email-password>
EMAIL_FROM=<your-email-user>
```

#### 📁 Frontend `.env`

```env
VITE_BACKEND_URL=<your-backend-base-url>
```

> Example: `VITE_BACKEND_URL=http://localhost:8000`

### 4. Run the Application

Start both the backend and frontend development servers in separate terminal sessions:

#### Start Backend

```bash
cd backend
npm run dev
```

#### Start Frontend

```bash
cd frontend
npm run dev
```

### 5. Access the Application

Once both servers are running, open your browser and navigate to:

```
http://localhost:5173
```


