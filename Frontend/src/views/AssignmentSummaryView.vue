<template>
  <div class="assignment-summary-view">
    <AssignmentSummary 
      :assignment-data="assignmentData" 
      @go-back="goBackToTasks"
    />
  </div>
</template>

<script>
import AssignmentSummary from '../components/AssignmentSummary.vue';

export default {
  name: 'AssignmentSummaryView',
  components: {
    AssignmentSummary
  },
  data() {
    return {
      assignmentData: {}
    };
  },
  mounted() {
    // Obtener los datos de asignación del localStorage o props
    this.loadAssignmentData();
  },
  methods: {
    loadAssignmentData() {
      // Intentar obtener los datos de asignación del localStorage
      const storedData = localStorage.getItem('lastAssignmentData');
      console.log('🔍 AssignmentSummaryView - Datos del localStorage:', storedData);
      
      if (storedData) {
        try {
          this.assignmentData = JSON.parse(storedData);
          console.log('🔍 AssignmentSummaryView - Datos parseados:', this.assignmentData);
          console.log('🔍 AssignmentSummaryView - Cantidad de resúmenes:', this.assignmentData.resumen?.length || 0);
        } catch (error) {
          console.error('Error parsing assignment data:', error);
          this.assignmentData = {
            message: 'Error cargando datos de asignación',
            resumen: []
          };
        }
      } else {
        // Si no hay datos almacenados, mostrar mensaje
        console.log('🔍 AssignmentSummaryView - No hay datos en localStorage');
        this.assignmentData = {
          message: 'No hay datos de asignación disponibles',
          resumen: []
        };
      }
    },
    goBackToTasks() {
      this.$router.push('/tareas');
    }
  }
};
</script>

<style scoped>
.assignment-summary-view {
  min-height: 100vh;
  background-color: #f8f9fa;
}
</style>
