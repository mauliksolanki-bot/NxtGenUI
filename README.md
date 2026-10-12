# NxtGenUI

React frontend for NxtGen. Empty ServiceNow-style workspace shell; no business APIs yet.

Pairs with [NxtGenBackend](../NxtGenBackend) (`GET /api/health`, CORS origin `http://localhost:5173`).

## Run

```powershell
cd C:\Projects\NxtGenUI
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to the Spring Boot app on port `8080`.

Copy `.env.example` to `.env` if you need to override `VITE_API_BASE_URL`.

## Ubuntu deployment

The `development` branch deploys through `azure-pipelines.yml`. See [deployment setup](deployment/README.md) for the Azure DevOps SSH connection, one-time Ubuntu setup, `/opt/nxtgen` folder, and rollback commands.
