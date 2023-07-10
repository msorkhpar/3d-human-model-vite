"use client";
import {Canvas} from "@react-three/fiber";
import {OrbitControls} from "@react-three/drei";
import {Model} from "@/components/Body";


export default function Home() {

  return (
      <main className="h-screen">
        <Canvas>
            <OrbitControls />
            <ambientLight color={0x666666} intensity={0.5} />
            <directionalLight color={0xffddcc} intensity={1} position={[0.5, 0, 0.86]} />
            <directionalLight color={0xffddcc} intensity={1.5} position={[-0.5, 0, -0.86]} />
            <Model scale={0.02} rotation={[-Math.PI / 2, 0, 0]}/>
        </Canvas>
      </main>
  )
}
