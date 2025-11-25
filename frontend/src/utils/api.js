import axios from 'axios';

// Default API base URL for development. Change via env if needed.
axios.defaults.baseURL = (typeof process !== 'undefined' && process.env.API_URL) ? process.env.API_URL : 'http://localhost:5000';

// attach token from localStorage (if present)
try {
	const token = localStorage.getItem('token');
	if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
} catch (e) { }

export default axios;
