import Camera from "./camera.js"
import { hitDispatch } from "./objects.js";
import { lambertianDiffuse } from "./materials.js";

onmessage = (e) => {
    let params = e.data
    let imgData = render(params.width, params.height, params.samples_per_pixel, params.camera, params.objs)
    postMessage(imgData);
};

function render(width, height, samples_per_pixel, camera, objs){
    let imageData = []
    for(let y=0; y<height; y++){
        for(let x=0; x<width; x++){
            const index = x*4 + y*4*width
            
            let final_color = [0,0,0,0]
            
            for(let sample=0; sample < samples_per_pixel; sample++){
                let color = [0,0,0,0]
                let dx = Math.random()
                let dy = Math.random()
                let ray = Camera.getRay(camera, (x+dx)/width, (y+dy)/height)
                
                color = trace(ray, objs)
                
                final_color[0] += color[0]/samples_per_pixel
                final_color[1] += color[1]/samples_per_pixel
                final_color[2] += color[2]/samples_per_pixel
                final_color[3] += color[3]/samples_per_pixel
            }
            
            imageData[index]   = final_color[0]
            imageData[index+1] = final_color[1]
            imageData[index+2] = final_color[2]
            imageData[index+3] = final_color[3]
        }
        /*document.getElementById("loading").innerHTML = "Processing : "+(y+1)+"/"+imageData.height
        document.getElementById("loading").style.display = "none"
        document.getElementById("loading").style.display = "inline-block"*/
        console.log("Processing : "+(y+1)+"/"+height)
    }
    return imageData
}

function trace(ray, objs, max_iterations=3){
    const sky_color = [200, 200, 255, 255]
    let color = [255, 255, 255, 255]
    let multiplier = [0.5, 0.1, 0.1, 1]
    
    for(let i=0; i<max_iterations; i++){
        let obj_found = undefined
        let t = Infinity
        
        objs.forEach(obj => {
            let t_tmp = hitDispatch(obj, ray)
            if(t_tmp < t){
                t = t_tmp
                obj_found = obj
            }
        })
        
        if(t !== Infinity){
            lambertianDiffuse(ray, t, obj_found)
            
            color[0] *= multiplier[0]
            color[1] *= multiplier[1]
            color[2] *= multiplier[2]
            color[3] *= multiplier[3]
        }else{
            color[0] *= sky_color[0]/255
            color[1] *= sky_color[1]/255
            color[2] *= sky_color[2]/255
            color[3] *= sky_color[3]/255
            break
        }
    }
    return gamma_correct(color)
}

function gamma_correct(color){
    return [
        Math.sqrt(color[0]/255)*255,
        Math.sqrt(color[1]/255)*255,
        Math.sqrt(color[2]/255)*255,
        color[3]
    ]
}
