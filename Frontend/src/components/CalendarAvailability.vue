<template>
  <div class="calendar-availability">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="mb-0">
        <i class="bi bi-calendar3 me-2"></i>
        Disponibilidad por Día
      </h6>
      <div class="d-flex gap-2">
        <button 
          class="btn btn-outline-secondary btn-sm" 
          @click="goToPreviousMonth"
          :disabled="loading"
        >
          <i class="bi bi-chevron-left"></i>
        </button>
        <span class="fw-bold">{{ currentMonthYear }}</span>
        <button 
          class="btn btn-outline-secondary btn-sm" 
          @click="goToNextMonth"
          :disabled="loading"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Calendario Grid -->
    <div class="calendar-grid">
      <!-- Encabezados de días -->
      <div class="calendar-header">
        <div class="calendar-day-header" v-for="day in weekDays" :key="day">
          {{ day }}
        </div>
      </div>

      <!-- Días del mes -->
      <div class="calendar-body">
        <div 
          v-for="day in calendarDays" 
          :key="day.date"
          class="calendar-day"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'has-availability': day.hoursAvailable > 0,
            'no-availability': day.hoursAvailable === 0 && day.isCurrentMonth
          }"
          @click="selectDay(day)"
        >
          <div class="day-number">{{ day.dayNumber }}</div>
          <div class="hours-indicator" v-if="day.isCurrentMonth">
            <span v-if="day.hoursAvailable > 0" class="hours-text">
              {{ day.hoursAvailable }}h
            </span>
            <span v-else class="no-hours">0h</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para editar disponibilidad del día -->
    <div class="modal fade" id="availabilityModal" tabindex="-1" aria-labelledby="availabilityModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="availabilityModalLabel">
              <i class="bi bi-calendar-day me-2"></i>
              Disponibilidad para {{ selectedDay?.formattedDate }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="hoursAvailable" class="form-label">Horas Disponibles</label>
              <input 
                type="number" 
                class="form-control" 
                id="hoursAvailable"
                v-model="editingHours"
                min="0"
                max="24"
                step="0.5"
              >
              <div class="form-text">
                Ingresa las horas disponibles para este día (0-24h)
              </div>
            </div>
            
            <!-- Opciones rápidas -->
            <div class="mb-3">
              <label class="form-label">Opciones Rápidas</label>
              <div class="d-flex gap-2 flex-wrap">
                <button 
                  v-for="option in quickOptions" 
                  :key="option.label"
                  class="btn btn-outline-secondary btn-sm"
                  @click="setQuickOption(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Mensaje de estado -->
            <div v-if="message" class="alert" :class="messageClass" role="alert">
              {{ message }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="removeAvailability"
              v-if="selectedDay?.hoursAvailable > 0"
              :disabled="saving"
            >
              <i class="bi bi-trash me-1"></i>
              Eliminar
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="saveAvailability"
              :disabled="saving"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap';

export default {
  name: 'CalendarAvailability',
  props: {
    userCalendar: {
      type: Array,
      default: () => []
    },
    userId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      currentDate: new Date(),
      selectedDay: null,
      editingHours: 0,
      modalInstance: null,
      saving: false,
      message: '',
      messageClass: '',
      loading: false,
      weekDays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      quickOptions: [
        { label: 'No disponible', value: 0 },
        { label: '4 horas', value: 4 },
        { label: '6 horas', value: 6 },
        { label: '8 horas', value: 8 },
        { label: '10 horas', value: 10 },
        { label: 'Jornada completa', value: 12 }
      ]
    };
  },
  computed: {
    currentMonthYear() {
      return this.currentDate.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      });
    },
    calendarDays() {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      
      // Primer día del mes
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Días del mes anterior para completar la semana
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      // Días del mes siguiente para completar la semana
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
      
      const days = [];
      const today = new Date();
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = this.formatDateForAPI(date);
        const calendarEntry = this.userCalendar.find(entry => entry.fecha === dateStr);
        const hoursAvailable = calendarEntry ? calendarEntry.horasDisponibles : 0;
        
        days.push({
          date: dateStr,
          dayNumber: date.getDate(),
          isCurrentMonth: date.getMonth() === month,
          isToday: date.toDateString() === today.toDateString(),
          hoursAvailable: hoursAvailable,
          formattedDate: date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
      }
      
      return days;
    }
  },
  mounted() {
    this.modalInstance = new Modal(document.getElementById('availabilityModal'));
  },
  methods: {
    goToPreviousMonth() {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    },
    goToNextMonth() {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    },
    selectDay(day) {
      if (!day.isCurrentMonth) return;
      
      this.selectedDay = day;
      this.editingHours = day.hoursAvailable;
      this.message = '';
      this.modalInstance.show();
    },
    closeModal() {
      this.modalInstance.hide();
      this.selectedDay = null;
      this.editingHours = 0;
      this.message = '';
    },
    setQuickOption(hours) {
      this.editingHours = hours;
    },
    async saveAvailability() {
      if (!this.selectedDay) return;
      
      this.saving = true;
      this.message = '';
      
      try {
        const availabilityData = {
          fecha: this.selectedDay.date,
          horasDisponibles: parseFloat(this.editingHours) || 0
        };
        
        // Emitir evento para que el componente padre maneje la actualización
        this.$emit('update-availability', availabilityData);
        
        this.message = 'Disponibilidad actualizada correctamente';
        this.messageClass = 'alert-success';
        
        // Cerrar modal después de un breve delay
        setTimeout(() => {
          this.closeModal();
        }, 1500);
        
      } catch (error) {
        console.error('Error saving availability:', error);
        this.message = 'Error al guardar la disponibilidad';
        this.messageClass = 'alert-danger';
      } finally {
        this.saving = false;
      }
    },
    async removeAvailability() {
      if (!this.selectedDay) return;
      
      this.saving = true;
      this.message = '';
      
      try {
        // Emitir evento para eliminar la disponibilidad
        this.$emit('remove-availability', this.selectedDay.date);
        
        this.message = 'Disponibilidad eliminada correctamente';
        this.messageClass = 'alert-success';
        
        // Cerrar modal después de un breve delay
        setTimeout(() => {
          this.closeModal();
        }, 1500);
        
      } catch (error) {
        console.error('Error removing availability:', error);
        this.message = 'Error al eliminar la disponibilidad';
        this.messageClass = 'alert-danger';
      } finally {
        this.saving = false;
      }
    },
    formatDateForAPI(date) {
      return date.toISOString().split('T')[0];
    }
  }
};
</script>

<style scoped>
.calendar-availability {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.calendar-grid {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.calendar-day-header {
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  color: #495057;
  border-right: 1px solid #dee2e6;
}

.calendar-day-header:last-child {
  border-right: none;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  min-height: 80px;
  border-right: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day:hover {
  background-color: #f8f9fa;
}

.calendar-day.other-month {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: default;
}

.calendar-day.other-month:hover {
  background-color: #f8f9fa;
}

.calendar-day.today {
  background-color: #e3f2fd;
  border: 2px solid #2196f3;
}

.calendar-day.has-availability {
  background-color: #e8f5e8;
}

.calendar-day.no-availability {
  background-color: #fff3cd;
}

.day-number {
  font-weight: 600;
  font-size: 0.9rem;
}

.hours-indicator {
  font-size: 0.75rem;
  text-align: center;
}

.hours-text {
  background-color: #28a745;
  color: white;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-weight: 600;
}

.no-hours {
  color: #dc3545;
  font-weight: 600;
}

.calendar-day.other-month .hours-indicator {
  display: none;
}

.quick-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .calendar-day {
    min-height: 60px;
    padding: 0.25rem;
  }
  
  .day-number {
    font-size: 0.8rem;
  }
  
  .hours-text, .no-hours {
    font-size: 0.7rem;
    padding: 0.1rem 0.3rem;
  }
}
</style>
