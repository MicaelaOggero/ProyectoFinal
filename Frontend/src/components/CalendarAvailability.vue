<template>
  <div class="calendar-availability">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="mb-0">
        <i class="bi bi-calendar3 me-2"></i>
        Disponibilidad por Día
      </h6>
      <div class="d-flex gap-2">
        <button 
          class="btn btn-outline-primary btn-sm" 
          @click="openWorkDaysModal"
          title="Configurar días laborales"
        >
          <i class="bi bi-gear me-1"></i>
          Configurar
        </button>
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

    <!-- Información del calendario -->
    <div class="row mb-3">
      <div class="col-12">
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Disponibilidad por Día</strong> - Cada día muestra las horas disponibles individualmente. 
          Las horas ocupadas por tareas asignadas se muestran en rojo.
        </div>
      </div>
    </div>

    <!-- Vista Mensual -->
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
            'has-assigned-tasks': day.hoursAvailable < 8 && day.isCurrentMonth
          }"
          @click="selectDay(day)"
        >
          <div class="day-number">{{ day.dayNumber }}</div>
          <div class="hours-indicator" v-if="day.isCurrentMonth">
            <span v-if="day.hoursAvailable > 0" class="hours-text">
              {{ day.hoursAvailable }}h
            </span>
            <span v-else class="no-hours">0h</span>
            <div v-if="day.assignedHours > 0" class="assigned-hours">
              <small class="text-danger">-{{ day.assignedHours }}h</small>
            </div>
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

    <!-- Modal para configurar días laborales -->
    <div class="modal fade" id="workDaysModal" tabindex="-1" aria-labelledby="workDaysModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="workDaysModalLabel">
              <i class="bi bi-gear me-2"></i>
              Configurar Días Laborales
            </h5>
            <button type="button" class="btn-close" @click="closeWorkDaysModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Días de Trabajo</label>
              <div class="row">
                <div class="col-md-6">
                  <div class="form-check mb-2">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="monday"
                      v-model="workDays.monday"
                      @change="updateWorkDays"
                    >
                    <label class="form-check-label" for="monday">
                      Lunes
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="tuesday"
                      v-model="workDays.tuesday"
                      @change="updateWorkDays"
                    >
                    <label class="form-check-label" for="tuesday">
                      Martes
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="wednesday"
                      v-model="workDays.wednesday"
                      @change="updateWorkDays"
                    >
                    <label class="form-check-label" for="wednesday">
                      Miércoles
                    </label>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-check mb-2">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="thursday"
                      v-model="workDays.thursday"
                      @change="updateWorkDays"
                    >
                    <label class="form-check-label" for="thursday">
                      Jueves
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="friday"
                      v-model="workDays.friday"
                      @change="updateWorkDays"
                    >
                    <label class="form-check-label" for="friday">
                      Viernes
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="saturday"
                      v-model="workDays.saturday"
                      @change="updateWorkDays"
                    >
                    <label class="form-check-label" for="saturday">
                      Sábado
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mb-3">
              <label for="defaultHours" class="form-label">Horas por Día Laboral</label>
              <input 
                type="number" 
                class="form-control" 
                id="defaultHours"
                v-model="defaultWorkHours"
                min="1"
                max="24"
                step="0.5"
                @change="updateWorkDays"
              >
              <div class="form-text">
                Horas disponibles por defecto en cada día laboral
              </div>
            </div>

            <!-- Resumen -->
            <div class="alert alert-info">
              <h6 class="alert-heading">
                <i class="bi bi-info-circle me-2"></i>
                Resumen de Configuración
              </h6>
              <p class="mb-1">
                <strong>Días laborales:</strong> {{ Object.values(workDays).filter(day => day).length }} días
              </p>
              <p class="mb-1">
                <strong>Horas por día:</strong> {{ defaultWorkHours }} horas
              </p>
              <p class="mb-0">
                <strong>Días laborales:</strong> {{ Object.values(workDays).filter(day => day).length }} días por semana
              </p>
            </div>

            <!-- Mensaje de estado -->
            <div v-if="workDaysMessage" class="alert" :class="workDaysMessageClass" role="alert">
              {{ workDaysMessage }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeWorkDaysModal">
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="saveWorkDaysConfig"
              :disabled="saving"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ saving ? 'Guardando...' : 'Guardar Configuración' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap';
import TaskService from '@/services/task.service.js';
import UserService from '@/services/user.service.js';

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
      workDaysModalInstance: null,
      saving: false,
      message: '',
      messageClass: '',
      workDaysMessage: '',
      workDaysMessageClass: '',
      loading: false,
      weekDays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      quickOptions: [
        { label: 'No disponible', value: 0 },
        { label: '4 horas', value: 4 },
        { label: '6 horas', value: 6 },
        { label: '8 horas', value: 8 },
        { label: '10 horas', value: 10 },
        { label: 'Jornada completa', value: 12 }
      ],
      // Configuración de trabajo por defecto
      defaultWorkHours: 8,
      workDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false
      },
      // Tareas asignadas al usuario
      assignedTasks: [],
      // Datos del calendario por mes
      monthlyCalendarData: {} // Objeto para almacenar datos por mes: { "2025-09": [...], "2025-10": [...] }
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
      // Usar UTC para coincidir con el backend
      const year = this.currentDate.getUTCFullYear();
      const month = this.currentDate.getUTCMonth();
      
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
        const calendarEntry = this.userCalendar.find(entry => {
          const normalizedBackendDate = this.normalizeBackendDate(entry.fecha);
          return normalizedBackendDate === dateStr;
        });
        
        // La disponibilidad viene directamente del backend (ya con tareas descontadas)
        const hoursAvailable = calendarEntry ? calendarEntry.horasDisponibles : 0;
        
        // Calcular horas ocupadas por tareas asignadas para mostrar en rojo
        const assignedHours = this.getAssignedHoursForDate(dateStr);
        
        days.push({
          date: dateStr,
          dayNumber: date.getDate(),
          isCurrentMonth: date.getMonth() === month,
          isToday: date.toDateString() === today.toDateString(),
          hoursAvailable: hoursAvailable,
          assignedHours: assignedHours,
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
    // Solo inicializar modales si existen (no en el dashboard)
    const availabilityModal = document.getElementById('availabilityModal');
    const workDaysModal = document.getElementById('workDaysModal');
    
    if (availabilityModal) {
      this.modalInstance = new Modal(availabilityModal);
    }
    if (workDaysModal) {
      this.workDaysModalInstance = new Modal(workDaysModal);
    }
    
    this.initializeDefaultAvailability();
    this.loadAssignedTasks();
    // Siempre cargar vista mensual
    this.loadCurrentMonthData();
  },
  methods: {
    // Inicializar disponibilidad por defecto para días laborales
    initializeDefaultAvailability() {
      // Usar UTC para coincidir con el backend
      const year = this.currentDate.getUTCFullYear();
      const month = this.currentDate.getUTCMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const newAvailabilityEntries = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const dateStr = this.formatDateForAPI(date);
        
        // Verificar si ya existe una entrada para esta fecha
        const existingEntry = this.userCalendar.find(entry => {
          const normalizedBackendDate = this.normalizeBackendDate(entry.fecha);
          return normalizedBackendDate === dateStr;
        });
        
        // Solo crear entrada si no existe y es un día laboral
        if (!existingEntry) {
          let defaultHours = 0;
          
          // Lunes = 1, Martes = 2, ..., Sábado = 6
          if (dayOfWeek === 1 && this.workDays.monday) defaultHours = this.defaultWorkHours;
          if (dayOfWeek === 2 && this.workDays.tuesday) defaultHours = this.defaultWorkHours;
          if (dayOfWeek === 3 && this.workDays.wednesday) defaultHours = this.defaultWorkHours;
          if (dayOfWeek === 4 && this.workDays.thursday) defaultHours = this.defaultWorkHours;
          if (dayOfWeek === 5 && this.workDays.friday) defaultHours = this.defaultWorkHours;
          if (dayOfWeek === 6 && this.workDays.saturday) defaultHours = this.defaultWorkHours;
          
          if (defaultHours > 0) {
            newAvailabilityEntries.push({
              fecha: dateStr,
              horasDisponibles: defaultHours
            });
          }
        }
      }
      
      // Solo emitir eventos si hay entradas nuevas y no hay conflictos
      if (newAvailabilityEntries.length > 0) {
        console.log('🔍 CalendarAvailability - Inicializando disponibilidad por defecto para:', newAvailabilityEntries.length, 'días');
        this.$emit('initialize-default-availability', newAvailabilityEntries);
      } else {
        console.log('🔍 CalendarAvailability - No hay días nuevos para inicializar (todos ya tienen disponibilidad configurada)');
      }
    },
    
    goToPreviousMonth() {
      // Crear nueva instancia de Date para forzar reactividad, usando UTC
      const newDate = new Date(this.currentDate);
      newDate.setUTCMonth(this.currentDate.getUTCMonth() - 1);
      this.currentDate = newDate;
      
      this.initializeDefaultAvailability();
      this.loadAssignedTasks();
      // Siempre cargar vista mensual
      this.loadCurrentMonthData();
    },
    goToNextMonth() {
      // Crear nueva instancia de Date para forzar reactividad, usando UTC
      const newDate = new Date(this.currentDate);
      newDate.setUTCMonth(this.currentDate.getUTCMonth() + 1);
      this.currentDate = newDate;
      
      this.initializeDefaultAvailability();
      this.loadAssignedTasks();
      // Siempre cargar vista mensual
      this.loadCurrentMonthData();
    },
    
    
    
    
    
    // Cargar datos del mes actual para vista mensual
    async loadCurrentMonthData() {
      if (!this.userId) return;
      
      try {
        // Usar UTC para coincidir con el backend
        const monthStr = `${this.currentDate.getUTCFullYear()}-${String(this.currentDate.getUTCMonth() + 1).padStart(2, '0')}`;
        console.log('🔍 CalendarAvailability - Cargando datos del mes actual (UTC):', monthStr);
        
        const response = await UserService.getUserCalendar(this.userId, monthStr);
        const calendarData = response.data.calendario || [];
        
        // Almacenar datos por mes
        this.monthlyCalendarData[monthStr] = calendarData;
        
        // Emitir evento para actualizar el calendario en el componente padre
        this.$emit('update-calendar-data', calendarData);
        
        console.log('🔍 CalendarAvailability - Datos del mes actual cargados:', calendarData);
      } catch (error) {
        console.error('Error loading current month data:', error);
      }
    },
    selectDay(day) {
      if (!day.isCurrentMonth) return;
      
      // 🔍 Validación del backend: Verificar si hay tareas asignadas a ese día
      const fechaISO = day.date; // Ya viene en formato "YYYY-MM-DD"
      const targetDate = new Date(fechaISO);
      
      // Buscar tareas asignadas en esta fecha
      const tareasAsignadas = this.assignedTasks.filter(task => {
        const startDate = new Date(task.fechaEstimadaInicio);
        const endDate = new Date(task.fechaEstimadaFin);
        
        // Verificar si la fecha está dentro del rango de la tarea
        // Misma lógica que en el backend (líneas 105-109 de user.service.js)
        return targetDate >= startDate && targetDate <= endDate;
      });
      
      // Si hay tareas asignadas, NO abrir el modal y mostrar mensaje
      if (tareasAsignadas.length > 0) {
        alert(`⚠️ No se puede modificar ${fechaISO}, tiene tareas asignadas.\n\nEste día tiene ${tareasAsignadas.length} tarea(s) en curso y no puede ser modificado.`);
        return; // No abrir el modal
      }
      
      // Si no hay tareas asignadas, abrir el modal normalmente
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
    },

    // Normalizar fecha del backend para comparación
    normalizeBackendDate(backendDate) {
      // Si viene en formato ISO, extraer solo la parte de la fecha
      if (backendDate.includes('T')) {
        return backendDate.split('T')[0];
      }
      // Si ya viene en formato YYYY-MM-DD, devolverla tal como está
      return backendDate;
    },

    // Cargar tareas asignadas al usuario
    async loadAssignedTasks() {
      if (!this.userId) return;
      
      try {
        const response = await TaskService.getTasksByDeveloper(this.userId);
        this.assignedTasks = response.data || [];
        console.log('🔍 CalendarAvailability - Tareas asignadas cargadas:', this.assignedTasks);
      } catch (error) {
        console.error('Error cargando tareas asignadas:', error);
        this.assignedTasks = [];
      }
    },

    // Calcular horas ocupadas por tareas asignadas en una fecha específica
    getAssignedHoursForDate(dateStr) {
      const targetDate = new Date(dateStr);
      let totalHours = 0;
      
      this.assignedTasks.forEach(task => {
        const startDate = new Date(task.fechaEstimadaInicio);
        const endDate = new Date(task.fechaEstimadaFin);
        
        // Verificar si la fecha está dentro del rango de la tarea
        if (targetDate >= startDate && targetDate <= endDate) {
          // Si la tarea tiene tiempo estimado, distribuirlo por día
          if (task.tiempoEstimadoHoras) {
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            const hoursPerDay = task.tiempoEstimadoHoras / totalDays;
            totalHours += hoursPerDay;
          }
        }
      });
      
      return Math.round(totalHours * 10) / 10; // Redondear a 1 decimal
    },
    
    // Métodos para el modal de configuración de días laborales
    openWorkDaysModal() {
      this.workDaysMessage = '';
      this.workDaysModalInstance.show();
    },
    
    closeWorkDaysModal() {
      this.workDaysModalInstance.hide();
      this.workDaysMessage = '';
    },
    
    updateWorkDays() {
      // Actualizar los cálculos automáticamente
      // Los computed properties se actualizarán automáticamente
    },
    
    async saveWorkDaysConfig() {
      this.saving = true;
      this.workDaysMessage = '';
      
      try {
        // Emitir evento para que el componente padre guarde la configuración
        this.$emit('update-work-days-config', {
          workDays: this.workDays,
          defaultWorkHours: this.defaultWorkHours
        });
        
        // Reinicializar la disponibilidad por defecto
        this.initializeDefaultAvailability();
        
        this.workDaysMessage = 'Configuración guardada correctamente';
        this.workDaysMessageClass = 'alert-success';
        
        // Cerrar modal después de un breve delay
        setTimeout(() => {
          this.closeWorkDaysModal();
        }, 1500);
        
      } catch (error) {
        console.error('Error saving work days config:', error);
        this.workDaysMessage = 'Error al guardar la configuración';
        this.workDaysMessageClass = 'alert-danger';
      } finally {
        this.saving = false;
      }
    },
    
    // Ya no necesitamos cargar tareas asignadas por separado
    // porque el calendario del backend ya viene actualizado con las horas descontadas
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

.calendar-day.has-assigned-tasks {
  background-color: #fff3cd;
  border-left: 3px solid #ffc107;
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

/* Estilos para horas asignadas */
.assigned-hours {
  margin-top: 2px;
}

.assigned-hours small {
  font-size: 0.65rem;
  font-weight: 500;
}

/* Estilos para vista de múltiples meses */
.multiple-months-view {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.month-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.month-header {
  text-align: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
}

.month-title {
  margin: 0;
  color: #495057;
  font-weight: 600;
}

.calendar-grid.small {
  transform: scale(0.85);
  transform-origin: top left;
  margin-bottom: -2rem;
}

.calendar-grid.small .calendar-day {
  min-height: 40px;
  padding: 0.2rem;
}

.calendar-grid.small .day-number {
  font-size: 0.75rem;
}

.calendar-grid.small .hours-text,
.calendar-grid.small .no-hours {
  font-size: 0.6rem;
  padding: 0.1rem 0.2rem;
}

.calendar-grid.small .assigned-hours small {
  font-size: 0.55rem;
}

/* Responsive para vista múltiple */
@media (max-width: 768px) {
  .multiple-months-view {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .calendar-grid.small {
    transform: scale(1);
    margin-bottom: 0;
  }
}
</style>
