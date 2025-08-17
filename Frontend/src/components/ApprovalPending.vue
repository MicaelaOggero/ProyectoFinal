<template>
  <div class="modal fade" id="approvalPendingModal" tabindex="-1" aria-labelledby="approvalPendingModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="approvalPendingModalLabel">Cuenta Pendiente de Aprobación</h5>
        </div>
        <div class="modal-body text-center">
          <div class="approval-icon mb-4">
            <i class="bi bi-clock-history"></i>
          </div>
          
          <h4 class="mb-3">¡Tu cuenta está siendo revisada!</h4>
          
          <p class="text-muted mb-4">
            Hemos recibido tu solicitud de registro. Un administrador revisará tu información y te notificará cuando tu cuenta sea aprobada.
          </p>
          
          <div class="alert alert-info" role="alert">
            <i class="bi bi-info-circle me-2"></i>
            <strong>Proceso de aprobación:</strong>
            <ul class="mb-0 mt-2 text-start">
              <li>✅ Revisión de información personal</li>
              <li>✅ Verificación de credenciales</li>
              <li>⏳ Aprobación por administrador</li>
              <li>📧 Notificación por email</li>
            </ul>
          </div>
          
          <div class="timeline mt-4">
            <div class="timeline-item completed">
              <div class="timeline-icon">
                <i class="bi bi-check-circle-fill"></i>
              </div>
              <div class="timeline-content">
                <h6>Perfil Completado</h6>
                <p class="small text-muted">Tu información ha sido enviada correctamente</p>
              </div>
            </div>
            
            <div class="timeline-item current">
              <div class="timeline-icon">
                <i class="bi bi-clock-fill"></i>
              </div>
              <div class="timeline-content">
                <h6>En Revisión</h6>
                <p class="small text-muted">Administrador revisando tu solicitud</p>
              </div>
            </div>
            
            <div class="timeline-item pending">
              <div class="timeline-icon">
                <i class="bi bi-person-check-fill"></i>
              </div>
              <div class="timeline-content">
                <h6>Cuenta Aprobada</h6>
                <p class="small text-muted">Acceso completo al sistema</p>
              </div>
            </div>
          </div>
          
          <div class="mt-4">
            <p class="text-muted small">
              <i class="bi bi-envelope me-1"></i>
              Recibirás una notificación por email cuando tu cuenta sea aprobada.
            </p>
            <p class="text-muted small">
              <i class="bi bi-clock me-1"></i>
              El proceso suele tomar entre 24-48 horas.
            </p>
          </div>
        </div>
        <div class="modal-footer justify-content-center">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap';

export default {
  name: 'ApprovalPending',
  data() {
    return {
      modalInstance: null
    };
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('approvalPendingModal'));
  },
  methods: {
    show() {
      this.modalInstance.show();
    },
    closeModal() {
      this.modalInstance.hide();
    }
  }
};
</script>

<style scoped>
.approval-icon {
  font-size: 4rem;
  color: #ffc107;
}

.approval-icon i {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.alert-info {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

.alert-info ul {
  padding-left: 1.5rem;
}

.alert-info li {
  margin-bottom: 0.25rem;
}

.timeline {
  position: relative;
  max-width: 400px;
  margin: 0 auto;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #dee2e6;
  transform: translateX(-50%);
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
}

.timeline-item:nth-child(odd) {
  flex-direction: row;
}

.timeline-item:nth-child(even) {
  flex-direction: row-reverse;
}

.timeline-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  z-index: 2;
  position: relative;
}

.timeline-item.completed .timeline-icon {
  background-color: #28a745;
  color: white;
}

.timeline-item.current .timeline-icon {
  background-color: #ffc107;
  color: white;
  animation: pulse 2s infinite;
}

.timeline-item.pending .timeline-icon {
  background-color: #6c757d;
  color: white;
}

.timeline-content {
  flex: 1;
  margin: 0 1rem;
  text-align: left;
}

.timeline-item:nth-child(even) .timeline-content {
  text-align: right;
}

.timeline-content h6 {
  margin: 0;
  color: #333;
}

.timeline-content p {
  margin: 0.25rem 0 0 0;
}

@media (max-width: 768px) {
  .timeline::before {
    left: 20px;
  }
  
  .timeline-item {
    flex-direction: row !important;
  }
  
  .timeline-content {
    margin-left: 1rem;
    text-align: left !important;
  }
}
</style>
