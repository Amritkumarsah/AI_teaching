"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { RotateCcw } from "lucide-react";

interface Realtime3DVisualizerProps {
  domain: string;
  title: string;
  isPlaying?: boolean;
  speed?: number;
  param1?: number; // e.g. velocity / attention heads
  param2?: number; // e.g. mass / embedding dimension
  resetSignal?: number;
}

export const Realtime3DVisualizer: React.FC<Realtime3DVisualizerProps> = ({
  domain = "physics",
  title = "3D Simulation",
  isPlaying = true,
  speed = 1.0,
  param1 = 70,
  param2 = 50,
  resetSignal = 0
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);

  const isPlayingRef = useRef<boolean>(isPlaying);
  const speedRef = useRef<number>(speed);
  const param1Ref = useRef<number>(param1);
  const param2Ref = useRef<number>(param2);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    speedRef.current = speed;
    param1Ref.current = param1;
    param2Ref.current = param2;
  }, [isPlaying, speed, param1, param2]);

  const titleLower = (title || "").toLowerCase();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // -------------------------------------------------------------------------
    // 1. Scene, Camera, WebGL Renderer
    // -------------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050811, 0.0025);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 30, 115);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------------------
    // 2. Cinematic Lighting
    // -------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0x1e293b, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x06b6d4, 2.5);
    keyLight.position.set(50, 80, 50);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 1.8);
    fillLight.position.set(-60, 40, -40);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xf43f5e, 3, 220);
    rimLight.position.set(0, -30, -50);
    scene.add(rimLight);

    // Dynamic 3D Grid Floor
    const gridHelper = new THREE.GridHelper(200, 40, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -35;
    scene.add(gridHelper);

    // -------------------------------------------------------------------------
    // 3. Root 3D Transformation Group
    // -------------------------------------------------------------------------
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const animatedObjects: {
      update: (time: number, delta: number) => void;
      cleanup?: () => void;
    }[] = [];

    // =========================================================================
    // MODEL 1: PHYSICS — NEWTON'S LAWS / GRAVITATIONAL EQUALITY / FREE FALL
    // =========================================================================
    if (
      domain === "physics" ||
      titleLower.includes("newton") ||
      titleLower.includes("gravit") ||
      titleLower.includes("fall") ||
      titleLower.includes("motion")
    ) {
      const isFreeFallTopic =
        titleLower.includes("fall") ||
        titleLower.includes("gravit") ||
        titleLower.includes("equality") ||
        titleLower.includes("newton");

      if (isFreeFallTopic) {
        // --- Galileo & Newton's Free Fall Equivalence Apparatus ---
        // Tower / Test Chamber Frame
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          metalness: 0.8,
          roughness: 0.3
        });
        const topPlat = new THREE.Mesh(new THREE.BoxGeometry(44, 2, 20), frameMat);
        topPlat.position.set(0, 32, 0);
        const botPlat = new THREE.Mesh(new THREE.BoxGeometry(44, 2, 20), frameMat);
        botPlat.position.set(0, -32, 0);
        rootGroup.add(topPlat, botPlat);

        // Guide Rails
        const railMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.35 });
        const rail1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 64), railMat);
        rail1.position.set(-14, 0, 0);
        const rail2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 64), railMat);
        rail2.position.set(14, 0, 0);
        rootGroup.add(rail1, rail2);

        // Sphere 1: Heavy Mass (m = 10 kg, Cyan)
        const heavyGeo = new THREE.SphereGeometry(6, 24, 24);
        const heavyMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 0.6,
          roughness: 0.2
        });
        const heavySphere = new THREE.Mesh(heavyGeo, heavyMat);
        heavySphere.position.set(-14, 24, 0);
        rootGroup.add(heavySphere);

        // Sphere 2: Light Mass (m = 1 kg, Amber Gold)
        const lightGeo = new THREE.SphereGeometry(3.2, 24, 24);
        const lightMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.7,
          roughness: 0.2
        });
        const lightSphere = new THREE.Mesh(lightGeo, lightMat);
        lightSphere.position.set(14, 24, 0);
        rootGroup.add(lightSphere);

        // Dynamic Force Vectors (Pointing Downward)
        const forceArrow1 = new THREE.ArrowHelper(
          new THREE.Vector3(0, -1, 0),
          new THREE.Vector3(-14, 24, 0),
          16,
          0xf43f5e,
          4,
          2.5
        );
        const forceArrow2 = new THREE.ArrowHelper(
          new THREE.Vector3(0, -1, 0),
          new THREE.Vector3(14, 24, 0),
          10,
          0xf59e0b,
          3,
          2
        );
        rootGroup.add(forceArrow1, forceArrow2);

        // Orbiting Cosmic Body in background
        const bgOrbitGeo = new THREE.RingGeometry(38, 38.6, 64);
        const bgOrbitMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3
        });
        const bgOrbit = new THREE.Mesh(bgOrbitGeo, bgOrbitMat);
        bgOrbit.rotation.x = Math.PI / 2.3;
        rootGroup.add(bgOrbit);

        animatedObjects.push({
          update: (time) => {
            // Free Fall cycle: accelerated descent y = y0 - 0.5 * g * t^2
            const cycleDuration = 3.2 / Math.max(speedRef.current, 0.2);
            const cycleProgress = (time % cycleDuration) / cycleDuration;
            const drop = Math.pow(cycleProgress, 2) * 54; // quadratic acceleration
            const currentY = 26 - drop;

            heavySphere.position.y = currentY;
            lightSphere.position.y = currentY;

            // Rotate spheres during fall
            heavySphere.rotation.x = time * 3;
            lightSphere.rotation.x = time * 3;

            // Update force vector positions
            forceArrow1.position.set(-14, currentY, 0);
            forceArrow2.position.set(14, currentY, 0);

            // Scale force vectors with mass parameter
            const massScale = (param2Ref.current / 50);
            forceArrow1.setLength(16 * massScale, 4, 2.5);

            bgOrbit.rotation.z = time * 0.2;
          }
        });
      } else {
        // Standard Planetary Orbit & Gravitational Vectors
        const sunGeo = new THREE.SphereGeometry(14, 32, 32);
        const sunMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 1.2,
          roughness: 0.2
        });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        rootGroup.add(sunMesh);

        const orbitCurve = new THREE.EllipseCurve(0, 0, 54, 36, 0, 2 * Math.PI, false, 0);
        const orbitPoints = orbitCurve.getPoints(100);
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(
          orbitPoints.map((p) => new THREE.Vector3(p.x, 0, p.y))
        );
        const orbitMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
        const orbitLine = new THREE.Line(orbitGeo, orbitMat);
        rootGroup.add(orbitLine);

        const planetGeo = new THREE.SphereGeometry(5.5, 24, 24);
        const planetMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 0.6
        });
        const planetMesh = new THREE.Mesh(planetGeo, planetMat);
        rootGroup.add(planetMesh);

        const forceArrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 0), 20, 0xf43f5e, 4, 2);
        const velArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 16, 0x10b981, 4, 2);
        rootGroup.add(forceArrow, velArrow);

        animatedObjects.push({
          update: (time) => {
            sunMesh.rotation.y = time * 0.3;
            const orbitTime = time * 0.8 * (param1Ref.current / 50);
            const px = Math.cos(orbitTime) * 54;
            const pz = Math.sin(orbitTime) * 36;
            planetMesh.position.set(px, 0, pz);
            planetMesh.rotation.y = time * 2;

            const dirToCenter = new THREE.Vector3(-px, 0, -pz).normalize();
            forceArrow.position.set(px, 0, pz);
            forceArrow.setDirection(dirToCenter);

            const tangentDir = new THREE.Vector3(-Math.sin(orbitTime) * 54, 0, Math.cos(orbitTime) * 36).normalize();
            velArrow.position.set(px, 0, pz);
            velArrow.setDirection(tangentDir);
          }
        });
      }
    }

    // =========================================================================
    // MODEL 2: COMPUTER SCIENCE — PROCESS MANAGEMENT / CPU ARCHITECTURE / QUEUES
    // =========================================================================
    else if (
      domain === "cs" ||
      titleLower.includes("process") ||
      titleLower.includes("os") ||
      titleLower.includes("thread") ||
      titleLower.includes("schedul") ||
      titleLower.includes("cpu") ||
      titleLower.includes("memory")
    ) {
      // Central 3D CPU Microprocessor Core
      const cpuGroup = new THREE.Group();
      rootGroup.add(cpuGroup);

      // Silicon Die & Heatspreader
      const chipMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.85,
        roughness: 0.2
      });
      const chipMesh = new THREE.Mesh(new THREE.BoxGeometry(22, 4, 22), chipMat);
      cpuGroup.add(chipMesh);

      const coreDieMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.9,
        roughness: 0.1
      });
      const coreDie = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 12), coreDieMat);
      coreDie.position.y = 2.4;
      cpuGroup.add(coreDie);

      // Concentric Process State Rings (Ready -> Running -> Waiting)
      const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.45 });
      const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.5 });
      const ringMat3 = new THREE.MeshBasicMaterial({ color: 0xf43f5e, wireframe: true, transparent: true, opacity: 0.4 });

      const readyRing = new THREE.Mesh(new THREE.TorusGeometry(32, 0.4, 16, 64), ringMat1);
      readyRing.rotation.x = Math.PI / 2;
      const runningRing = new THREE.Mesh(new THREE.TorusGeometry(20, 0.4, 16, 64), ringMat2);
      runningRing.rotation.x = Math.PI / 2;
      const waitRing = new THREE.Mesh(new THREE.TorusGeometry(44, 0.4, 16, 64), ringMat3);
      waitRing.rotation.x = Math.PI / 2;
      rootGroup.add(readyRing, runningRing, waitRing);

      // Rotating Process Blocks (P1, P2, P3, P4)
      const processCubes: THREE.Mesh[] = [];
      const numProcs = 5;
      const pGeo = new THREE.BoxGeometry(4.5, 4.5, 4.5);
      const pMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        roughness: 0.2
      });

      for (let p = 0; p < numProcs; p++) {
        const pMesh = new THREE.Mesh(pGeo, pMat);
        rootGroup.add(pMesh);
        processCubes.push(pMesh);
      }

      animatedObjects.push({
        update: (time) => {
          cpuGroup.rotation.y = time * 0.4;
          coreDie.scale.setScalar(1 + Math.sin(time * 6) * 0.08);

          readyRing.rotation.z = time * 0.5;
          runningRing.rotation.z = -time * 0.7;
          waitRing.rotation.z = time * 0.3;

          processCubes.forEach((cube, idx) => {
            const angle = time * 1.2 * (param1Ref.current / 50) + (idx * Math.PI * 2) / numProcs;
            const r = 32 + Math.sin(time * 2 + idx) * 8;
            cube.position.set(Math.cos(angle) * r, Math.sin(time * 3 + idx) * 3, Math.sin(angle) * r);
            cube.rotation.x = time * 2;
            cube.rotation.y = time * 1.5;
          });
        }
      });
    }

    // =========================================================================
    // MODEL 3: AI & NEURAL ARCHITECTURE / TRANSFORMER SELF-ATTENTION
    // =========================================================================
    else if (domain === "ai") {
      const coreGeo = new THREE.IcosahedronGeometry(14, 2);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.8,
        wireframe: true,
        roughness: 0.2,
        metalness: 0.8
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      rootGroup.add(coreMesh);

      const innerGeo = new THREE.SphereGeometry(8, 32, 32);
      const innerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      rootGroup.add(innerMesh);

      const headNodes: THREE.Mesh[] = [];
      const numHeads = 8;
      const headGeo = new THREE.SphereGeometry(3.2, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x059669,
        emissiveIntensity: 0.9,
        roughness: 0.3
      });

      for (let i = 0; i < numHeads; i++) {
        const head = new THREE.Mesh(headGeo, headMat);
        rootGroup.add(head);
        headNodes.push(head);
      }

      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.6,
        linewidth: 2
      });
      const lineGeo = new THREE.BufferGeometry();
      const linePositions = new Float32Array(numHeads * 2 * 3);
      lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
      const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
      rootGroup.add(lineMesh);

      animatedObjects.push({
        update: (time) => {
          coreMesh.rotation.y = time * 0.4;
          coreMesh.rotation.x = time * 0.2;
          innerMesh.scale.setScalar(1 + Math.sin(time * 4) * 0.15);

          const positions = lineGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < numHeads; i++) {
            const angle = (i / numHeads) * Math.PI * 2 + time * 0.6;
            const rad = 36 + Math.sin(time * 2 + i) * 6;
            const hx = Math.cos(angle) * rad;
            const hy = Math.sin(time * 1.5 + i) * 12;
            const hz = Math.sin(angle) * rad;

            headNodes[i].position.set(hx, hy, hz);

            const idx = i * 6;
            positions[idx] = 0;
            positions[idx + 1] = 0;
            positions[idx + 2] = 0;
            positions[idx + 3] = hx;
            positions[idx + 4] = hy;
            positions[idx + 5] = hz;
          }
          lineGeo.attributes.position.needsUpdate = true;
        }
      });
    }

    // =========================================================================
    // MODEL 4: CHEMISTRY / ATOMIC ORBITALS
    // =========================================================================
    else if (domain === "chemistry") {
      const nucleusGroup = new THREE.Group();
      rootGroup.add(nucleusGroup);

      const nucMatP = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.9 });
      const nucMatN = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 });

      for (let n = 0; n < 8; n++) {
        const nGeo = new THREE.SphereGeometry(3.5, 16, 16);
        const nMesh = new THREE.Mesh(nGeo, n % 2 === 0 ? nucMatP : nucMatN);
        nMesh.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
        nucleusGroup.add(nMesh);
      }

      const ringAngles = [
        { x: 0, y: 0, z: 0 },
        { x: Math.PI / 3, y: Math.PI / 4, z: 0 },
        { x: -Math.PI / 3, y: -Math.PI / 4, z: Math.PI / 6 }
      ];
      const electronMeshes: THREE.Mesh[] = [];
      const electronGeo = new THREE.SphereGeometry(2.5, 16, 16);
      const electronMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 1.2 });

      ringAngles.forEach((ang) => {
        const rGeo = new THREE.TorusGeometry(35, 0.4, 16, 64);
        const rMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.5 });
        const rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.rotation.set(ang.x, ang.y, ang.z);
        rootGroup.add(rMesh);

        const eMesh = new THREE.Mesh(electronGeo, electronMat);
        rootGroup.add(eMesh);
        electronMeshes.push(eMesh);
      });

      animatedObjects.push({
        update: (time) => {
          nucleusGroup.rotation.y = time * 0.5;
          nucleusGroup.rotation.x = time * 0.3;

          electronMeshes.forEach((eMesh, idx) => {
            const ang = ringAngles[idx];
            const eAngle = time * 3 + idx * 2.1;
            const r = 35;
            const lx = Math.cos(eAngle) * r;
            const ly = Math.sin(eAngle) * r;

            const vec = new THREE.Vector3(lx, ly, 0);
            vec.applyEuler(new THREE.Euler(ang.x, ang.y, ang.z));
            eMesh.position.copy(vec);
          });
        }
      });
    }

    // =========================================================================
    // MODEL 5: BIOLOGY / GENERAL — CELL / DNA HELIX ROTARY SYSTEM
    // =========================================================================
    else {
      const rotorGroup = new THREE.Group();
      rootGroup.add(rotorGroup);

      const shaftGeo = new THREE.CylinderGeometry(5, 5, 45, 24);
      const shaftMat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        emissive: 0x6d28d9,
        emissiveIntensity: 0.7,
        roughness: 0.3
      });
      const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
      rotorGroup.add(shaftMesh);

      const spokeCount = 6;
      for (let s = 0; s < spokeCount; s++) {
        const sAngle = (s / spokeCount) * Math.PI * 2;
        const spokeGeo = new THREE.BoxGeometry(4, 12, 14);
        const spokeMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.8
        });
        const spokeMesh = new THREE.Mesh(spokeGeo, spokeMat);
        spokeMesh.position.set(Math.cos(sAngle) * 12, 10, Math.sin(sAngle) * 12);
        spokeMesh.rotation.y = -sAngle;
        rotorGroup.add(spokeMesh);
      }

      const photons: THREE.Mesh[] = [];
      const photonGeo = new THREE.SphereGeometry(2, 12, 12);
      const photonMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      for (let p = 0; p < 14; p++) {
        const ph = new THREE.Mesh(photonGeo, photonMat);
        rootGroup.add(ph);
        photons.push(ph);
      }

      animatedObjects.push({
        update: (time) => {
          rotorGroup.rotation.y = time * 2.5;
          photons.forEach((ph, idx) => {
            const pProg = (time * 1.5 + idx * 0.4) % 3;
            ph.position.set(Math.sin(idx * 33) * 30, 40 - pProg * 35, Math.cos(idx * 33) * 30);
          });
        }
      });
    }

    // -------------------------------------------------------------------------
    // 4. Mouse & Touch 360° Camera Orbit & Zoom
    // -------------------------------------------------------------------------
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;

    const onPointerDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      targetRotY += dx * 0.008;
      targetRotX = Math.max(-1.1, Math.min(1.1, targetRotX + dy * 0.008));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerUp = () => {
      isMouseDown = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isMouseDown = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isMouseDown || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouseX;
      const dy = e.touches[0].clientY - prevMouseY;
      targetRotY += dx * 0.008;
      targetRotX = Math.max(-1.1, Math.min(1.1, targetRotX + dy * 0.008));
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(35, Math.min(260, camera.position.z + e.deltaY * 0.12));
    };

    container.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    container.addEventListener("wheel", onWheel, { passive: false });

    // Expose reset camera
    resetCameraRef.current = () => {
      targetRotY = 0;
      targetRotX = 0;
      camera.position.set(0, 30, 115);
    };

    // -------------------------------------------------------------------------
    // 5. 60 FPS Render Loop
    // -------------------------------------------------------------------------
    let animId: number;
    let clock = 0;

    const animate = () => {
      if (isPlayingRef.current) {
        clock += 0.016 * speedRef.current;
      }

      // Smooth camera orbit
      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.1;
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.1;

      // Continuous 360° idle auto-rotation
      if (!isMouseDown) {
        targetRotY += 0.005 * speedRef.current;
      }

      // Update domain model animations
      animatedObjects.forEach((obj) => obj.update(clock, 0.016));

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      container.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("wheel", onWheel);

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [domain, titleLower]);

  useEffect(() => {
    if (resetSignal && resetCameraRef.current) {
      resetCameraRef.current();
    }
  }, [resetSignal]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Real-time 3D Telemetry & Controls Overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/85 border border-cyan-500/40 rounded-xl text-xs font-mono text-cyan-300 backdrop-blur-md shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>60 FPS • 3D CAMERA ORBIT</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-bold">360° LIVE</span>
        </div>
        <div className="px-2.5 py-0.5 bg-slate-950/70 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400 backdrop-blur-md">
          <span>DRAG TO ORBIT 360° • SCROLL TO ZOOM</span>
        </div>
      </div>
    </div>
  );
};

export default Realtime3DVisualizer;
