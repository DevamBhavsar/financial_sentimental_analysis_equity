"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { useTheme } from "next-themes";

const HeroAnimation = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const handleResize = useCallback((camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
    if (mountRef.current) {
      const { clientWidth: width, clientHeight: height } = mountRef.current;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
  }, []);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });

    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    camera.position.z = 3.5;

    // Main group for all objects
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Central icosahedron - larger and more detailed
    const icosahedronGeometry = new THREE.IcosahedronGeometry(1.8, 4);

    // Theme-based colors with gradients
    const isDark = theme === 'dark';
    const primaryColor = isDark ? 0x64b5f6 : 0x1976d2;
    const secondaryColor = isDark ? 0x81c784 : 0x388e3c;
    const accentColor = isDark ? 0xffb74d : 0xf57c00;
    const particleColor = isDark ? 0xffffff : 0x333333;

    // Create central wireframe with particles
    const centralGroup = new THREE.Group();

    // Enhanced particle system - bigger particles for larger globe
    const particlesMaterial = new THREE.PointsMaterial({
      color: particleColor,
      size: 0.035,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(icosahedronGeometry, particlesMaterial);
    centralGroup.add(particles);

    // Enhanced wireframe with more vibrant colors and effects
    const wireframeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color1: { value: new THREE.Color(primaryColor) },
        color2: { value: new THREE.Color(secondaryColor) },
        color3: { value: new THREE.Color(accentColor) },
        opacity: { value: 0.6 }
      },
      vertexShader: `
        uniform float time;
        varying vec3 vPosition;
        varying float vIntensity;
        void main() {
          vPosition = position;
          vec3 pos = position;
          // More pronounced wave effect for larger globe
          pos += sin(time * 2.0 + position.x * 3.0) * 0.08;
          pos += cos(time * 1.5 + position.y * 2.0) * 0.06;

          // Calculate intensity for color mixing
          vIntensity = sin(time + position.x + position.y + position.z) * 0.5 + 0.5;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform float opacity;
        varying vec3 vPosition;
        varying float vIntensity;
        void main() {
          // Triple color mixing for more dynamic effects
          vec3 color = mix(color1, color2, vIntensity);
          color = mix(color, color3, sin(time * 0.5 + vPosition.z) * 0.3 + 0.3);

          // Add some glow effect
          float glow = pow(vIntensity, 2.0) * 0.5 + 0.5;
          color *= glow;

          gl_FragColor = vec4(color, opacity);
        }
      `,
      transparent: true,
      wireframe: true
    });

    const wireframeGeometry = new THREE.WireframeGeometry(icosahedronGeometry);
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    centralGroup.add(wireframe);

    mainGroup.add(centralGroup);

    // Enhanced lighting focused on the central globe
    const ambientLight = new THREE.AmbientLight(isDark ? 0x404040 : 0x606060, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(primaryColor, 1.2, 50);
    pointLight1.position.set(5, 5, 8);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(secondaryColor, 1, 50);
    pointLight2.position.set(-5, -5, 6);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(accentColor, 0.8, 50);
    pointLight3.position.set(0, 8, -5);
    scene.add(pointLight3);

    // Create more subtle background particles
    const backgroundParticles = new THREE.Group();
    const bgParticleGeometry = new THREE.BufferGeometry();
    const bgParticleCount = 100; // Reduced for focus on main globe
    const positions = new Float32Array(bgParticleCount * 3);

    for (let i = 0; i < bgParticleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 15;     // x - smaller spread
      positions[i + 1] = (Math.random() - 0.5) * 15; // y
      positions[i + 2] = (Math.random() - 0.5) * 8;  // z
    }

    bgParticleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const bgParticleMaterial = new THREE.PointsMaterial({
      color: particleColor,
      size: 0.008,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending
    });

    const bgParticleSystem = new THREE.Points(bgParticleGeometry, bgParticleMaterial);
    backgroundParticles.add(bgParticleSystem);
    scene.add(backgroundParticles);

    // Mouse interaction
    const mouse = new THREE.Vector2();
    const target = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = currentMount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    currentMount.addEventListener('mousemove', handleMouseMove);

    // Animation variables
    let time = 0;
    let animationFrameId: number;

    // Fade in animation
    setIsVisible(true);

    const animate = () => {
      time += 0.01;

      // Smooth mouse following
      target.x += (mouse.x - target.x) * 0.02;
      target.y += (mouse.y - target.y) * 0.02;

      // Central object rotation with mouse influence - slower for better focus
      centralGroup.rotation.x += 0.003 + target.y * 0.001;
      centralGroup.rotation.y += 0.005 + target.x * 0.001;
      centralGroup.rotation.z += 0.001;

      // Update shader uniforms
      if (wireframeMaterial.uniforms) {
        wireframeMaterial.uniforms.time.value = time;
      }

      // Animate background particles subtly
      const positions = bgParticleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < bgParticleCount * 3; i += 3) {
        positions[i + 1] += Math.sin(time * 0.5 + i) * 0.0005; // gentler floating motion
      }
      bgParticleGeometry.attributes.position.needsUpdate = true;

      // Rotate background particles slowly
      backgroundParticles.rotation.y += 0.0001;

      // Camera subtle movement
      camera.position.x += (target.x * 0.15 - camera.position.x) * 0.008;
      camera.position.y += (target.y * 0.15 - camera.position.y) * 0.008;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const resizeListener = () => handleResize(camera, renderer);
    window.addEventListener('resize', resizeListener);

    return () => {
      window.removeEventListener('resize', resizeListener);
      currentMount.removeEventListener('mousemove', handleMouseMove);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      cancelAnimationFrame(animationFrameId);

      // Cleanup
      scene.clear();
      renderer.dispose();
    };
  }, [handleResize, theme]);

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
};

export default HeroAnimation;