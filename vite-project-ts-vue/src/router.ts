import { createRouter, createWebHistory } from "vue-router";
import HelloWorld from "./pages/HelloWorld.vue";
import ThreeJsDemo from "./pages/ThreeJsDemo.vue";
import ThreeJsDemo3D from "./pages/ThreeJsDemo3D.vue";
import ShaderDemo from "./pages/ShaderDemo.vue";
import P5JsDemo from "./pages/P5JsDemo.vue";
import ThreeJsInitDemo from "./pages/ThreeJsInitDemo.vue";
import ShaderBubleDemo from "./pages/ShaderBubleDemo.vue";

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
    {
      path: "/p5js",
      component: P5JsDemo,
    },
    {
      path: "/threejsinit",
      component: ThreeJsInitDemo,
    },
    {
      path: "/shaderbuble",
      component: ShaderBubleDemo,
    },
  ],
});
