<template>
  <main class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div><h1>Empresas</h1><p class="text-muted mb-0">Administrá las empresas de SmartAssistant.</p></div>
      <button class="btn btn-outline-secondary" @click="logout">Cerrar sesión</button>
    </div>
    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <p v-if="message" class="alert alert-success" role="status">{{ message }}</p>
    <div v-if="inviteLink" class="alert alert-info">
      <p>Compartí este enlace con la persona invitada. Vence en 48 horas.</p>
      <label for="invite-link" class="visually-hidden">Enlace de invitación</label>
      <input id="invite-link" :value="inviteLink" class="form-control" readonly @focus="$event.target.select()">
    </div>
    <section class="card p-4 mb-4">
      <h2 class="h5">Crear empresa</h2>
      <form class="d-flex gap-2 flex-wrap" @submit.prevent="createCompany">
        <label class="visually-hidden" for="company-name">Nombre de la empresa</label>
        <input id="company-name" v-model.trim="nombre" class="form-control flex-grow-1" placeholder="Nombre de la empresa" maxlength="120" required>
        <button class="btn btn-primary" :disabled="busy">Crear empresa</button>
      </form>
    </section>
    <section class="card p-4">
      <h2 class="h5">Empresas habilitadas</h2>
      <p v-if="loading">Cargando empresas...</p>
      <p v-else-if="!companies.length" class="text-muted">Todavía no hay empresas.</p>
      <div v-for="company in companies" :key="company._id" class="border rounded p-3 mb-3">
        <div class="d-flex justify-content-between"><strong>{{ company.nombre }}</strong><span>{{ company.activa ? 'Activa' : 'Inactiva' }}</span></div>
        <form class="d-flex gap-2 flex-wrap mt-3" @submit.prevent="invite(company)">
          <label class="visually-hidden" :for="`email-${company._id}`">Correo del administrador de la empresa</label>
          <input :id="`email-${company._id}`" v-model.trim="emails[company._id]" type="email" class="form-control flex-grow-1" placeholder="Correo del administrador de la empresa" required>
          <button class="btn btn-outline-primary" :disabled="busy || !company.activa">Invitar administrador</button>
        </form>
      </div>
    </section>
  </main>
</template>

<script>
import CompanyService from '@/services/company.service.js';
import AuthService from '@/services/auth.service.js';
export default {
  name: 'EmpresasView',
  data: () => ({ companies: [], emails: {}, nombre: '', loading: true, busy: false, error: '', message: '', inviteLink: '' }),
  async mounted() { await this.load(); },
  methods: {
    async load() {
      this.loading = true;
      try { this.companies = await CompanyService.list(); }
      catch (error) { this.error = error.response?.data?.error || 'No se pudieron cargar las empresas.'; }
      finally { this.loading = false; }
    },
    async createCompany() {
      this.error = ''; this.message = ''; this.busy = true;
      try { await CompanyService.create(this.nombre); this.nombre = ''; await this.load(); this.message = 'Empresa creada. Ya podés invitar a su administrador.'; }
      catch (error) { this.error = error.response?.data?.error || 'No se pudo crear la empresa.'; }
      finally { this.busy = false; }
    },
    async invite(company) {
      this.error = ''; this.message = ''; this.inviteLink = ''; this.busy = true;
      try { const result = await CompanyService.inviteAdmin(company._id, this.emails[company._id]); this.emails[company._id] = ''; this.inviteLink = result.enlace || ''; this.message = result.metodo === 'correo' ? 'Invitación enviada.' : 'Enlace de invitación creado.'; }
      catch (error) { this.error = error.response?.data?.error || 'No se pudo enviar la invitación.'; }
      finally { this.busy = false; }
    },
    async logout() { await AuthService.logout(); this.$router.push('/login'); }
  }
};
</script>
