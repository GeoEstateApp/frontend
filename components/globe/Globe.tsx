import React, { useRef, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Renderer, TextureLoader } from "expo-three";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import * as THREE from "three";

interface TouchPosition {
    x: number;
    y: number;
}

export default function Globe(): JSX.Element {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const earthRef = useRef<THREE.Mesh | null>(null);
    const cloudsRef = useRef<THREE.Mesh | null>(null);
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

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
        sunLight.position.set(5, 3, 5);
        scene.add(sunLight);

        // Atmosphere light
        const atmosphereLight = new THREE.PointLight(0x4444ff, 0.5, 100);
        atmosphereLight.position.set(-5, 0, 5);
        scene.add(atmosphereLight);

        try {
            // Textures
            const textureLoader = new TextureLoader();
            const [earthMap, earthBump, earthSpec, cloudsMap] = await Promise.all([
                textureLoader.loadAsync(require('./earth_atmos_2048.jpg')),
                textureLoader.loadAsync(require('./earth_normal_2048.jpg')),
                textureLoader.loadAsync(require('./earth_specular_2048.jpg')),
                textureLoader.loadAsync(require('./earth_clouds_1024.png')),
            ]);

            // Earth
            const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
            const earthMaterial = new THREE.MeshPhongMaterial({
                map: earthMap,
                bumpMap: earthBump,
                bumpScale: 0.05,
                specularMap: earthSpec,
                specular: new THREE.Color(0x333333),
                shininess: 25,
            });

            const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
            scene.add(earthMesh);
            earthRef.current = earthMesh;

            // Clouds
            const cloudsGeometry = new THREE.SphereGeometry(1.01, 64, 64);
            const cloudsMaterial = new THREE.MeshPhongMaterial({
                map: cloudsMap,
                transparent: true,
                opacity: 0.4,
            });

            const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
            scene.add(cloudsMesh);
            cloudsRef.current = cloudsMesh;

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
                // Position
                vertices[i] = THREE.MathUtils.randFloatSpread(2000) * depth;
                vertices[i + 1] = THREE.MathUtils.randFloatSpread(2000) * depth;
                vertices[i + 2] = THREE.MathUtils.randFloatSpread(2000) * depth;

                // Color variation for twinkling
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

        // Create multiple star layers
        const starLayers = [
            { count: 1000, size: 2, depth: 1 },    // Bright, close stars
            { count: 5000, size: 1.5, depth: 1.5 }, // Medium stars
            { count: 10000, size: 1, depth: 2 },    // Distant stars
        ];

        starLayers.forEach(layer => {
            const starField = createStarField(layer.count, layer.size, layer.depth);
            scene.add(starField);
            starFieldRef.current.push(starField);
        });

        // Touch handling
        const handleTouchStart = (event: TouchEvent): void => {
            isDragging = true;
            const touch = event.touches[0];
            previousTouch = { x: touch.clientX, y: touch.clientY };
        };

        const handleTouchMove = (event: TouchEvent): void => {
            if (!isDragging) return;

            // Rotate the globe based on touch movement
            const touch = event.touches[0];
            const deltaX = touch.clientX - previousTouch.x;
            const deltaY = touch.clientY - previousTouch.y;

            if (earthRef.current) {
                earthRef.current.rotation.y += deltaX * 0.005;
                earthRef.current.rotation.x += deltaY * 0.005;
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
                // Auto-rotate when not being dragged
                if (earthRef.current) {
                    earthRef.current.rotation.y += autoRotateSpeed;
                }
                if (cloudsRef.current) {
                    cloudsRef.current.rotation.y += autoRotateSpeed * 1.1;
                }
            }

            starFieldRef.current.forEach((starField, index) => {
                starField.rotation.y = time * (0.05 + index * 0.01);
                starField.rotation.x = time * 0.03;

                // Flicker effect
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