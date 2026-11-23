<template>
  <section class="card border-primary mb-4" aria-labelledby="tasks-ai-title" :aria-busy="busy">
    <div class="card-body">
      <h2 id="tasks-ai-title" class="h5">Revisar tareas de {{ project.name }}</h2>
      <p class="text-muted">Podés editar o eliminar las propuestas antes de guardarlas. Se crearán pendientes y sin desarrollador asignado.</p>
      <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
      <p v-if="busy" role="status">{{ saving ? 'Guardando tareas...' : 'Generando tareas con IA. Esto puede demorar unos instantes...' }}</p>
      <form v-if="generated" @submit.prevent="confirm">
        <fieldset :disabled="busy">
          <article v-for="(task, index) in tasks" :key="task.key" class="border rounded p-3 mb-3">
            <div class="d-flex justify-content-between mb-2">
              <h3 class="h6">Tarea {{ index + 1 }}</h3>
              <button type="button" class="btn btn-outline-danger btn-sm" :aria-label="`Eliminar tarea ${index + 1}`" @click="tasks.splice(index, 1)">Eliminar</button>
            </div>
            <label class="d-block mb-2">Descripción
              <textarea v-model="task.descripcion" class="form-control" required rows="2"></textarea>
            </label>
            <label class="d-block mb-2">Habilidades requeridas (separadas por comas)
              <input v-model="task.skills" class="form-control" required>
            </label>
            <div class="row g-2">
              <label class="col-md-4">Categoría<select v-model="task.categoria" class="form-select" required><option value="frontend">Frontend</option><option value="backend">Backend</option><option value="testing">Testing</option><option value="documentacion">Documentación</option><option value="machine learning">Machine learning</option></select></label>
              <label class="col-md-4">Dificultad (1 a 5)<input v-model.number="task.nivelDificultad" type="number" min="1" max="5" step="1" class="form-control" required></label>
              <label class="col-md-4">Prioridad<select v-model="task.prioridad" class="form-select" required><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></select></label>
              <label class="col-md-4">Horas estimadas<input v-model.number="task.tiempoEstimadoHoras" type="number" min="0.01" step="any" class="form-control" required></label>
              <label class="col-md-4">Inicio estimado<input v-model="task.fechaEstimadaInicio" type="date" :min="project.startDate" :max="project.endDate" class="form-control" required></label>
              <label class="col-md-4">Fin estimado<input v-model="task.fechaEstimadaFin" type="date" :min="task.fechaEstimadaInicio || project.startDate" :max="project.endDate" class="form-control" required></label>
            </div>
          </article>
          <p v-if="!tasks.length">Eliminaste todas las propuestas. Podés cerrar esta vista y crear las tareas manualmente.</p>
          <button type="submit" class="btn btn-primary" :disabled="!tasks.length">Confirmar y guardar {{ tasks.length }} tareas</button>
        </fieldset>
      </form>
      <div class="d-flex gap-2 mt-3">
        <button v-if="!generated && !creditsExhausted" type="button" class="btn btn-primary" :disabled="busy" @click="generate">Reintentar generación</button>
        <router-link v-if="creditsExhausted" :to="{ name: 'ProyectoDetalle', params: { id: project._id } }" class="btn btn-primary">Ir al proyecto y crear tareas manualmente</router-link>
        <button type="button" class="btn btn-outline-secondary" :disabled="busy" @click="close">Cerrar sin guardar tareas</button>
      </div>
      <p class="small text-muted mt-2 mb-0">El proyecto ya está creado. Las propuestas se guardan únicamente al confirmar.</p>
    </div>
  </section>
</template>

<script>
import ProjectService from '@/services/project.service';

export default {
  props: { project: { type: Object, required: true } },
  emits: ['close', 'confirmed'],
  data: () => ({ tasks: [], busy: false, saving: false, generated: false, creditsExhausted: false, error: '' }),
  mounted() { this.generate(); },
  methods: {
    async generate() {
      if (this.busy) return;
      this.busy = true;
      this.error = '';
      this.creditsExhausted = false;
      try {
        const tasks = await ProjectService.previewTasksAI(this.project._id);
        this.tasks = tasks.map((task, key) => ({
          ...task, key,
          skills: (task.habilidadesRequeridas || []).join(', '),
          fechaEstimadaInicio: (task.fechaEstimadaInicio || '').split('T')[0],
          fechaEstimadaFin: (task.fechaEstimadaFin || '').split('T')[0]
        }));
        this.generated = true;
      } catch (error) {
        this.creditsExhausted = error.response?.data?.code === 'AI_CREDITS_EXHAUSTED' ||
          (error.response?.status === 400 && /no credits remaining/i.test(error.response?.data?.error || ''));
        this.error = this.creditsExhausted
          ? 'La cuenta de IA no tiene créditos disponibles. El proyecto ya está creado. Podés crear las tareas manualmente o volver a generar propuestas cuando se restablezcan los créditos.'
          : error.response?.data?.error || error.response?.data?.message || error.message;
      } finally { this.busy = false; }
    },
    async confirm() {
      if (this.busy || !this.tasks.length) return;
      this.error = '';
      const tareas = this.tasks.map(task => ({
        descripcion: task.descripcion.trim(),
        habilidadesRequeridas: task.skills.split(',').map(skill => skill.trim()).filter(Boolean),
        categoria: (task.categoria || '').trim(),
        nivelDificultad: Number(task.nivelDificultad),
        prioridad: task.prioridad,
        tiempoEstimadoHoras: Number(task.tiempoEstimadoHoras),
        fechaEstimadaInicio: task.fechaEstimadaInicio,
        fechaEstimadaFin: task.fechaEstimadaFin
      }));
      if (tareas.some(task => !task.descripcion || !['frontend', 'backend', 'testing', 'documentacion', 'machine learning'].includes(task.categoria) || !task.habilidadesRequeridas.length ||
        !Number.isInteger(task.nivelDificultad) || task.nivelDificultad < 1 || task.nivelDificultad > 5 ||
        !Number.isFinite(task.tiempoEstimadoHoras) || task.tiempoEstimadoHoras <= 0 ||
        !['baja', 'media', 'alta'].includes(task.prioridad) ||
        !task.fechaEstimadaInicio || !task.fechaEstimadaFin || task.fechaEstimadaFin < task.fechaEstimadaInicio ||
        task.fechaEstimadaInicio < this.project.startDate || task.fechaEstimadaFin > this.project.endDate)) {
        this.error = 'Revisá los campos: cada tarea necesita descripción, habilidades, categoría, dificultad de 1 a 5, horas positivas y fechas dentro del proyecto.';
        return;
      }
      this.busy = true;
      this.saving = true;
      try {
        await ProjectService.confirmTasksAI(this.project._id, tareas);
        this.$emit('confirmed');
      } catch (error) {
        this.error = error.response?.data?.error || error.response?.data?.message || error.message;
      } finally { this.busy = false; this.saving = false; }
    },
    close() {
      if (this.tasks.length && !window.confirm('¿Descartar las propuestas? El proyecto seguirá creado y las tareas no se guardarán.')) return;
      this.$emit('close');
    }
  }
};
</script>
