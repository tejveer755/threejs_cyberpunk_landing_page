import './style.css'
import * as THREE from 'three'
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js'
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js'
import gsap from 'gsap'

//scene
const scene = new THREE.Scene()

//camera
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.z = 3

const canvas = document.querySelector('#draw')

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.outputEncoding = THREE.sRGBEncoding

// Load HDRI environment map
const rgbeLoader = new RGBELoader()
rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/klippad_sunrise_1_2k.hdr', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping
  // scene.background = texture
  scene.environment = texture
})

// Load GLTF model
const loader = new GLTFLoader()
let model

loader.load(
  './DamagedHelmet.gltf',
  (gltf) => {
    model = gltf.scene
    scene.add(model)

    // Adjust model position if needed
    model.position.set(0, 0, 0)

    // Adjust camera position to view the model
    camera.position.set(0, 0, 6)
  },
  (progress) => {
    console.log(`Loading model... ${(progress.loaded / progress.total * 100)}%`)
  },
  (error) => {
    console.error('An error occurred while loading the model:', error)
  }
)

// Post-processing setup
const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

// RGB Shift effect
const rgbShiftPass = new ShaderPass(RGBShiftShader)
rgbShiftPass.uniforms['amount'].value = 0.0020
composer.addPass(rgbShiftPass)



// Animate RGB shift randomly
function animateRGBShift() {
  gsap.to(rgbShiftPass.uniforms['amount'], {
    value: Math.random() * 0.01,
    duration: 0.2,
    ease: "power1.inOut",
    onComplete: () => {
      gsap.to(rgbShiftPass.uniforms['amount'], {
        value: 0.0025,
        duration: 0.1,
        ease: "power1.inOut"
      })
    }
  })
  
  // Trigger glitch effect randomly
  if (Math.random() > 0.95) {
    glitchPass.goWild = true
    setTimeout(() => {
      glitchPass.goWild = false
    }, 200)
  }
  
  setTimeout(animateRGBShift, Math.random() * 2000 + 1000)
}

animateRGBShift()

window.addEventListener('mousemove', (e) => {
  if (model) {
    let rotationX = (e.clientX / window.innerWidth) - 0.5
    let rotationY = (e.clientY / window.innerHeight) - 0.5
    gsap.to(model.rotation, {
      x: rotationY,
      y: rotationX,
      duration: 0.5,
      ease: "power2.out"
    })
  }
})

function animate() {
  window.requestAnimationFrame(animate)

  // Render the scene with post-processing
  composer.render()
}

animate()

// Handle window resizing
window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}
