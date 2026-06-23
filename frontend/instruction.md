# Running the Frontend Locally

This guide explains how to install dependencies and run the frontend dashboard application on your local development machine.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
*   [npm](https://www.npmjs.com/) (usually comes bundled with Node.js)

---

## Setup & Run Instructions

Follow these steps to set up and run the frontend:

### 1. Navigate to the Frontend Directory
Open a terminal and change your working directory to the `frontend` folder:
```bash
cd frontend
```

### 2. Install Dependencies
Run the installation command to download and set up all required packages (including Tailwind CSS v4, Lucide icons, and jsPDF):
```bash
npm install
```

### 3. Ensure the Backend Server is Running
The frontend dev server uses a proxy configuration configured in [vite.config.js](file:///home/sayem/projects/ViolationDetections/frontend/vite.config.js) to forward API requests to the Python FastAPI backend.
*   **Target Backend URL**: `http://127.0.0.1:8000`
*   Ensure your FastAPI backend is running via Uvicorn before interacting with the UI:
    ```bash
    # (From the python API directory)
    uvicorn main:app --reload
    ```

### 4. Start the Vite Development Server
Run the development command to boot up the hot-reloading web server:
```bash
npm run dev
```

### 5. Access the Dashboard
Once the server starts, open your web browser and navigate to the local host URL shown in the terminal, typically:
*   **Local URL**: [http://localhost:5173](http://localhost:5173)

---

## Available Scripts

In the `frontend` directory, you can run the following npm commands:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the app in development mode with Hot Module Replacement (HMR). |
| `npm run build` | Builds the production-ready assets into the `dist/` directory. |
| `npm run preview` | Locally previews the production build built with the compile script. |
| `npm run lint` | Runs ESLint to check for syntax and styling guidelines in the codebase. |
