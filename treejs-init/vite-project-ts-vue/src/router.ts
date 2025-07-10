import { createRouter, createWebHistory } from "vue-router";
import HelloWorld from "./pages/HelloWorld.vue";
import ThreeJsDemo from "./pages/ThreeJsDemo.vue";
import ThreeJsDemo3D from "./pages/ThreeJsDemo3D.vue";
import ShaderDemo from "./pages/ShaderDemo.vue";

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
    {
      path: "/threejs3d",
      component: ThreeJsDemo3D,
    },
    {
      path: "/shaderdemo",
      component: ShaderDemo,
    },
  ],
});
