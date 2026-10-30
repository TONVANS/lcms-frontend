# Backend CORS Configuration Requirements for LCMS Frontend

For the LCMS frontend to communicate with the backend API in live mode (`NEXT_PUBLIC_API_MODE=live`), the backend API server must be configured with the following Cross-Origin Resource Sharing (CORS) settings:

- **Allowed Origins (`Access-Control-Allow-Origin`)**: The frontend host origin(s), e.g. `http://localhost:3000`, `http://localhost:3100` (for local development and Playwright E2E test runs), and the production frontend domain (e.g. `https://lcms.edl.com.la` or deployment URLs). In development/staging, allowing `*` or reflecting the request `Origin` header is recommended.
- **Allowed Methods (`Access-Control-Allow-Methods`)**: `GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD`.
- **Allowed Headers (`Access-Control-Allow-Headers`)**: `Authorization, Content-Type, Accept, Origin, X-Requested-With`.
- **Exposed Headers (`Access-Control-Expose-Headers`)**: `Content-Disposition, Content-Type, Content-Length`. *Crucial for file downloads:* Axios in the browser cannot read the `Content-Disposition` header (which supplies document attachment filenames) unless it is explicitly listed in `Access-Control-Expose-Headers`.
- **Preflight Support (`OPTIONS`)**: Return status `200` or `204` on preflight `OPTIONS` requests containing the headers above.
