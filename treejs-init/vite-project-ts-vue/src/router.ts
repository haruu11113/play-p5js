import { createRouter, createWebHistory } from "vue-router";
import HelloWorld from "./pages/HelloWorld.vue";
import ThreeJsDemo from "./pages/ThreeJsDemo.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: HelloWorld,
    },
    {
      path: "/threejs",
      component: ThreeJsDemo,
    },
  ],
});
