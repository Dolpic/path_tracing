import { Sphere } from "./objects/Shape.js"
import Objects from "./objects/Object.js"
import Diffuse from "./materials/diffuse.js"
import Conductor from "./materials/conductor.js"
import Dielectric from "./materials/dielectric.js"
import { Vec3, Color, Complex } from "./primitives.js"
import Matrix from "./primitives/Matrix.js"
import {PointLight, EnvironmentalLight} from "./Lights.js"

export default class Scenes{

    static async loadScene(scene, camera=null){
        if(scene.objects != undefined){
            if(scene.shapes == undefined){
                scene.shapes = []
            }
            const objs = await Objects.loadObjects(scene.objects)
            scene.shapes = [...scene.shapes, ...objs.flat()]
        }
        if(camera != null){
            scene.camera = camera
        }
        return scene
    }

    static SimpleSphere(){
        return {
            materials:[
                new Diffuse(Color.new(0.8, 0.4, 0.3)),
                new Dielectric(Color.new(1,1,1), 1, 1.5)
            ],
            shapes:[
                new Sphere( Vec3.new(0, -80.98, -4), 80,  0),
                new Sphere( Vec3.new(0, 0,      -4), 0.5, 0)
            ],
            lights: [
                new PointLight(Vec3.new(0, 4, -4), Color.new(0,1,0), 300)
            ],
            camera: {
                position: Vec3.new(0,0,0),
                rotation: Vec3.new(0,0,0),
                fieldOfView: 45,
                lens:{
                    radius: 0,
                    focalDistance: 0,
                }
            }
        }
    }

    static Teapot(){
        return {
            materials:[
                new Diffuse(Color.new(0.8, 0.4, 0.3)),
                new Dielectric(Color.new(0.95, 0.95, 0.95), 1, 1.5),
                new Dielectric(Color.new(1, 1, 1), 1, 1.5),
                new Conductor(Color.new(0.9, 0.6, 0.1), Complex.fromReal(1), Complex.new(0.2, 3), 0.2, 0.1)
            ],
            objects:[
                {
                    file: "teapot/teapot_smooth_corrected",
                    material: 1,
                    transformMatrix: (new Matrix()).transform([0, -1, -4], [0,0,0], [3, 3, 3])
                }
            ],
            shapes:[
                new Sphere( Vec3.new(0,   -80.98, -4), 80,    0),
                new Sphere( Vec3.new(1.2, 1.2, -5), 0.5,      2),
                new Sphere( Vec3.new(-1.2,  1.2, -5), 0.5,    2),

                
                new Sphere( Vec3.new(-0.6, 1.5, -5), 0.1,     0),
                new Sphere( Vec3.new(-0.4, 1.5, -5), 0.1,     0),
                new Sphere( Vec3.new(-0.2, 1.5, -5), 0.1,     0),
                new Sphere( Vec3.new(0.0, 1.5, -5), 0.1,      0),
                new Sphere( Vec3.new(0.2, 1.5, -5), 0.1,      0),
                new Sphere( Vec3.new(0.4, 1.5, -5), 0.1,      0),
                new Sphere( Vec3.new(0.6, 1.5, -5), 0.1,      0),

                new Sphere( Vec3.new(-0.3, -0.88, -2.7), 0.1, 1),
                new Sphere( Vec3.new(0.3, -0.88, -2.7), 0.1,  1),

                new Sphere( Vec3.new(-0.3, -0.68, -2.7), 0.1, 3),
                new Sphere( Vec3.new(0.3, -0.68, -2.7), 0.1,  3),

                new Sphere( Vec3.new(-0.3, -0.48, -2.7), 0.1, 1),
                new Sphere( Vec3.new(0.3, -0.48, -2.7), 0.1,  1),

                new Sphere( Vec3.new(-0.3, -0.28, -2.7), 0.1, 3),
                new Sphere( Vec3.new(0.3, -0.28, -2.7), 0.1,  3),


                new Sphere( Vec3.new(-0.7, -0.86, -3), 0.15,  1),
                new Sphere( Vec3.new(0.7, -0.86, -3), 0.15,   1),

                new Sphere( Vec3.new(-0.7, -0.56, -3), 0.15,  1),
                new Sphere( Vec3.new(0.7, -0.56, -3), 0.15,   1),
            ],
            lights: [
                new EnvironmentalLight(Color.new(0.7, 0.7, 1), 0.6),
                new PointLight(Vec3.new(5, 5, -5), Color.new(1,1,1), 400)
            ],
            camera: {
                position: Vec3.new(0,0,0),
                rotation: Vec3.new(0,0,0),
                fieldOfView: 45,
                lens:{
                    radius: 0,
                    focalDistance: 0,
                }
            }
        }
    }

    static Dragons(){
        return {
            materials:[
                new Diffuse(Color.new(0.8, 0.4, 0.3)),
                new Dielectric(Color.new(0.96, 0.96, 0.96), 1, 1.5, 0.005, 0.005),
                new Conductor(Color.new(0.9, 0.6, 0.1), Complex.fromReal(1), Complex.new(0.2, 3), 0.2, 0.2)
            ],
            objects:[
                {
                    file: "dragon/dragon_very_simple",
                    material: 0,
                    transformMatrix: (new Matrix()).transform([-1.2, -1, -5.2], [0,-130,0], [1.5, 1.5, 1.5])
                },
                {
                    file: "dragon/dragon_very_simple",
                    material: 1,
                    transformMatrix: (new Matrix()).transform([0.2, -1, -4.7], [0,-130,0], [1.5, 1.5, 1.5])
                },
                {
                    file: "dragon/dragon_very_simple",
                    material: 2,
                    transformMatrix: (new Matrix()).transform([1.2, -1, -4.2], [0,-130,0], [1.5, 1.5, 1.5])
                }
            ],
            shapes:[
                new Sphere( Vec3.new(0, -80.98, -4), 80, 0),
            ],
            lights:[
                new EnvironmentalLight(Color.new(0.7, 0.7, 1), 0.15),
                new PointLight(Vec3.new(2, 3, -2), Color.new(1,1,1), 800)
            ],
            camera: {
                position: Vec3.new(0,0,0),
                rotation: Vec3.new(0,0,0),
                fieldOfView: 45,
                lens:{
                    radius: 0,
                    focalDistance: 0,
                }
            }
        }
    }

    static MaterialTest(material, model) {
        let objects
        let shapes
        if(model == "sphere"){
            objects = []
            shapes = [
                new Sphere( Vec3.new(0, -80.98, -4), 80, 0),
                new Sphere( Vec3.new(0, -0.7 , -5), 0.3, 1),
            ]
        }else{
            objects = [
                {
                    file: model,
                    material: 1,
                    transformMatrix: (new Matrix()).transform([0, -1, -5], [0,-90,0], [1, 1, 1])
                }
            ]
            shapes = [new Sphere( Vec3.new(0, -80.98, -4), 80, 0)]
        }
        return {
            materials:[
                new Diffuse(Color.new(0.8, 0.4, 0.3)),
                material
            ],
            objects:objects,
            shapes:shapes,
            lights:[
                new EnvironmentalLight(Color.new(0.7, 0.7, 1), 0.2),
                new PointLight(Vec3.new(4, 3, -7), Color.new(1,1,1), 1200)
            ],
            camera: {
                position: Vec3.new(1.3, 0, -3.75),
                rotation: Vec3.new(-34, 45, 25),
                fieldOfView: 45,
                lens:{
                    radius: 0,
                    focalDistance: 0,
                }
            }
        }
    }
}