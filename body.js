import {animateCamera, CameraData, set_back_view} from "./main.js";

let current_level = 0
let camera_view_stack = []
let latest_camera_data;

var control_buttons = document.getElementsByClassName('control_button');
for (var i = 0; i < control_buttons.length; i++) {
    control_buttons[i].onclick = function (e) {
        set_back_view(e.target.id === "back")
        let camera_data = new CameraData(e.target.getAttribute('cameraData'))
        camera_view_stack = []
        change_level(1, camera_data)
    };
}

export function change_level(target_level, camera_data = null) {
    if (latest_camera_data == null) {
        latest_camera_data = camera_data
    }
    if (target_level === current_level && camera_data == null)
        return
    if (target_level > current_level) {
        camera_view_stack.push(camera_data)
    } else {
        let stack_camera = null
        for (let i = 0; i < current_level - target_level; i++) {
            stack_camera = camera_view_stack.pop()
        }
        if (camera_data == null) {
            camera_data = stack_camera
        }
    }

    animateCamera(latest_camera_data, camera_data, function () {
        latest_camera_data = camera_data
        current_level = target_level
    })

}
