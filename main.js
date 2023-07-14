import {
    ACESFilmicToneMapping,
    AmbientLight,
    Box3,
    DirectionalLight,
    PerspectiveCamera,
    PMREMGenerator,
    Scene,
    Vector3,
    WebGLRenderer
} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as TWEEN from '@tweenjs/tween.js';

import {change_level} from "./body.js";
import Stats from "three/addons/libs/stats.module.js";
import {InteractionManager} from "three.interactive";
import {degToRad} from "three/src/math/MathUtils.js";
import {SVGRenderer} from "three/addons/renderers/SVGRenderer.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import body_url from './body.glb'

export class CameraData {
    constructor(attribute_info) {
        let camera_info = attribute_info.split(" ")
        this.x = parseFloat(camera_info[0])
        this.y = parseFloat(camera_info[1])
        this.z = parseFloat(camera_info[2])
        this.lookat_x = parseFloat(camera_info[3])
        this.lookat_y = parseFloat(camera_info[4])
        this.lookat_z = parseFloat(camera_info[5])
    }

}

let container = document.querySelector('#body');

let width = container.offsetWidth;
let height = container.offsetHeight;


export const scene = new Scene();
export const camera = new PerspectiveCamera(
    25, width / height, 1, 10000
);
camera.useQuaternion = true;
let is_back_view = false
let is_animating = false;

export function set_back_view(is_back) {
    is_back_view = is_back
}

const renderer = new WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio); // TODO: Use player.setPixelRatio()
renderer.setClearColor(0x000000); // Set black background color
renderer.setSize(width, height);
renderer.shadowMap.enabled = true
const interactionManager = new InteractionManager(
    renderer,
    camera,
    renderer.domElement
);
container.appendChild(renderer.domElement);


var stats1 = new Stats();
stats1.showPanel(0); // Panel 0 = fps
stats1.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
document.body.appendChild(stats1.domElement);

var stats2 = new Stats();
stats2.showPanel(1); // Panel 1 = ms
stats2.domElement.style.cssText = 'position:absolute;top:50px;left:0px;';
document.body.appendChild(stats2.domElement);

var stats3 = new Stats();
stats3.showPanel(2); // Panel 3 = memory
stats3.domElement.style.cssText = 'position:absolute;top:100px;left:0px;';
document.body.appendChild(stats3.domElement);


const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.153.0/examples/jsm/libs/draco/');
loader.setDRACOLoader(dracoLoader);

function meshHandleHover(event) {
    if (is_animating) {
        return
    }
    if (event.type === 'mouseover') {
        let new_material = event.target.material.clone();
        new_material.color.set(0xff0000);
        event.target.material = new_material;
        document.body.style.cursor = 'pointer';
    } else if (event.type === 'mouseout') {
        let new_material = event.target.material.clone();
        new_material.color.set(0xffffff);
        event.target.material = new_material;
        document.body.style.cursor = 'default';
    } else if (event.type === 'click') {
        const boundingBox = new Box3().setFromObject(event.target);
        // Get the dimensions (width, height, depth)
        const width = boundingBox.max.x - boundingBox.min.x;
        const height = boundingBox.max.y - boundingBox.min.y;
        const depth = boundingBox.max.z - boundingBox.min.z;


        event.target.geometry.computeBoundingBox();
        let centroid = new Vector3();
        centroid.addVectors(event.target.geometry.boundingBox.min, event.target.geometry.boundingBox.max);
        centroid.multiplyScalar(0.6);
        centroid.applyMatrix4(event.target.matrixWorld);

        let distance = width * 6
        let y_position = centroid.y - 8
        if (width < 20) {
            distance = 80
            y_position -= 20
        } else if (width < 40) {
            distance = 150
        } else {
            distance /= 1.3
        }
        if (distance > 300) {
            distance /= 1.5
        }
        if (is_back_view) {
            distance *= -1
        }

        change_level(1, new CameraData(`0 ${y_position} ${distance} 0 ${y_position} ${depth}`))
    }
}

loader.load(body_url, function (gltf) {
    let areas = [...gltf.scenes[0].children[0].children]
    for (let i = 0; i < areas.length; i++) {
        //areas[i].rotateX(degToRad(-90))
        //areas[i].material = new MeshPhongMaterial({ flatShading: false });
        areas[i].geometry.deleteAttribute('normal')
        areas[i].geometry = BufferGeometryUtils.mergeVertices(areas[i].geometry, 1e-6)
        areas[i].geometry.computeVertexNormals()


        let names = {"Model_the_full_body_": true}
        if (names[areas[i].name]) {
            let new_material = areas[i].material.clone();
            new_material.polygonOffset = true;
            new_material.polygonOffsetUnits = 1;
            new_material.polygonOffsetFactor = 10;
            areas[i].material = new_material;
            scene.add(areas[i]);
        } else {
            areas[i].addEventListener('mouseover', meshHandleHover);
            areas[i].addEventListener('mouseout', meshHandleHover);
            areas[i].addEventListener('click', meshHandleHover);

            if (areas[i].name === "02_Face") {
                let new_material = areas[i].material.clone();
                new_material.polygonOffset = true;
                new_material.polygonOffsetUnits = 1;
                new_material.polygonOffsetFactor = 3;
                areas[i].material = new_material;
                scene.add(areas[i]);
                interactionManager.add(areas[i]);
            } else {
                scene.add(areas[i]);
                interactionManager.add(areas[i]);
            }
        }
    }

    camera.updateProjectionMatrix()
    renderer.toneMapping = Number(ACESFilmicToneMapping);
    //renderer.toneMapping = Number(LinearToneMapping);
    renderer.toneMappingExposure = Math.pow(2, -0.5);
    renderer.useLegacyLights = false;

    scene.add(new AmbientLight(0x666666, 0.5));

    const dirLight1 = new DirectionalLight(0xffddcc, 1);
    dirLight1.position.set(0.5, 0, 0.86);
    scene.add(dirLight1);

    const dirLight2 = new DirectionalLight(0xffddcc, 1.5);
    dirLight2.position.set(-0.5, 0, -0.86);
    scene.add(dirLight2);

    const pmremGenerator = new PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture
    pmremGenerator.dispose();

    change_level(1, new CameraData("0 110 450 0 90 0"))
}, function (xhr) {
    // inside the onProgress callback (Optional)
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
}, function (error) {
    console.error(error);
});

function animate(callback) {
    function loop(time) {
        callback(time);
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}

animate((time) => {
    renderer.render(scene, camera);
    stats1.update()
    stats2.update()
    stats3.update()
    TWEEN.update(time);
    interactionManager.update();
});

function export_scene_as_svg() {
    var rendererSVG = new SVGRenderer();
    rendererSVG.setSize(window.innerWidth, window.innerHeight);
    rendererSVG.render(scene, camera);
    var XMLS = new XMLSerializer();
    var svgfile = XMLS.serializeToString(rendererSVG.domElement);
    var svgData = svgfile;
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, svgData], {
        type: "image/svg+xml;charset=utf-8"
    });
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");

    downloadLink.href = svgUrl;
    downloadLink.download = "test.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

export function animateCamera(source_camera, destination_camera, callback, duration = 1000) {
    is_animating = true
    let to_data = {
        x: source_camera.x,
        y: source_camera.y,
        z: source_camera.z,
        l_x: source_camera.lookat_x,
        l_y: source_camera.lookat_y,
        l_z: source_camera.lookat_z,
    };

    new TWEEN.Tween(to_data)
        .duration(duration)
        .to({
            x: destination_camera.x,
            y: destination_camera.y,
            z: destination_camera.z,
            l_x: destination_camera.lookat_x,
            l_y: destination_camera.lookat_y,
            l_z: destination_camera.lookat_z,
        })
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
            camera.position.set(to_data.x, to_data.y, to_data.z)
            camera.lookAt(to_data.l_x, to_data.l_y, to_data.l_z)
        })
        .onComplete(() => {
            //export_scene_as_svg()
            callback()
            is_animating = false
        })
        .start();
}