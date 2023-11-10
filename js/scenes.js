import { Sphere } from "./objects/Shape.js"
import Objects from "./objects/Object.js"
import { Diffuse, Dielectric, Conductor} from "./materials.js"
import { Vec3, Color, Complex } from "./primitives.js"
import Matrix from "./primitives/Matrix.js"
import {PointLight, EnvironmentalLight} from "./Lights.js"

export default class Scenes{

    static async loadScene(scene){
        if(scene.objects != undefined){
            if(scene.shapes == undefined){
                scene.shapes = []
            }
            const objs = await Objects.loadObjects(scene.objects)
            scene.shapes = [...scene.shapes, ...objs.flat()]
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
                new Dielectric(Color.new(1, 1, 1), 1, 1.5),
                new Diffuse(Color.new(1,0,0,1)),
                new Conductor(Color.new(0.9, 0.6, 0.1), Complex.fromReal(1), Complex.new(0.2, 3))
            ],
            objects:[
                {
                    file: "teapot/teapot_smooth_corrected",
                    material: 1,
                    transformMatrix: (new Matrix()).transform([0, -1, -4], [0,0,0], [0.5,0.5,0.5])
                }
            ],
            shapes:[
                new Sphere( Vec3.new(0,   -80.98, -4), 80,    0),
                new Sphere( Vec3.new(1.2, 1.2, -5), 0.5,      1),
                new Sphere( Vec3.new(-1.2,  1.2, -5), 0.5,    1),

                
                new Sphere( Vec3.new(-0.6, 1.5, -5), 0.1,     0),
                new Sphere( Vec3.new(-0.4, 1.5, -5), 0.1,     0),
                new Sphere( Vec3.new(-0.2, 1.5, -5), 0.1,     0),
                new Sphere( Vec3.new(0.0, 1.5, -5), 0.1,      0),
                new Sphere( Vec3.new(0.2, 1.5, -5), 0.1,      0),
                new Sphere( Vec3.new(0.4, 1.5, -5), 0.1,      0),
                new Sphere( Vec3.new(0.6, 1.5, -5), 0.1,      0),

                new Sphere( Vec3.new(-0.3, -0.88, -2.7), 0.1, 0),
                new Sphere( Vec3.new(0.3, -0.88, -2.7), 0.1,  0),

                new Sphere( Vec3.new(-0.3, -0.68, -2.7), 0.1, 0),
                new Sphere( Vec3.new(0.3, -0.68, -2.7), 0.1,  0),

                new Sphere( Vec3.new(-0.3, -0.48, -2.7), 0.1, 0),
                new Sphere( Vec3.new(0.3, -0.48, -2.7), 0.1,  0),

                new Sphere( Vec3.new(-0.3, -0.28, -2.7), 0.1, 0),
                new Sphere( Vec3.new(0.3, -0.28, -2.7), 0.1,  0),


                new Sphere( Vec3.new(-0.7, -0.86, -3), 0.15,  1),
                new Sphere( Vec3.new(0.7, -0.86, -3), 0.15,   1),

                new Sphere( Vec3.new(-0.7, -0.56, -3), 0.15,  1),
                new Sphere( Vec3.new(0.7, -0.56, -3), 0.15,   1),
            ],
            lights: [
                new EnvironmentalLight(Color.new(0.7, 0.7, 1), 0.8)
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
                new Dielectric(Color.new(0.85, 0.85, 0.85), 1, 1.4),
                new Conductor(Color.new(0.9, 0.6, 0.1), Complex.fromReal(1), Complex.new(0.2, 3))
            ],
            objects:[
                {
                    file: "dragon/dragon_very_simple",
                    material: 0,
                    transformMatrix: (new Matrix()).transform([-1, -1, -5], [0,-90,0], [0.2,0.2,0.2])
                },
                {
                    file: "dragon/dragon_very_simple",
                    material: 1,
                    transformMatrix: (new Matrix()).transform([0, -1, -5], [0,-90,0], [0.2,0.2,0.2])
                },
                {
                    file: "dragon/dragon_very_simple",
                    material: 2,
                    transformMatrix: (new Matrix()).transform([1, -1, -5], [0,-90,0], [0.2,0.2,0.2])
                }
            ],
            shapes:[
                new Sphere( Vec3.new(0, -80.98, -4), 80, 0),
            ],
            lights:[
                new EnvironmentalLight(Color.new(0.7, 0.7, 1), 0.1),
                new PointLight(Vec3.new(2, 5, -5), Color.new(1,1,1), 400)
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

    static MaterialTestDragon(material) {
        return {
            materials:[
                new Diffuse(Color.new(0.8, 0.4, 0.3))
            ],
            objects:[
                {
                    file: "dragon/dragon_very_simple",
                    material: 0,
                    transformMatrix: (new Matrix()).transform([0, -1, -5], [0,-90,0], [0.2,0.2,0.2])
                }
            ],
            shapes:[
                new Sphere( Vec3.new(0, -80.98, -4), 80, 0),
            ],
            lights:[
                new EnvironmentalLight(Color.new(0.7, 0.7, 1), 0.1),
                new PointLight(Vec3.new(2, 5, -5), Color.new(1,1,1), 400)
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
}