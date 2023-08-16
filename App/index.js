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
  Vector3,
  BufferGeometry,
  BufferAttribute,
  EquirectangularReflectionMapping,
  PointLight,
  PointLightHelper,
  MeshStandardMaterial,
  MathUtils,
  AdditiveBlending,
  Points,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Stats from "stats.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

import vertex from "./shaders/index.vert";
import fragment from "./shaders/index.frag";

const TL = new TextureLoader();
const GL = new GLTFLoader();
const gui = new GUI();
const rgbeLoader = new RGBELoader();
const dl = new DRACOLoader();
dl.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
dl.preload();
GL.setDRACOLoader(dl);

export default class App {
  constructor() {
    this._renderer = undefined;
    this._camera = undefined;
    this._scene = undefined;
    this._model = undefined;
    this._raf = undefined;
    this._points = undefined;
    this._pointLightHelpers = [];
    this._pointLights = [];
    this._fireFlies = [];
    this._guiInitialized = false;
    this._allHelpersVisible = false;
    this._showAllLampLighting = true;

    this._clock = new Clock();
    this._clock.start();
    this._stats = new Stats();
    document.body.appendChild(this._stats.dom);

    this._init();
  }

  _init() {
    // Render Target
    this._renderer = new WebGLRenderer({
      canvas: document.querySelector("#canvas"),
      antialias: true,
    });

    // Enabled Shadow
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = PCFSoftShadowMap;
    this._renderer.useLegacyLights = false;

    // Camera Setting
    const aspect = window.innerWidth / window.innerHeight;
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._camera = new PerspectiveCamera(75, aspect, 0.1, 100);
    this._camera.position.y = 1;
    this._camera.position.z = 5;

    // Initial Scene
    this._scene = new Scene();

    // CONTROLS
    this._controls = new OrbitControls(this._camera, this._renderer.domElement);

    this._initFloor();
    this._initModel();
    // this._initLight();

    // START
    this._initEvents();
    this._start();
  }

  _initFloor() {
    const groundGeometry = new BoxGeometry(30, 0.1, 30);
    const texture = TL.load("/texture/rock_wall_09_diff_1k.jpg");
    const groundMaterial = new MeshStandardMaterial({
      color: 0x3b3b3b,
      map: texture,
      envMapIntensity: 1,
    });

    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    this._scene.add(ground);
    ground.position.set(0, -1.5, 0);

    rgbeLoader.load("/envMaps/moonless_golf_1k.hdr", (t) => {
      t.mapping = EquirectangularReflectionMapping;

      this._scene.environment = t;
      this._scene.background = t;
      this._scene.backgroundBlurriness = 1;
      this._scene.backgroundIntensity = 0.01;
    });
  }

  _initModel() {
    new Promise((_) => {
      GL.load("/models/japanese_restaurant.glb", (model) => {
        console.log("model loaded", model);
        this._model = model.scene;
        this._model.scale.setScalar(0.3);
        this._model.position.set(0, -1.4, 0);

        this._initFireFlies();
        this._initLampPointLight();

        this._model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.side = 0;

            const envMap = this._scene.environment;
            child.material.envMap = envMap;
            child.material.envMapIntensity = 1.0;
          }

          // Lamp
          if (child.name.includes("lambert5")) {
            const fabric = TL.load("/texture/fabric.avif");
            child.material.color.set(0xcab177);
            child.material.bumpMap = fabric;
            child.material.bumpScale = 0.05;
          }

          // Tag Name
          if (child.name.includes("lambert33")) {
            const texture = TL.load("/texture/bark_willow_02_diff_1k.jpg");
            const normal = TL.load("/texture/bark_willow_02_nor_gl_1k.jpg");
            const rough = TL.load("/texture/bark_willow_02_arm_1k.jpg");
            child.material.color.set(0x704b35);
            child.material.normalMap = normal;
            child.material.map = texture;
            child.material.roughnessMap = rough;
            child.material.roughness = 0.8;
          }

          // Roof
          if (
            child.name.includes("lambert4") ||
            child.name.includes("phong6")
          ) {
            const texture = TL.load("/texture/ceramic_roof_01_diff_1k.jpg");
            const normal = TL.load("/texture/ceramic_roof_01_nor_gl_1k.jpg");
            const rough = TL.load("/texture/ceramic_roof_01_rough_1k.jpg");
            child.material.normalMap = normal;
            child.material.map = texture;
            child.material.roughnessMap = rough;
            child.material.roughness = 0.8;
          }

          // Ground
          if (
            child.name.includes("lambert41") ||
            child.name.includes("lambert42")
          ) {
            const texture = TL.load("/texture/aerial_rocks_02_diff_1k.jpg");
            const normal = TL.load("/texture/aerial_rocks_02_nor_gl_1k.jpg");
            const rough = TL.load("/texture/aerial_rocks_02_rough_1k.jpg");
            child.material.normalMap = normal;
            child.material.map = texture;
            child.material.roughnessMap = rough;
            child.material.roughness = 0.9;
          }

          // Wood
          if (
            child.name.includes("lambert32") ||
            child.name.includes("lambert33") ||
            child.name.includes("lambert13") ||
            child.name.includes("lambert12") ||
            child.name.includes("lambert36") ||
            child.name.includes("lambert35")
          ) {
            const texture = TL.load("/texture/rough_wood_diff_1k.jpg");
            const normal = TL.load("/texture/rough_wood_nor_gl_1k.jpg");
            const rough = TL.load("/texture/aerial_rocks_02_rough_1k.jpg");

            if (child.name.includes("lambert13")) {
              child.material.bumpMap = texture;
              child.material.bumpScale = 0.1;
            } else {
              child.material.normalMap = normal;
              child.material.roughnessMap = rough;
              child.material.roughness = 0.5;
              child.material.map = texture;
            }
          }

          // Bamboo
          if (child.name.includes("lambert19")) {
            const texture = TL.load("/texture/bamboo.jpeg");
            child.material.map = texture;
            child.material.color.set(0x8d823f);
          }

          // Fence
          if (child.name.includes("phong4")) {
            const texture = TL.load("/texture/grey_roof_01_diff_1k.jpg");
            child.material.map = texture;
            child.material.color.set(0x8d6f53);
          }

          // Salmon
          if (child.name.includes("lambert24")) {
            const texture = TL.load("/texture/salmon.png");
            child.material.map = texture;
          }

          // Fabric
          if (
            child.name.includes("lambert37") ||
            child.name.includes("lambert38")
          ) {
            const texture = TL.load("/texture/fabric_pattern_05_col_01_1k.jpg");
            const normal = TL.load("/texture/fabric_pattern_05_nor_gl_1k.jpg");
            child.material.map = texture;
            child.material.bumpMap = texture;
            child.material.normalMap = normal;
          }

          if (child.name.includes("pasted__phong17")) {
            const texture = TL.load(
              "/texture/plastered_stone_wall_diff_1k.jpg"
            );
            const normal = TL.load(
              "/texture/plastered_stone_wall_nor_gl_1k.jpg"
            );
            const rough = TL.load("/texture/plastered_stone_wall_arm_1k.jpg");
            child.material.normalMap = normal;
            child.material.roughnessMap = rough;
            child.material.roughness = 0.5;
            child.material.map = texture;
          }
        });

        this._scene.add(this._model);

        if (!this._guiInitialized) {
          this._initGUI(); // Initialize GUI only once after model is loaded
          this._guiInitialized = true;
        }
      });
    });
  }

  _initLampPointLight() {
    const lightPositions = [
      new Vector3(-5.6, 6, 3.4),
      new Vector3(0.5, 6, 3.4),
      new Vector3(-2.5, 6, 3.4),
      new Vector3(3, 6, 3.4),
      new Vector3(5.5, 6, 3.4),
    ];

    for (let i = 0; i < lightPositions.length; i++) {
      const pointLight = new PointLight(0xd37a4a, 1.0);
      pointLight.position.copy(lightPositions[i]);
      pointLight.intensity = 1.5;
      pointLight.castShadow = true;
      pointLight.visible = true;
      this._pointLights.push(pointLight);
      this._model.add(pointLight);

      // Create a helper for the point light
      const pointLightHelper = new PointLightHelper(pointLight);
      this._pointLightHelpers.push(pointLightHelper);
      pointLightHelper.visible = false;
      this._scene.add(pointLightHelper);

      this._points.scale.setScalar(0.3);
      const clonePoint = this._points.clone();
      clonePoint.position.copy(lightPositions[i]);
      this._fireFlies.push(clonePoint);

      this._model.add(clonePoint);
    }
  }

  _initFireFlies() {
    const g = new BufferGeometry();
    const posArr = [];
    const shiftArr = [];
    const scaleArr = [];

    for (let i = 0; i < 30; i++) {
      const x = MathUtils.randFloat(-5, 5);
      const y = MathUtils.randFloat(-3, 3);
      const z = MathUtils.randFloat(-3, 3);

      const shift = MathUtils.randFloat(0, 5);
      const scale = MathUtils.randFloat(0.3, 0.5);

      posArr.push(x, y, z);
      shiftArr.push(shift);
      scaleArr.push(scale);
    }

    const positionAttribute = new BufferAttribute(new Float32Array(posArr), 3);
    const timeShiftAttribute = new BufferAttribute(
      new Float32Array(shiftArr),
      1
    );
    const scaleAttribute = new BufferAttribute(new Float32Array(scaleArr), 1);

    g.setAttribute("position", positionAttribute);
    g.setAttribute("aTimeShift", timeShiftAttribute);
    g.setAttribute("aScale", scaleAttribute);

    const m = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uTxt: { value: TL.load("/texture/glow.png") },
        uColor: { value: new Color(0xf2d658) },
        uIntensity: { value: 6.8 },
      },
      transparent: true,
      blending: AdditiveBlending,
    });
    const p = new Points(g, m);

    this._points = p;
  }

  _initEvents() {
    window.addEventListener("resize", this._onResize.bind(this));
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

    // Update Timing
    if (this._points && this._model)
      this._points.material.uniforms.uTime.value = t * 0.3;

    this._renderer.render(this._scene, this._camera);
    this._stats.end();
  }

  _initGUI() {
    // Light
    const pointLightsGroup = gui.addFolder("Lamp Lights");
    const pointLightsColor = {
      color: 0xd37a4a,
      intensity: 1.0,
    };

    pointLightsGroup
      .addColor(pointLightsColor, "color")
      .name("Lamp Color")
      .onChange((colorValue) => {
        const newColor = new Color(colorValue);
        // Update all lamps color
        for (const pointLight of this._pointLights) {
          pointLight.color.copy(newColor);
        }
      });

    pointLightsGroup
      .add({ allVisible: this._allHelpersVisible }, "allVisible")
      .name("Helpers Visibility")
      .onChange((value) => {
        this._allHelpersVisible = value;
        this._setAllHelpersVisibility();
      });

    pointLightsGroup
      .add({ allVisible: this._showAllLampLighting }, "allVisible")
      .name("Turn on lights")
      .onChange((value) => {
        this._showAllLampLighting = value;
        this._setAllLampsLighting();
      });

    // Firefly
    const pointsUniformsGroup = gui.addFolder("FireFly");
    pointsUniformsGroup
      .addColor({ color: new Color(0xd2c483) }, "color")
      .name("Firefly Color")
      .onChange((colorValue) => {
        const newColor = new Color(colorValue);
        for (const firefly of this._fireFlies) {
          firefly.material.uniforms.uColor.value = newColor;
        }
      });

    pointsUniformsGroup
      .add({ value: 6.8 }, "value")
      .min(0)
      .max(12)
      .name("Intensity")
      .onChange((value) => {
        for (const firefly of this._fireFlies) {
          firefly.material.uniforms.uIntensity.value = value;
        }
      });
  }

  _setAllHelpersVisibility() {
    for (const pointLight of this._pointLightHelpers) {
      pointLight.visible = this._allHelpersVisible;
    }
  }

  _setAllLampsLighting() {
    for (let i = 0; i < this._pointLights.length; i++) {
      this._pointLights[i].visible = this._showAllLampLighting;
      this._fireFlies[i].visible = this._showAllLampLighting;
    }
  }
}
