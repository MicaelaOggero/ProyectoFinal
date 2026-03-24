<template>
  <div class="container py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <h1 class="m-0">Reportes</h1>
      <button class="btn btn-outline-secondary" :disabled="!hasPrintableContent" @click="downloadPdf">
        <i class="bi bi-file-earmark-pdf me-1"></i>
        Descargar PDF
      </button>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label">Proyecto</label>
            <select v-model="selectedProjectId" class="form-select">
              <option disabled value="">Seleccionar proyecto</option>
              <option v-for="project in projects" :key="project._id" :value="project._id">
                {{ project.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header"><strong>Reporte Semanal</strong></div>
      <div class="card-body">
        <div class="row g-3 align-items-end mb-2">
          <div class="col-md-3">
            <label class="form-label">Semana desde</label>
            <input v-model="weekStart" type="date" class="form-control" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Semana hasta</label>
            <input v-model="weekEnd" type="date" class="form-control" />
          </div>
          <div class="col-md-2 d-grid">
            <button class="btn btn-primary" :disabled="loadingWeekly || !canLoadWeekly" @click="loadWeeklyReports">
              {{ loadingWeekly ? 'Cargando...' : 'Consultar semanal' }}
            </button>
          </div>
        </div>
        <div v-if="weeklyErrorMessage" class="alert alert-danger mb-0">{{ weeklyErrorMessage }}</div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header"><strong>Reporte Final</strong></div>
      <div class="card-body">
        <div class="row g-3 align-items-end mb-2">
          <div class="col-md-2 d-grid">
            <button class="btn btn-secondary" :disabled="loadingFinal || !canLoadFinal" @click="loadFinalReport">
              {{ loadingFinal ? 'Cargando...' : 'Consultar final' }}
            </button>
          </div>
        </div>
        <div v-if="finalErrorMessage" class="alert alert-danger mb-0">{{ finalErrorMessage }}</div>
      </div>
    </div>

    <div id="report-print-area" v-if="hasPrintableContent">
      <div class="card mb-3" v-if="weeklyProject">
        <div class="card-header"><strong>Resumen semanal del proyecto</strong></div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3" v-for="item in weeklyProjectKpis" :key="item.label">
              <div class="kpi-box">
                <small>{{ item.label }}</small>
                <div class="kpi-value">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-3" v-if="weeklyDevelopers.length">
        <div class="card-header"><strong>Resumen semanal por desarrollador</strong></div>
        <div class="card-body table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>Desarrollador</th>
                <th>Horas</th>
                <th>Costo</th>
                <th>T. Completadas</th>
                <th>T. En progreso</th>
                <th>T. Retrasadas</th>
                <th>Calidad</th>
                <th>Rendimiento</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dev in weeklyDevelopers" :key="dev.desarrolladorId">
                <td>{{ fullName(dev) }}</td>
                <td>{{ toNumber(dev.horasTrabajadas) }}</td>
                <td>${{ toNumber(dev.costoTotal) }}</td>
                <td>{{ dev.tareasCompletadas }}</td>
                <td>{{ dev.tareasEnProgreso }}</td>
                <td>{{ dev.tareasRetrasadas }}</td>
                <td>{{ toNumber(dev.promedioCalidad) }}</td>
                <td>
                  <div class="progress" style="height: 10px;">
                    <div class="progress-bar" :style="{ width: barWidth(dev.promedioRendimiento) + '%' }"></div>
                  </div>
                  <small>{{ toNumber(dev.promedioRendimiento) }}%</small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card mb-3" v-if="finalReport">
        <div class="card-header"><strong>Reporte final global</strong></div>
        <div class="card-body">
          <div class="row g-3 mb-3">
            <div class="col-md-3" v-for="item in finalKpis" :key="item.label">
              <div class="kpi-box">
                <small>{{ item.label }}</small>
                <div class="kpi-value">{{ item.value }}</div>
              </div>
            </div>
          </div>

          <h6>Desarrolladores (final)</h6>
          <div class="table-responsive mb-3">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Desarrollador</th>
                  <th>Horas esperadas</th>
                  <th>Horas reales</th>
                  <th>Costo esperado</th>
                  <th>Costo real</th>
                  <th>Calidad</th>
                  <th>Rendimiento</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="dev in finalDevelopers" :key="dev.desarrolladorId">
                  <td>{{ fullName(dev) }}</td>
                  <td>{{ toNumber(dev.expectedHours) }}</td>
                  <td>{{ toNumber(dev.realHours) }}</td>
                  <td>${{ toNumber(dev.expectedCost) }}</td>
                  <td>${{ toNumber(dev.realCost) }}</td>
                  <td>{{ toNumber(dev.promedioCalidad) }}</td>
                  <td>{{ toNumber(dev.promedioRendimiento) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AuthService from '@/services/auth.service.js';
import ProjectService from '@/services/project.service.js';
import ReportService from '@/services/report.service.js';

export default {
  name: 'ReportesView',
  data() {
    return {
      projects: [],
      selectedProjectId: '',
      weekStart: '',
      weekEnd: '',
      loadingWeekly: false,
      loadingFinal: false,
      weeklyErrorMessage: '',
      finalErrorMessage: '',
      weeklyProject: null,
      weeklyDevelopers: [],
      finalReport: null,
    };
  },
  computed: {
    canLoadWeekly() {
      return !!this.selectedProjectId && !!this.weekStart && !!this.weekEnd;
    },
    canLoadFinal() {
      return !!this.selectedProjectId;
    },
    hasPrintableContent() {
      return !!this.weeklyProject || !!this.finalReport;
    },
    weeklyProjectKpis() {
      if (!this.weeklyProject) return [];
      return [
        { label: 'Horas trabajadas', value: this.toNumber(this.weeklyProject.horasTrabajadas) },
        { label: 'Costo total', value: `$${this.toNumber(this.weeklyProject.costoTotal)}` },
        { label: 'Tareas completadas', value: this.weeklyProject.tareasCompletadas || 0 },
        { label: 'Tareas retrasadas', value: this.weeklyProject.tareasRetrasadas || 0 },
        { label: 'Calidad promedio', value: this.toNumber(this.weeklyProject.promedioCalidad) },
        { label: 'Rendimiento promedio', value: `${this.toNumber(this.weeklyProject.promedioRendimiento)}%` },
      ];
    },
    finalKpis() {
      if (!this.finalReport) return [];
      return [
        { label: 'Tareas totales', value: this.finalReport?.tareas?.total || 0 },
        { label: 'Completadas', value: this.finalReport?.tareas?.completadas || 0 },
        { label: 'Retrasadas', value: this.finalReport?.tareas?.retrasadas || 0 },
        { label: 'Canceladas', value: this.finalReport?.tareas?.canceladas || 0 },
        { label: 'Costo simulado', value: `$${this.toNumber(this.finalReport?.expected?.costoTotalSimulado)}` },
        { label: 'Costo real', value: `$${this.toNumber(this.finalReport?.real?.costoTotalSimulado)}` },
      ];
    },
    finalDevelopers() {
      return this.finalReport?.desarrolladores || [];
    },
  },
  async mounted() {
    const user = await AuthService.checkSession();
    if (!AuthService.isAdmin(user)) {
      this.$router.push('/dashboard');
      return;
    }
    await this.loadProjects();
    this.setCurrentWeek();
  },
  methods: {
    async loadProjects() {
      try {
        const response = await ProjectService.getProjects();
        this.projects = response.data || [];
      } catch (error) {
        this.weeklyErrorMessage = 'No se pudieron cargar los proyectos.';
        this.finalErrorMessage = 'No se pudieron cargar los proyectos.';
      }
    },
    setCurrentWeek() {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      this.weekStart = this.toDateInput(monday);
      this.weekEnd = this.toDateInput(sunday);
    },
    toDateInput(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    toIsoStart(dateText) {
      return new Date(`${dateText}T00:00:00.000Z`).toISOString();
    },
    toIsoEnd(dateText) {
      return new Date(`${dateText}T23:59:59.999Z`).toISOString();
    },
    async loadWeeklyReports() {
      this.loadingWeekly = true;
      this.weeklyErrorMessage = '';
      try {
        const weekStart = this.toIsoStart(this.weekStart);
        const weekEnd = this.toIsoEnd(this.weekEnd);

        const [weeklyProject, weeklyDevelopers] = await Promise.all([
          ReportService.getWeeklyProjectReport(this.selectedProjectId, weekStart, weekEnd),
          ReportService.getWeeklyDevelopersReport(this.selectedProjectId, weekStart, weekEnd),
        ]);

        this.weeklyProject = weeklyProject;
        this.weeklyDevelopers = weeklyDevelopers?.metrics || [];
      } catch (error) {
        this.weeklyErrorMessage = error?.response?.data?.error || 'No se pudo cargar el reporte semanal.';
      } finally {
        this.loadingWeekly = false;
      }
    },
    async loadFinalReport() {
      this.loadingFinal = true;
      this.finalErrorMessage = '';
      try {
        this.finalReport = await ReportService.getFinalProjectReport(this.selectedProjectId);
      } catch (error) {
        this.finalErrorMessage = error?.response?.data?.error || 'No se pudo cargar el reporte final.';
      } finally {
        this.loadingFinal = false;
      }
    },
    fullName(dev) {
      return `${dev?.nombre || ''} ${dev?.apellido || ''}`.trim() || 'Sin nombre';
    },
    toNumber(value) {
      const n = Number(value || 0);
      return Number.isFinite(n) ? n.toFixed(2) : '0.00';
    },
    barWidth(value) {
      const n = Number(value || 0);
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, Math.min(100, Math.round(n)));
    },
    downloadPdf() {
      const content = document.getElementById('report-print-area');
      if (!content) return;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <html>
          <head><title>Reporte</title></head>
          <body>${content.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    },
  },
};
</script>

<style scoped>
.kpi-box {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
  background: #f8f9fa;
}
.kpi-value {
  font-size: 1.2rem;
  font-weight: 700;
}
</style>
