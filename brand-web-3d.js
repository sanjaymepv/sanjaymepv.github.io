/* <brand-web-3d> — three.js brand ecosystem, soft-lit neumorphic scene on a ground plane.
   Attribute: data = JSON {brands:[{id,name,mark,color,kin,logo}]}
   Drag = orbit around the plane (azimuth free, elevation clamped), wheel = zoom. */
(function () {
  const CRIMSON = '#E52B50';
  const HOVER_PINK = '#EA124F';

  function waitTHREE() {
    return new Promise((res) => {
      if (window.THREE) return res(window.THREE);
      const t = setInterval(() => { if (window.THREE) { clearInterval(t); res(window.THREE); } }, 60);
    });
  }

  function labelSprite(THREE, text, color) {
    const pad = 16, fs = 44;
    const font = '600 ' + fs + 'px Inter, system-ui, sans-serif';
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    x.font = font;
    c.width = Math.ceil(x.measureText(String(text)).width) + pad * 2;
    c.height = fs + pad * 2;
    x.font = font;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = color || '#3A3E44';
    x.fillText(String(text), c.width / 2, c.height / 2 + 1);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 4;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
    const sh = spr.userData && spr.userData.big ? 0.62 : 0.4;
    spr.scale.set((c.width / c.height) * sh, sh, 1);
    spr.userData.w = (c.width / c.height) * sh;
    spr.userData.h = sh;
    spr.renderOrder = 5;
    return spr;
  }

  function dropShadow(THREE, size, strength) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(21,23,26,' + strength + ')');
    g.addColorStop(0.45, 'rgba(21,23,26,' + strength * 0.5 + ')');
    g.addColorStop(1, 'rgba(21,23,26,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    const m = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.008;
    mesh.renderOrder = 1;
    return mesh;
  }

  // matte studio plaster — no clearcoat, no sheen; depth comes from real shadows + env
  function softWhite(THREE, tint, rough) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(tint || '#EFEFED'),
      roughness: rough == null ? 0.7 : Math.max(0.5, rough + 0.1),
      metalness: 0.0,
      envMapIntensity: 0.5,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.16
    });
  }

  // per-brand extruded marks (index order matches the six logo brands)
  const MODELS = [
    'uploads/frame_2147225956_3d.glb',
    'uploads/frame_2147225957_3d_E52B50.glb',
    'uploads/frame_2147225958_3d_E52B50.glb',
    'uploads/frame_2147225960_3d.glb',
    'uploads/frame_2147225961_3d_small.glb',
    'uploads/frame_2147225961_3d_small-a18a5c4d.glb'
  ];
  const GLB_CACHE = {};
  function loadGLB(url) {
    if (!GLB_CACHE[url]) {
      GLB_CACHE[url] = (async () => {
        const Loader = await new Promise((res) => {
          if (window.GLTFLoader) return res(window.GLTFLoader);
          const t = setInterval(() => { if (window.GLTFLoader) { clearInterval(t); res(window.GLTFLoader); } }, 60);
        });
        return new Loader().loadAsync(url);
      })();
    }
    return GLB_CACHE[url];
  }

  // smooth (vertex-averaged) normals so the extrusions read as soft solids
  function smoothShade(THREE, mesh) {
    const U = window.BufferGeometryUtils;
    let g = mesh.geometry;
    const heavy = g.attributes.position && g.attributes.position.count > 60000;
    if (!heavy && U && U.mergeVertices) {
      try { g = U.mergeVertices(g.index ? g.toNonIndexed() : g, 1e-4); } catch (e) {}
    }
    g.computeVertexNormals();
    mesh.geometry = g;
  }

  // cylinder with filleted top/bottom rims
  function roundedCylinder(THREE, r, h, fillet, seg) {
    const f = Math.min(fillet == null ? 0.06 : fillet, Math.min(r, h / 2) * 0.9);
    const pts = [];
    const arc = 6;
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(r - f, 0));
    for (let i = 1; i <= arc; i++) {
      const a = (i / arc) * Math.PI / 2;
      pts.push(new THREE.Vector2(r - f + Math.sin(a) * f, f - Math.cos(a) * f));
    }
    for (let i = 0; i <= arc; i++) {
      const a = (i / arc) * Math.PI / 2;
      pts.push(new THREE.Vector2(r - f + Math.cos(a) * f, h - f + Math.sin(a) * f));
    }
    pts.push(new THREE.Vector2(0, h));
    const g = new THREE.LatheGeometry(pts, seg || 96);
    g.translate(0, -h / 2, 0);
    g.computeVertexNormals();
    return g;
  }

  // extruded rounded rectangle (soft-cornered rail / slab)
  function roundedBox(THREE, w, h, d, r) {
    const rr = Math.min(r == null ? 0.05 : r, Math.min(w, h) / 2.2);
    const sh = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    sh.moveTo(x + rr, y);
    sh.lineTo(x + w - rr, y);
    sh.quadraticCurveTo(x + w, y, x + w, y + rr);
    sh.lineTo(x + w, y + h - rr);
    sh.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    sh.lineTo(x + rr, y + h);
    sh.quadraticCurveTo(x, y + h, x, y + h - rr);
    sh.lineTo(x, y + rr);
    sh.quadraticCurveTo(x, y, x + rr, y);
    const bev = Math.min(rr * 0.6, d / 4);
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: d - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 8
    });
    g.translate(0, 0, -(d - bev * 2) / 2);
    g.computeVertexNormals();
    return g;
  }

  // frosted-glass brand mark: tinted, transmissive, glossy edge
  // this three build has colour management off, so sRGB hexes must be converted by hand
  function srgb(THREE, hex) {
    const c = new THREE.Color(hex);
    if (c.convertSRGBToLinear) c.convertSRGBToLinear();
    return c;
  }

  function glassMat(THREE, tint) {
    const base = (tint && tint.isColor) ? tint.clone() : srgb(THREE, tint || '#3B82F6');
    return new THREE.MeshPhysicalMaterial({
      color: base,
      emissive: base.clone(),
      emissiveIntensity: 0.52,
      roughness: 0.38,
      metalness: 0,
      ior: 1.5,
      clearcoat: 0.15,
      clearcoatRoughness: 0.14,
      specularIntensity: 0.35,
      envMapIntensity: 0.1,
      toneMapped: false
    });
  }

  function glowTex(THREE, hex) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, hex);
    g.addColorStop(0.34, hex);
    g.addColorStop(0.62, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(128, 128, 128, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function glowSprite(THREE, hex, size) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex(THREE, hex), transparent: true, opacity: 0, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending, toneMapped: false
    }));
    sp.scale.set(size, size, 1);
    return sp;
  }

  // retint an existing glow to the mark's own colour once its model has loaded
  function retintGlow(THREE, sprite, hex) {
    if (!sprite) return;
    const old = sprite.material.map;
    sprite.material.map = glowTex(THREE, hex);
    sprite.material.needsUpdate = true;
    if (old) old.dispose();
  }

  // a slightly inflated copy of the mark, additively blended — glow that hugs the logo silhouette
  function shapeGlow(THREE, source, color) {
    const g = new THREE.Group();
    source.traverse((o) => {
      if (!o.isMesh) return;
      o.updateMatrix();
      // three stacked shells of increasing size and decreasing strength = feathered edge
      [[1.07, 1.0], [1.16, 0.6], [1.28, 0.3]].forEach((L) => {
        const m = new THREE.Mesh(o.geometry, new THREE.MeshBasicMaterial({
          color: color.clone(), transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
          side: THREE.BackSide, toneMapped: false
        }));
        m.applyMatrix4(o.matrix);
        m.scale.multiplyScalar(L[0]);
        m.userData.k = L[1];
        m.renderOrder = -1;
        g.add(m);
      });
    });
    return g;
  }

  function radialTex(THREE, inner, outer) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, inner);
    g.addColorStop(0.06, inner);
    g.addColorStop(1, outer);
    x.fillStyle = g;
    x.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function gradientTex(THREE, stops, w, h) {
    const c = document.createElement('canvas');
    c.width = w || 8; c.height = h || 512;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, c.height);
    stops.forEach((s) => g.addColorStop(s[0], s[1]));
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
    return t;
  }

  class BrandWeb3D extends HTMLElement {
    static get observedAttributes() { return ['data', 'labels', 'active', 'data-active-brand']; }

    connectedCallback() {
      this.style.display = 'block';
      this.style.position = 'absolute';
      this.style.inset = '0';
      this.style.cursor = 'grab';
      if (!this._booted) { this._booted = true; this._boot(); }
    }
    attributeChangedCallback(name) {
      if (!this._ready) return;
      if (name === 'labels') this._applyLabels();
      else if (name === 'data-active-brand') this._syncActive();
      else if (name === 'active') {
        this._painted = false;
        this._lastW = this._lastH = 0;
        this._resize();
        if (!this._userZoom) this._fitNow();
      }
      else this._build();
    }

    _applyLabels() {
      const on = this.getAttribute('labels') === 'on';
      (this._nodes || []).forEach((n) => { if (n.userData.label) n.userData.label.visible = on; });
    }
    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      if (this._cam) document.removeEventListener('brand3dcamera', this._cam);
      if (this._ro) this._ro.disconnect();
      if (this._renderer) { this._renderer.dispose(); this._renderer.domElement.remove(); }
      this._ready = false; this._booted = false;
    }

    _brands() {
      try { return (JSON.parse(this.getAttribute('data') || '{}').brands) || []; }
      catch (e) { return []; }
    }

    async _boot() {
      const THREE = await waitTHREE();
      if (!this.isConnected) return;
      this.THREE = THREE;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.88;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.appendChild(renderer.domElement);
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      this._renderer = renderer;

      const scene = new THREE.Scene();
      this._scene = scene;
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
      this._camera = camera;

      // seamless studio backdrop: grey cyc wall washing down into a white floor
      const cyc = new THREE.Mesh(
        new THREE.SphereGeometry(110, 48, 32),
        new THREE.MeshBasicMaterial({
          map: gradientTex(THREE, [[0, '#EDEDEB'], [0.5, '#E6E6E4'], [1, '#DCDCDA']]),
          side: THREE.BackSide, toneMapped: false
        })
      );
      scene.add(cyc);

      // big soft-box environment — this does most of the shading, so every side stays visible
      const envScene = new THREE.Scene();
      envScene.background = gradientTex(THREE, [[0, '#D8D8D6'], [0.4, '#CFCFCD'], [1, '#BEBEBC']]);
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const box1 = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshBasicMaterial({ color: 0xf2f2f0 }));
      box1.position.set(-2.5, 6, 3.5); box1.lookAt(0, 0, 0);
      envScene.add(box1);
      const box2 = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.4), new THREE.MeshBasicMaterial({ color: 0xdfe3ec }));
      box2.position.set(5, 2.4, -4); box2.lookAt(0, 0, 0);
      envScene.add(box2);
      const env = pmrem.fromScene(envScene, 0.035);
      scene.environment = env.texture;
      this._envRT = env;
      this._pmrem = pmrem;

      scene.add(new THREE.HemisphereLight(0xffffff, 0xf2f2f0, 0.15));

      // near-overhead, very diffuse key — short, pale, soft-edged contact shadows
      const key = new THREE.DirectionalLight(0xffffff, 1.5);
      key.position.set(-3.5, 20, 5.5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.radius = 9;
      key.shadow.blurSamples = 32;
      key.shadow.bias = -0.0006;
      key.shadow.normalBias = 0.045;
      const sc = key.shadow.camera;
      sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 60;
      sc.updateProjectionMatrix();
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xfdfdfc, 0.18);
      fill.position.set(12, 7, -9);
      scene.add(fill);
      const bounce = new THREE.DirectionalLight(0xffffff, 0.1);
      bounce.position.set(2, -6, 6);
      scene.add(bounce);

      // one seamless studio plane — white under the scene, easing to grey with no visible edge
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(90, 160),
        new THREE.MeshStandardMaterial({
          map: radialTex(THREE, '#F2F2F0', '#DDDDDB'),
          color: 0xffffff, roughness: 0.98, metalness: 0, envMapIntensity: 0.12
        })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.001;
      ground.receiveShadow = true;
      scene.add(ground);
      this._ground = ground;

      this._root = new THREE.Group();
      scene.add(this._root);

      const tip = document.createElement('div');
      tip.style.cssText = 'position:absolute; pointer-events:none; opacity:0; transform:translate(-50%,-150%); padding:9px 13px; border-radius:11px; background:#15171A; color:#fff; font:600 12.5px Inter, sans-serif; white-space:nowrap; box-shadow:0 14px 34px rgba(21,23,26,0.26); transition:opacity 140ms ease-out; z-index:2;';
      this.appendChild(tip);
      this._tip = tip;

      this._az = 0.42;          // free
      this._el = 0.58;          // fixed perspective — plane orbit only
      this._dist = 26;
      this._target = new THREE.Vector3(0, 0.4, 0);
      this._pointer = new THREE.Vector2(-9, -9);
      this._ray = new THREE.Raycaster();
      this._hover = null;

      this._bindInput();
      this._cam = (e) => {
        const a = e && e.detail && e.detail.action;
        if (a === 'in') this.zoomBy(1.2);
        else if (a === 'out') this.zoomBy(1 / 1.2);
        else if (a === 'fit') this.fitView();
      };
      document.addEventListener('brand3dcamera', this._cam);
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);

      this._ready = true;
      this._build();
      this._resize();
      this._fitNow();
      this._tick();
    }

    // Upright extruded Way mark standing on the podium cap.
    async _loadCentreLogo(centre, capTop) {
      const THREE = this.THREE;
      let gltf;
      try { gltf = await loadGLB('uploads/way_logo_extruded.glb'); }
      catch (e) { return; }
      if (!this._ready || centre.parent !== this._root) return;

      const model = gltf.scene.clone(true);
      const box0 = new THREE.Box3().setFromObject(model);
      const s0 = box0.getSize(new THREE.Vector3());
      // stand it up if the mark was exported lying flat (depth taller than height)
      if (s0.y < s0.z * 0.6) model.rotation.x = -Math.PI / 2;

      const wrap = new THREE.Group();
      wrap.add(model);
      wrap.updateMatrixWorld(true);
      const size = new THREE.Box3().setFromObject(wrap).getSize(new THREE.Vector3());
      wrap.scale.setScalar(2.5 / Math.max(size.y, 0.0001));
      wrap.updateMatrixWorld(true);
      const box2 = new THREE.Box3().setFromObject(wrap);
      const c = box2.getCenter(new THREE.Vector3());
      wrap.position.set(-c.x, capTop - box2.min.y, -c.z);

      model.traverse((o) => {
        if (!o.isMesh) return;
        const m0 = Array.isArray(o.material) ? o.material[0] : o.material;
        if (m0 && (m0.map || m0.normalMap || m0.roughnessMap)) {
          if (m0.map) { m0.map.colorSpace = THREE.SRGBColorSpace; m0.map.anisotropy = 4; }
          m0.envMapIntensity = 0.85;
          m0.needsUpdate = true;
          o.castShadow = true;
          return;
        }
        smoothShade(THREE, o);
        const cc = srgb(THREE, CRIMSON);
        o.material = new THREE.MeshPhysicalMaterial({
          color: cc,
          emissive: cc.clone(), emissiveIntensity: 0.52,
          roughness: 0.3, metalness: 0, envMapIntensity: 0.12,
          clearcoat: 0.15, clearcoatRoughness: 0.14, specularIntensity: 0.35,
          toneMapped: false
        });
        o.castShadow = true;
        o.receiveShadow = true;
      });
      centre.add(wrap);
      if (this._centreGlow) { centre.remove(this._centreGlow); }
      const cShell = shapeGlow(THREE, wrap, srgb(THREE, CRIMSON));
      cShell.position.copy(wrap.position);
      cShell.scale.copy(wrap.scale);
      centre.add(cShell);
      this._centreGlow = cShell;
    }

    // Extruded brand mark standing upright on a node pedestal.
    async _loadNodeMark(stand, url, height, fallback) {
      const THREE = this.THREE;
      let gltf;
      try { gltf = await loadGLB(url); }
      catch (e) { return; }
      if (!this._ready || !stand.parent) return;

      const model = gltf.scene.clone(true);
      let markHex = null;
      const s0 = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
      if (s0.y < s0.z * 0.6) model.rotation.x = -Math.PI / 2;

      const wrap = new THREE.Group();
      wrap.add(model);
      wrap.updateMatrixWorld(true);
      const size = new THREE.Box3().setFromObject(wrap).getSize(new THREE.Vector3());
      wrap.scale.setScalar(height / Math.max(size.y, 0.0001));
      wrap.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(wrap);
      const c = box.getCenter(new THREE.Vector3());
      wrap.position.set(-c.x, 0.3 - box.min.y, -c.z);

      model.traverse((o) => {
        if (!o.isMesh) return;
        const src = o.material;
        const mats = Array.isArray(src) ? src : [src];
        // a model that ships its own textures keeps them — only flat single-colour
        // marks get retinted into the glass material
        const textured = mats.some((m) => m && (m.map || m.normalMap || m.emissiveMap || m.aoMap || m.roughnessMap))
          || !!(o.geometry.attributes && o.geometry.attributes.color);
        if (textured) {
          mats.forEach((m) => {
            if (!m) return;
            if (m.map) { m.map.colorSpace = THREE.SRGBColorSpace; m.map.anisotropy = 4; }
            m.envMapIntensity = 0.85;
            m.side = THREE.FrontSide;
            m.needsUpdate = true;
          });
          if (!markHex && mats[0] && mats[0].color) markHex = '#' + mats[0].color.getHexString();
          o.castShadow = true;
          o.receiveShadow = false;
          return;
        }
        smoothShade(THREE, o);
        const tintHex = (src && src.color) ? '#' + src.color.getHexString() : '#3B82F6';
        if (!markHex) markHex = tintHex;
        o.material = glassMat(THREE, tintHex);
        o.castShadow = false;
        o.receiveShadow = false;
      });
      if (fallback) { stand.remove(fallback); }
      stand.add(wrap);
      const host = stand.parent;
      if (host) {
        // drop the circular sprite glow in favour of one shaped like the mark
        if (host.userData.glow) { host.remove(host.userData.glow); host.userData.glow = null; }
        const gcol = srgb(THREE, markHex || '#E52B50');
        const shell = shapeGlow(THREE, wrap, gcol);
        shell.position.copy(wrap.position);
        shell.scale.copy(wrap.scale);
        stand.add(shell);
        host.userData.glow = shell;
        host.userData.glowShell = true;
      }
    }

    _build() {
      const THREE = this.THREE, root = this._root;
      while (root.children.length) {
        const c = root.children.pop();
        c.traverse && c.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      }
      this._nodes = [];
      this._rings = [];

      const brands = this._brands();
      const loader = new THREE.TextureLoader();

      // centre podium
      const centre = new THREE.Group();
      const base = new THREE.Mesh(roundedCylinder(THREE, 2.12, 0.5, 0.09), softWhite(THREE, '#FFFFFF', 0.62));
      base.position.y = 0.25;
      centre.add(base);
      const collar = new THREE.Mesh(roundedCylinder(THREE, 1.7, 0.34, 0.07), new THREE.MeshStandardMaterial({ color: new THREE.Color('#F7B9C6'), roughness: 0.55, metalness: 0 }));
      collar.position.y = 0.66;
      centre.add(collar);
      const cap = new THREE.Mesh(roundedCylinder(THREE, 1.38, 0.3, 0.07), softWhite(THREE, '#FFFFFF', 0.55));
      cap.position.y = 0.92;
      centre.add(cap);
      this._loadCentreLogo(centre, 1.07);
      const cGlow = glowSprite(THREE, CRIMSON, 4.1);
      cGlow.position.set(0, 2.1, 0);
      centre.add(cGlow);
      this._centreGlow = cGlow;
      root.add(centre);
      centre.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      this._centre = centre;

      const groups = [
        { kin: 0, radius: 5.5, speed: 0.05, r: 0.86 },
        { kin: 1, radius: 8.6, speed: -0.028, r: 0.74 }
      ];
      groups.forEach((cfg) => {
        const list = brands.filter((b) => (cfg.kin === 0 ? b.kin === 0 : b.kin !== 0));
        if (!list.length) return;
        const ring = new THREE.Group();
        ring.userData.speed = cfg.speed;
        root.add(ring);
        this._rings.push(ring);

        const guide = new THREE.Mesh(
          new THREE.RingGeometry(cfg.radius - 0.02, cfg.radius + 0.02, 200),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(cfg.kin === 0 ? CRIMSON : '#15171A'),
            transparent: true, opacity: cfg.kin === 0 ? 0.16 : 0.08, side: THREE.DoubleSide
          })
        );
        guide.rotation.x = -Math.PI / 2;
        guide.position.y = 0.012;
        ring.add(guide);

        list.forEach((b, i) => {
          const a = (i / list.length) * Math.PI * 2;
          const px = Math.cos(a) * cfg.radius, pz = Math.sin(a) * cfg.radius;

          const node = new THREE.Group();
          node.position.set(px, 0, pz);

          // circular pedestal
          const pad = new THREE.Mesh(
            roundedCylinder(THREE, cfg.r, 0.3, 0.07, 80),
            softWhite(THREE, cfg.kin === 0 ? '#FFFFFF' : '#FFFFFF', 0.62)
          );
          pad.position.y = 0.15;
          pad.castShadow = true;
          pad.receiveShadow = true;
          node.add(pad);

          // the mark itself stands straight on the pedestal — no disc behind it
          const artH = cfg.r * 1.3;
          const stand = new THREE.Group();
          const disc = pad;
          let flat = null;

          if (b.logo) {
            const t = loader.load(b.logo);
            if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
            flat = new THREE.Mesh(
              new THREE.PlaneGeometry(artH, artH),
              new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, toneMapped: false })
            );
            flat.position.set(0, 0.26 + artH / 2, 0);
            stand.add(flat);
          } else {
            const mk = labelSprite(THREE, b.mark || (b.name || '?')[0], b.color || '#3A3E44');
            mk.scale.multiplyScalar(1.6);
            mk.position.set(0, 0.26 + artH / 2, 0);
            stand.add(mk);
          }
          const glow = glowSprite(THREE, b.color || '#E52B50', cfg.r * 1.85);
          glow.position.set(0, 0.3 + artH * 0.5, 0);
          node.add(glow);
          node.userData.glow = glow;
          node.add(stand);
          node.userData.stand = stand;
          if (b.logo || b.model3d) {
            const mi = /l(\d)\.png/.exec(b.logo);
            const url = b.model3d || MODELS[(mi ? parseInt(mi[1], 10) - 1 : this._nodes.length) % MODELS.length];
            this._loadNodeMark(stand, url, artH, flat);
          }

          const lab = labelSprite(THREE, b.name || '', '#3A3E44');
          lab.position.set(0, 0.3 + artH + 0.55, 0);
          lab.visible = this.getAttribute('labels') === 'on';
          node.userData.label = lab;
          node.add(lab);

          // connector rail on the plane (direct brands only)
          let rail = null;
          if (cfg.kin === 0) {
            const inner = 1.55, outer = cfg.radius - cfg.r * 0.55;
            const len = Math.max(0.4, outer - inner);
            rail = new THREE.Mesh(
              roundedBox(THREE, len, 0.13, 0.26, 0.05),
              softWhite(THREE, '#FFFFFF', 0.66)
            );
           
            rail.position.set(Math.cos(a) * (inner + len / 2), 0.07, Math.sin(a) * (inner + len / 2));
            rail.rotation.y = -a;
            rail.castShadow = true;
            rail.receiveShadow = true;
            rail.userData.baseColor = '#FFFFFF';
            ring.add(rail);
          }

          node.userData.brand = b;
          node.userData.rail = rail;
          node.userData.hit = pad;
          node.userData.disc = disc;
          ring.add(node);
          this._nodes.push(node);
        });
      });
      this._syncActive();
    }

    _syncActive() {
      const id = this.getAttribute('data-active-brand') || '';
      this._activeNode = id
        ? (this._nodes.filter((n) => n.userData.brand && n.userData.brand.id === id)[0] || null)
        : null;
      this._paintRails();
    }

    _paintRails() {
      this._nodes.forEach((n) => {
        const rail = n.userData.rail;
        if (rail) rail.material.color.set((n === this._hover || n === this._activeNode) ? HOVER_PINK : '#FFFFFF');
      });
    }

    _bindInput() {
      const el = this;
      let down = false, panning = false, lx = 0, ly = 0, dx0 = 0, dy0 = 0;
      const THREE = this.THREE;
      el.addEventListener('pointerdown', (e) => {
        down = true; lx = e.clientX; ly = e.clientY; dx0 = e.clientX; dy0 = e.clientY;
        panning = e.button === 1 || e.button === 2 || e.shiftKey || e.altKey;
        el.style.cursor = panning ? 'grabbing' : 'grab';
        try { el.setPointerCapture(e.pointerId); } catch (x) {}
        el.style.cursor = 'grabbing';
      });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        this._pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        this._pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        this._mx = e.clientX - r.left; this._my = e.clientY - r.top;
        if (!down) return;
        if (panning) {
          this._panX = (this._panX || 0) - (e.clientX - lx);
          this._panY = (this._panY || 0) - (e.clientY - ly);
          this._userZoom = true;
          this._resize(true);
        } else {
          this._az += (e.clientX - lx) * 0.006;
        }
        lx = e.clientX; ly = e.clientY;
      });
      const up = (e) => {
        const moved = Math.hypot(e.clientX - dx0, e.clientY - dy0);
        down = false; panning = false; el.style.cursor = 'grab';
        try { el.releasePointerCapture(e.pointerId); } catch (x) {}
        if (moved < 4 && this._hover) {
          const id = (this._hover.userData.brand && this._hover.userData.brand.id) || 'way';
          if (typeof window.__wayBrandPick === 'function') window.__wayBrandPick(id);
          document.dispatchEvent(new CustomEvent('brand3dpick', { detail: { id: id } }));
        }
      };
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', () => { this._pointer.set(-9, -9); });
      el.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          this._az += e.deltaX * 0.004;   // swipe right → orbit turns right
          return;
        }
        this._userZoom = true;
        this._dist = Math.max(13, Math.min(46, this._dist + e.deltaY * 0.022));
      }, { passive: false });
    }

    _resize(force) {
      if (!this._renderer) return;
      const w = this.clientWidth || 1, h = this.clientHeight || 1;
      if (w < 4 || h < 4) return;                            // degenerate box while hidden
      if (!force && this._lastW === w && this._lastH === h) return;   // ResizeObserver re-entry guard
      this._lastW = w; this._lastH = h;
      this._renderer.setSize(w, h);
      this._renderer.domElement.style.width = '100%';
      this._renderer.domElement.style.height = '100%';
      this._camera.aspect = w / h;
      // pan is a frame offset, so orbit keeps pivoting on the centre Way logo
      this._camera.setViewOffset(w, h, (this._panX || 0), 46 + (this._panY || 0), w, h);
      this._camera.updateProjectionMatrix();
      if (!this._userZoom) this._fitNow();
    }

    zoomBy(f) {
      this._userZoom = true;
      this._dist = Math.max(11, Math.min(46, this._dist / f));
    }

    fitView() {
      this._userZoom = false;
      this._panX = 0; this._panY = 0;
      this._target.set(0, 0.4, 0);
      this._resize(true);
      this._az = 0.42;
      this._dist = 26;
      this._fitNow();
    }

    zoomPct() { return Math.round((26 / (this._shown || this._dist)) * 100); }

    _fitNow() {
      const THREE = this.THREE;
      if (!THREE || !this._nodes || !this._nodes.length) return;
      const v = new THREE.Vector3(), base = new THREE.Vector3();
      const radii = this._nodes.map((n) => { n.getWorldPosition(base); return Math.hypot(base.x, base.z); });
      for (let pass = 0; pass < 18; pass++) {
        const ce = Math.cos(this._el), se = Math.sin(this._el);
        this._camera.position.set(
          this._target.x + Math.cos(this._az) * ce * this._dist,
          this._target.y + se * this._dist,
          this._target.z + Math.sin(this._az) * ce * this._dist
        );
        this._camera.lookAt(this._target);
        this._camera.updateMatrixWorld(true);
        let f = 0;
        radii.forEach((r) => {
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
            const wx = Math.cos(a) * r, wz = Math.sin(a) * r;
            v.set(wx, -0.45, wz).project(this._camera);
            f = Math.max(f, Math.abs(v.x) / 0.9, -v.y / 0.65);
            v.set(wx, 2.7, wz).project(this._camera);
            f = Math.max(f, Math.abs(v.x) / 0.9, v.y / 0.86);
          }
        });
        if (!(f > 0)) break;
        const next = Math.max(11, Math.min(46, this._dist * f));
        const done = Math.abs(next - this._dist) < 0.05;
        this._dist = next;
        if (done) break;
      }
      this._shown = this._dist;
    }

    _tick = () => {
      this._raf = requestAnimationFrame(this._tick);
      const THREE = this.THREE;
      if (!THREE || !this._renderer) return;
      const dt = 0.016;

      // camera orbit
      this._shown = this._shown == null ? this._dist : this._shown + (this._dist - this._shown) * 0.12;
      const dd = this._shown;
      const ce = Math.cos(this._el), se = Math.sin(this._el);
      this._camera.position.set(
        this._target.x + Math.cos(this._az) * ce * dd,
        this._target.y + se * dd,
        this._target.z + Math.sin(this._az) * ce * dd
      );
      this._camera.lookAt(this._target);

      const paused = !!(this._hover || this._activeNode);
      this._rings.forEach((r) => { if (!paused) r.rotation.y += r.userData.speed * dt; });

      this._ray.setFromCamera(this._pointer, this._camera);
      const pickables = this._nodes.concat(this._centre ? [this._centre] : []);
      const hits = this._ray.intersectObjects(pickables, true);
      let hitNode = null;
      if (hits.length) {
        let o = hits[0].object;
        while (o && pickables.indexOf(o) === -1) o = o.parent;
        hitNode = o || null;
      }
      if (hitNode !== this._hover) {
        this._hover = hitNode;
        this.style.cursor = hitNode ? 'pointer' : 'grab';
        this._nodes.forEach((n) => {
          const lb = n.userData.label;
          if (lb && lb.visible) {
            const d = n.getWorldPosition(new this.THREE.Vector3()).distanceTo(this._camera.position);
            const k = d / 34;
            lb.scale.set(lb.userData.w * k, lb.userData.h * k, 1);
          }
        });
        this._paintRails();
        if (hitNode) { this._tip.textContent = (hitNode.userData.brand && hitNode.userData.brand.name) || 'Way'; this._tip.style.opacity = '1'; }
        else this._tip.style.opacity = '0';
      }
      if (this._hover) { this._tip.style.left = this._mx + 'px'; this._tip.style.top = this._my + 'px'; }

      if (this._centre) {
        const con = this._hover === this._centre;
        const cy = con ? 0.24 : 0;
        this._centre.position.y += (cy - this._centre.position.y) * 0.15;
        if (this._centreGlow) {
          const o = con ? 0.46 : 0;
          const cg = this._centreGlow;
          if (cg.material) cg.material.opacity += (o - cg.material.opacity) * 0.16;
          else cg.traverse((x) => {
            if (!x.material) return;
            const t = o * (x.userData.k == null ? 1 : x.userData.k);
            x.material.opacity += (t - x.material.opacity) * 0.16;
          });
        }
      }

      this._nodes.forEach((n) => {
        const on = n === this._hover || n === this._activeNode;
        const st = n.userData.stand;
        if (n.userData.glow) {
          const go = on ? 0.5 : 0;
          const gl = n.userData.glow;
          if (gl.material) gl.material.opacity += (go - gl.material.opacity) * 0.18;
          else gl.traverse((o) => {
            if (!o.material) return;
            const t = go * (o.userData.k == null ? 1 : o.userData.k);
            o.material.opacity += (t - o.material.opacity) * 0.18;
          });
        }
        this._np = this._np || new THREE.Vector3();
        n.getWorldPosition(this._np);
        const yaw = Math.atan2(this._camera.position.x - this._np.x, this._camera.position.z - this._np.z);
        st.rotation.y = yaw + 0.4 - (n.parent ? n.parent.rotation.y : 0);
        const ty = on ? 0.16 : 0;
        st.position.y += (ty - st.position.y) * 0.15;
        const ts = on ? 1.08 : 1;
        n.scale.x += (ts - n.scale.x) * 0.15;
        n.scale.y = n.scale.x; n.scale.z = n.scale.x;
      });

      if (this.getAttribute('active') === 'off' && this._painted) return;
      this._renderer.render(this._scene, this._camera);
      this._painted = true;
    };
  }

  if (!customElements.get('brand-web-3d')) customElements.define('brand-web-3d', BrandWeb3D);
})();
