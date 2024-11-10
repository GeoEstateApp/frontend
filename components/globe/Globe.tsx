import React, { useRef, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Renderer, TextureLoader } from "expo-three";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import * as THREE from "three";

interface TouchPosition {
    x: number;
    y: number;
}

// Atmosphere shader
const atmosphereVertexShader = `
varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const atmosphereFragmentShader = `
varying vec3 vNormal;
void main() {
    float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
    vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
    gl_FragColor = vec4(atmosphereColor, 1.0) * intensity;
}`;

// Inner glow shader
const innerGlowFragmentShader = `
varying vec3 vNormal;
void main() {
    float intensity = pow(0.4 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 1.4);
    vec3 glowColor = vec3(0.3, 0.6, 1.0);
    gl_FragColor = vec4(glowColor, 1.0) * intensity * 0.4;
}`;

export default function Globe(): JSX.Element {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const earthRef = useRef<THREE.Mesh | null>(null);
    const cloudsRef = useRef<THREE.Mesh | null>(null);
    const atmosphereRef = useRef<THREE.Mesh | null>(null);
    const starFieldRef = useRef<THREE.Points[]>([]);
    const autoRotateSpeed = 0.0005;
    let isDragging = false;
    let previousTouch: TouchPosition = { x: 0, y: 0 };

    const onContextCreate = async (gl: ExpoWebGLRenderingContext): Promise<void> => {
        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 2;

        const renderer = new Renderer({ gl });
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 1);

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Increased ambient light intensity
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2); // Increased directional light intensity
        sunLight.position.set(5, 3, 5);
        scene.add(sunLight);

        // Multiple atmosphere lights (for glow)
        const atmosphereLight1 = new THREE.PointLight(0x4444ff, 0.6, 100);
        atmosphereLight1.position.set(-5, 0, 5);
        scene.add(atmosphereLight1);

        const atmosphereLight2 = new THREE.PointLight(0x4444ff, 0.4, 100);
        atmosphereLight2.position.set(5, 0, -5);
        scene.add(atmosphereLight2);

        try {
            // Textures
            const textureLoader = new TextureLoader();
            const [earthMap, earthBump, earthSpec, cloudsMap] = await Promise.all([
                textureLoader.loadAsync(require('./earth_atmos_2048.jpg')),
                textureLoader.loadAsync(require('./earth_normal_2048.jpg')),
                textureLoader.loadAsync(require('./earth_specular_2048.jpg')),
                textureLoader.loadAsync(require('./earth_clouds_1024.png')),
            ]);

            // Earth Geometry
            const earthGeometry = new THREE.SphereGeometry(0.995, 64, 64);
            const earthMaterial = new THREE.MeshPhongMaterial({
                map: earthMap,
                bumpMap: earthBump,
                bumpScale: 0.05,
                specularMap: earthSpec,
                specular: new THREE.Color(0x666666),
                shininess: 30,
            });

            const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
            scene.add(earthMesh);
            earthRef.current = earthMesh;

            // Clouds
            const cloudsGeometry = new THREE.SphereGeometry(1.005, 64, 64);
            const cloudsMaterial = new THREE.MeshPhongMaterial({
                map: cloudsMap,
                transparent: true,
                opacity: 0.5,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });

            const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
            scene.add(cloudsMesh);
            cloudsRef.current = cloudsMesh;

            // Main atmosphere glow
            const atmosphereGeometry = new THREE.SphereGeometry(1.25, 64, 64);
            const atmosphereMaterial = new THREE.ShaderMaterial({
                vertexShader: atmosphereVertexShader,
                fragmentShader: atmosphereFragmentShader,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false,
            });

            const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            scene.add(atmosphereMesh);
            atmosphereRef.current = atmosphereMesh;

            // Inner glow
            const innerGlowGeometry = new THREE.SphereGeometry(1.01, 64, 64);
            const innerGlowMaterial = new THREE.ShaderMaterial({
                vertexShader: atmosphereVertexShader,
                fragmentShader: innerGlowFragmentShader,
                blending: THREE.AdditiveBlending,
                side: THREE.FrontSide,
                transparent: true,
                depthWrite: false,
            });

            // Outer glow
            const outerGlowGeometry = new THREE.SphereGeometry(1.3, 64, 64);
            const outerGlowMaterial = new THREE.ShaderMaterial({
                vertexShader: atmosphereVertexShader,
                fragmentShader: atmosphereFragmentShader,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false,
            });

            const innerGlowMesh = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
            const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
            scene.add(innerGlowMesh);
            scene.add(outerGlowMesh);

            setIsLoading(false);
        } catch (error) {
            console.error('Error loading textures:', error);
            setIsLoading(false);
        }

        // Star background
        const createStarField = (count: number, size: number, depth: number): THREE.Points => {
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);

            for (let i = 0; i < count * 3; i += 3) {
                vertices[i] = THREE.MathUtils.randFloatSpread(2000) * depth;
                vertices[i + 1] = THREE.MathUtils.randFloatSpread(2000) * depth;
                vertices[i + 2] = THREE.MathUtils.randFloatSpread(2000) * depth;

                const brightness = 0.5 + Math.random() * 0.5;
                colors[i] = brightness;
                colors[i + 1] = brightness;
                colors[i + 2] = brightness;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({
                size: size,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
            });

            return new THREE.Points(geometry, material);
        };

        // Multiple star layers
        const starLayers = [
            { count: 1000, size: 2, depth: 1 },
            { count: 5000, size: 1.5, depth: 1.5 },
            { count: 10000, size: 1, depth: 2 },
        ];

        starLayers.forEach(layer => {
            const starField = createStarField(layer.count, layer.size, layer.depth);
            scene.add(starField);
            starFieldRef.current.push(starField);
        });

        // Touch handling (if not in bg)
        const handleTouchStart = (event: TouchEvent): void => {
            isDragging = true;
            const touch = event.touches[0];
            previousTouch = { x: touch.clientX, y: touch.clientY };
        };

        const handleTouchMove = (event: TouchEvent): void => {
            if (!isDragging) return;

            const touch = event.touches[0];
            const deltaX = touch.clientX - previousTouch.x;
            const deltaY = touch.clientY - previousTouch.y;

            if (earthRef.current && atmosphereRef.current) {
                earthRef.current.rotation.y += deltaX * 0.005;
                earthRef.current.rotation.x += deltaY * 0.005;
                atmosphereRef.current.rotation.y += deltaX * 0.005;
                atmosphereRef.current.rotation.x += deltaY * 0.005;
            }

            if (cloudsRef.current) {
                cloudsRef.current.rotation.y += deltaX * 0.005;
                cloudsRef.current.rotation.x += deltaY * 0.005;
            }

            previousTouch = { x: touch.clientX, y: touch.clientY };
        };

        const handleTouchEnd = (): void => {
            isDragging = false;
        };

        if (gl.canvas) {
            gl.canvas.addEventListener('touchstart', handleTouchStart as unknown as EventListener);
            gl.canvas.addEventListener('touchmove', handleTouchMove as unknown as EventListener);
            gl.canvas.addEventListener('touchend', handleTouchEnd as unknown as EventListener);
        }

        // Render loop with star animation
        let time = 0;
        const render = (): void => {
            requestAnimationFrame(render);
            time += 0.001;

            if (!isDragging) {
                if (earthRef.current && atmosphereRef.current) {
                    earthRef.current.rotation.y += autoRotateSpeed;
                    atmosphereRef.current.rotation.y += autoRotateSpeed;
                }
                if (cloudsRef.current) {
                    cloudsRef.current.rotation.y += autoRotateSpeed * 1.1;
                }
            }

            starFieldRef.current.forEach((starField, index) => {
                starField.rotation.y = time * (0.05 + index * 0.01);
                starField.rotation.x = time * 0.03;

                const colors = starField.geometry.attributes.color;
                for (let i = 0; i < colors.array.length; i += 3) {
                    const flicker = 0.95 + 0.05 * Math.sin(time * 10 + i);
                    colors.array[i] = flicker;
                    colors.array[i + 1] = flicker;
                    colors.array[i + 2] = flicker;
                }
                colors.needsUpdate = true;
            });

            renderer.render(scene, camera);
            gl.endFrameEXP();
        };
        render();
    };

    return (
        <View style={StyleSheet.absoluteFill}>
            <GLView
                style={StyleSheet.absoluteFill}
                onContextCreate={onContextCreate}
            />
            {isLoading && (
                <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
                    <Text style={styles.loadingText}>Loading Earth...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
    },
});