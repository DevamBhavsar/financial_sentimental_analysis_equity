"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// Enhanced createGlobe function with better error handling and features
const createGlobe = (config = {}) => {
  const radius = 100;
  const globeGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const globeMaterial = new THREE.MeshPhongMaterial({
    color: 0x4285f4,
    transparent: true,
    opacity: 0.9,
    shininess: 100,
  });
  const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);

  const countryGroup = new THREE.Group();
  globeMesh.add(countryGroup);
  const pointsGroup = new THREE.Group();
  globeMesh.add(pointsGroup);
  const arcsGroup = new THREE.Group();
  globeMesh.add(arcsGroup);

  let currentCountries = [];
  let currentPoints = [];
  let currentArcs = [];
  let userCountry = null;

  const latLngToVector3 = (lat, lng, altitude = 0) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const r = radius + altitude;
    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const z = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  const updateCountries = () => {
    // Clear existing countries
    while(countryGroup.children.length > 0) {
      const child = countryGroup.children[0];
      countryGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    if (!currentCountries || currentCountries.length === 0) return;

    currentCountries.forEach((country) => {
      if (!country.geometry || !country.geometry.coordinates) return;

      const processCoordinates = (coords) => {
        if (!Array.isArray(coords)) return [];
        if (typeof coords[0] === "number" && coords.length === 2) return [coords];
        return coords.flatMap(processCoordinates);
      };

      try {
        let allCoordinates = [];
        if (country.geometry.type === 'Polygon') {
          allCoordinates = country.geometry.coordinates.flatMap(processCoordinates);
        } else if (country.geometry.type === 'MultiPolygon') {
          allCoordinates = country.geometry.coordinates.flatMap(polygon =>
            polygon.flatMap(processCoordinates)
          );
        }

        if (allCoordinates.length > 2) {
          const points = allCoordinates.map(([lng, lat]) => {
            if (typeof lng !== 'number' || typeof lat !== 'number') return null;
            if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
            return latLngToVector3(lat, lng, 1);
          }).filter(Boolean);

          if (points.length > 2) {
            // Check if this is the user's country
            const isUserCountry = userCountry && (
              country.properties.NAME === userCountry ||
              country.properties.NAME_EN === userCountry ||
              country.properties.NAME_LONG === userCountry ||
              country.properties.ADMIN === userCountry ||
              country.properties.ISO_A2 === userCountry ||
              country.properties.ISO_A3 === userCountry ||
              (country.properties.NAME && country.properties.NAME.toLowerCase().includes(userCountry.toLowerCase())) ||
              (country.properties.NAME_EN && country.properties.NAME_EN.toLowerCase().includes(userCountry.toLowerCase()))
            );

            const material = new THREE.LineBasicMaterial({
              color: isUserCountry ? 0xff6b35 : 0xcccccc, // Orange for user country, gray for others
              opacity: isUserCountry ? 1.0 : 0.6,
              transparent: true,
              linewidth: isUserCountry ? 3 : 1,
            });

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.LineLoop(geometry, material);
            countryGroup.add(line);

            // Add a subtle glow effect for user's country
            if (isUserCountry) {
              const glowMaterial = new THREE.LineBasicMaterial({
                color: 0xff6b35,
                opacity: 0.3,
                transparent: true,
                linewidth: 5,
              });
              const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
              const glowLine = new THREE.LineLoop(glowGeometry, glowMaterial);
              countryGroup.add(glowLine);
            }
          }
        }
      } catch (error) {
        console.warn('Error processing country geometry:', error);
      }
    });
  };

  const updatePoints = () => {
    // Clear existing points
    while(pointsGroup.children.length > 0) {
      const child = pointsGroup.children[0];
      pointsGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    currentPoints.forEach(point => {
      if (typeof point.lat !== 'number' || typeof point.lng !== 'number') return;

      const pointGeometry = new THREE.SphereGeometry(point.size || 1.5, 16, 16);
      const pointMaterial = new THREE.MeshBasicMaterial({
        color: point.color || '#ffffff',
        transparent: true,
        opacity: 0.9
      });
      const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

      // Add glow effect
      const glowGeometry = new THREE.SphereGeometry((point.size || 1.5) * 1.5, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: point.color || '#ffffff',
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);

      const position = latLngToVector3(point.lat, point.lng, 3);
      pointMesh.position.copy(position);
      glowMesh.position.copy(position);

      // Add pulsing animation
      pointMesh.userData = {
        originalScale: pointMesh.scale.clone(),
        time: Math.random() * Math.PI * 2
      };
      glowMesh.userData = {
        originalScale: glowMesh.scale.clone(),
        time: Math.random() * Math.PI * 2
      };

      pointsGroup.add(pointMesh);
      pointsGroup.add(glowMesh);
    });
  };

  const updateArcs = () => {
    // Clear existing arcs
    while(arcsGroup.children.length > 0) {
      const child = arcsGroup.children[0];
      arcsGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    currentArcs.forEach(arc => {
      if (!arc.startLat || !arc.startLng || !arc.endLat || !arc.endLng) return;

      const start = latLngToVector3(arc.startLat, arc.startLng, 3);
      const end = latLngToVector3(arc.endLat, arc.endLng, 3);

      const distance = start.distanceTo(end);
      const arcHeight = Math.max(20, distance * 0.3);

      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(radius + arcHeight);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(64);

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const colors = new Float32Array(points.length * 3);

      for (let i = 0; i < points.length; i++) {
        const color = new THREE.Color(arc.color || '#ffffff');
        const alpha = Math.sin((i / points.length) * Math.PI);
        colors[i * 3] = color.r * alpha;
        colors[i * 3 + 1] = color.g * alpha;
        colors[i * 3 + 2] = color.b * alpha;
      }

      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
      });

      const arcLine = new THREE.Line(geometry, material);
      arcsGroup.add(arcLine);

      const particleCount = 5;
      for (let i = 0; i < particleCount; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
          color: arc.color || '#ffffff',
          transparent: true,
          opacity: 0.9
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.userData = {
          curve,
          progress: (i / particleCount) + Math.random() * 0.1,
          speed: 0.008 + Math.random() * 0.004,
          originalOpacity: 0.9
        };
        arcsGroup.add(particle);
      }
    });
  };

  const animateArcs = (deltaTime = 0.016) => {
    arcsGroup.children.forEach(child => {
      if (child.userData.curve) {
        child.userData.progress += child.userData.speed;
        if (child.userData.progress > 1) {
          child.userData.progress = 0;
        }

        const point = child.userData.curve.getPointAt(child.userData.progress);
        child.position.copy(point);

        const fadeStart = 0.1;
        const fadeEnd = 0.9;
        let opacity = child.userData.originalOpacity;

        if (child.userData.progress < fadeStart) {
          opacity *= child.userData.progress / fadeStart;
        } else if (child.userData.progress > fadeEnd) {
          opacity *= (1 - child.userData.progress) / (1 - fadeEnd);
        }

        child.material.opacity = opacity;
      }
    });

    pointsGroup.children.forEach(child => {
      if (child.userData.time !== undefined) {
        child.userData.time += deltaTime * 3;
        const scale = 1 + Math.sin(child.userData.time) * 0.2;
        child.scale.copy(child.userData.originalScale).multiplyScalar(scale);
      }
    });
  };

  const dispose = () => {
    [countryGroup, pointsGroup, arcsGroup].forEach(group => {
      while(group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
    });

    if (globeGeometry) globeGeometry.dispose();
    if (globeMaterial) globeMaterial.dispose();
  };

  const api = {
    polygonsData: function(data) {
      currentCountries = data || [];
      updateCountries();
      return this;
    },
    polygonCapColor: function() { return this; },
    polygonSideColor: function() { return this; },
    polygonStrokeColor: function() { return this; },
    pointsData: function(data) {
      currentPoints = data || [];
      updatePoints();
      return this;
    },
    pointLat: function() { return this; },
    pointLng: function() { return this; },
    pointRadius: function() { return this; },
    pointColor: function() { return this; },
    pointAltitude: function() { return this; },
    arcsData: function(data) {
      currentArcs = data || [];
      updateArcs();
      return this;
    },
    arcColor: function() { return this; },
    arcDashLength: function() { return this; },
    arcDashGap: function() { return this; },
    arcDashAnimateTime: function() { return this; },
    arcStroke: function() { return this; },
    setUserCountry: function(country) {
      userCountry = country;
      updateCountries();
      return this;
    },
    showAtmosphere: function(show) {
      if (show && !globeMesh.userData.atmosphere) {
        const atmosphereGeometry = new THREE.SphereGeometry(radius + 15, 64, 64);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
          color: 0x4da6ff,
          transparent: true,
          opacity: 0.15,
          side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        globeMesh.add(atmosphere);
        globeMesh.userData.atmosphere = atmosphere;
      }
      return this;
    },
    atmosphereColor: function() { return this; },
    atmosphereAltitude: function() { return this; },
    globeMaterial: function() { return globeMaterial; },
    tick: animateArcs,
    dispose: dispose,
    position: globeMesh.position,
    rotation: globeMesh.rotation,
    scale: globeMesh.scale,
    add: globeMesh.add.bind(globeMesh),
  };

  Object.setPrototypeOf(api, globeMesh);
  return api;
};

const Globe = ({
  globeConfig = {
    globeColor: "#1a1a2e",
    showAtmosphere: true,
    atmosphereColor: "#4da6ff",
    atmosphereAltitude: 0.15,
    emissive: "#0f0f23",
    emissiveIntensity: 0.2,
    shininess: 100,
    polygonColor: "rgba(255,255,255,0.8)",
    polygonStrokeColor: "#ffffff",
    ambientLight: "#404040",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    autoRotate: true,
    autoRotateSpeed: 0.5,
  },
  data = { points: [], arcs: [] },
  className = "",
  style = {},
}) => {
  const [globe, setGlobe] = useState(null);
  const [countries, setCountries] = useState({ features: [] });
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());

  // Fetch user's location based on IP
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        // Using ipapi.co for location detection
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
          throw new Error('Failed to fetch location');
        }
        const locationData = await response.json();

        setUserLocation({
          country: locationData.country_name,
          countryCode: locationData.country_code,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          city: locationData.city,
          region: locationData.region
        });

        console.log('User location detected:', {
          country: locationData.country_name,
          code: locationData.country_code,
          city: locationData.city
        });
      } catch (error) {
        console.error('Error fetching user location:', error);
        // Fallback location (you can remove this or set a default)
        setUserLocation({
          country: 'India',
          countryCode: 'IN',
          latitude: 20.5937,
          longitude: 78.9629,
          city: 'Unknown',
          region: 'Unknown'
        });
      }
    };

    fetchUserLocation();
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch countries: ${response.status}`);
        }
        const data = await response.json();
        setCountries(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching countries:", error);
        setError(error.message);
        setCountries({ features: [] });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const onResize = useCallback(() => {
    if (canvasRef.current && globe) {
      const { width, height } = canvasRef.current.getBoundingClientRect();
      if (width > 0 && height > 0 && globe.camera && globe.renderer) {
        globe.camera.aspect = width / height;
        globe.camera.updateProjectionMatrix();
        globe.renderer.setSize(width, height, false);
      }
    }
  }, [globe]);

  useEffect(() => {
    if (!canvasRef.current || isLoading || globe) return;

    const {
      globeColor, showAtmosphere, emissive, emissiveIntensity,
      shininess, ambientLight, directionalLeftLight,
      directionalTopLight, autoRotate, autoRotateSpeed,
    } = globeConfig;

    const { width, height } = canvasRef.current.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    try {
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x000000, 400, 2000);

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 200);

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      renderer.shadowMap.enabled = false;

      const orbitControls = {
        enabled: true,
        autoRotate: autoRotate,
        autoRotateSpeed: autoRotateSpeed || 0.5,

        update: function() {
          if (this.autoRotate && this.enabled) {
            globeInstance.rotation.y += this.autoRotateSpeed * 0.01;
          }
        }
      };

      const globeInstance = createGlobe();

      // Create enhanced data with user location
      const enhancedPoints = [...(data.points || [])];

      // Add user location point if available
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        enhancedPoints.push({
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          color: '#ff6b35',
          size: 3,
          label: 'Your Location'
        });
      }

      globeInstance
        .polygonsData(countries.features)
        .polygonCapColor(() => globeConfig.polygonColor)
        .polygonSideColor(() => "rgba(0, 0, 0, 0)")
        .polygonStrokeColor(() => globeConfig.polygonStrokeColor)
        .pointsData(enhancedPoints)
        .pointColor((d) => d.color || "white")
        .arcsData(data.arcs || [])
        .arcColor((d) => d.color || "white")
        .showAtmosphere(showAtmosphere)
        .atmosphereColor(globeConfig.atmosphereColor)
        .atmosphereAltitude(globeConfig.atmosphereAltitude);

      // Set user country for highlighting
      if (userLocation) {
        console.log('Setting user country for highlighting:', userLocation.country);
        globeInstance.setUserCountry(userLocation.country);
      }

      const globeMaterial = globeInstance.globeMaterial();
      globeMaterial.color = new THREE.Color(globeColor);
      globeMaterial.emissive = new THREE.Color(emissive);
      globeMaterial.emissiveIntensity = emissiveIntensity || 0.1;
      globeMaterial.shininess = shininess || 100;

      scene.add(globeInstance);

      const ambientLightObj = new THREE.AmbientLight(ambientLight, 0.4);
      scene.add(ambientLightObj);

      const dirLight1 = new THREE.DirectionalLight(directionalLeftLight, 0.8);
      dirLight1.position.set(-400, 100, 400);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(directionalTopLight, 0.6);
      dirLight2.position.set(200, 500, 200);
      scene.add(dirLight2);

      const rimLight = new THREE.DirectionalLight('#4da6ff', 0.3);
      rimLight.position.set(0, 0, -400);
      scene.add(rimLight);

      setGlobe({
        globe: globeInstance,
        renderer,
        camera,
        scene,
        orbitControls,
      });
    } catch (error) {
      console.error('Error initializing globe:', error);
      setError('Failed to initialize 3D globe');
    }
  }, [canvasRef, countries, isLoading, globe, data, globeConfig, userLocation]);

  useEffect(() => {
    if (!globe) return;

    window.addEventListener("resize", onResize);

    const animate = () => {
      try {
        const deltaTime = clockRef.current.getDelta();

        if (globe.orbitControls) {
          globe.orbitControls.update();
        }

        if (globe.globe && typeof globe.globe.tick === 'function') {
          globe.globe.tick(deltaTime);
        }

        if (globe.renderer && globe.scene && globe.camera) {
          globe.renderer.render(globe.scene, globe.camera);
        }

        animationRef.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error('Animation error:', error);
      }
    };

    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (globe.globe && typeof globe.globe.dispose === 'function') {
        globe.globe.dispose();
      }
      if (globe.renderer) {
        globe.renderer.dispose();
      }
    };
  }, [globe, onResize]);

  useEffect(() => {
    if (globe && globe.globe) {
      const enhancedPoints = [...(data.points || [])];

      if (userLocation && userLocation.latitude && userLocation.longitude) {
        enhancedPoints.push({
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          color: '#ff6b35',
          size: 3,
          label: 'Your Location'
        });
      }

      globe.globe.pointsData(enhancedPoints);

      if (data.arcs) {
        globe.globe.arcsData(data.arcs);
      }
    }
  }, [globe, data, userLocation]);

  const canvasStyle = {
    width: "100%",
    height: "100%",
    contain: "layout paint size",
    cursor: "default",
    userSelect: "none",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: -999,
    pointerEvents: "none",
    ...style
  };

  if (error) {
    return (
      <div style={{...canvasStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a'}}>
        <div style={{color: 'white', textAlign: 'center'}}>
          <p>Failed to load globe</p>
          <p style={{fontSize: '0.8em', opacity: 0.7}}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className={className}
        style={canvasStyle}
      />
      {isLoading && (
        <div style={{
          ...canvasStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          zIndex: -999
        }}>
          <div style={{color: 'white', textAlign: 'center'}}>
            <p>Loading globe...</p>
            {userLocation && (
              <p style={{fontSize: '0.8em', opacity: 0.8}}>
                Detected location: {userLocation.city}, {userLocation.country}
              </p>
            )}
          </div>
        </div>
      )}
      {userLocation && !isLoading && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '8px',
          fontSize: '0.9em',
          zIndex: 10,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,107,53,0.3)'
        }}>
          <div style={{color: '#ff6b35', fontWeight: 'bold', marginBottom: '2px'}}>Your Location</div>
          <div>{userLocation.city}, {userLocation.country}</div>
        </div>
      )}
    </>
  );
};

export default Globe;