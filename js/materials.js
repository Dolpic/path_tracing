import { Vec3, Ray, Color } from "./primitives.js"

export class Material{
    constructor(BxDF, color, multiplier){
        this.BxDF = BxDF
        this.color = color
        this.multiplier = multiplier

        this.color_mul = Color.mul(color, multiplier)
    }

    updateRay(ray, t, obj, ...others){
        this.BxDF.apply(ray, t, obj, others)
        Color.mul(ray.color, this.color_mul)
    }
}

export class PerfectDiffuse{
    constructor(){this.name="perfectDiffuse"}
    apply(ray, t, obj, others){
        Ray.moveAt(ray, t)
        let new_dir = Vec3.random_spheric()
        let normal = obj.normalAt(ray.origin)
        ray.direction = Vec3.dot(normal, new_dir) < 0 ? new_dir : Vec3.mulScalar(new_dir, -1)
    }
}

export class LambertianDiffuse{
    constructor(){this.name="lambertianDiffuse"}
    apply(ray, t, obj, others){
        Ray.moveAt(ray, t)
        let normal = obj.normalAt(ray.origin)
        ray.direction = Vec3.add(normal, Vec3.normalize( Vec3.random_spheric(ray.direction) ))
    }
}

export class Granular_mirror{
    constructor(){this.name="granular_mirror"}
    apply(ray, t, obj, granular_factor=0.1){
        Ray.moveAt(ray, t)
        let normal = obj.normalAt(ray.origin)
        let reflectJiggle = Vec3.mulScalar( Vec3.normalize(Vec3.random_spheric()), granular_factor) 
        let reflectDir = Vec3.mulScalar(normal, 2*Vec3.dot(ray.direction, normal) )
        Vec3.sub(ray.direction, Vec3.add(reflectDir, reflectJiggle ))
    }
}

export class Refract{
    constructor(){this.name="refract"}
    apply(ray, t, obj, eta_from=1, eta_to=1){
        let normal = obj.normalAt(ray.origin) // Wrong !
        let dot = Vec3.dot(ray.direction, normal)
        let eta_ratio = eta_from/eta_to
    
        if(eta_ratio * Math.sqrt(1-dot*dot) > 1){
            mirror(ray, t, obj)
        }else{
            Ray.moveAt(ray, t)
            let toAdd = Vec3.dot(Vec3.mulScalar( Vec3.clone(ray.direction), -1), normal)
            let perpendicular =  Vec3.add(ray.direction, toAdd)
            Vec3.mul(perpendicular, eta_ratio)
            let parallel = Vec3.mulScalar(normal, -Math.sqrt(1-perpendicular.norm_squared()))
            ray.direction = Vec3.add(perpendicular, parallel)
        }
    }
}

export class Composite{
    constructor(){this.name="composite"}
    apply(ray, t, obj, others){
        const material1 = others[0]
        const material2 = others[1]
        const threshold = others[2]

        let rnd = Math.random()
        rnd < threshold ? material1.apply(ray, t, obj) : material2.apply(ray, t, obj)
    }
}
