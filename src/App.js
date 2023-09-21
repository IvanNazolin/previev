import Swal from 'sweetalert2'

import { Stars, Sky, OrbitControls, Billboard, Text, Html, Plane, Sphere, softShadows } from "@react-three/drei"
import React, { useRef, Suspense, useEffect, useMemo, useState } from "react"
import { Canvas, extend, useThree, useFrame, useLoader } from "@react-three/fiber"
import { GLTFLoader } from "three-stdlib";
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from "three";
import { Physics, useBox, usePlane, useSphere } from "use-cannon"
import { MeshStandardMaterial, SphereBufferGeometry } from "three";
import { useGLTF, PerspectiveCamera } from '@react-three/drei'
import { useSpring } from "react-spring";
//extend({ OrbitControls })
softShadows()



const HINT_PHRASE = "Удачи на соревнованиях"
//14 words
const birthdayText = "known. ever have I which girl best the and awesome most the are you Nika,"


const word_list = birthdayText.split(" ").reverse()

function Heart(props) {
  const { gl, camera } = useThree()
  
  //camera.position.x = 4000

  const { x } = useSpring({
    from: { x: 8000 },
    to: { x: 10 },
    config: {
      mass: 1.5,
      tension: 200,
      friction: 140
    },
    delay: 3000,
    onRest: () => props.setAnimationFinished(true)
  });

  const group = useRef()
  const heart = useRef()
  const { nodes, materials } = useLoader(GLTFLoader, "models/heart.glb");
  console.log(nodes)

  useEffect(()=>{
    heart.current.scale.x = 0.1
    heart.current.scale.y = 0.1
    heart.current.scale.z = 0.1

    group.current.rotation.y = 0
    group.current.rotation.z = 0
    group.current.rotation.x = -Math.PI/2
  })

  useFrame(({clock}) => {
    const scale = 1 + Math.sin(clock.elapsedTime*1.5) * 0.05
    //console.log(scale)
    heart.current.rotation.z += 0.005
    heart.current.scale.y = scale
    heart.current.scale.x = scale
    heart.current.scale.z = scale

    if(!props.animationFinished){
      camera.position.x = x.get()
    }
    
  })

  return (
    <group ref={group} {...props} dispose={null} scale={0.1}>
      <mesh visible geometry={nodes.Heart.geometry} ref={heart} scale={0.1}> 
        <meshStandardMaterial
          attach="material"
          color="red"
          roughness={0.3}
          metalness={0.3}
        />
      </mesh>
      <LoveText rotation={[-Math.PI/2, group.current ? group.current.rotation.z : 0, -Math.PI]} position={[0, 0, 25]} fontSize={7}>Good luck, Nika! And have a good summer!</LoveText>
    </group>
  )
}

function LoveText({ rotation, children, fontSize, maxWidth, lineHeight, textAlign, position }) {
  const textref = useRef()

  const { camera } = useThree();
  console.log(camera.rotation.y)
  React.useEffect(() => {
    textref.current.rotation.x = rotation[0]
    textref.current.rotation.y = rotation[1]
    textref.current.rotation.z = rotation[2]

    textref.current.position.x = position[0]
    textref.current.position.y = position[1]
    textref.current.position.z = position[2]
  })

  useFrame(({camera}) => {
    textref.current.rotation.y = -(camera.rotation.z+Math.PI)
    //console.log(camera.rotation.z)
  });
  return (
    <Text ref={textref} fontSize={fontSize && fontSize} maxWidth={maxWidth && maxWidth} lineHeight={lineHeight ? lineHeight : 1} textAlign={textAlign ? textAlign : "left"} font='/font.woff'>
      {children}
      <meshBasicMaterial
        attach="material"
        side={THREE.DoubleSide}
        color="red"
      />
    </Text>
  )
}

function MyLight(){
  const lightRef = useRef()

  
  return(
    <pointLight position={[10, 15, 10]} angle={0.3} intensity={0.5}
        castShadow
        shadowMapWidth={1024}
        shadowMapHeight={1024}
        ref={lightRef}
        
        />
  )
}

function Word({ children, ...props }) {
  const color = new THREE.Color()
  const fontProps = { font: '/font.woff', fontSize: 3.5, letterSpacing: -0.05, lineHeight: 1, 'material-toneMapped': false }
  const ref = useRef()
  const [hovered, setHovered] = useState(false)
  const over = (e) => (e.stopPropagation(), setHovered(true))
  const out = () => setHovered(false)
  // Change the mouse cursor on hover
  useEffect(() => {
    if (hovered) document.body.style.cursor = 'pointer'
    return () => (document.body.style.cursor = 'auto')
  }, [hovered])
  // Tie component to the render-loop
  useFrame(({ camera }) => {
    // Make text face the camera
    ref.current.quaternion.copy(camera.quaternion)
    // Animate font color
    ref.current.material.color.lerp(color.set(hovered ? '#fa2720' : '#0294f5'), 0.1)
  })

  function handleClick(){
    if(children=="Happy" && props.index===97){
      Swal.fire("Ураааа!", `${HINT_PHRASE}`, "success")
    }
  }

  return <Text ref={ref} onPointerOver={over} onPointerOut={out} onPointerDown={handleClick} {...props} {...fontProps} children={children}/>
}

function Cloud({ count = 10, radius = 20 }) {
  // Create a count x count random words with spherical distribution
  const words = useMemo(() => {
    const temp = []
    const spherical = new THREE.Spherical()
    const phiSpan = Math.PI / (count + 1)
    const thetaSpan = (Math.PI * 2) / count
    for (let i = 1; i < count + 1; i++)
      // Taken from https://discourse.threejs.org/t/can-i-place-obects-on-a-sphere-surface-evenly/4773/6
      for (let j = 0; j < count; j++) temp.push([new THREE.Vector3().setFromSpherical(spherical.set(radius, phiSpan * i, thetaSpan * j)), word_list[j]])
    return temp
  }, [count, radius])
  return words.map(([pos, word], index) => <Word key={index} position={pos} children={word} index={index}/>)
}

function App() {
  const canvasRef = useRef()
  const radius = 3600
  const [animationFinished, setAnimationFinished] = useState(false)


  return (
    <Canvas ref={canvasRef} camera={{ fov: 75, near: 0.1, far: 8000, position: [9, 0, 5] }} style={{ height: "100vh" }}
      shadows
      
      onCreated={({ gl, scene }) => {

        scene.background = new THREE.Color('#000000')
      }}>

      <Stars />


        <MyLight/>
        <ambientLight intensity={0.3}/>
      
      

      <OrbitControls enabled={animationFinished} maxPolarAngle={Math.PI/2} minPolarAngle={Math.PI/2} enablePan={false}/>

      <Suspense fallback={null}><Heart setAnimationFinished={setAnimationFinished} animationFinished={animationFinished}/></Suspense>
      
      <Cloud count={15} radius={40} /> 

    </Canvas>
  );
}

export default App;
