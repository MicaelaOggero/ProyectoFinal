<template>
  <div>
    <Navbar />
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-3 col-lg-2 d-none d-md-block bg-light sidebar">
          <Sidebar />
        </div>
        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue';
import Sidebar from '@/components/Sidebar.vue';

export default {
  name: 'MainLayout',
  components: {
    Navbar,
    Sidebar
  }
}
</script>

<style scoped>
.sidebar {
  padding: 0;
}
main {
  padding-top: 1.5rem;
}
</style>
