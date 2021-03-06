"use strict";

import {glMatrix, mat4} from 'gl-matrix';

import Settings from './constants';
import Util from './util';
import Pyramid from './pyramid';
import Cube from './cube';
import Starburst from './starburst';
import Flame from './flame';
import FixedText from './fixed-text';
import Ground from './ground';

function main() {
	const canvas = document.getElementById(Settings.WEBGL_CANVAS_ID);
	if(canvas === null) {
		console.error(
			`Couldn't find drawing canvas for WebGL scene, check that a ` +
			`canvas element with id "${Settings.WEBGL_CANVAS_ID}" exists.`
		);
		return;
	}
	Util.resizeCanvas(canvas);
	const gl = Util.initGL(canvas);
	console.log(`Acquired WebGL context.`);
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

	const pyramid = Settings.ENABLE_PYRAMID ? new Pyramid(gl) : null;
	const cube = Settings.ENABLE_CUBE ? new Cube(gl) : null;
	const starburst = Settings.ENABLE_STARBURST ? new Starburst(gl, Settings.NUM_STARBURST_SPRITES) : null;
	const redFlame = Settings.ENABLE_RED_FLAME ?
		new Flame(gl, [0.0, 0.0, -1.0], [0.8, 0.25, 0.25, 1.0], Settings.NUM_FLAME_SPRITES) :
		null;
	const purpleFlame = Settings.ENABLE_PURPLE_FLAME ?
		new Flame(gl, [0.5, 0.0, -1.0], [0.25, 0.25, 8.25, 1.0], Settings.NUM_FLAME_SPRITES) :
		null;
	const hudText = Settings.ENABLE_TEXT ? new FixedText(gl) : null;
	const ground = Settings.ENABLE_GROUND ? new Ground(gl, Settings.GROUND_Z_POSITION) : null;

	let sceneTranslation = Settings.INITIAL_SCENE_TRANSLATION;
	let perspectiveMatrix = Util.perspectiveMatrix(
		canvas.clientWidth/canvas.clientHeight,
		Settings.FOVY,
	);

	gl.clearColor(0.1, 0.2, 0.3, 1.0);

	document.addEventListener("keydown", (event) => {
		const key = event.keyCode;

		// TODO: try to get smoother scrolling using the keydown method from
		// lesson 6
		switch(key) {
			case 27: // escape key
				sceneTranslation = Settings.INITIAL_SCENE_TRANSLATION;
				break;
			case 65: // a
				sceneTranslation.x += Settings.SCENE_TRANSLATION_STEP;
				break;
			case 68: // d
				sceneTranslation.x -= Settings.SCENE_TRANSLATION_STEP;
				break;
			case 83: // s
				sceneTranslation.z -= Settings.SCENE_TRANSLATION_STEP;
				break;
			case 87: // w
				sceneTranslation.z += Settings.SCENE_TRANSLATION_STEP;
				break;
		};
	});

	let isDragging = false;
	let lastMouseX = null;
	let lastMouseY = null;
	let xRotation = null;
	let yRotation = null;
	canvas.addEventListener("mousedown", (event) => {
		isDragging = true;
		lastMouseX = event.pageX;
		lastMouseY = event.pageY;
	});
	canvas.addEventListener("mousemove", (event) => {
		if(isDragging) {
			sceneTranslation.x += (event.pageX - lastMouseX) / 50.0;
			sceneTranslation.y -= (event.pageY - lastMouseY) / 50.0;

			lastMouseX = event.pageX;
			lastMouseY = event.pageY;
		}
	});
	canvas.addEventListener("mouseup", (event) => {
		isDragging = false;
	});

	let t = 0;
	let t_last_report = 0;
	let last_report_timestamp_ms = performance.now();
	(function drawScene(timestamp_ms) {
		window.requestAnimationFrame(drawScene);

		if(Util.resizeCanvas(canvas)) {
			perspectiveMatrix = Util.perspectiveMatrix(
				canvas.clientWidth/canvas.clientHeight,
				Settings.FOVY,
			);
		}

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		if(Settings.ENABLE_STARBURST) {
			starburst.draw(
				perspectiveMatrix,
				t,
				sceneTranslation
			);
		}

		if(Settings.ENABLE_GROUND) {
			ground.draw(
				perspectiveMatrix,
				t,
				sceneTranslation,
			);
		}

		if(Settings.ENABLE_RED_FLAME) {
			redFlame.draw(
				perspectiveMatrix,
				t,
				sceneTranslation
			);
		}
		if(Settings.ENABLE_PURPLE_FLAME) {
			purpleFlame.draw(
				perspectiveMatrix,
				t,
				sceneTranslation
			);
		}

		if(Settings.ENABLE_PYRAMID) {
			pyramid.draw(
				perspectiveMatrix,
				t,
				sceneTranslation
			);
		}

		if(Settings.ENABLE_CUBE) {
			cube.draw(
				perspectiveMatrix,
				t,
				sceneTranslation
			);
		}

		if(Settings.ENABLE_TEXT) {
			const screenWidth = gl.drawingBufferWidth;
			const screenHeight = gl.drawingBufferHeight;
			const position = [0.1 * screenWidth, 0.5 * screenHeight];
			const text = "test text";
			const fontSize = 100;
			const color = [0, 0, 0, 1.0];
			const bgColor = [1.0, 1.0, 1.0, 1.0];
			hudText.draw(position, text, fontSize, color, bgColor);
		}

		if(Settings.FRAMES_PER_FPS_REPORT > 0 && (t - t_last_report) == Settings.FRAMES_PER_FPS_REPORT) {
			const elapsed_ms = timestamp_ms - last_report_timestamp_ms;
			const avg_render_time_ms = elapsed_ms/Settings.FRAMES_PER_FPS_REPORT;
			const fps = 1000.0/avg_render_time_ms;
			console.log(`last ${Settings.FRAMES_PER_FPS_REPORT} frames: avg render time: ${avg_render_time_ms.toFixed(0)} ms, ${fps.toFixed(0)} fps`);
			t_last_report = t;
			last_report_timestamp_ms = timestamp_ms;
		}

		t++;
	})();
}

document.addEventListener('DOMContentLoaded', main);
