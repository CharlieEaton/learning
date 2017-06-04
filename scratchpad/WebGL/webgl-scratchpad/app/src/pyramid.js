import {glMatrix, mat4} from 'gl-matrix';

import Util from './util';

export default class Pyramid {
	constructor(gl) {
		this.gl = gl,

		this.vao = this.gl.createVertexArray();
		this.gl.bindVertexArray(this.vao);

		this.initShaders();
		this.initBuffers();

		this.gl.bindVertexArray(null);
	}

	initShaders() {
		const shaderSrcFiles = [
			"color_v.glsl",
			"color_f.glsl",
		];
		const attributes = [
			"aVertexPosition",
			"aVertexColor",
		];
		const uniforms = [
			"modelViewMatrix",
			"perspectiveMatrix",
		];

		this.shaders = Util.initShaders(
			this.gl,
			shaderSrcFiles,
			attributes,
			uniforms
		);
	};

	initBuffers() {
		this.position = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.position);
		const vertices = [
			// front face
			 0.0,  1.0,  0.0,
			-1.0, -1.0,  1.0,
			 1.0, -1.0,  1.0,

			// right face
			0.0,  1.0,	0.0,
			1.0, -1.0,	1.0,
			1.0, -1.0, -1.0,

			// back face
			 0.0,  1.0,  0.0,
			 1.0, -1.0, -1.0,
			-1.0, -1.0, -1.0,

			// left face
			 0.0,  1.0,  0.0,
			-1.0, -1.0, -1.0,
			-1.0, -1.0,  1.0,
		];
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array(vertices),
			this.gl.STATIC_DRAW
		);
		this.position.itemSize = 3;
		this.position.numItems = 12;
		this.gl.vertexAttribPointer(
			this.shaders.aVertexPosition,
			this.position.itemSize,
			this.gl.FLOAT,
			false,
			0,
			0
		);

		this.color = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.color);
		const alpha = 1.0;	// note that alpha will have no effect as long as blending is off
		const colors = [
			// front face
			1.0, 0.0, 0.0, alpha,
			0.0, 1.0, 0.0, alpha,
			0.0, 0.0, 1.0, alpha,

			// right face
			1.0, 0.0, 0.0, alpha,
			0.0, 0.0, 1.0, alpha,
			0.0, 1.0, 0.0, alpha,

			// back face
			1.0, 0.0, 0.0, alpha,
			0.0, 1.0, 0.0, alpha,
			0.0, 0.0, 1.0, alpha,

			// left face
			1.0, 0.0, 0.0, alpha,
			0.0, 0.0, 1.0, alpha,
			0.0, 1.0, 0.0, alpha,
		];
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array(colors),
			this.gl.STATIC_DRAW
		);
		this.color.itemSize = 4;
		this.color.numItems = 12;
		this.gl.vertexAttribPointer(
			this.shaders.aVertexColor,
			this.color.itemSize,
			this.gl.FLOAT,
			false,
			0,
			0
		);
	}

	rotation(t) {
		return glMatrix.toRadian(t);
	}

	draw(perspectiveMatrix, t, sceneTranslation) {
		this.gl.useProgram(this.shaders);

		this.gl.disable(this.gl.BLEND);
		this.gl.enable(this.gl.DEPTH_TEST);

		this.gl.bindVertexArray(this.vao);

		let modelViewMatrix = mat4.identity(mat4.create());
		mat4.translate(
			modelViewMatrix,
			modelViewMatrix,
			[sceneTranslation.x, 0, sceneTranslation.z]
		);
		mat4.translate(modelViewMatrix, modelViewMatrix, [-1.5, 0.0, -5.0]);
		mat4.rotateY(
			modelViewMatrix,
			modelViewMatrix,
			this.rotation(t)
		);

		this.gl.uniformMatrix4fv(
			this.shaders.perspectiveMatrix,
			false,
			perspectiveMatrix
		);
		this.gl.uniformMatrix4fv(
			this.shaders.modelViewMatrix,
			false,
			modelViewMatrix
		);

		this.gl.drawArrays(this.gl.TRIANGLES, 0, this.position.numItems);

		this.gl.bindVertexArray(null);
	}
}
