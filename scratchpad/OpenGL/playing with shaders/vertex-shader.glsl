#version 110

attribute vec2 position;

varying vec2 pos2;

void main()
{
    gl_Position = vec4(position, 0.0, 1.0);
	pos2 = position;
}