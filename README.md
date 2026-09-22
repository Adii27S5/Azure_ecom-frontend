# Azure E-Commerce Storefront (Frontend)
**Repository:** [https://github.com/Adii27S5/Azure_ecom-frontend](https://github.com/Adii27S5/Azure_ecom-frontend)  
**Project ID:** 24CC3046-P056

A modern, responsive, high-performance eCommerce Storefront designed to demonstrate Microsoft Azure Load Testing and Capacity Study.

---

## Features
- **Dynamic Catalog**: Categorized products (Laptops, Smartphones, Monitors, Audio, Accessories, Gaming, Storage) fetched live from the backend API (`GET /api/products`).
- **Full-Text Live Search**: Search bar querying the backend database (`GET /api/search?q=...`).
- **Interactive Cart & Checkout**:
  - Add to cart with quantity management.
  - Places live orders via `POST /api/orders`.
- **Live Azure Backend Telemetry Pill**:
  - Pings `GET /health` every 5 seconds.
  - Displays round-trip response time (latency) and the active Azure App Service instance ID.
- **Glassmorphic Dark Theme**: Clean, responsive UI built with vanilla CSS.

---

## Local Development

```bash
# Serve locally using npx or any static server
npx serve . -l 3000
```

By default, the storefront connects to the backend API running on `http://localhost:8080`.

---

## Deploy to Azure Static Web Apps
1. Push this repository to GitHub: `https://github.com/Adii27S5/Azure_ecom-frontend`
2. In Azure Portal, search **Static Web Apps** -> **+ Create**.
3. Link your GitHub account and repository.
4. Select Build Preset: **Custom** (App location: `/`, Output location: `/`).
5. Click **Review + Create**.
