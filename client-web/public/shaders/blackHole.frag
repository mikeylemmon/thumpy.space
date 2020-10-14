precision mediump float;

varying vec4 vPosModel;

uniform vec4 uMaterialColor;
uniform sampler2D backbuffer;
uniform vec2 size;
uniform vec2 origin;
uniform float scale;

void main(void) {
	vec2 uv = vec2(gl_FragCoord.x / size.x, 1.0 - gl_FragCoord.y / size.y);
	uv = (uv - origin) * (scale + 1.0) + origin;
	vec4 bb = texture2D(backbuffer, uv);
	gl_FragColor = vec4(bb.xyz, 0.7);
}
