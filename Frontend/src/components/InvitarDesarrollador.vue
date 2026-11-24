<template>
  <form class="card p-3 mb-3" @submit.prevent="invite">
    <h2 class="h5">Invitar desarrollador</h2>
    <p class="text-muted">Creá una invitación para que se una a tu empresa.</p>
    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <p v-if="sent" class="alert alert-success" role="status">Invitación enviada.</p>
    <div v-if="inviteLink" class="alert alert-info">
      <p>Compartí este enlace con la persona invitada. Vence en 48 horas.</p>
      <label for="developer-invite-link" class="visually-hidden">Enlace de invitación</label>
      <input id="developer-invite-link" :value="inviteLink" class="form-control" readonly @focus="$event.target.select()">
    </div>
    <div class="d-flex gap-2 flex-wrap">
      <label class="visually-hidden" for="invite-developer-email">Correo del desarrollador</label>
      <input id="invite-developer-email" v-model.trim="email" type="email" class="form-control flex-grow-1" placeholder="Correo del desarrollador" required>
      <button class="btn btn-primary" :disabled="busy">{{ busy ? 'Enviando...' : 'Enviar invitación' }}</button>
    </div>
  </form>
</template>

<script>
import CompanyService from '@/services/company.service.js';
export default {
  name: 'InvitarDesarrollador',
  data: () => ({ email: '', error: '', sent: false, inviteLink: '', busy: false }),
  methods: {
    async invite() {
      this.busy = true; this.error = ''; this.sent = false; this.inviteLink = '';
      try { const result = await CompanyService.inviteDeveloper(this.email); this.email = ''; this.sent = result.metodo === 'correo'; this.inviteLink = result.enlace || ''; }
      catch (error) { this.error = error.response?.data?.error || 'No se pudo enviar la invitación.'; }
      finally { this.busy = false; }
    }
  }
};
</script>
