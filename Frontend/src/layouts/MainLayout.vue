<template>
  <div>
    <Navbar @toggle-sidebar="toggleSidebar" />
    <div class="container-fluid">
      <div class="row">
        <main class="col-12 px-md-4">
          <router-view @toggle-sidebar="toggleSidebar" />
        </main>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue';

export default {
  name: 'MainLayout',
  components: {
    Navbar
  },
  data() {
    return {
      sidebarVisible: false,
      isMobile: false
    };
  },
  mounted() {
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkScreenSize);
  },
  methods: {
    toggleSidebar() {
      // No hacer nada ya que no hay sidebar
    },
    closeSidebar() {
      // No hacer nada ya que no hay sidebar
    },
    checkScreenSize() {
      this.isMobile = window.innerWidth < 768;
    }
  }
}
</script>

<style scoped>
main {
  padding-top: 1.5rem;
  width: 100% !important;
  margin-left: 0 !important;
}
</style>
