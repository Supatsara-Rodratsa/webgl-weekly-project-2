import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  BoxGeometry,
  Mesh,
  TextureLoader,
  PCFSoftShadowMap,
  Clock,
  ShaderMaterial,
  Color,
  Vector2,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";

import Stats from "stats.js";

import vertex from "./shaders/index.vert";
import fragment from "./shaders/index.frag";

const TL = new TextureLoader();
const gui = new GUI();

export default class App {
  constructor() {
    this._renderer = undefined;
    this._camera = undefined;
    this._scene = undefined;

    this._mesh = undefined;
    this._clock = new Clock();
    this._clock.start();

    this._raf = undefined;
    this._stats = new Stats();
    document.body.appendChild(this._stats.dom);

    this._init();
  }

  _init() {
    this._renderer = new WebGLRenderer({
      canvas: document.querySelector("#canvas"),
    });
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = PCFSoftShadowMap;
    this._renderer.useLegacyLights = false;

    const aspect = window.innerWidth / window.innerHeight;
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._camera = new PerspectiveCamera(75, aspect, 0.1, 100);
    this._camera.position.y = 0;
    this._camera.position.z = 5;

    this._scene = new Scene();

    // CONTROLS
    this._controls = new OrbitControls(this._camera, this._renderer.domElement);

    // MESH
    this._initMesh();

    // START
    this._initEvents();
    this._start();
  }

  _initEvents() {
    window.addEventListener("resize", this._onResize.bind(this));
  }

  _initMesh() {
    // Create a plane geometry
    const geometry = new BoxGeometry(3, 3, 3);

    // Load Texture
    const texture = TL.load("/texture.jpeg");

    // Shader Setting
    const shaderMaterial = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        u_resolution: {
          value: new Vector2(window.innerWidth, window.innerHeight),
        },
        u_time: { value: 0.0 },
        u_texture: { value: texture },
        u_wave: { value: 10 },
        u_Color1: { value: new Color(0xc8620e) },
        u_Color2: { value: new Color(0x810e75) },
      },
    });

    // Create Mesh with ShaderMaterial
    const mesh = new Mesh(geometry, shaderMaterial);
    this._mesh = mesh;
    this._scene.add(this._mesh);

    // GUI Config
    gui.add(shaderMaterial.uniforms.u_wave, "value").name("Wave Freq");
    gui.addColor(shaderMaterial.uniforms.u_Color1, "value").name("Color 1");
    gui.addColor(shaderMaterial.uniforms.u_Color2, "value").name("Color 2");
  }

  _onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this._camera.aspect = aspect;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _start() {
    this._raf = window.requestAnimationFrame(this._animate.bind(this));
  }

  _pause() {
    window.cancelAnimationFrame(this._raf);
  }

  _animate() {
    this._stats.begin();
    this._raf = window.requestAnimationFrame(this._animate.bind(this));
    const t = this._clock.getElapsedTime();

    // Rotate Mesh
    this._mesh.rotation.y += 0.005;
    this._mesh.rotation.x += 0.005;
    this._mesh.rotation.z += 0.005;

    // Update Timing
    this._mesh.material.uniforms.u_time.value = t;

    this._renderer.render(this._scene, this._camera);
    this._stats.end();
  }
}
