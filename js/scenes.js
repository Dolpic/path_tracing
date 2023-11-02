import { Sphere } from "./shapes.js"
import Objects from "./Objects.js"
import { LambertianDiffuse, Reflect, Refract, Dielectric, Conductor} from "./materials.js"
import { Vec3, Color, Complex } from "./primitives.js"
import Matrix from "./Matrix.js"

export default class Scenes{

    static async loadScene(scene){
        const objs = await Objects.loadObjects(scene.objects)
        return {
            shapes: [...scene.shapes, ...objs.flat()],
            materials: scene.materials
        }
    }

    static Teapot(){
        return {
            materials:[
                new LambertianDiffuse(Color.new(0.8, 0.4, 0.3, 1)),
                new Dielectric(Color.new(0.9, 0.9, 0.9, 1), 1, 1.5),
                new LambertianDiffuse(Color.new(1,0,0,1)),
                new Conductor(Color.new(0.9, 0.6, 0.1, 1), Complex.fromReal(1), Complex.new(0.2, 3))
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

                //new Sphere( Vec3.new(0,   -0.26, -6.5), 3*0.15,    6),
            ],
        }
    }

    static Dragons(){

        return {
            materials:[
                new LambertianDiffuse(Color.new(0.8, 0.4, 0.3, 1)),
                new Reflect(Color.new(0.4, 0.8, 0.3, 1), 0),
                new Refract(Color.new(0.8, 0.8, 1, 1), 1, 1.5),
                new Dielectric(Color.new(0.8, 0.8, 1, 1), 1, 1.5),
                new Dielectric(Color.new(1, 1, 1, 1), 1, 1.5),
            ],
            objects:[
                /*{
                    file: "dragon/dragon_very_simple",
                    material: 0,
                    transformMatrix: (new Matrix()).transform([-1, -1, -5], [0,-90,0], [0.2,0.2,0.2])
                },
                {
                    file: "dragon/dragon_very_simple",
                    material: 1,
                    transformMatrix: (new Matrix()).transform([0, -1, -5], [0,-90,0], [0.2,0.2,0.2])
                },*/
                {
                    file: "teapot/teapot_smooth",
                    material: 4,
                    transformMatrix: (new Matrix()).transform([1, -1, -5], [0,-90,0], [0.2,0.2,0.2])
                },
                /*{
                    file: "dragon/dragon_simple",
                    material: dielectric,
                    transformMatrix: (new Matrix()).transform([2, -1, -4], [0,0,0], [0.5,0.5,0.5])
                },*/
            ],
            shapes:[
                new Sphere( Vec3.new(0,   -80.98, -4), 80, 0),
            ]
        }
    }
}