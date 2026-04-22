# Project Context: Dynamic E-Commerce Platform

## 1. Project Overview

Building a custom Online Store from scratch with a decoupled architecture. The core philosophy is a **Server-Driven UI / Headless approach** where the structure and routing are controlled dynamically via the Backend Admin Panel, not by static frontend files.

## 2. Tech Stack

- **Frontend:** Nuxt 4 (Vue.js).
- **Backend:** Python, Django (Django Admin used as CMS).
- **Communication:** REST API.
- **Environment:** Local development runs on **HTTPS** to support secure cookies.

## 3. Core Architecture & Routing (Crucial)

- **Dynamic Routing:** The frontend does **not** use static files for every page in the `pages/` directory.
- **Catch-all Route:** Uses `[...slug].vue` and `ComponentsLoader.vue` to handle all incoming page requests.
- **Data Fetching flow:**
  1.  On every page load, a request is sent to a backend endpoint.
  2.  The backend returns JSON describing which **Components** should be rendered for that specific URL.
  3.  The frontend dynamically iterates through this data and renders the corresponding Vue components.
- **Inner Pages:** Specific logic (`getSinglePageUrl`) handles internal routing for nested component details.

## 4. Security & Authentication (Current Status)

- **Auth Flow:** Registration (Email Verification link), Login, Password Reset (Email link).
- **Security Mechanisms:**
  - **HTTPS:** Enabled locally.
  - **Cookies:** Uses `HttpOnly` and `Secure` cookies for authentication.
  - **CSRF:** Protection is active.
- **Rate Limiting (Backend Implemented):**
  - **Sensitive Endpoints (e.g., Login):** Max 5 attempts per minute.
  - **General Endpoints:** 100 req/min (Anonymous), 120 req/min (Authenticated).
  - **Response:** Triggers HTTP Status `429 Too Many Requests`.

<!-- ## 5. Current Task: Handling Rate Limiting (UX)

- **Backend status:** The logic works and returns `429` errors correctly.
- **Frontend goal:** Intercept the `429` error in Nuxt/Vue.
- **Requirement:** Display a user-friendly error message or UI state when the rate limit is hit, preventing the user from being confused by a generic failure. The UX needs to be polished specifically for this scenario. -->

## 6. Coding Guidelines

- **Nuxt 4:** Use modern Nuxt 4 features and Composition API (`<script setup>`).
- **typescript** Use typescript
- **Dynamic Components:** Keep in mind the component rendering is recursive or loop-based based on API response.
- **Error Handling:** Focus on global interceptors (e.g., in `$fetch` or Axios wrappers) to manage errors like 401, 403, and specifically 429 centrally.
