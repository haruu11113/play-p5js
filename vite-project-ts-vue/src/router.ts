import { createRouter, createWebHistory } from "vue-router";
import HelloWorld from "./pages/HelloWorld.vue";
import ThreeJsDemo from "./pages/ThreeJsDemo.vue";
import ThreeJsDemo3D from "./pages/ThreeJsDemo3D.vue";
import ShaderDemo from "./pages/ShaderDemo.vue";
import P5JsDemo from "./pages/P5JsDemo.vue";
import ThreeJsInitDemo from "./pages/ThreeJsInitDemo.vue";
import ShaderBubleDemo from "./pages/ShaderBubleDemo.vue";
import ShaderGizagizaDemo from "./pages/ShaderGizagizaDemo.vue";
import ShaderGoodCubeDemo from "./pages/ShaderGoodCubeDemo.vue";
import ShaderGoodCube2ndDemo from "./pages/ShaderGoodCube2ndDemo.vue";
import ShaderTyoimaruDemo from "./pages/ShaderTyoimaruDemo.vue";
import Shader2LineDemo from "./pages/Shader2LineDemo.vue";

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
    {
      path: "/shadergizagiza",
      component: ShaderGizagizaDemo,
    },
    {
      path: "/shadergoodcube",
      component: ShaderGoodCubeDemo,
    },
    {
      path: "/shadergoodcube2nd",
      component: ShaderGoodCube2ndDemo,
    },
    {
      path: "/shadertyoimaru",
      component: ShaderTyoimaruDemo,
    },
    {
      path: "/shader2line",
      component: Shader2LineDemo,
    },
  ],
});
