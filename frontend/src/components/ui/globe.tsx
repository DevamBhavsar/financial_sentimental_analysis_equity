"use client";

import createGlobe from "three-globe";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Color,
  Fog,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

const Globe = ({
  globeConfig,
  data,
}: {
  globeConfig: any;
  data: { points: any[], arcs: any[] };
}) => {
  const [globe, setGlobe] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onResize = useCallback(() => {
    if (canvasRef.current && globe) {
      const { width, height } = canvasRef.current.getBoundingClientRect();
      const camera = globe.camera;
      const renderer = globe.renderer;
      if (camera && renderer) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    }
  }, [globe]);

  useEffect(() => {
    if (canvasRef.current && !globe) {
      const {
        pointSize,
        globeColor,
        showAtmosphere,
        atmosphereColor,
        atmosphereAltitude,
        emissive,
        emissiveIntensity,
        shininess,
        polygonColor,
        ambientLight,
        directionalLeftLight,
        directionalTopLight,
        pointLight: pointLightColor,
      } = globeConfig;

      const { width, height } = canvasRef.current.getBoundingClientRect();

      const scene = new Scene();
      scene.fog = new Fog(0xffffff, 400, 2000);

      const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 400;

      const renderer = new WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);

      const orbitControls = new OrbitControls(camera, renderer.domElement);
      orbitControls.enableDamping = true;
      orbitControls.enablePan = false;
      orbitControls.minDistance = 200;
      orbitControls.maxDistance = 500;
      orbitControls.autoRotate = true;
      orbitControls.autoRotateSpeed = 0.5;
      orbitControls.update();

      const globeInstance = new (createGlobe as any)({
        waitForGlobeReady: true,
        animateIn: true,
      })
        .pointsData(data.points)
        .pointLat((d: any) => d.lat)
        .pointLng((d: any) => d.lng)
        .pointRadius((d: any) => d.size)
        .pointColor((d: any) => d.color)
        .pointAltitude(0.01)
        .arcsData(data.arcs)
        .arcColor('color')
        .arcDashLength(0.4)
        .arcDashGap(0.6)
        .arcDashAnimateTime(2000)
        .arcStroke(0.3)
        .showAtmosphere(showAtmosphere)
        .atmosphereColor(atmosphereColor)
        .atmosphereAltitude(atmosphereAltitude);

      const globeMaterial = globeInstance.globeMaterial() as THREE.MeshPhongMaterial;
      globeMaterial.color = new Color(globeColor);
      globeMaterial.emissive = new Color(emissive);
      globeMaterial.emissiveIntensity = emissiveIntensity;
      globeMaterial.shininess = shininess;

      scene.add(globeInstance);
      scene.add(new THREE.AmbientLight(ambientLight));

      const directionalLight = new THREE.DirectionalLight(directionalLeftLight, 0.6);
      directionalLight.position.set(-400, 100, 400);
      scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(directionalTopLight, 0.6);
      directionalLight2.position.set(200, 500, 200);
      scene.add(directionalLight2);

      const pointLight = new THREE.PointLight(pointLightColor, 0.2);
      pointLight.position.set(-200, 50, 200);
      scene.add(pointLight);

      setGlobe({
        globe: globeInstance,
        renderer,
        camera,
        scene,
        orbitControls,
      });
    }
  }, [canvasRef, globe, data, globeConfig]);

  useEffect(() => {
    if (globe) {
      window.addEventListener("resize", onResize);
      (function animate() {
        globe.orbitControls.update();
        globe.renderer.render(globe.scene, globe.camera);
        requestAnimationFrame(animate);
      })();
    }
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [globe, onResize]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        contain: "layout paint size",
        cursor: "auto",
        userSelect: "none",
      }}
    />
  );
};

export default Globe;