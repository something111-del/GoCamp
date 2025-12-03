import axios from 'axios';

const CHATBOT_API = process.env.REACT_APP_CHATBOT_URL || 'http://localhost:8080';
const BACKEND_API = (process.env.REACT_APP_API_URL || 'http://localhost:5001') + '/api';

export const submitChatQuery = (data) => axios.post(`${CHATBOT_API}/chatbot`, data);
export const getChatQueries = () => axios.get(`${CHATBOT_API}/queries`);
export const login = (data) => axios.post(`${BACKEND_API}/auth/login`, data);
export const deleteCampground = (id) => axios.delete(`${BACKEND_API}/campgrounds/${id}`);
