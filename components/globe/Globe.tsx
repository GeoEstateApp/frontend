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

        try {
            // Load textures
            const textureLoader = new TextureLoader();
            const [earthMap, earthBump, earthSpec, cloudsMap] = await Promise.all([
                textureLoader.loadAsync(
                    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg"
                ),
                textureLoader.loadAsync(
                    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg"
                ),
                textureLoader.loadAsync(
                    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg"
                ),
                textureLoader.loadAsync(
                    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png"
                ),
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

        // Stars background
        const starsGeometry = new THREE.BufferGeometry();
        const starsVertices: number[] = [];
        for (let i = 0; i < 10000; i++) {
            const x = THREE.MathUtils.randFloatSpread(2000);
            const y = THREE.MathUtils.randFloatSpread(2000);
            const z = THREE.MathUtils.randFloatSpread(2000);
            starsVertices.push(x, y, z);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(starField);

        // Touch handling (if not in background)
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

        // Add touch event listeners with proper typing
        if (gl.canvas) {
            gl.canvas.addEventListener('touchstart', handleTouchStart as unknown as EventListener);
            gl.canvas.addEventListener('touchmove', handleTouchMove as unknown as EventListener);
            gl.canvas.addEventListener('touchend', handleTouchEnd as unknown as EventListener);
        }

        // Render animation loop
        const render = (): void => {
            requestAnimationFrame(render);

            if (!isDragging) {
                // Auto-rotate when not being dragged
                if (earthRef.current) {
                    earthRef.current.rotation.y += autoRotateSpeed;
                }
                if (cloudsRef.current) {
                    cloudsRef.current.rotation.y += autoRotateSpeed * 1.1;
                }
            }

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