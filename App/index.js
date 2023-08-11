import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  PlaneGeometry,
  MeshStandardMaterial,
  DirectionalLight,
  SpotLight,
  PointLight,
  HemisphereLight,
  TorusKnotGeometry,
  RectAreaLight,
  AmbientLight,
  PMREMGenerator,
  TextureLoader,
  SphereGeometry,
  PCFSoftShadowMap,
  CameraHelper,
  DirectionalLightHelper,
  HemisphereLightHelper,
  Clock,
  SpotLightHelper,
  AxesHelper,
  GridHelper,
  PointLightHelper,
  DoubleSide,
  ShaderMaterial,
  BufferAttribute,
  Color,
  RepeatWrapping,
  IcosahedronGeometry,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import GUI from 'lil-gui';

import Stats from 'stats.js';

import vertex from './shaders/index.vert';
import fragment from './shaders/index.frag';

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
      canvas: document.querySelector('#canvas'),
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
    window.addEventListener('resize', this._onResize.bind(this));
  }

  _initMesh() {
    const texture = TL.load('/n.jpg');
    texture.wrapT = RepeatWrapping;
    texture.wrapS = RepeatWrapping;
    // const geometry = new PlaneGeometry(1, 1, 50, 50);
    const geometry = new IcosahedronGeometry(1, 50);
    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uStrength: { value: 0.3 },
        uColor1: { value: new Color(0x4d00ff) },
        uColor2: { value: new Color(0x4dffff) },
        uTexture: { value: texture },
        uTime: { value: 0 },
      },
    });
    const mesh = new Mesh(geometry, material);
    this._mesh = mesh;
    this._scene.add(this._mesh);

    // RANDOMNESS
    const randomArr = [];
    const amount = geometry.attributes.position.count;
    for (let i = 0; i < amount; i++) {
      const r = Math.random();
      randomArr.push(r);
    }

    // CREATE THE ATTRIBUTE
    const randomAttribute = new BufferAttribute(new Float32Array(randomArr), 1);

    // BIND THE ATTRIBUTE TO GEOMETRY
    geometry.setAttribute('aRandom', randomAttribute);
    console.log(geometry);

    gui.add(material.uniforms.uStrength, 'value', 0, 3);
    gui.addColor(material.uniforms.uColor1, 'value');
    gui.addColor(material.uniforms.uColor2, 'value');
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

    this._mesh.material.uniforms.uTime.value = t;

    this._renderer.render(this._scene, this._camera);
    this._stats.end();
  }
}
