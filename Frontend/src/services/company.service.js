import axios from 'axios';

const API = `${process.env.VUE_APP_API_URL || 'http://localhost:8080/api'}/company`;
const auth = () => ({ withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });

export default {
  async list() { return (await axios.get(API, auth())).data; },
  async create(nombre) { return (await axios.post(API, { nombre }, auth())).data; },
  async inviteAdmin(id, email) { return (await axios.post(`${API}/${id}/invitaciones-admin`, { email }, auth())).data; },
  async inviteDeveloper(email) { return (await axios.post(`${API}/mi-empresa/invitaciones`, { email }, auth())).data; },
  async invitation(token) { return (await axios.get(`${API}/invitaciones/${encodeURIComponent(token)}`)).data; },
  async accept(data) { return (await axios.post(`${API}/invitaciones/aceptar`, data)).data; }
};
