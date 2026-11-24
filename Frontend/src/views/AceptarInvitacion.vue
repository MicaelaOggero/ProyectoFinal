<template>
  <main class="container py-5" style="max-width: 600px">
    <section class="card p-4">
      <h1 class="h3">Unite a SmartAssistant</h1>
      <p v-if="loading">Comprobando invitación...</p>
      <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
      <div v-if="success" class="alert alert-success" role="status">Tu cuenta fue creada. Ya podés iniciar sesión.</div>
      <template v-if="invitation && !success">
        <p>Te invitaron a <strong>{{ invitation.empresa }}</strong> como {{ invitation.rol === 'admin' ? 'administrador de empresa' : 'desarrollador' }}.</p>
        <p>Correo: {{ invitation.email }}</p>
        <form @submit.prevent="accept">
          <label for="nombre" class="form-label">Nombre</label>
          <input id="nombre" v-model.trim="nombre" class="form-control mb-3" required autocomplete="given-name">
          <label for="apellido" class="form-label">Apellido</label>
          <input id="apellido" v-model.trim="apellido" class="form-control mb-3" autocomplete="family-name">
          <label for="password" class="form-label">Contraseña</label>
          <input id="password" v-model="password" type="password" minlength="8" class="form-control mb-3" required autocomplete="new-password">
          <button class="btn btn-primary" :disabled="busy">{{ busy ? 'Creando cuenta...' : 'Aceptar invitación' }}</button>
        </form>
      </template>
      <router-link v-if="success || (!loading && !invitation)" to="/login" class="mt-3">Ir a iniciar sesión</router-link>
    </section>
  </main>
</template>

<script>
import CompanyService from '@/services/company.service.js';
export default {
  name: 'AceptarInvitacionView',
  data: () => ({ invitation: null, nombre: '', apellido: '', password: '', loading: true, busy: false, success: false, error: '' }),
  async mounted() {
    try { this.invitation = await CompanyService.invitation(this.$route.query.token || ''); }
    catch (error) { this.error = error.response?.data?.error || 'No se pudo comprobar la invitación.'; }
    finally { this.loading = false; }
  },
  methods: {
    async accept() {
      this.error = ''; this.busy = true;
      try { await CompanyService.accept({ token: this.$route.query.token, nombre: this.nombre, apellido: this.apellido, password: this.password }); this.password = ''; this.success = true; }
      catch (error) { this.error = error.response?.data?.error || 'No se pudo crear la cuenta.'; }
      finally { this.busy = false; }
    }
  }
};
</script>
