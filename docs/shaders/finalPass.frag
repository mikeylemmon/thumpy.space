precision mediump float;

varying vec4 vPosModel;

uniform vec4 uMaterialColor;
uniform sampler2D backbuffer;
uniform vec2 size;

void main(void) {
	vec2 uv = vec2(gl_FragCoord.x / size.x, 1.0 - gl_FragCoord.y / size.y);
	vec4 bb = texture2D(backbuffer, uv);
	if (uMaterialColor.a < 0.1) {
		gl_FragColor = bb;
	} else {
		gl_FragColor = mix(uMaterialColor, bb, 0.5);
	}
	gl_FragColor.a = 1.0;
}
