import { Sphere } from "./shapes.js"
import Objects from "./Objects.js"
import { Material, LambertianDiffuse, Reflect, Refract, Dielectric} from "./materials.js"
import { Vec3, Color } from "./primitives.js"
import Matrix from "./Matrix.js"

export default class Scenes{

    static async loadScene(scene){
        const objs = await Objects.loadObjects(scene.objects)
        return [
            ...scene.shapes,
            ...objs.flat()
        ]
    }

    static Teapot(){

        const diffuse    = new Material(new LambertianDiffuse(), Color.new(0.8, 0.4, 0.3, 1))
        const mirror     = new Material(new Reflect(0), Color.new(0.4, 0.8, 0.3, 1))
        const mirror2    = new Material(new Reflect(0.2), Color.new(0.4, 0.8, 0.3, 1))
        const refract    = new Material(new Refract(1, 1.5), Color.new(0.8, 0.8, 1, 1))
        const dielectric = new Material(new Dielectric(1, 1.5), Color.new(0.8, 0.8, 1, 1))

        return {
            objects:[
                {
                    file: "teapot/teapot_smooth",
                    material: mirror,
                    transformMatrix: (new Matrix()).transform([0, -1, -4], [0,0,0], [0.5,0.5,0.5])
                }
            ],
            shapes:[
                new Sphere( Vec3.new(0,   -80.98, -4), 80, diffuse),
                new Sphere( Vec3.new(1.2, 1.2, -5), 0.5, mirror2),
                new Sphere( Vec3.new(-1.2,  1.2, -5), 0.5, mirror2),

                
                new Sphere( Vec3.new(-0.6, 1.5, -5), 0.1, diffuse),
                new Sphere( Vec3.new(-0.4, 1.5, -5), 0.1, diffuse),
                new Sphere( Vec3.new(-0.2, 1.5, -5), 0.1, diffuse),
                new Sphere( Vec3.new(0.0, 1.5, -5), 0.1, diffuse),
                new Sphere( Vec3.new(0.2, 1.5, -5), 0.1, diffuse),
                new Sphere( Vec3.new(0.4, 1.5, -5), 0.1, diffuse),
                new Sphere( Vec3.new(0.6, 1.5, -5), 0.1, diffuse),

                new Sphere( Vec3.new(-0.3, -0.88, -2.7), 0.1, diffuse),
                new Sphere( Vec3.new(0.3, -0.88, -2.7), 0.1, diffuse),

                new Sphere( Vec3.new(-0.3, -0.68, -2.7), 0.1, diffuse),
                new Sphere( Vec3.new(0.3, -0.68, -2.7), 0.1, diffuse),

                new Sphere( Vec3.new(-0.3, -0.48, -2.7), 0.1, diffuse),
                new Sphere( Vec3.new(0.3, -0.48, -2.7), 0.1, diffuse),

                new Sphere( Vec3.new(-0.3, -0.28, -2.7), 0.1, diffuse),
                new Sphere( Vec3.new(0.3, -0.28, -2.7), 0.1, diffuse),


                new Sphere( Vec3.new(-0.7, -0.86, -3), 0.15, refract),
                new Sphere( Vec3.new(0.7, -0.86, -3), 0.15, refract),

                new Sphere( Vec3.new(-0.7, -0.56, -3), 0.15, dielectric),
                new Sphere( Vec3.new(0.7, -0.56, -3), 0.15, dielectric),
            ],
        }
    }

    static Dragons(){

        const diffuse    = new Material(new LambertianDiffuse(), Color.new(0.8, 0.4, 0.3, 1))
        const mirror     = new Material(new Reflect(0), Color.new(0.4, 0.8, 0.3, 1))
        const mirror2    = new Material(new Reflect(0.2), Color.new(0.4, 0.8, 0.3, 1))
        const refract    = new Material(new Refract(1, 1.5), Color.new(0.8, 0.8, 1, 1))
        const dielectric = new Material(new Dielectric(1, 1.5), Color.new(0.8, 0.8, 1, 1))

        return {
            objects:[
                {
                    file: "dragon/dragon_simple",
                    material: diffuse,
                    transformMatrix: (new Matrix()).transform([0, -1, -5], [0,-90,0], [0.3,0.3,0.3])
                },
                /*{
                    file: "dragon/dragon_simple",
                    material: mirror,
                    transformMatrix: (new Matrix()).transform([-1, -1, -4], [0,0,0], [0.5,0.5,0.5])
                },
                {
                    file: "dragon/dragon_simple",
                    material: refract,
                    transformMatrix: (new Matrix()).transform([1, -1, -4], [0,0,0], [0.5,0.5,0.5])
                },
                {
                    file: "dragon/dragon_simple",
                    material: dielectric,
                    transformMatrix: (new Matrix()).transform([2, -1, -4], [0,0,0], [0.5,0.5,0.5])
                },*/
            ],
            shapes:[
                new Sphere( Vec3.new(0,   -80.98, -4), 80, diffuse),
            ]
        }
    }
}