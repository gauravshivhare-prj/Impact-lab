// Central API client — all frontend calls to the Express API go through here. Never call Cerebras from the browser.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export { API_BASE_URL };
