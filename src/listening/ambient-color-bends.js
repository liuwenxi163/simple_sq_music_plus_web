import fragment from '../vendor/react-bits/color-bends/fragment.glsl?raw'
import vertex from '../vendor/react-bits/color-bends/vertex.glsl?raw'

/*! React Bits Color Bends, Copyright (c) 2026 David Haz. MIT + Commons Clause. See /licenses/react-bits.txt. */
export function mountColorBends(canvas, { active = true } = {}) {
  let gl, program, buffer, frame = 0, disposed = false, failed = false
  let running = active, last = 0, elapsed = 8, previousDraw = 0
  const shaders = [], motion = matchMedia('(prefers-reduced-motion: reduce)')
  const uniforms = {}, pointer = [0, 0], target = [0, 0]
  const colors = new Float32Array(24)
  colors.set(['#648bd9', '#a09bdc', '#56b8c5'].flatMap(hex =>
    [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)))
  function release() {
    cancelAnimationFrame(frame); frame = 0
    if (gl && !gl.isContextLost()) {
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
      shaders.forEach(shader => gl.deleteShader(shader))
    }
    shaders.length = 0; program = null; buffer = null
  }
  function fallback() { failed = true; release(); canvas.dataset.renderer = 'fallback' }
  function draw() {
    if (failed || disposed || document.hidden || !program) return
    gl.useProgram(program)
    gl.uniform2f(uniforms.uCanvas, canvas.width, canvas.height)
    gl.uniform1f(uniforms.uTime, elapsed)
    gl.uniform2f(uniforms.uPointer, pointer[0], pointer[1])
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    canvas.dataset.renderer = 'webgl'
  }
  function resize() {
    if (!gl || failed || disposed) return
    const rect = canvas.getBoundingClientRect(), mobile = rect.width < 760
    const scale = Math.min(devicePixelRatio || 1, mobile ? .75 : 1,
      Math.sqrt((mobile ? 480000 : 1100000) / Math.max(1, rect.width * rect.height)))
    canvas.width = Math.max(1, Math.round(rect.width * scale))
    canvas.height = Math.max(1, Math.round(rect.height * scale))
    gl.viewport(0, 0, canvas.width, canvas.height); draw()
  }
  function tick(now) {
    frame = 0
    if (failed || disposed || !running || document.hidden || motion.matches) return
    if (!previousDraw || now - previousDraw >= 1000 / 24) {
      const dt = last ? Math.min((now - last) / 1000, .12) : 0
      last = now; previousDraw = now; elapsed += dt
      pointer[0] += (target[0] - pointer[0]) * Math.min(1, dt * 3)
      pointer[1] += (target[1] - pointer[1]) * Math.min(1, dt * 3)
      draw()
    }
    frame = requestAnimationFrame(tick)
  }
  function resume() {
    cancelAnimationFrame(frame); frame = 0; last = 0; previousDraw = 0
    canvas.dataset.motion = motion.matches ? 'reduced' : running && !document.hidden ? 'playing' : 'paused'
    if (disposed || failed || document.hidden || !running) return
    draw(); if (!motion.matches) frame = requestAnimationFrame(tick)
  }
  function move(event) {
    if (!running || motion.matches || event.pointerType === 'touch') return
    target[0] = event.clientX / innerWidth * 2 - 1
    target[1] = 1 - event.clientY / innerHeight * 2
  }
  function initialize() {
    gl = canvas.getContext('webgl', { alpha:false, antialias:false, depth:false,
      stencil:false, powerPreference:'low-power', preserveDrawingBuffer:false })
    if (!gl) { fallback(); return }
    const compile = (type, source) => {
      const shader = gl.createShader(type); shaders.push(shader)
      gl.shaderSource(shader, source); gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Ambient shader unavailable')
      return shader
    }
    program = gl.createProgram()
    gl.attachShader(program, compile(gl.VERTEX_SHADER, 'attribute vec3 position;\nattribute vec2 uv;\n' + vertex))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n' + fragment))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Ambient program unavailable')
    gl.useProgram(program)
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,0,0,0, 1,-1,0,1,0, -1,1,0,0,1, 1,1,0,1,1]), gl.STATIC_DRAW)
    for (const [name, size, offset] of [['position',3,0], ['uv',2,12]]) {
      const location = gl.getAttribLocation(program,name)
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location,size,gl.FLOAT,false,20,offset)
    }
    for (const name of ['uCanvas','uTime','uSpeed','uRot','uColorCount','uTransparent','uScale','uFrequency','uWarpStrength','uPointer','uMouseInfluence','uParallax','uNoise','uIterations','uIntensity','uBandWidth']) uniforms[name] = gl.getUniformLocation(program,name)
    gl.uniform3fv(gl.getUniformLocation(program,'uColors[0]'),colors)
    gl.uniform1i(uniforms.uColorCount,3); gl.uniform1i(uniforms.uTransparent,0); gl.uniform1i(uniforms.uIterations,1)
    for (const [key,value] of Object.entries({uSpeed:.075,uScale:1.15,uFrequency:1,uWarpStrength:1,uMouseInfluence:.18,uParallax:.12,uNoise:.025,uIntensity:1.1,uBandWidth:3.2})) gl.uniform1f(uniforms[key],value)
    const rotation = 35 * Math.PI / 180
    gl.uniform2f(uniforms.uRot,Math.cos(rotation),Math.sin(rotation))
    failed = false; resize(); resume()
  }
  function lost(event) { event.preventDefault(); fallback() }
  function restored() { if (!disposed) { try { initialize() } catch { fallback() } } }
  canvas.addEventListener('webglcontextlost',lost); canvas.addEventListener('webglcontextrestored',restored)
  document.addEventListener('visibilitychange',resume); motion.addEventListener('change',resume)
  window.addEventListener('resize',resize,{passive:true}); window.addEventListener('pointermove',move,{passive:true})
  try { initialize() } catch { fallback() }
  return {
    setActive(value) { running = !!value; resume() },
    dispose() {
      disposed = true; release()
      canvas.removeEventListener('webglcontextlost',lost); canvas.removeEventListener('webglcontextrestored',restored)
      document.removeEventListener('visibilitychange',resume); motion.removeEventListener('change',resume)
      window.removeEventListener('resize',resize); window.removeEventListener('pointermove',move)
    }
  }
}
