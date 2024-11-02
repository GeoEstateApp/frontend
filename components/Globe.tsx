import React from "react";
import { View, StyleSheet } from "react-native";
import { Renderer, TextureLoader } from "expo-three";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import * as THREE from "three";

export default function Globe() {
    const rotateSpeed = 0.001;

    const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 3;

        const renderer = new Renderer({ gl });
        renderer.setSize(width, height);

        const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
        const earthMaterial = new THREE.MeshBasicMaterial({
            map: await new TextureLoader().loadAsync("https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg"),
        });

        const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earthMesh);

        const render = () => {
            requestAnimationFrame(render);
            earthMesh.rotation.y += rotateSpeed; // Rotate the globe
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
        </View>
    );
}